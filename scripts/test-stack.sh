#!/usr/bin/env bash
# Test script to verify all stack components are working

set +e  # Don't exit on errors, we want to show all results

echo "🧪 Testing Smart Campus Stack Components"
echo "=========================================="
echo ""

# Test MLX Server
echo "1️⃣  Testing MLX Server (port 8000)..."
MLX_RESULT=$(curl -s http://localhost:8000/v1/models 2>&1)
if echo "$MLX_RESULT" | grep -q "mlx-community/Jinx-gpt-oss-20b"; then
  echo "   ✅ MLX Server: GPT-OSS 20B model available"
else
  echo "   ❌ MLX Server: Not responding or wrong model"
  echo "   Response: $MLX_RESULT"
fi
echo ""

# Test Voice Server
echo "2️⃣  Testing Voice Server (port 7001)..."
VOICE_RESULT=$(curl -s http://localhost:7001/health 2>&1)
if echo "$VOICE_RESULT" | grep -q '"status":"ok"'; then
  echo "   ✅ Voice Server: Running and healthy"
else
  echo "   ❌ Voice Server: Not responding"
  echo "   Response: $VOICE_RESULT"
fi
echo ""

# Test Tier1 Server
echo "3️⃣  Testing Tier1 Server (port 3001)..."
TIER1_RESULT=$(curl -s http://localhost:3001/health 2>&1)
if echo "$TIER1_RESULT" | grep -q '"status":"ok"'; then
  echo "   ✅ Tier1 Server: Running and healthy"
else
  echo "   ❌ Tier1 Server: Not responding"
  echo "   Response: $TIER1_RESULT"
fi
echo ""

# Test MLX Chat Endpoint
echo "4️⃣  Testing MLX Chat Endpoint..."
MLX_CHAT_RESULT=$(curl -s -X POST http://localhost:3001/api/mlx/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx",
    "messages": [{"role": "user", "content": "Say hello in 3 words"}],
    "maxTokens": 50
  }' 2>&1)

if echo "$MLX_CHAT_RESULT" | grep -q '"completion"'; then
  echo "   ✅ MLX Chat: Working"
  echo "   Response: $(echo "$MLX_CHAT_RESULT" | grep -o '"completion":"[^"]*"' | cut -d'"' -f4)"
else
  echo "   ❌ MLX Chat: Failed"
  echo "   Response: $MLX_CHAT_RESULT"
fi
echo ""

# Test Voice Status Endpoint
echo "5️⃣  Testing Voice Status Endpoint..."
VOICE_STATUS_RESULT=$(curl -s http://localhost:3001/api/voice/status 2>&1)
if echo "$VOICE_STATUS_RESULT" | grep -q '"configured":true'; then
  echo "   ✅ Voice Status: Configured and ready"
else
  echo "   ⚠️  Voice Status: Not configured or not ready"
  echo "   Response: $VOICE_STATUS_RESULT"
fi
echo ""

# Test Vite Dev Server
echo "6️⃣  Testing Vite Dev Server (port 5173)..."
VITE_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>&1)
if [ "$VITE_RESULT" = "200" ]; then
  echo "   ✅ Vite Dev Server: Running"
else
  echo "   ❌ Vite Dev Server: Not responding (HTTP $VITE_RESULT)"
fi
echo ""

echo "=========================================="
echo "✅ Stack test complete!"
echo ""
echo "📊 Summary:"
echo "   • MLX Server:     http://localhost:8000"
echo "   • Voice Server:   http://localhost:7001"
echo "   • Tier1 API:      http://localhost:3001"
echo "   • UI:             http://localhost:5173"
echo ""
echo "📝 Logs:"
echo "   • MLX:    /Users/davidcaballero/core-x-kbllr_0/houses/tier3b-mlx-rag/mlx_server.log"
echo "   • Voice:  /Users/davidcaballero/core-x-kbllr_0/houses/tier3b-mlx-rag/voice_server.log"
