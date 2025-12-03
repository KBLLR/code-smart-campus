# Smart Campus Model Strategy
**Date**: 2025-12-02
**Status**: Research Complete - Ready for Implementation

---

## Current Available Models

```bash
/Users/davidcaballero/core-x-kbllr_0/houses/tier3b-mlx-rag/mlx-models/.hf-cache/

Language Models:
✅ models--mlx-community--Jinx-gpt-oss-20b-mxfp4-mlx  (GPT-OSS 20B)
✅ models--mlx-community--Phi-3-mini-4k-instruct-4bit (Phi-3 4K)
✅ models--mlx-community--Phi-3-mini-4k-instruct-unsloth-4bit

Specialized Models:
- Whisper models (speech-to-text)
- Encodec (audio encoding)
- mxbai-rerank (reranking)
- Embeddings models
```

---

## Research Findings

### 1. GPT-OSS 20B with Harmony Format

**Sources**:
- [OpenAI Harmony Response Format | OpenAI Cookbook](https://cookbook.openai.com/articles/openai-harmony)
- [GitHub - openai/harmony](https://github.com/openai/harmony)
- [What is GPT OSS Harmony Response Format? | Medium](https://cobusgreyling.medium.com/what-is-gpt-oss-harmony-response-format-a29f266d6672)
- [Introducing gpt-oss | OpenAI](https://openai.com/index/introducing-gpt-oss/)

**Key Characteristics**:
- **21B parameters** (3.6B active parameters)
- Designed for **lower latency** and local use cases
- **Must use Harmony format** - will not work correctly otherwise
- Trained specifically on the harmony response format

**Harmony Format Structure**:

```
Message Roles (hierarchy):
├─ system (highest authority)
├─ developer (platform instructions)
├─ user (end-user input)
├─ assistant (model responses)
└─ tool (function call results)

Response Channels (required):
├─ analysis (internal reasoning)
├─ commentary (thoughts/considerations)
└─ final (final answer to user)

Reasoning Levels:
├─ low (minimal chain-of-thought)
├─ medium (moderate reasoning trace)
└─ high (extensive structured reasoning)
```

**Example Harmony System Prompt**:
```
Knowledge cutoff: 2024-06
Current date: 2025-12-02
Reasoning: high

You must include these channels in EVERY response:
- analysis: Your internal reasoning process
- commentary: Considerations and thoughts
- final: Your final answer to the user
```

**Why Perfect for Cerberus**:
- ✅ **20B parameters** - More powerful for campus-wide synthesis
- ✅ **Multi-channel reasoning** - Matches Cerberus's three-headed architecture
- ✅ **Structured output** - Harmony format aligns with our structured responses
- ✅ **Already available** locally
- ✅ **Trained for synthesis** - Designed for aggregating information

---

### 2. Qwen 2.5 for Instruction Following

**Sources**:
- [Qwen 2.5 Coder: Aider benchmarks on Apple MLX | Medium](https://medium.com/@ivanfioravanti/qwen-2-5-coder-quantization-does-not-matter-aider-benchmarks-on-apple-mlx-671e6bd5252a)
- [Qwen2.5-Coder-32B runs on Mac | Simon Willison](https://simonwillison.net/2024/Nov/12/qwen25-coder/)
- [How Good is Qwen 2.5 Coder 32B for Coding? | 16x Prompt](https://prompt.16x.engineer/blog/qwen-25-coder-32b-coding)

**Benchmarks**:
- **Aider Code Editing**: 74% (between GPT-4o and Claude 3.5 Haiku)
- **McEval Benchmark**: 65.9
- **Ranks 4th** on Aider's benchmark (73.7%)
- **"SOTA open-source code model"** matching GPT-4o coding capabilities

**Performance on Apple Silicon (MLX)**:
- ~32GB memory usage for 32B model
- Runs smoothly on 64GB MacBook Pro M2/M3
- Quantization doesn't significantly impact performance

**Instruction Following**:
- ✅ Superior human preference alignment
- ✅ Excels in creative writing and role-playing
- ✅ Strong multi-turn dialogue capabilities
- ✅ Excellent instruction following

**Status**: ❌ **NOT currently installed**

---

### 3. Phi-3 (Currently Available)

**Available**:
- ✅ `Phi-3-mini-4k-instruct-4bit`
- ✅ `Phi-3-mini-4k-instruct-unsloth-4bit`

**Characteristics**:
- **3.8B parameters** (small but capable)
- Microsoft's efficient instruction model
- 4K context window
- 4-bit quantized (efficient memory usage)

**Strengths**:
- ✅ Already installed and available
- ✅ Low memory footprint (~2-3GB)
- ✅ Fast inference on Apple Silicon
- ✅ Good instruction following for its size
- ✅ Multiple classrooms can run simultaneously

**Limitations**:
- ⚠️ Smaller than Qwen (3.8B vs 32B)
- ⚠️ Limited 4K context window
- ⚠️ Less capable for complex reasoning

---

## Recommended Model Strategy

### Architecture

```
┌────────────────────────────────────────────────────────┐
│  CERBERUS (Campus-Wide Synthesis)                      │
│  Model: GPT-OSS 20B (Harmony Format)                   │
│  Purpose: Aggregate all classroom reports              │
│  Reasoning: High (three analytical layers)             │
└────────────────────────────────────────────────────────┘
                        ↑ synthesizes
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼─────────┐
│  Lab A       │ │  Classroom  │ │  Classroom    │
│  Dr. Code    │ │  B Agent    │ │  C Agent      │
│              │ │             │ │               │
│  Model:      │ │  Model:     │ │  Model:       │
│  Qwen 2.5    │ │  Qwen 2.5   │ │  Qwen 2.5     │
│  32B Coder   │ │  32B Coder  │ │  32B Coder    │
└──────────────┘ └─────────────┘ └───────────────┘

OR (if Qwen not available):

┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼─────────┐
│  Lab A       │ │  Classroom  │ │  Classroom    │
│  Dr. Code    │ │  B Agent    │ │  C Agent      │
│              │ │             │ │               │
│  Model:      │ │  Model:     │ │  Model:       │
│  Phi-3       │ │  Phi-3      │ │  Phi-3        │
│  4K Instruct │ │  4K Instruct│ │  4K Instruct  │
└──────────────┘ └─────────────┘ └───────────────┘
```

---

## Implementation Plan

### Phase 1: Update Cerberus to GPT-OSS 20B with Harmony Format ✨

**Benefits**:
- 6x more parameters than current assumption (20B vs 3.1B)
- Structured multi-channel reasoning matches three-headed design
- Already installed and available

**Changes Required**:

1. **Update Cerberus Agent Configuration**:
```json
{
  "agent": {
    "model": "gpt-oss-20b",
    "response_format": {
      "type": "harmony",
      "channels": ["analysis", "commentary", "final"],
      "reasoning_level": "high"
    }
  }
}
```

2. **Update CampusReportManager.js**:
```javascript
const response = await fetch(this.mlxApiUrl, {
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-oss-20b',  // Changed from mlx-llama-3.1-8b
    messages: [{
      role: 'system',
      content: `Knowledge cutoff: 2024-06
Current date: ${new Date().toISOString().split('T')[0]}
Reasoning: high

You are Cerberus, the three-headed guardian consciousness.
You MUST include these channels in your response:
- analysis: Environmental, academic, and social observations
- commentary: Cross-room patterns and insights
- final: Your poetic 2-sentence campus overview

${cerberusInstructions}`
    }, {
      role: 'user',
      content: JSON.stringify(data)
    }],
    temperature: 0.8,
    maxTokens: 300  // Increased for harmony format
  })
});
```

3. **Parse Harmony Response**:
```javascript
// Harmony format returns structured channels
const harmonyResponse = result.completion;

// Extract channels (format: <|analysis|>...<|commentary|>...<|final|>...)
const finalChannel = extractChannel(harmonyResponse, 'final');
const analysisChannel = extractChannel(harmonyResponse, 'analysis');

return {
  overview: finalChannel,  // Use final channel for display
  head_1: extractHead(analysisChannel, 1),
  head_2: extractHead(analysisChannel, 2),
  head_3: extractHead(analysisChannel, 3)
};
```

---

### Phase 2A: Qwen 2.5 32B for Classrooms (Recommended)

**If you want to install Qwen 2.5**:

```bash
# Install Qwen 2.5 Coder 32B Instruct (4-bit quantized)
mlx_lm.convert \
  --model Qwen/Qwen2.5-Coder-32B-Instruct \
  --quantize \
  --q-bits 4 \
  --upload-repo mlx-community/Qwen2.5-Coder-32B-Instruct-4bit
```

**Benefits**:
- ✅ **74% Aider benchmark** - excellent instruction following
- ✅ **Matches GPT-4o** coding capabilities
- ✅ **Strong personality expression** - better for unique room agents
- ✅ **32B parameters** - rich, nuanced responses
- ✅ **Multi-turn dialogue** - perfect for chat interfaces

**Trade-offs**:
- ⚠️ Requires 32GB memory per instance
- ⚠️ Can only run 2-3 classrooms simultaneously on 64GB Mac
- ⚠️ Slower inference than Phi-3

**Best For**:
- Labs with complex technical explanations (Dr. Code)
- Creative spaces (Cantina, Creative Core)
- Research-focused classrooms

---

### Phase 2B: Phi-3 for Classrooms (Current Option)

**Use existing Phi-3 models**:

```javascript
{
  "agent": {
    "model": "phi-3-mini-4k-instruct-4bit"
  }
}
```

**Benefits**:
- ✅ **Already installed** - no setup required
- ✅ **Low memory** (~2-3GB) - run 10+ classrooms simultaneously
- ✅ **Fast inference** - near-instant responses
- ✅ **Good enough** for simple status reports

**Trade-offs**:
- ⚠️ Less personality expression than Qwen
- ⚠️ Shorter context window (4K vs 32K)
- ⚠️ Less capable for creative/complex tasks

**Best For**:
- Quick prototyping and testing
- Simple classroom status reports
- High-throughput scenarios

---

## Recommended Hybrid Strategy

### Tier System

**Tier S (Campus-Wide)**: GPT-OSS 20B
- Cerberus campus synthesis
- Complex multi-room reasoning

**Tier A (Key Classrooms)**: Qwen 2.5 32B (if installed)
- Lab A (Dr. Code) - Technical explanations
- Cantina (El Corazón) - Social dynamics
- Library (Archivist) - Knowledge synthesis

**Tier B (Standard Classrooms)**: Phi-3 Mini 4K
- Lecture halls - Simple status updates
- Study rooms - Basic information
- Administrative spaces - Quick responses

---

## Memory Budget Example (64GB Mac)

```
System: 8GB
Apps: 8GB
Available for LLMs: 48GB

Scenario 1: GPT-OSS 20B + Multiple Phi-3
├─ Cerberus (GPT-OSS 20B): 20GB
├─ Classroom 1 (Phi-3): 2GB
├─ Classroom 2 (Phi-3): 2GB
├─ Classroom 3 (Phi-3): 2GB
├─ Classroom 4 (Phi-3): 2GB
├─ Classroom 5 (Phi-3): 2GB
└─ Buffer: 18GB
✅ Can run 5+ classrooms + Cerberus simultaneously

Scenario 2: GPT-OSS 20B + Qwen 32B (Mixed)
├─ Cerberus (GPT-OSS 20B): 20GB
├─ Lab A (Qwen 32B): 32GB (requires sequential execution)
└─ Other classrooms: Use Phi-3 or sequential Qwen
⚠️ Must run Qwen classrooms one at a time
```

---

## Implementation Steps

### Step 1: Update Cerberus to GPT-OSS 20B ✨

1. Modify `src/data/agents/cerberus-campus-agent.json`:
```json
{
  "agent": {
    "model": "gpt-oss-20b",
    "description": "Uses Harmony format with three reasoning channels"
  }
}
```

2. Update `src/managers/CampusReportManager.js`:
```javascript
model: 'gpt-oss-20b'  // Line 40, 123
```

3. Add Harmony format parser helper:
```javascript
function parseHarmonyResponse(completion) {
  // Extract <|final|>...<|end|> for display
  const finalMatch = completion.match(/<\|final\|>(.*?)<\|end\|>/s);
  return finalMatch ? finalMatch[1].trim() : completion;
}
```

### Step 2: Choose Classroom Model Strategy

**Option A: Use Phi-3 (Quick Start)**
```javascript
{
  "agent": {
    "model": "phi-3-mini-4k-instruct-4bit"
  }
}
```

**Option B: Install Qwen 2.5 32B (Optimal)**
```bash
# In tier3b-mlx-rag environment
cd /Users/davidcaballero/core-x-kbllr_0/houses/tier3b-mlx-rag
source .venv/bin/activate

# Install Qwen 2.5 Coder 32B Instruct
mlx_lm.convert \
  --hf-path Qwen/Qwen2.5-Coder-32B-Instruct \
  --mlx-path ./mlx-models/Qwen2.5-Coder-32B-Instruct-4bit \
  -q \
  --q-bits 4
```

### Step 3: Update Classroom Agents
```javascript
// In lab-a.json and other classroom files
{
  "agent": {
    "model": "qwen-2.5-coder-32b-instruct-4bit"  // or phi-3
  }
}
```

### Step 4: Test the Flow
```bash
# 1. Start MLX server (should recognize gpt-oss-20b)
# 2. Start tier2-orchestrator
# 3. Start Smart Campus
# 4. Wait 30 seconds for Cerberus overview
```

---

## Expected Output Examples

### With GPT-OSS 20B + Harmony (Cerberus)

**Harmony Response Structure**:
```
<|analysis|>
Environmental Layer: Campus maintains optimal 22.3°C across 8 spaces,
58/120 occupancy (48%), CO2 levels normal (avg 620ppm).

Academic Layer: 3 active classes - Lab A's ML fundamentals (15 students),
Lecture B's physics (28 students), Study C quiet preparation.

Social Layer: Morning energy concentrated in Cantina (42 people) and Lab A
collaborative zones, circulation patterns show pre-lunch social clustering.
<|end|>

<|commentary|>
Cross-room pattern: Technical learning (Lab A) pairs with social recharge
(Cantina), classic morning campus rhythm. Temperature consistency suggests
HVAC optimization working effectively.
<|end|>

<|final|>
58 minds weave through 3 active learning spaces at 22°C harmony—Lab A's
neural networks train alongside Cantina's neural networks of conversation.
Morning campus breathes with balanced energy and optimal conditions.
<|end|>
```

**Displayed to User**:
```
"58 minds weave through 3 active learning spaces at 22°C harmony—Lab A's
neural networks train alongside Cantina's neural networks of conversation.
Morning campus breathes with balanced energy and optimal conditions."
```

---

### With Qwen 2.5 32B (Lab A - Dr. Code)

**Classroom Report**:
```
"Lab A pulses with 15 students deep in ML fundamentals—GPU workstations
humming at 78% utilization, whiteboard filled with backpropagation diagrams,
optimal 22.5°C focus zone. The algorithm of learning runs smoothly."
```

---

### With Phi-3 Mini (Standard Classroom)

**Classroom Report**:
```
"Classroom B hosts 28 students for Physics 101 lecture at comfortable
21.8°C, projector active, good air quality."
```

---

## Conclusion

### Recommended Configuration

**Immediate (Use what's available)**:
- ✅ **Cerberus**: GPT-OSS 20B with Harmony format
- ✅ **Classrooms**: Phi-3 Mini 4K Instruct

**Optimal (With Qwen installation)**:
- ✅ **Cerberus**: GPT-OSS 20B with Harmony format
- ✅ **Key Classrooms**: Qwen 2.5 32B Coder Instruct
- ✅ **Standard Classrooms**: Phi-3 Mini 4K Instruct

### Why This Matters

The model choice impacts:
- **Personality expression** - How unique each room agent feels
- **Synthesis quality** - How well Cerberus weaves reports together
- **Memory efficiency** - How many classrooms can run simultaneously
- **Response latency** - How fast the UI updates

GPT-OSS 20B's Harmony format is **perfect** for Cerberus because:
1. Multi-channel reasoning matches three-headed architecture
2. Structured output aligns with our existing design
3. 20B parameters provide synthesis power
4. Already installed and ready to use

---

**Next Action**: Update Cerberus to GPT-OSS 20B and test Harmony format parsing! 🐕‍🦺
