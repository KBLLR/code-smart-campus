import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

const CITY = 'Berlin';

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekNumber(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const weekDiff = (target - firstThursday) / 86400000;
  return 1 + Math.floor(weekDiff / 7);
}

export class HeaderBar extends Interface {
  constructor() {
    super('.header-bar');

    this.updateTimer = null;
    this.statusTimer = null;
    this.statusText = 'Checking systems…';
    this.init();
    this.initViews();
  }

  init() {
    this.css({
      position: 'absolute',
      top: 12,
      left: 16,
      right: 16,
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      pointerEvents: 'none',
      fontFamily: 'var(--ui-font-family)',
      color: 'var(--ui-color)'
    });

    document.body.appendChild(this.element);
  }

  initViews() {
    // Left cluster (time/date/city/week)
    this.left = new Interface('.header-left');
    this.left.css({
      display: 'flex',
      gap: 12,
      fontSize: '11px',
      letterSpacing: 1,
      textTransform: 'uppercase',
      opacity: 0.8
    });
    this.add(this.left);

    this.timeEl = new Interface('.time');
    this.dateEl = new Interface('.date');
    this.cityEl = new Interface('.city');
    this.weekEl = new Interface('.week');
    this.left.add(this.timeEl);
    this.left.add(this.dateEl);
    this.left.add(this.cityEl);
    this.left.add(this.weekEl);

    // Center label
    this.center = new Interface('.header-center');
    this.center.css({
      fontSize: '13px',
      letterSpacing: 2,
      fontWeight: '700',
      textTransform: 'uppercase',
      opacity: 0.9
    });
    this.center.text('<CODE>');
    this.add(this.center);

    // Loader/status text
    this.status = new Interface('.header-status');
    this.status.css({
      fontSize: '11px',
      letterSpacing: 1,
      textTransform: 'uppercase',
      opacity: 0.7,
      position: 'absolute',
      bottom: -14,
      left: '50%',
      transform: 'translateX(-50%)',
      whiteSpace: 'nowrap'
    });
    this.status.text('Initializing user processes');
    this.add(this.status);

    // Right icons/labels
    this.right = new Interface('.header-right');
    this.right.css({
      display: 'flex',
      gap: 10,
      fontSize: '11px',
      letterSpacing: 1,
      textTransform: 'uppercase',
      opacity: 0.8
    });
    this.add(this.right);

    const items = ['Sound', 'Modules', 'Info'];
    items.forEach(label => {
      const chip = new Interface('.chip');
      chip.css({
        padding: '4px 8px',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 4,
        background: 'transparent'
      });
      chip.text(label);
      this.right.add(chip);
    });

    this.update();
    this.updateTimer = setInterval(() => this.update(), 30000);
    this.statusTimer = setInterval(() => this.updateStatus(), 20000);
    this.updateStatus();
  }

  update() {
    const now = new Date();
    this.timeEl.text(formatTime(now));
    this.dateEl.text(formatDate(now));
    this.cityEl.text(CITY);
    this.weekEl.text(`W${getWeekNumber(now)}`);

    // Live status text from health checks
    this.status.text(this.statusText);
  }

  async updateStatus() {
    const parts = [];

    // Backend/MLX health
    try {
      const res = await fetch('/health', { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.mlxServer?.reachable) {
          parts.push('MLX ok');
        } else {
          parts.push('MLX offline');
        }
      } else {
        parts.push('Backend error');
      }
    } catch (err) {
      parts.push('Backend unreachable');
    }

    // Voice health
    try {
      const res = await fetch('/api/voice/status', { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.reachable) {
          parts.push('Voice ok');
        } else if (data.configured) {
          parts.push('Voice unreachable');
        } else {
          parts.push('Voice disabled');
        }
      } else {
        parts.push('Voice error');
      }
    } catch (err) {
      parts.push('Voice unreachable');
    }

    // Compact status line (Space.js style, ≤ 8 words)
    this.statusText = parts.join(' · ').slice(0, 60);
  }

  destroy() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
    }
    super.destroy();
  }
}
