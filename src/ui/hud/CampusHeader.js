import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { CampusReportManager } from '../../managers/CampusReportManager.js';
import { SensorSnapshotService } from '../../services/SensorSnapshotService.js';

export class CampusHeader extends Interface {
  constructor(classroomRegistry, sensorManager) {
    super('.campus-header');

    this.classroomRegistry = classroomRegistry;
    this.sensorManager = sensorManager;
    this.snapshotService = new SensorSnapshotService(classroomRegistry, { enabled: false });
    this.reportManager = new CampusReportManager(classroomRegistry, this.snapshotService);

    this.pages = [];
    this.currentPage = 0;

    this.init();
    this.initViews();
  }

  init() {
    this.css({
      position: 'absolute',
      left: '40px',
      bottom: '40px', // Bottom-left positioning
      zIndex: 1000,
      pointerEvents: 'none',
      webkitUserSelect: 'none',
      userSelect: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      width: '300px'
    });

    document.body.appendChild(this.element);
  }

  initViews() {
    // Title
    this.title = new Interface('.title');
    this.title.css({
      fontFamily: 'var(--ui-font-family)',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      color: 'var(--ui-color)',
      opacity: 0.9
    });
    this.title.text('SMART CAMPUS OVERVIEW');
    this.add(this.title);

    // Description / Content
    this.content = new Interface('.content');
    this.content.css({
      fontFamily: 'var(--ui-font-family)',
      fontSize: '13px',
      lineHeight: '1.6',
      color: 'var(--ui-secondary-color)',
      opacity: 0.8,
      minHeight: '60px' // Prevent jumping
    });
    this.content.text('Initializing campus neural link...');
    this.add(this.content);

    // Pagination (Squares)
    this.pagination = new Interface('.pagination');
    this.pagination.css({
      display: 'flex',
      gap: '8px',
      marginTop: '5px',
      pointerEvents: 'auto'
    });
    this.add(this.pagination);

    // Initial update
    this.updateOverview();

    // Auto-rotate pages every 10 seconds
    setInterval(() => this.nextPage(), 10000);
  }

  async updateOverview() {
    try {
      const result = await this.reportManager.generateCampusOverview();

      if (result.ok) {
        // Split overview into sentences for better readability
        const sentences = result.overview.match(/[^.!?]+[.!?]+/g) || [result.overview];

        // Group sentences if they are too short (optional, but good for flow)
        const chunks = [];
        let currentChunk = '';

        sentences.forEach(sentence => {
          if (currentChunk.length + sentence.length < 150) {
            currentChunk += sentence + ' ';
          } else {
            chunks.push(currentChunk.trim());
            currentChunk = sentence + ' ';
          }
        });
        if (currentChunk) chunks.push(currentChunk.trim());

        this.pages = [
          ...chunks,
          `Active Sensors: ${this.sensorManager.getDiscoveredSensors().length}\nSystem Status: NOMINAL`,
          "Cerberus Agent: Monitoring all sectors.\nAnomaly Detection: Active."
        ];

        this.renderPagination();
        this.showPage(0);
      } else {
        this.content.text('Real-time campus monitoring active. Waiting for report...');
      }
    } catch (error) {
      console.error('[CampusHeader] Failed to generate overview:', error);
      this.content.text('System Link: Unstable. Retrying...');
    }
  }

  renderPagination() {
    this.pagination.empty();
    this.pages.forEach((_, index) => {
      const dot = new Interface('.dot');
      dot.css({
        width: '8px',
        height: '8px',
        background: index === this.currentPage ? 'var(--ui-color)' : 'rgba(255,255,255,0.2)',
        border: '1px solid rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'background 0.3s ease'
      });
      dot.element.addEventListener('click', () => this.showPage(index));
      this.pagination.add(dot);
    });
  }

  showPage(index) {
    this.currentPage = index;
    if (this.currentPage >= this.pages.length) this.currentPage = 0;

    const text = this.pages[this.currentPage];

    // Animate text change
    this.content.tween({ opacity: 0 }, 200, 'easeOutQuad', 0, () => {
      this.content.text(text);
      this.content.tween({ opacity: 0.8 }, 300, 'easeOutQuad');
    });

    // Update dots
    const dots = this.pagination.element.children;
    for (let i = 0; i < dots.length; i++) {
      dots[i].style.background = i === this.currentPage ? 'var(--ui-color)' : 'rgba(255,255,255,0.2)';
    }
  }

  nextPage() {
    if (this.pages.length > 0) {
      this.showPage((this.currentPage + 1) % this.pages.length);
    }
  }

  hide() {
    this.tween({ opacity: 0, y: 20 }, 500, 'easeOutExpo');
    this.css({ pointerEvents: 'none' });
  }

  show() {
    this.css({ pointerEvents: 'auto' });
    this.tween({ opacity: 1, y: 0 }, 800, 'easeOutExpo');
  }

  destroy() {
    super.destroy();
  }
}
