# Implementation Complete: GPT-OSS 20B + Qwen 2.5 7B

**Date**: 2025-12-02
**Status**: ✅ Ready to Test
**RAM**: 36GB System

---

## What Was Implemented

### 1. Cerberus → GPT-OSS 20B with Harmony Format ✅

**Model**: `gpt-oss-20b` (20B parameters, ~20GB RAM)

**Features**:
- Harmony format with three response channels
- Structured multi-layer reasoning
- Perfect for campus-wide synthesis

**Files Modified**:
- ✅ `src/managers/CampusReportManager.js` - Updated to use `gpt-oss-20b`
- ✅ `src/data/agents/cerberus-campus-agent.json` - Model changed to `gpt-oss-20b`
- ✅ `src/utils/harmonyParser.js` - NEW: Harmony format parser

**Harmony Format Parsing**:
```javascript
// Response structure:
<|analysis|>
  Environmental Layer: ...
  Academic Layer: ...
  Social Layer: ...
<|end|>

<|commentary|>
  Cross-room patterns and insights...
<|end|>

<|final|>
  Poetic 2-sentence campus overview...
<|end|>

// We display the <|final|> channel to users
// Store analysis/commentary for debugging
```

---

### 2. Classrooms → Qwen 2.5 7B Instruct ✅

**Model**: `qwen2.5-7b-instr` (7B parameters, ~7GB RAM)

**Features**:
- Strong instruction following
- Better personality expression than Phi-3
- Good for creative and technical responses

**Files Modified**:
- ✅ `src/managers/CampusReportManager.js` - Classroom model set to `qwen2.5-7b-instr`
- ✅ `src/data/classrooms/lab-a.json` - Dr. Code now uses `qwen2.5-7b-instr`

---

## Memory Configuration (36GB RAM)

### Available Memory Budget

```
Total RAM: 36GB
├─ System: ~6GB
├─ Apps/Browser: ~6GB
└─ Available for MLX: ~24GB
```

### Model Memory Usage

```
GPT-OSS 20B: ~20GB (Cerberus)
Qwen 2.5 7B: ~7GB (per classroom)
Phi-3 Mini: ~3GB (per classroom)
```

### Running Strategy

#### Option A: Sequential Execution (Recommended for 36GB)

```
1. Cerberus NOT loaded by default
2. Classroom reports run sequentially with Qwen 2.5 7B
   ├─ Load Qwen 2.5 7B (~7GB)
   ├─ Generate Lab A report
   ├─ Generate Classroom B report
   ├─ Generate Classroom C report
   └─ Unload Qwen (or keep for next cycle)

3. Load GPT-OSS 20B (~20GB)
4. Generate Cerberus campus overview
5. Unload GPT-OSS 20B

Memory peak: ~20GB (Cerberus) OR ~7GB (Qwen classrooms)
```

#### Option B: Mixed Models (Better for 36GB)

```
Cerberus: gpt-oss-20b (20B, ~20GB) - Run once per 30s
Classrooms: phi-3-mini-4k-instruct-4bit (~3GB) - Run in parallel

Memory usage:
├─ Cerberus generation: 20GB (brief spike)
├─ 5x Phi-3 classrooms: 15GB (continuous)
└─ Total peak: 20GB + 15GB = 35GB ⚠️ TIGHT!

Better approach:
├─ Cerberus: 20GB (30s cycle)
├─ When Cerberus idle: 3x Phi-3 = 9GB
└─ Comfortable: 20GB peak, 9GB steady
```

#### Option C: Ultra-Light Classrooms (Most Stable)

```
Cerberus: gpt-oss-20b (20GB) - Campus synthesis
Classrooms: phi-3-mini-4k-instruct (3GB) - All reports

Memory profile:
├─ Cerberus active: 20GB
├─ 3x Phi-3 parallel: 9GB
├─ Total peak: 29GB
└─ Safe margin: 7GB ✅ RECOMMENDED
```

---

## Recommended Configuration for 36GB

### Update CampusReportManager

