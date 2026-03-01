export interface RecognitionResult {
  cardCode: string;
  confidence: number;
  candidateCount: number;
  durationMs: number;
}

export interface RecognitionNoMatch {
  cardCode: null;
  confidence: number;
  candidateCount: number;
  durationMs: number;
}

export type RecognitionOutput = RecognitionResult | RecognitionNoMatch;

export interface EmbeddingEntry {
  cardCode: string;
  embedding: number[];
  histogram?: number[];
  color?: string;
  dhash?: number[] | string;
}

export interface ReferenceEmbedding {
  cardCode: string;
  embedding: Float32Array;
  histogram?: Float32Array;
  color?: string;
  dhash?: Float32Array;
}

export interface EmbeddingDatabase {
  version: string;
  model: string;
  embeddingDim: number;
  cardCount: number;
  generatedAt: string;
  entries: EmbeddingEntry[];
}

export interface RecognitionConfig {
  confidenceThreshold: number;
  inputSize: number;
  maxCandidates: number;
  frameSkip: number;
  maxIdentify: number;
}

export type PipelineStatus =
  | "idle"
  | "loading"
  | "ready"
  | "processing"
  | "error";

export interface IdentifiedCard extends DetectedCard {
  cardCode: string | null;
  matchConfidence: number;
  candidates: RecognitionResult[];
}

export interface CardRecognitionState {
  status: PipelineStatus;
  lastResult: RecognitionOutput | null;
  topCandidates: RecognitionResult[];
  detectedCards: DetectedCard[];
  identifiedCards: IdentifiedCard[];
  error: string | null;
  isActive: boolean;
  loadingProgress: number;
  fps: number;
}

export type WorkerMessage =
  | { type: "init"; modelUrl: string; embeddingsUrl: string }
  | { type: "recognize"; imageData: ImageData; config: RecognitionConfig }
  | { type: "dispose" };

export type WorkerResponse =
  | { type: "initialized" }
  | { type: "result"; data: RecognitionOutput; fps: number }
  | { type: "error"; message: string };

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedCard {
  bbox: [number, number, number, number];
  confidence: number;
}

export interface DetectionConfig {
  detectionThreshold: number;
  maxDetections: number;
}
