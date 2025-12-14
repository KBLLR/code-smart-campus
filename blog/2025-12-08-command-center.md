# Command Center: Merging WebGL, HUDs, and Local Voice Agents

Using a 2D dashboard to control a smart building feels like driving a spaceship with a spreadsheet. It works, but it has no soul.

For the last few weeks, I’ve been obsessed with a specific question: can we make a web-based "Digital Twin" that actually feels like a sci-fi command center? I don’t just mean better icons. I mean a living, breathing 3D environment where you can float through rooms, see real-time sensor data glowing on the walls, and—crucially—just *talk* to the building to get things done.

The detailed "Smart Campus" project I’ve been building (Tier 1) needed a serious upgrade. I wanted to move from "functional debug view" to "premium HUD."

## The Core Tension

Here is the problem: **Cinematic visuals usually kill usability.**

Thick 3D atmospheres (bloom, shadows, post-processing) tend to make text unreadable. Complex 3D scenes steal mouse events from UI overlays. And adding voice interaction usually means dealing with cloud APIs that add 500ms of lag, killing the "Jarvis" vibe.

Can we have it all? A Space.js-style immersive HUD, a high-fidelity Three.js scene, and snappy local AI interaction?

## Process & Experiments

### 1. The "Tron" Aesthetic (Bloom + Post-Processing)

First, I needed to ditch the flat look. I reached for the `UnrealBloomPass` in Three.js. It’s the easiest way to add that "next-gen" polish, but it’s dangerous. Set the strength too high, and your clean UI turns into a radioactive smear.

I built a dedicated `EffectsView` to manage this. The trick was isolating the bloom so it hits the "emissive" parts of the room (like screens and lights) but spares the clean lines of the HUD.

```javascript
// src/3d/views/EffectsView.js
this.bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 
  0.6, // Strength: Keep this under 0.8!
  0.5, // Radius
  0.8  // Threshold
);
```

**Observation:** `0.75` strength is the sweet spot for "sci-fi" without "lens flare meme."

### 2. The Invisible Wall (Pointer Events)

Once the HUD was in place—a beautiful overlay of sensor graphs and labels—I hit a classic wall. Literally.

I couldn't click on any of the rooms. The 3D raycaster was failing.

It turned out my new "cinematic" UI layers were transparent `<div>`s covering the entire screen. Visually invisible, but physically blocking every mouse click intended for the WebGL canvas.

The fix was a strict CSS discipline:
```css
.hud-container {
  pointer-events: none; /* Let clicks pass through */
}
.hud-button {
  pointer-events: auto; /* Catch clicks only on interactive bits */
}
```
It sounds trivial, but debugging "why can't I select the kitchen?" took longer than I'd like to admit.

### 3. Talking to the House (Local MLX Support)

The final piece was voice. I didn't want to send audio to OpenAI and wait. I have a Mac with Apple Silicon; I should be able to run this locally.

I hooked up a `VoiceChatService` that captures microphone input and flings it to a local Python server running MLX (Apple's array framework).

```javascript
// src/services/VoiceChatService.js
async sendAudio({ roomId, audioBlob }) {
  const formData = new FormData();
  formData.append('voice_id', 'af_bella');
  formData.append('audio', audioBlob, 'input.wav');
  
  // POST to local MLX server
  const response = await fetch(this.baseUrl, { 
    method: 'POST', 
    body: formData 
  });
  return response.json();
}
```

We default to `mlx-community` models. The latency? Surprisingly snappy. It feels intimate in a way cloud APIs don't.

## Findings & Patterns

### 1. Latency is a Texture
In a 3D interface, lag feels different. Visual lag (low FPS) breaks immersion immediately. Voice lag (waiting for AI) feels like "thinking." As long as the UI *acknowledges* the input (a spinning ring, a sound), users forgive the AI delay. But drop 5 frames of animation? They hate it.

### 2. The "Glass Wall" Effect
Mixing DOM UI (HTML/CSS) and WebGL is a minefield. You are effectively building two apps on top of each other. Managing `pointer-events` is not just CSS cleanup; it's the core architecture of your interaction model.

### 3. Local AI is "Good Enough"
For a home controller, a 7B or 8B parameter model running locally on M-series chips is indistinguishable from GPT-4 for tasks like "Turn on the lights" or "What's the temperature?". And it’s free.

## Practical Takeaways

- **Bloom Responsibly**: Use `UnrealBloomPass` but expose `blooomStrength`, `radius`, and `threshold` to a debug panel (like Tweakpane). You need to tune it live in the browser, not in code.
- **FormData for Audio**: Don't overcomplicate audio uploads. `FormData` handles the multipart boundaries for blobs perfectly.
- **Debug Interaction Layers**: If your 3D scene ignores you, add a `border: 1px solid red` to your UI containers. You'll likely find a giant invisible div eating your clicks.

## Limits & Open Questions

I’m still sending the *entire* audio blob at once. This adds latency. The next step is **streaming** audio chunks to the MLX server for near-instant transcription.

Also, the "Campus" is getting heavy. Loading the GLB + Textures + AI Models on startup is becoming noticeable. I need a proper `LoaderManager` (which is already on my task list) to make the startup feel like a boot sequence, not a frozen tab.

## Wrap-up

This week moved the project from "informative dashboard" to "immersive environment." It finally feels like a place I want to inhabit, not just a tool I use.

Next up: connecting that Local AI to the actual Home Assistant WebSocket API, so when I say "make it moody," the lights actually dim.

*(Should I verify that? Probably. But that's for the next post.)*
