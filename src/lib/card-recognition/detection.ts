/**
 * Card detection via YOLOv8 ONNX model.
 *
 * Pipeline: ImageData -> letterbox + normalize -> YOLOv8 ONNX -> NMS -> geometry filter
 */

import type { DetectedCard } from "@/types/ml";

const SCORE_THRESHOLD = 0.6;
const IOU_THRESHOLD = 0.45;
const CARD_ASPECT_MIN = 0.4;
const CARD_ASPECT_MAX = 1.8;
const MIN_CARD_SIZE = 30;
const MODEL_SIZE = 640;

interface OrtTensor {
  data: Float32Array | Int32Array | Uint8Array;
  dims: readonly number[];
  dispose(): void;
}

interface OrtTensorCtor {
  new (type: string, data: Float32Array, dims: readonly number[]): OrtTensor;
}

interface OrtSession {
  run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>>;
  release(): Promise<void>;
}

interface OrtModule {
  InferenceSession: {
    create(
      path: string | ArrayBuffer,
      options?: Record<string, unknown>
    ): Promise<OrtSession>;
  };
  Tensor: OrtTensorCtor;
  env: { wasm: { wasmPaths?: string; numThreads?: number } };
}

let session: OrtSession | null = null;
let ortRef: OrtModule | null = null;

export async function initDetectionModel(
  modelUrl = "/ml/yolov8n.onnx"
): Promise<void> {
  if (session) return;

  const ort = (await import("onnxruntime-web")) as unknown as OrtModule;
  ortRef = ort;

  let wasmBase = "/ml/wasm/";
  try {
    const origin = new URL(modelUrl).origin;
    if (origin && origin !== "null") {
      wasmBase = origin + "/ml/wasm/";
    }
  } catch {
    // relative path is fine
  }
  ort.env.wasm.wasmPaths = wasmBase;
  ort.env.wasm.numThreads = 1;

  session = await ort.InferenceSession.create(modelUrl, {
    executionProviders: ["wasm"],
  });
}

export async function detectCards(input: ImageData): Promise<DetectedCard[]> {
  if (!session || !ortRef) return [];

  const { tensor, scaleFactor } = preprocessForYolo(input);

  const inputTensor = new ortRef.Tensor("float32", tensor, [
    1,
    3,
    MODEL_SIZE,
    MODEL_SIZE,
  ]);

  const feeds: Record<string, OrtTensor> = { images: inputTensor };
  const results = await session.run(feeds);

  const outputKey = Object.keys(results)[0];
  const output = results[outputKey];

  const detections = postprocessYolo(
    output.data as Float32Array,
    output.dims,
    scaleFactor
  );

  inputTensor.dispose();
  output.dispose();

  return detections;
}

export function disposeDetectionModel(): void {
  if (session) {
    void session.release();
    session = null;
  }
  ortRef = null;
}

function preprocessForYolo(imageData: ImageData): {
  tensor: Float32Array;
  scaleFactor: number;
} {
  const srcW = imageData.width;
  const srcH = imageData.height;
  const maxDim = Math.max(srcW, srcH);
  const scaleFactor = maxDim / MODEL_SIZE;

  const makeCanvas = (w: number, h: number) => {
    if (typeof OffscreenCanvas !== "undefined") {
      return new OffscreenCanvas(w, h);
    }
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };

  const getCtx = (c: HTMLCanvasElement | OffscreenCanvas) =>
    c.getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;

  const emptyTensor = () => ({
    tensor: new Float32Array(3 * MODEL_SIZE * MODEL_SIZE),
    scaleFactor,
  });

  const srcCanvas = makeCanvas(srcW, srcH);
  const srcCtx = getCtx(srcCanvas);
  if (!srcCtx) return emptyTensor();
  srcCtx.putImageData(imageData, 0, 0);

  const dstCanvas = makeCanvas(MODEL_SIZE, MODEL_SIZE);
  const dstCtx = getCtx(dstCanvas);
  if (!dstCtx) return emptyTensor();

  dstCtx.fillStyle = "#000";
  dstCtx.fillRect(0, 0, MODEL_SIZE, MODEL_SIZE);

  const scaledW = Math.round((srcW / maxDim) * MODEL_SIZE);
  const scaledH = Math.round((srcH / maxDim) * MODEL_SIZE);

  dstCtx.drawImage(
    srcCanvas as CanvasImageSource,
    0,
    0,
    srcW,
    srcH,
    0,
    0,
    scaledW,
    scaledH
  );

  const pixels = dstCtx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data;
  const count = MODEL_SIZE * MODEL_SIZE;
  const tensor = new Float32Array(3 * count);

  for (let i = 0; i < count; i++) {
    const si = i * 4;
    tensor[i] = pixels[si] / 255;
    tensor[count + i] = pixels[si + 1] / 255;
    tensor[2 * count + i] = pixels[si + 2] / 255;
  }

  return { tensor, scaleFactor };
}

interface RawBox {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
}

function postprocessYolo(
  data: Float32Array,
  dims: readonly number[],
  scaleFactor: number
): DetectedCard[] {
  const numOutputs = dims[1];
  const numAnchors = dims[2];

  const candidates: RawBox[] = [];

  for (let i = 0; i < numAnchors; i++) {
    const cx = data[0 * numAnchors + i];
    const cy = data[1 * numAnchors + i];
    const w = data[2 * numAnchors + i];
    const h = data[3 * numAnchors + i];

    let maxScore = 0;
    for (let c = 4; c < numOutputs; c++) {
      const score = data[c * numAnchors + i];
      if (score > maxScore) maxScore = score;
    }

    if (maxScore < SCORE_THRESHOLD) continue;

    candidates.push({
      x: (cx - w / 2) * scaleFactor,
      y: (cy - h / 2) * scaleFactor,
      w: w * scaleFactor,
      h: h * scaleFactor,
      score: maxScore,
    });
  }

  return filterByGeometry(
    nms(candidates, IOU_THRESHOLD).map((b) => ({
      bbox: [b.x, b.y, b.w, b.h] as [number, number, number, number],
      confidence: b.score,
    }))
  );
}

function filterByGeometry(detections: DetectedCard[]): DetectedCard[] {
  return detections.filter((d) => {
    const [, , w, h] = d.bbox;
    if (w < MIN_CARD_SIZE || h < MIN_CARD_SIZE) return false;
    const aspect = w / h;
    return aspect >= CARD_ASPECT_MIN && aspect <= CARD_ASPECT_MAX;
  });
}

function computeIou(a: RawBox, b: RawBox): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);

  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (inter === 0) return 0;

  return inter / (a.w * a.h + b.w * b.h - inter);
}

function nms(boxes: RawBox[], iouThreshold: number): RawBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const kept: RawBox[] = [];
  const suppressed = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (suppressed.has(i)) continue;
    kept.push(sorted[i]);

    for (let j = i + 1; j < sorted.length; j++) {
      if (
        !suppressed.has(j) &&
        computeIou(sorted[i], sorted[j]) > iouThreshold
      ) {
        suppressed.add(j);
      }
    }
  }

  return kept;
}
