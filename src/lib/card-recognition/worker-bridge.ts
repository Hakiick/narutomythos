/**
 * Worker bridge for card recognition pipeline.
 * Adapted for Naruto Mythos TCG (no OCR, adapted art crop geometry).
 */

import type {
  RecognitionConfig,
  RecognitionOutput,
  RecognitionResult,
  DetectedCard,
  IdentifiedCard,
  WorkerMessage,
  WorkerResponse,
} from "@/types/ml";
import { preprocessFrame } from "./preprocess";
import {
  loadReferenceDatabase,
  loadAllReferenceDatabases,
  findTopCandidates,
  type ReferenceDatabase,
} from "./reference-db";
import {
  initDetectionModel,
  detectCards,
  disposeDetectionModel,
} from "./detection";
import { computeHistogram } from "./histogram";
import { detectBorderColor } from "./color-filter";
import { computeDHash } from "./dhash";
import { loadOnnxModel, type OnnxFeatureModel } from "./onnx-model";

const FPS_WINDOW_SIZE = 10;

function flipImageDataHorizontally(source: ImageData): ImageData {
  const { width, height, data } = source;
  const flipped = new ImageData(width, height);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const srcIdx = (row * width + col) * 4;
      const dstIdx = (row * width + (width - 1 - col)) * 4;
      flipped.data[dstIdx] = data[srcIdx];
      flipped.data[dstIdx + 1] = data[srcIdx + 1];
      flipped.data[dstIdx + 2] = data[srcIdx + 2];
      flipped.data[dstIdx + 3] = data[srcIdx + 3];
    }
  }
  return flipped;
}

function cropFromImageData(
  source: ImageData,
  x: number,
  y: number,
  w: number,
  h: number
): ImageData {
  const sx = Math.max(0, Math.min(x, source.width));
  const sy = Math.max(0, Math.min(y, source.height));
  const sw = Math.min(w, source.width - sx);
  const sh = Math.min(h, source.height - sy);

  if (sw <= 0 || sh <= 0) {
    return new ImageData(1, 1);
  }

  const cropped = new ImageData(sw, sh);
  for (let row = 0; row < sh; row++) {
    const srcOffset = ((sy + row) * source.width + sx) * 4;
    const dstOffset = row * sw * 4;
    cropped.data.set(
      source.data.subarray(srcOffset, srcOffset + sw * 4),
      dstOffset
    );
  }
  return cropped;
}

function deduplicateDetections(detections: DetectedCard[]): DetectedCard[] {
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: DetectedCard[] = [];
  const suppressed = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (suppressed.has(i)) continue;
    kept.push(sorted[i]);
    for (let j = i + 1; j < sorted.length; j++) {
      if (suppressed.has(j)) continue;
      const [ax, ay, aw, ah] = sorted[i].bbox;
      const [bx, by, bw, bh] = sorted[j].bbox;
      const ix1 = Math.max(ax, bx);
      const iy1 = Math.max(ay, by);
      const ix2 = Math.min(ax + aw, bx + bw);
      const iy2 = Math.min(ay + ah, by + bh);
      const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
      if (inter === 0) continue;
      const union = aw * ah + bw * bh - inter;
      if (union > 0 && inter / union > 0.3) {
        suppressed.add(j);
      }
    }
  }
  return kept;
}

export interface RecognizeResult {
  result: RecognitionOutput;
  topCandidates: RecognitionResult[];
  fps: number;
  detectedCards: DetectedCard[];
  identifiedCards: IdentifiedCard[];
}

export interface WorkerBridge {
  initialize(modelUrl: string, embeddingsUrl: string): Promise<void>;
  recognize(
    imageData: ImageData,
    config: RecognitionConfig
  ): Promise<RecognizeResult>;
  dispose(): void;
  isUsingWorker(): boolean;
}

export type WorkerFactory = () => Worker | null;

function computeFpsFromTimestamps(timestamps: number[]): number {
  if (timestamps.length < 2) return 0;
  const first = timestamps[0];
  const last = timestamps[timestamps.length - 1];
  const elapsed = last - first;
  if (elapsed <= 0) return 0;
  return ((timestamps.length - 1) / elapsed) * 1000;
}

export function createDefaultWorkerFactory(): WorkerFactory {
  return (): Worker | null => null;
}

