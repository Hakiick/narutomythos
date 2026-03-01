"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createWorkerBridge,
  type WorkerBridge,
} from "@/lib/card-recognition/worker-bridge";
import {
  createRecognitionLoop,
  type RecognitionLoop,
} from "@/lib/card-recognition/recognition-loop";
import {
  createTemporalSmoother,
  type TemporalSmoother,
} from "@/lib/card-recognition/temporal-smoother";
import { captureFrame } from "@/lib/card-recognition/capture";
import type {
  CardRecognitionState,
  RecognitionConfig,
  CropRegion,
} from "@/types/ml";

const DEFAULT_CONFIG: RecognitionConfig = {
  confidenceThreshold: 0.0,
  inputSize: 224,
  maxCandidates: 20,
  frameSkip: 5,
  maxIdentify: 5,
};

const DEFAULT_MODEL_URL = "/ml/mobilenet_v3_large.onnx";
const DEFAULT_EMBEDDINGS_URL = "/ml/manifest.json";

export interface UseCardRecognitionReturn {
  state: CardRecognitionState;
  start: (
    videoRef: React.RefObject<HTMLVideoElement | null>,
    crop?: CropRegion
  ) => Promise<void>;
  stop: () => void;
  recognizeOnce: (
    videoRef: React.RefObject<HTMLVideoElement | null>,
    crop?: CropRegion
  ) => Promise<void>;
  setConfig: (partial: Partial<RecognitionConfig>) => void;
  isUsingWorker: boolean;
}

