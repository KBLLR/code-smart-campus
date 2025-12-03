/**
 * HeroHeader - Top-left hero header with title and status
 * TODO: Full implementation with connection status, animations
 */

export class HeroHeader {
  constructor(options = {}) {
    this.options = {
      title: options.title || 'Smart Campus',
      subtitle: options.subtitle || '',
      ...options,
    };

    this.container = null;
    this._init();
  }

  _init() {
    // Create hero header container
    this.container = document.createElement('div');
    this.container.className = 'view-hero';
    this.container.id = 'view-hero-root';

    this.container.innerHTML = `
      <div class="view-hero__content">
        <p class="view-hero__eyebrow">LIVE</p>
        <h1 class="view-hero__title">${this.options.title}</h1>
        <p class="view-hero__subtitle">${this.options.subtitle}</p>
        <div class="view-hero__status-wrap">
          <div class="view-hero__status view-hero__status--default">
            <span class="view-hero__status-label">Initializing...</span>
          </div>
        </div>
      </div>
    `;

    document.getElementById('ui-shell')?.appendChild(this.container);
    console.log('[HeroHeader] Initialized (stub)');
  }

  updateStatus(text, type = 'default') {
    const status = this.container.querySelector('.view-hero__status');
    if (status) {
      status.className = `view-hero__status view-hero__status--${type}`;
      status.querySelector('.view-hero__status-label').textContent = text;
    }
  }

  dispose() {
    this.container?.remove();
  }
}