export function createWorkerBridge(
  workerFactory: WorkerFactory = createDefaultWorkerFactory()
): WorkerBridge {
  let worker: Worker | null = null;
  let usingWorker = false;
  const completionTimestamps: number[] = [];

  let fallbackModel: OnnxFeatureModel | null = null;
  let fallbackDb: ReferenceDatabase | null = null;
  let fallbackReady = false;

  function recordCompletion(): number {
    completionTimestamps.push(Date.now());
    if (completionTimestamps.length > FPS_WINDOW_SIZE) {
      completionTimestamps.shift();
    }
    return computeFpsFromTimestamps(completionTimestamps);
  }

  async function initializeFallback(
    modelUrl: string,
    embeddingsUrl: string
  ): Promise<void> {
    console.log(`[Init] Loading model: ${modelUrl}`);
    console.log(`[Init] Loading embeddings: ${embeddingsUrl}`);
    const isManifest = embeddingsUrl.endsWith("manifest.json");
    const [loadedModel, loadedDb] = await Promise.all([
      loadOnnxModel(modelUrl),
      isManifest
        ? loadAllReferenceDatabases(embeddingsUrl)
        : loadReferenceDatabase(embeddingsUrl),
    ]);
    fallbackModel = loadedModel;
    fallbackDb = loadedDb;
    fallbackReady = true;
    console.log(
      `[Init] Ready — ${loadedDb.cardCount} cards, ${loadedDb.embeddingDim}D embeddings`
    );

    try {
      await initDetectionModel();
      console.log("[Init] YOLO detection model loaded");
    } catch {
      console.log("[Init] YOLO model not available — full-frame mode");
    }
  }

  async function initialize(
    modelUrl: string,
    embeddingsUrl: string
  ): Promise<void> {
    const w = workerFactory();

    if (w) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const toAbsolute = (url: string): string =>
        url.startsWith("/") ? origin + url : url;

      const workerSuccess = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          w.terminate();
          resolve(false);
        }, 30000);

        w.onmessage = (event: MessageEvent<WorkerResponse>) => {
          clearTimeout(timeout);
          if (event.data.type === "initialized") {
            worker = w;
            usingWorker = true;
            resolve(true);
          } else {
            w.terminate();
            resolve(false);
          }
        };

        w.onerror = () => {
          clearTimeout(timeout);
          w.terminate();
          resolve(false);
        };

        const msg: WorkerMessage = {
          type: "init",
          modelUrl: toAbsolute(modelUrl),
          embeddingsUrl: toAbsolute(embeddingsUrl),
        };
        w.postMessage(msg);
      });

      if (!workerSuccess) {
        usingWorker = false;
        await initializeFallback(modelUrl, embeddingsUrl);
      }
    } else {
      usingWorker = false;
      await initializeFallback(modelUrl, embeddingsUrl);
    }
  }

  async function recognize(
    imageData: ImageData,
    config: RecognitionConfig
  ): Promise<RecognizeResult> {
    if (usingWorker && worker) {
      const w = worker;
      const cloned = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );

      return new Promise<RecognizeResult>((resolve, reject) => {
        const handleMessage = (event: MessageEvent<WorkerResponse>): void => {
          clearTimeout(timeout);
          w.removeEventListener("message", handleMessage);
          w.removeEventListener("error", onError);
          if (event.data.type === "result") {
            const workerResult = event.data.data;
            const workerCandidates: RecognitionResult[] =
              workerResult.cardCode !== null
                ? [workerResult as RecognitionResult]
                : [];
            resolve({
              result: workerResult,
              topCandidates: workerCandidates,
              fps: event.data.fps,
              detectedCards: [],
              identifiedCards: [],
            });
          } else if (event.data.type === "error") {
            reject(new Error(event.data.message));
          }
        };

        const onError = (e: ErrorEvent): void => {
          clearTimeout(timeout);
          w.removeEventListener("message", handleMessage);
          w.removeEventListener("error", onError);
          reject(new Error(e.message ?? "Worker error during recognition"));
        };

        const timeout = setTimeout(() => {
          w.removeEventListener("message", handleMessage);
          w.removeEventListener("error", onError);
          reject(new Error("Worker recognition timeout"));
        }, 5000);

        w.addEventListener("message", handleMessage);
        w.addEventListener("error", onError);

        const msg: WorkerMessage = {
          type: "recognize",
          imageData: cloned,
          config,
        };
        w.postMessage(msg);
      });
    }

    // Main-thread fallback
    const start = Date.now();

    if (!fallbackReady || !fallbackModel || !fallbackDb) {
      const fps = recordCompletion();
      return {
        result: {
          cardCode: null,
          confidence: 0,
          candidateCount: 0,
          durationMs: Date.now() - start,
        },
        topCandidates: [],
        fps,
        detectedCards: [],
        identifiedCards: [],
      };
    }

    // Art crop geometry for Naruto Mythos cards
    const ART_CROPS = [
      { topPct: 0.18, heightPct: 0.44 },
      { topPct: 0.15, heightPct: 0.44 },
      { topPct: 0.21, heightPct: 0.44 },
    ];
    const ART_LEFT_PCT = 0.08;
    const ART_WIDTH_PCT = 0.84;

    async function identifyCard(
      croppedInput: ImageData,
      model: OnnxFeatureModel,
      db: ReferenceDatabase,
      cfg: RecognitionConfig
    ): Promise<{
      candidates: RecognitionResult[];
      detectedColor: string | null;
    }> {
      const enhanced = croppedInput;
      const detectedColor = detectBorderColor(enhanced);
      const fullCardHist = computeHistogram(enhanced);

      let bestCandidates: RecognitionResult[] = [];
      let bestTopScore = -1;

      for (const crop of ART_CROPS) {
        const artTop = Math.round(enhanced.height * crop.topPct);
        const artHeight = Math.round(enhanced.height * crop.heightPct);
        const artLeft = Math.round(enhanced.width * ART_LEFT_PCT);
        const artWidth = Math.round(enhanced.width * ART_WIDTH_PCT);
        const artCrop = cropFromImageData(
          enhanced,
          artLeft,
          artTop,
          artWidth,
          artHeight
        );

        const preprocessedNormal = preprocessFrame(artCrop, cfg.inputSize);
        const embNormal = await model.run(preprocessedNormal, cfg.inputSize);

        const artHist = computeHistogram(artCrop);
        let blendedHist: Float32Array | undefined;
        if (artHist && fullCardHist) {
          blendedHist = new Float32Array(artHist.length);
          for (let i = 0; i < artHist.length; i++) {
            blendedHist[i] = 0.6 * artHist[i] + 0.4 * fullCardHist[i];
          }
        }

        const dhashNormal = computeDHash(artCrop);

        const candidates = findTopCandidates(
          embNormal,
          db,
          cfg.maxCandidates,
          cfg.confidenceThreshold,
          blendedHist ?? artHist,
          null,
          dhashNormal
        );

        const topScore = candidates[0]?.confidence ?? 0;
        if (topScore > bestTopScore) {
          bestTopScore = topScore;
          bestCandidates = candidates;
        }
      }

      // Also try flipped orientation
      {
        const artTop = Math.round(enhanced.height * ART_CROPS[0].topPct);
        const artHeight = Math.round(
          enhanced.height * ART_CROPS[0].heightPct
        );
        const artLeft = Math.round(enhanced.width * ART_LEFT_PCT);
        const artWidth = Math.round(enhanced.width * ART_WIDTH_PCT);
        const artCrop = cropFromImageData(
          enhanced,
          artLeft,
          artTop,
          artWidth,
          artHeight
        );
        const flippedArt = flipImageDataHorizontally(artCrop);

        const preprocessedFlipped = preprocessFrame(flippedArt, cfg.inputSize);
        const embFlipped = await model.run(preprocessedFlipped, cfg.inputSize);

        const artHist = computeHistogram(flippedArt);
        let blendedHist: Float32Array | undefined;
        if (artHist && fullCardHist) {
          blendedHist = new Float32Array(artHist.length);
          for (let i = 0; i < artHist.length; i++) {
            blendedHist[i] = 0.6 * artHist[i] + 0.4 * fullCardHist[i];
          }
        }

        const dhashFlipped = computeDHash(flippedArt);

        const candidatesFlipped = findTopCandidates(
          embFlipped,
          db,
          cfg.maxCandidates,
          cfg.confidenceThreshold,
          blendedHist ?? artHist,
          null,
          dhashFlipped
        );

        const topFlipped = candidatesFlipped[0]?.confidence ?? 0;
        if (topFlipped > bestTopScore) {
          bestTopScore = topFlipped;
          bestCandidates = candidatesFlipped;
        }
      }

      return { candidates: bestCandidates, detectedColor };
    }

    try {
      const detectedCards = await detectCards(imageData);
      const deduped = deduplicateDetections(detectedCards);
      const sorted =
        deduped.length > 0
          ? [...deduped].sort((a, b) => b.confidence - a.confidence)
          : [];

      const maxIdentify = config.maxIdentify ?? 5;
      const TIME_BUDGET_MS = 1500;
      const identifiedCards: IdentifiedCard[] = [];
      let bestOverallResult: RecognitionOutput | null = null;
      let bestOverallCandidates: RecognitionResult[] = [];

      if (sorted.length > 0) {
        const toProcess = sorted.slice(0, maxIdentify);

        for (let i = 0; i < toProcess.length; i++) {
          if (i > 0 && Date.now() - start > TIME_BUDGET_MS) {
            for (let j = i; j < toProcess.length; j++) {
              identifiedCards.push({
                ...toProcess[j],
                cardCode: null,
                matchConfidence: 0,
                candidates: [],
              });
            }
            break;
          }

          const detection = toProcess[i];
          const [bx, by, bw, bh] = detection.bbox;

          const shrinkX = bw * 0.1;
          const shrinkY = bh * 0.1;
          const cropped = cropFromImageData(
            imageData,
            Math.round(bx + shrinkX),
            Math.round(by + shrinkY),
            Math.round(bw - shrinkX * 2),
            Math.round(bh - shrinkY * 2)
          );

          const { candidates } = await identifyCard(
            cropped,
            fallbackModel,
            fallbackDb,
            config
          );

          const durationMs = Date.now() - start;
          const best = candidates[0] ?? null;

          const identified: IdentifiedCard = {
            ...detection,
            cardCode: best?.cardCode ?? null,
            matchConfidence: best?.confidence ?? 0,
            candidates: candidates.map((c) => ({ ...c, durationMs })),
          };
          identifiedCards.push(identified);

          if (
            best &&
            (bestOverallResult === null ||
              best.confidence > (bestOverallResult.confidence ?? 0))
          ) {
            bestOverallResult = {
              cardCode: best.cardCode,
              confidence: best.confidence,
              candidateCount: candidates.length,
              durationMs,
            };
            bestOverallCandidates = candidates.map((c) => ({
              ...c,
              durationMs,
            }));
          }
        }

        for (let i = toProcess.length; i < sorted.length; i++) {
          identifiedCards.push({
            ...sorted[i],
            cardCode: null,
            matchConfidence: 0,
            candidates: [],
          });
        }
      } else {
        const { candidates } = await identifyCard(
          imageData,
          fallbackModel,
          fallbackDb,
          config
        );

        const durationMs = Date.now() - start;
        const best = candidates[0] ?? null;

        if (best) {
          bestOverallResult = {
            cardCode: best.cardCode,
            confidence: best.confidence,
            candidateCount: candidates.length,
            durationMs,
          };
          bestOverallCandidates = candidates.map((c) => ({
            ...c,
            durationMs,
          }));
        }
      }

      const durationMs = Date.now() - start;
      const fps = recordCompletion();

      if (bestOverallResult?.cardCode) {
        console.log(
          `[Match] ${bestOverallResult.cardCode} confidence=${(bestOverallResult.confidence * 100).toFixed(1)}% duration=${durationMs}ms detections=${sorted.length}`
        );
      } else if (sorted.length > 0) {
        console.log(
          `[Detection] ${sorted.length} card(s) detected, no match above threshold (${durationMs}ms)`
        );
      }

      return {
        result: bestOverallResult ?? {
          cardCode: null,
          confidence: 0,
          candidateCount: 0,
          durationMs,
        },
        topCandidates: bestOverallCandidates,
        fps,
        detectedCards: sorted,
        identifiedCards,
      };
    } catch {
      const fps = recordCompletion();
      return {
        result: {
          cardCode: null,
          confidence: 0,
          candidateCount: 0,
          durationMs: Date.now() - start,
        },
        topCandidates: [],
        fps,
        detectedCards: [],
        identifiedCards: [],
      };
    }
  }

  function dispose(): void {
    if (worker) {
      const msg: WorkerMessage = { type: "dispose" };
      worker.postMessage(msg);
      worker.terminate();
      worker = null;
    }
    if (fallbackModel) {
      fallbackModel.dispose();
      fallbackModel = null;
    }
    disposeDetectionModel();
    fallbackDb = null;
    fallbackReady = false;
    usingWorker = false;
    completionTimestamps.length = 0;
  }

  function isUsingWorkerFn(): boolean {
    return usingWorker;
  }

  return { initialize, recognize, dispose, isUsingWorker: isUsingWorkerFn };
}
