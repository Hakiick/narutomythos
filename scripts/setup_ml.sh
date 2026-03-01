#!/usr/bin/env bash
set -euo pipefail

# setup_ml.sh — Set up Python environment, export ONNX model, and generate embeddings
# Usage: bash scripts/setup_ml.sh [--mock]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

MOCK_FLAG=""
if [[ "${1:-}" == "--mock" ]]; then
    MOCK_FLAG="--mock"
    echo "ℹ  Mock mode: will generate random embeddings"
fi

echo "═══════════════════════════════════════════"
echo "  Naruto Mythos — ML Setup"
echo "═══════════════════════════════════════════"

# Step 1: Create Python virtual environment
echo ""
echo "── Step 1: Python virtual environment ──"
if [ ! -d ".venv" ]; then
    echo "Creating .venv..."
    python3 -m venv .venv
else
    echo ".venv already exists, skipping creation"
fi

# Step 2: Install Python dependencies
echo ""
echo "── Step 2: Install Python dependencies ──"
.venv/bin/pip install --upgrade pip
.venv/bin/pip install torch torchvision numpy pillow requests onnxruntime

# Step 3: Copy WASM files
echo ""
echo "── Step 3: Copy ONNX Runtime WASM files ──"
bash scripts/copy_wasm.sh

# Step 4: Export ONNX model (skip if already exists or in mock mode)
echo ""
echo "── Step 4: Export ONNX model ──"
if [ -f "public/ml/mobilenet_v3_large.onnx" ]; then
    echo "Model already exists at public/ml/mobilenet_v3_large.onnx, skipping export"
else
    if [ -n "$MOCK_FLAG" ]; then
        echo "Mock mode: skipping ONNX export"
    else
        .venv/bin/python scripts/export_onnx.py
    fi
fi

# Step 5: Generate embeddings
echo ""
echo "── Step 5: Generate embeddings ──"
.venv/bin/python scripts/generate_embeddings.py $MOCK_FLAG

echo ""
echo "═══════════════════════════════════════════"
echo "  ML Setup complete!"
echo "═══════════════════════════════════════════"
