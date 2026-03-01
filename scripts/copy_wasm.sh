#!/bin/bash
# Copy ONNX Runtime WASM files from node_modules to public/ml/wasm/
WASM_SRC="node_modules/onnxruntime-web/dist"
WASM_DST="public/ml/wasm"

if [ ! -d "$WASM_SRC" ]; then
  echo "onnxruntime-web not installed yet, skipping WASM copy"
  exit 0
fi

mkdir -p "$WASM_DST"
cp "$WASM_SRC"/ort-wasm*.wasm "$WASM_DST/" 2>/dev/null || true
cp "$WASM_SRC"/ort-wasm*.mjs "$WASM_DST/" 2>/dev/null || true
echo "WASM files copied to $WASM_DST"
