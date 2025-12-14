export class AudioManager {
    constructor() {
        this.waves = new Map(); // targetId -> AudioWave instance
        this.activeVoices = new Map(); // voiceId -> { targetId, level }
    }

    registerWave(targetId, component) {
        this.waves.set(targetId, component);
    }

    unregisterWave(targetId) {
        this.waves.delete(targetId);
    }

    startVoice(voiceId, { targetId }) {
        if (!targetId || !this.waves.has(targetId)) return;
        
        this.activeVoices.set(voiceId, { targetId, level: 0 });
        const wave = this.waves.get(targetId);
        if (wave) wave.start();
    }

    updateVoiceLevel(voiceId, level) {
        const voice = this.activeVoices.get(voiceId);
        if (voice) {
            voice.level = level;
            // Immediate update or smoothed in update loop?
            // Let's update component directly
            const wave = this.waves.get(voice.targetId);
            if (wave) wave.update(level);
        }
    }

    stopVoice(voiceId) {
        const voice = this.activeVoices.get(voiceId);
        if (voice) {
            const wave = this.waves.get(voice.targetId);
            if (wave) wave.stop(); // Or just let it settle to 0?
            this.activeVoices.delete(voiceId);
        }
    }

    update(dt) {
        this.waves.forEach(wave => {
            if (wave.update && typeof wave.update === 'function') {
                // Some might need explicit dt updates for animation
                // wave.animate() handles itself usually via requestAnimationFrame?
                // If using Space.js loop, we call it here.
            }
        });
    }
}