```javascript
// In src/managers/CampusReportManager.js
constructor(classroomRegistry) {
  this.classroomRegistry = classroomRegistry;
  this.mlxApiUrl = 'http://localhost:8081/api/mlx/chat';

  // Model configuration for 36GB RAM
  this.cerberusModel = 'gpt-oss-20b';  // 20GB - Campus synthesis
  this.classroomModel = 'phi-3-mini-4k-instruct-4bit';  // 3GB - Classroom reports

  // Alternative: Use Qwen for high-priority classrooms only
  this.classroomModelPriority = {
    'classroom-lab-a': 'qwen2.5-7b-instr',  // Dr. Code gets Qwen
    'default': 'phi-3-mini-4k-instruct-4bit'  // Others get Phi-3
  };

  this.reportCache = new Map();
  this.cacheExpiry = 60000;
}
```

### Implement Smart Model Selection

```javascript
async generateClassroomReport(classroom) {
  // Choose model based on classroom priority
  const model = this.classroomModelPriority[classroom.id]
    || this.classroomModelPriority.default;

  const response = await fetch(this.mlxApiUrl, {
    method: 'POST',
    body: JSON.stringify({
      model,  // phi-3 or qwen based on priority
      messages: [...]
    })
  });
}
```

---

## Current Implementation (As-Is)

**What's configured NOW**:
```javascript
// CampusReportManager.js:19-20
this.cerberusModel = 'gpt-oss-20b';  // ✅ Harmony format
this.classroomModel = 'qwen2.5-7b-instr';  // ⚠️ 7GB per classroom
```

**This will work IF**:
- Classrooms generate reports sequentially (one at a time)
- Cerberus generates overview after all classrooms done
- MLX server properly unloads models between calls

**Potential issue on 36GB**:
- If MLX keeps both models loaded: 20GB + 7GB = 27GB (TIGHT)
- If MLX unloads between: 20GB peak (SAFE)

---

## Testing the Implementation

### Step 1: Check Dev Server

```bash
# Should already be running on port 5176
# Check for errors in console
```

### Step 2: Start MLX Server

```bash
# The MLX server needs to be running on port 8000
# Should recognize gpt-oss-20b and qwen2.5-7b-instr models
```

### Step 3: Start tier2-orchestrator

```bash
cd /Users/davidcaballero/core-x-kbllr_0/houses/tier2-orchestrator
npm start
# Port 8081
```

### Step 4: Open Smart Campus

```
http://localhost:5176/

Wait 30 seconds for Cerberus to generate overview
```

### Step 5: Check Console

```javascript
// After overview loads:

// View Harmony channels
window.campusApp.campusHeader.reportManager.generateCampusOverview()
  .then(result => {
    console.log('Final (displayed):', result.overview);
    console.log('Analysis channel:', result.harmonyChannels.analysis);
    console.log('Commentary channel:', result.harmonyChannels.commentary);
    console.log('Cerberus heads:', result.cerberusHeads);
  });

// View classroom reports
window.classroomReports
// Should show reports generated by qwen2.5-7b-instr
```

---

## If Memory Issues Occur

### Switch to Phi-3 for Classrooms

**Edit**: `src/managers/CampusReportManager.js:20`

```javascript
// Change from:
this.classroomModel = 'qwen2.5-7b-instr';

// To:
this.classroomModel = 'phi-3-mini-4k-instruct-4bit';
```

**Save and reload browser** - Vite will hot-reload the change.

### Benefits of Phi-3 Fallback
- ✅ Only 3GB RAM per classroom
- ✅ Can run 5+ classrooms in parallel
- ✅ Safe 29GB peak with Cerberus
- ⚠️ Less personality than Qwen
- ⚠️ Simpler responses

---

## Files Created/Modified

### Created
1. ✅ `src/utils/harmonyParser.js` - Harmony format parser (195 lines)
2. ✅ `docs/MODEL_STRATEGY.md` - Comprehensive model research
3. ✅ `docs/IMPLEMENTATION_COMPLETE.md` - This file

### Modified
1. ✅ `src/managers/CampusReportManager.js`
   - Line 11: Added harmony parser import
   - Line 19: `cerberusModel = 'gpt-oss-20b'`
   - Line 20: `classroomModel = 'qwen2.5-7b-instr'`
   - Line 61: Classroom uses `this.classroomModel`
   - Line 150: Cerberus uses `this.cerberusModel` with Harmony prompt
   - Line 175-191: Parse Harmony response, extract channels and heads

2. ✅ `src/data/agents/cerberus-campus-agent.json`
   - Line 20: Model changed to `gpt-oss-20b`

