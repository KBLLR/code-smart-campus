import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

/**
 * Radial audio graph inspired by Space.js audio_radial_graph example.
 * Displays highs/mids/lows energy while recording.
 */
export class RadialAudioGraph extends Interface {
  constructor(options = {}) {
    super('.radial-audio-graph');

    this.size = options.size || 160;
    this.radius = this.size / 2 - 10;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d');

    this.analyser = null;
    this.data = null;
    this.animationId = null;
    this.segments = {
      highs: 0,
      mids: 0,
      lows: 0
    };

    this._initStyles();
  }

  _initStyles() {
    this.css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      background: 'rgba(0,0,0,0.2)',
      width: `${this.size}px`
    });

    const title = new Interface('.radial-title');
    title.text('VOICE SPECTRUM');
    title.css({
      fontSize: '10px',
      letterSpacing: '1px',
      color: 'var(--ui-secondary-color)',
      textTransform: 'uppercase'
    });
    this.add(title);

    this.canvas.style.width = `${this.size}px`;
    this.canvas.style.height = `${this.size}px`;
    this.add(this.canvas);
  }

  attachStream(stream) {
    const audioCtx = new AudioContext({ sampleRate: 48000 });
    const source = audioCtx.createMediaStreamSource(stream);
    this.analyser = audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.data = new Uint8Array(this.analyser.frequencyBinCount);
    source.connect(this.analyser);
    this._animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.analyser = null;
    this.data = null;
    this.clear();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _animate() {
    if (!this.analyser) return;

    this.analyser.getByteFrequencyData(this.data);
    const len = this.data.length;
    const third = Math.floor(len / 3);

    const highs = this._avg(this.data, 0, third);
    const mids = this._avg(this.data, third, third * 2);
    const lows = this._avg(this.data, third * 2, len);

    this.segments.highs = highs;
    this.segments.mids = mids;
    this.segments.lows = lows;

    this._draw();

    this.animationId = requestAnimationFrame(() => this._animate());
  }

  _avg(arr, start, end) {
    let sum = 0;
    let count = 0;
    for (let i = start; i < end; i++) {
      sum += arr[i];
      count++;
    }
    return count ? sum / count / 255 : 0;
  }

  _draw() {
    const { ctx, canvas, radius } = this;
    const center = this.size / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const segments = [
      { value: this.segments.highs, color: '#60a5fa', start: -Math.PI / 2, end: 0 },
      { value: this.segments.mids, color: '#34d399', start: 0, end: Math.PI / 2 },
      { value: this.segments.lows, color: '#fbbf24', start: Math.PI / 2, end: Math.PI * 1.5 }
    ];

    segments.forEach(seg => {
      ctx.beginPath();
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = 6;
      const r = radius * (0.4 + seg.value * 0.6);
      ctx.arc(center, center, r, seg.start, seg.end);
      ctx.stroke();
    });

    // center dot
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.arc(center, center, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
