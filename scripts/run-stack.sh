#!/usr/bin/env bash
set -e

# Configuration
TIER3B_DIR="/Users/davidcaballero/core-x-kbllr_0/houses/tier3b-mlx-rag"
TIER1_DIR="/Users/davidcaballero/core-x-kbllr_0/houses/tier1-smart-campus"
PY_VER="3.13.9"
MLX_PORT=8000
VOICE_PORT=7001
VOICE_PATH="voice-chat"

echo "🚀 Starting Smart Campus stack..."
echo "▶️  Tier3b: $TIER3B_DIR (Python $PY_VER)"

# Activate tier3b environment
cd "$TIER3B_DIR"

# Check if venv exists and has correct Python version
if [ -f ".venv/bin/python" ]; then
  VENV_PY_VER=$(.venv/bin/python --version 2>&1 | awk '{print $2}')
  echo "   Found existing venv with Python $VENV_PY_VER"
  if [[ "$VENV_PY_VER" == "$PY_VER"* ]]; then
    echo "   Using existing venv"
  else
    echo "   ⚠️  Venv has wrong Python version ($VENV_PY_VER vs $PY_VER)"
    echo "   Please run: rm -rf .venv && pyenv shell $PY_VER && uv venv"
    exit 1
  fi
else
  echo "   Creating new venv with Python $PY_VER"
  if command -v pyenv >/dev/null 2>&1; then
    pyenv shell "$PY_VER" || true
  fi
  uv venv
fi

source .venv/bin/activate
uv sync

# Upgrade mlx-lm to ensure GPT-OSS support
echo "📦 Upgrading mlx-lm for GPT-OSS support..."
uv pip install --upgrade mlx-lm

# Start MLX server (GPT-OSS 20B) in background
echo "▶️  Starting MLX server on $MLX_PORT..."
nohup mlx_lm.server --model mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx --host 127.0.0.1 --port "$MLX_PORT" > "$TIER3B_DIR/mlx_server.log" 2>&1 &
MLX_PID=$!
echo "   MLX PID: $MLX_PID"

# Start voice backend (Whisper → GPT-OSS → Kokoro TTS)
if [ -f "$TIER3B_DIR/voice_server.py" ]; then
  echo "▶️  Starting voice backend on $VOICE_PORT/$VOICE_PATH..."
  nohup uv run python "$TIER3B_DIR/voice_server.py" --port "$VOICE_PORT" --host 127.0.0.1 > "$TIER3B_DIR/voice_server.log" 2>&1 &
  VOICE_PID=$!
  echo "   Voice PID: $VOICE_PID"
  echo "   Log: $TIER3B_DIR/voice_server.log"
else
  echo "⚠️  Voice server not found at $TIER3B_DIR/voice_server.py"
  echo "   Voice chat will not be available"
  VOICE_PID=""
fi

# Start Tier1 (server + Vite)
echo "▶️  Starting Tier1 (server + Vite)..."
cd "$TIER1_DIR"
npm run dev:full

# Cleanup on exit
trap "echo '🧹 Stopping servers...'; kill $MLX_PID $VOICE_PID >/dev/null 2>&1 || true" EXIT