export function useCardRecognition(
  modelUrl?: string,
  embeddingsUrl?: string
): UseCardRecognitionReturn {
  const bridgeRef = useRef<WorkerBridge | null>(null);
  const loopRef = useRef<RecognitionLoop | null>(null);
  const smootherRef = useRef<TemporalSmoother | null>(null);
  const isActiveRef = useRef(false);
  const initializedRef = useRef(false);
  const recognizingRef = useRef(false);
  const [isUsingWorker, setIsUsingWorker] = useState(false);

  const [config, setConfigState] = useState<RecognitionConfig>(DEFAULT_CONFIG);

  const [state, setState] = useState<CardRecognitionState>({
    status: "idle",
    lastResult: null,
    topCandidates: [],
    detectedCards: [],
    identifiedCards: [],
    error: null,
    isActive: false,
    loadingProgress: 0,
    fps: 0,
  });

  const getBridge = useCallback((): WorkerBridge => {
    if (!bridgeRef.current) {
      bridgeRef.current = createWorkerBridge();
    }
    return bridgeRef.current;
  }, []);

  const getLoop = useCallback((): RecognitionLoop => {
    if (!loopRef.current) {
      loopRef.current = createRecognitionLoop();
    }
    return loopRef.current;
  }, []);

  const getSmoother = useCallback((): TemporalSmoother => {
    if (!smootherRef.current) {
      smootherRef.current = createTemporalSmoother();
    }
    return smootherRef.current;
  }, []);

  const initialize = useCallback(async (): Promise<boolean> => {
    if (initializedRef.current) return true;

    const bridge = getBridge();

    setState((prev) => ({ ...prev, status: "loading", loadingProgress: 0 }));

    try {
      await bridge.initialize(
        modelUrl ?? DEFAULT_MODEL_URL,
        embeddingsUrl ?? DEFAULT_EMBEDDINGS_URL
      );
      setIsUsingWorker(bridge.isUsingWorker());
      initializedRef.current = true;
      setState((prev) => ({
        ...prev,
        status: "ready",
        loadingProgress: 100,
        error: null,
      }));
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to initialize ML pipeline";
      setState((prev) => ({
        ...prev,
        status: "error",
        error: message,
        loadingProgress: 0,
      }));
      return false;
    }
  }, [getBridge, modelUrl, embeddingsUrl]);

  const start = useCallback(
    async (
      videoRef: React.RefObject<HTMLVideoElement | null>,
      crop?: CropRegion
    ): Promise<void> => {
      if (isActiveRef.current) return;

      const ready = await initialize();
      if (!ready) return;

      const video = videoRef.current;
      if (!video) {
        isActiveRef.current = false;
        setState((prev) => ({ ...prev, isActive: false, status: "ready" }));
        return;
      }

      if (video.readyState < 2) {
        await new Promise<void>((resolve) => {
          const onReady = () => {
            video.removeEventListener("loadeddata", onReady);
            resolve();
          };
          video.addEventListener("loadeddata", onReady);
          setTimeout(() => {
            video.removeEventListener("loadeddata", onReady);
            resolve();
          }, 5000);
        });
      }

      isActiveRef.current = true;
      setState((prev) => ({ ...prev, isActive: true, status: "ready" }));

      const bridge = getBridge();
      const loop = getLoop();
      const smoother = getSmoother();
      smoother.reset();
      const currentConfig = config;

      loop.start(
        video,
        currentConfig,
        {
          onFrame: (imageData: ImageData) => {
            if (recognizingRef.current) return;
            recognizingRef.current = true;

            setState((prev) => ({ ...prev, status: "processing" }));

            void bridge.recognize(imageData, currentConfig).then(
              ({
                result,
                fps,
                detectedCards,
                topCandidates,
                identifiedCards,
              }) => {
                recognizingRef.current = false;

                const smoothed = smoother.smooth(identifiedCards ?? []);

                let smoothedResult = result;
                let smoothedCandidates = topCandidates;
                const bestSmoothed = smoothed.reduce<
                  (typeof smoothed)[0] | null
                >(
                  (best, c) =>
                    c.cardCode &&
                    c.matchConfidence > (best?.matchConfidence ?? 0)
                      ? c
                      : best,
                  null
                );
                if (bestSmoothed?.cardCode) {
                  smoothedResult = {
                    cardCode: bestSmoothed.cardCode,
                    confidence: bestSmoothed.matchConfidence,
                    candidateCount: bestSmoothed.candidates?.length ?? 0,
                    durationMs: result.durationMs,
                  };
                  smoothedCandidates = bestSmoothed.candidates ?? topCandidates;
                }

                setState((prev) => ({
                  ...prev,
                  status: "ready",
                  lastResult: smoothedResult,
                  topCandidates: smoothedCandidates,
                  detectedCards: detectedCards ?? [],
                  identifiedCards: smoothed,
                  fps,
                }));
              },
              (err: unknown) => {
                recognizingRef.current = false;
                const message =
                  err instanceof Error ? err.message : "Recognition error";
                setState((prev) => ({
                  ...prev,
                  status: "error",
                  error: message,
                }));
              }
            );
          },
          onFpsUpdate: (fps: number) => {
            setState((prev) => ({ ...prev, fps }));
          },
        },
        crop
      );
    },
    [config, getBridge, getLoop, getSmoother, initialize]
  );

  const stop = useCallback((): void => {
    isActiveRef.current = false;

    if (loopRef.current) {
      loopRef.current.stop();
    }

    setState((prev) => ({
      ...prev,
      isActive: false,
      status: prev.status === "processing" ? "ready" : prev.status,
    }));
  }, []);

  const recognizeOnce = useCallback(
    async (
      videoRef: React.RefObject<HTMLVideoElement | null>,
      crop?: CropRegion
    ): Promise<void> => {
      const ready = await initialize();
      if (!ready) return;

      const video = videoRef.current;
      if (!video) return;

      setState((prev) => ({ ...prev, status: "processing" }));

      try {
        const capture = captureFrame(video, crop);
        if (!capture) {
          setState((prev) => ({ ...prev, status: "ready" }));
          return;
        }

        const bridge = getBridge();
        const { result, fps, detectedCards, topCandidates, identifiedCards } =
          await bridge.recognize(capture.imageData, config);

        setState((prev) => ({
          ...prev,
          status: "ready",
          lastResult: result,
          topCandidates,
          detectedCards: detectedCards ?? [],
          identifiedCards: identifiedCards ?? [],
          fps,
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Recognition error";
        setState((prev) => ({
          ...prev,
          status: "error",
          error: message,
        }));
      }
    },
    [config, getBridge, initialize]
  );

  const setConfig = useCallback((partial: Partial<RecognitionConfig>): void => {
    setConfigState((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      recognizingRef.current = false;
      initializedRef.current = false;
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current = null;
      }
      if (smootherRef.current) {
        smootherRef.current.reset();
        smootherRef.current = null;
      }
      if (bridgeRef.current) {
        bridgeRef.current.dispose();
        bridgeRef.current = null;
      }
    };
  }, []);

  return { state, start, stop, recognizeOnce, setConfig, isUsingWorker };
}