3. ✅ `src/data/classrooms/lab-a.json`
   - Line 39: Dr. Code model changed to `qwen2.5-7b-instr`

---

## Expected Behavior

### Cerberus Overview (with Harmony)

**Raw Response** (in console):
```
<|analysis|>
Environmental Layer: Campus maintains 22.3°C average across 8 spaces,
58/120 occupancy (48%), optimal air quality with 620ppm CO2 average.

Academic Layer: 3 active learning sessions - Lab A's ML fundamentals
with 15 students, Lecture B physics with 28, quiet study preparation in C.

Social Layer: Morning social energy concentrated in Cantina (42 people)
and Lab A collaborative zones, circulation patterns show pre-lunch clustering.
<|end|>

<|commentary|>
Cross-room observation: Technical learning (Lab A) naturally pairs with
social recharge (Cantina), classic morning campus rhythm. Temperature
consistency across spaces suggests HVAC optimization performing effectively.
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

### Lab A Report (with Qwen 2.5 7B)

```
"Lab A pulses with 15 students deep in ML fundamentals—GPU workstations
humming at 78% utilization, whiteboard filled with backpropagation diagrams,
optimal 22.5°C focus zone. The algorithm of learning runs smoothly."
```

---

## Performance Expectations

### With 36GB RAM

**Scenario: Sequential Execution**
```
Classroom reports (Qwen 2.5 7B):
├─ First report: ~2-3s (model load + inference)
├─ Cached reports: < 1s (cache hit)
└─ Peak memory: ~7GB

Cerberus overview (GPT-OSS 20B):
├─ Generation: ~3-5s (model load + inference)
├─ Harmony parsing: < 10ms
└─ Peak memory: ~20GB

Total cycle time: ~8-12s for full campus overview
Cache refresh: Every 60s for classrooms, 30s for Cerberus
```

**If using Phi-3 instead**:
```
Classroom reports (Phi-3):
├─ First report: ~500ms-1s
├─ Multiple parallel: 3 simultaneous
└─ Peak memory: ~3GB

Cerberus overview (GPT-OSS 20B):
├─ Same: ~3-5s
└─ Peak memory: ~20GB

Total cycle time: ~5-7s for full campus overview
```

---

## Troubleshooting

### "Model not found: gpt-oss-20b"

MLX server doesn't recognize the model name.

**Fix options**:
1. Check model name in MLX server: `curl http://localhost:8000/v1/models`
2. Update `cerberusModel` to match actual model name
3. Possible names: `gpt-oss-20b`, `mlx-community--Jinx-gpt-oss-20b-mxfp4-mlx`

### "Out of memory" errors

36GB RAM is tight for both models simultaneously.

**Fix**:
```javascript
// In CampusReportManager.js:20
this.classroomModel = 'phi-3-mini-4k-instruct-4bit';  // Use lighter model
```

### Harmony parsing fails

If Harmony format tags not found, falls back to raw response.

**Check**:
```javascript
// In console
window.campusApp.campusHeader.reportManager.generateCampusOverview()
  .then(r => console.log(r.rawResponse));
// Should show <|analysis|>, <|commentary|>, <|final|> tags
```

---

## Summary

### Architecture

```
Smart Campus (tier1)
  ↓ http://localhost:8081/api/mlx/chat
tier2-orchestrator (tier2)
  ↓ http://localhost:8000/v1/chat/completions
MLX Server (tier3a)
  ├─ gpt-oss-20b → Cerberus campus overview (Harmony format)
  └─ qwen2.5-7b-instr → Classroom reports (instruction-tuned)
```

### Models

| Agent | Model | RAM | Purpose |
|-------|-------|-----|---------|
| Cerberus | gpt-oss-20b | ~20GB | Campus synthesis with Harmony |
| Dr. Code (Lab A) | qwen2.5-7b-instr | ~7GB | Technical classroom reports |
| Other Classrooms | phi-3 (recommended) | ~3GB | Standard reports |

### Next Steps

1. ✅ **Start MLX server** on port 8000
2. ✅ **Start tier2-orchestrator** on port 8081
3. ✅ **Smart Campus already running** on port 5176
4. ✅ **Wait 30 seconds** for first Cerberus overview
5. ✅ **Check console** for Harmony channels and classroom reports

**The Guardian watches. Cerberus awaits activation.** 🐕‍🦺
