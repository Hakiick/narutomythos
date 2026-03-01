/**
 * ONNX Runtime Web abstraction for MobileNetV3 Large feature extraction.
 *
 * Loads the ONNX model via WASM backend and provides a simple inference API.
 *
 * Input: Float32Array in NCHW format, ImageNet-normalized
 * Output: Float32Array of 1280-dim embedding
 */

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

export interface OnnxFeatureModel {
  run(input: Float32Array, inputSize: number): Promise<Float32Array>;
  dispose(): void;
}

export async function loadOnnxModel(
  modelUrl: string
): Promise<OnnxFeatureModel> {
  const ort = (await import("onnxruntime-web")) as unknown as OrtModule;

  let wasmBase = "/ml/wasm/";
  try {
    const origin = new URL(modelUrl).origin;
    if (origin && origin !== "null") {
      wasmBase = origin + "/ml/wasm/";
    }
  } catch {
    // modelUrl is relative — relative path is fine
  }
  ort.env.wasm.wasmPaths = wasmBase;
  ort.env.wasm.numThreads = 1;

  const session = await ort.InferenceSession.create(modelUrl, {
    executionProviders: ["wasm"],
  });

  return {
    async run(input: Float32Array, inputSize: number): Promise<Float32Array> {
      const inputTensor = new ort.Tensor("float32", input, [
        1,
        3,
        inputSize,
        inputSize,
      ]);

      const feeds: Record<string, OrtTensor> = { input: inputTensor };
      const results = await session.run(feeds);

      const outputKey = Object.keys(results)[0];
      const output = results[outputKey];
      const embedding = new Float32Array(output.data as Float32Array);

      inputTensor.dispose();
      output.dispose();

      return embedding;
    },

    dispose(): void {
      void session.release();
    },
  };
}
