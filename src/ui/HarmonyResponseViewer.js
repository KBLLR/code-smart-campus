/**
 * HarmonyResponseViewer - Display Harmony format AI responses
 * Uses Space.js Interface system for consistent styling
 *
 * Harmony format structure:
 * <|analysis|>Internal reasoning<|end|>
 * <|commentary|>Insights and patterns<|end|>
 * <|final|>User-facing answer<|end|>
 */

import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { parseHarmonyResponse, isHarmonyFormat } from '@/utils/harmonyParser.js';

export class HarmonyResponseViewer extends Interface {
  constructor() {
    super('.harmony-viewer');

    this.currentChannel = 'analysis';
    this.harmonyData = null;

    // Channel containers
    this.tabBar = new Interface('.tab-bar');
    this.channels = {
      analysis: new Interface('.channel-analysis'),
      commentary: new Interface('.channel-commentary'),
      final: new Interface('.channel-final')
    };

    // Tab buttons
    this.tabButtons = {
      analysis: new Interface('.tab-analysis'),
      commentary: new Interface('.tab-commentary'),
      final: new Interface('.tab-final')
    };

    // Close button
    this.closeButton = new Interface('.close-button');

    this.init();
    this.setupEventListeners();
  }

  init() {
    // Main glassmorphism container
    this.css({
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: 900,
      maxHeight: '80vh',
      background: 'rgba(6, 6, 6, 0.90)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '32px',
      overflow: 'hidden',
      zIndex: 2000,
      display: 'none', // Hidden by default
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)'
    });

    this.initTabBar();
    this.initChannels();
    this.initCloseButton();
  }

  initTabBar() {
    this.tabBar.css({
      display: 'flex',
      gap: 20,
      borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
      paddingBottom: 16,
      marginBottom: 24
    });

    const channelLabels = {
      analysis: 'ANALYSIS',
      commentary: 'COMMENTARY',
      final: 'FINAL'
    };

    Object.entries(channelLabels).forEach(([key, label]) => {
      const button = this.tabButtons[key];

      button.css({
        cursor: 'pointer',
        padding: '8px 16px',
        textTransform: 'uppercase',
        fontSize: 'var(--ui-title-font-size)',
        fontFamily: 'var(--ui-font-family)',
        letterSpacing: 'var(--ui-title-letter-spacing)',
        opacity: key === this.currentChannel ? 1 : 0.4,
        color: 'var(--ui-color)',
        transition: 'opacity 0.2s ease',
        borderRadius: '4px',
        background: key === this.currentChannel ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
      });

      button.text(label);
      this.tabBar.add(button);
    });

    this.add(this.tabBar);
  }

  initChannels() {
    Object.values(this.channels).forEach(channel => {
      channel.css({
        display: 'none',
        fontFamily: 'var(--ui-font-family)',
        fontSize: 'var(--ui-font-size)',
        lineHeight: '1.8',
        color: 'var(--ui-color)',
        whiteSpace: 'pre-wrap',
        overflowY: 'auto',
        maxHeight: 'calc(80vh - 180px)',
        paddingRight: 8,
        opacity: 0.9
      });

      // Custom scrollbar
      channel.element.style.cssText += `
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
      `;

      this.add(channel);
    });

    // Show initial channel
    this.channels[this.currentChannel].css({ display: 'block' });
  }

  initCloseButton() {
    this.closeButton.css({
      position: 'absolute',
      top: 24,
      right: 24,
      cursor: 'pointer',
      fontSize: 'var(--ui-title-font-size)',
      fontFamily: 'var(--ui-font-family)',
      letterSpacing: 'var(--ui-title-letter-spacing)',
      color: 'var(--ui-color)',
      opacity: 0.5,
      transition: 'opacity 0.2s ease',
      padding: '8px',
      textTransform: 'uppercase'
    });

    this.closeButton.text('✕ CLOSE');
    this.add(this.closeButton);
  }

  setupEventListeners() {
    // Tab switching
    Object.entries(this.tabButtons).forEach(([channelName, button]) => {
      button.element.addEventListener('click', () => {
        this.switchChannel(channelName);
      });

      // Hover effect
      button.element.addEventListener('mouseenter', () => {
        if (channelName !== this.currentChannel) {
          button.css({ opacity: 0.7 });
        }
      });

      button.element.addEventListener('mouseleave', () => {
        if (channelName !== this.currentChannel) {
          button.css({ opacity: 0.4 });
        }
      });
    });

    // Close button
    this.closeButton.element.addEventListener('click', () => {
      this.hide();
    });

    this.closeButton.element.addEventListener('mouseenter', () => {
      this.closeButton.css({ opacity: 1 });
    });

    this.closeButton.element.addEventListener('mouseleave', () => {
      this.closeButton.css({ opacity: 0.5 });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.element.style.display === 'block') {
        this.hide();
      }
    });

    // Close on background click
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.hide();
      }
    });
  }

  switchChannel(channelName) {
    if (this.currentChannel === channelName) return;

    // Update tab buttons
    Object.entries(this.tabButtons).forEach(([key, button]) => {
      button.css({
        opacity: key === channelName ? 1 : 0.4,
        background: key === channelName ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
      });
    });

    // Fade out current channel
    this.channels[this.currentChannel]
      .clearTween()
      .tween({ opacity: 0 }, 150, 'easeOutCubic', 0, () => {
        this.channels[this.currentChannel].css({ display: 'none' });

        // Fade in new channel
        this.channels[channelName].css({
          display: 'block',
          opacity: 0
        });

        this.channels[channelName]
          .clearTween()
          .tween({ opacity: 0.9 }, 200, 'easeOutCubic');
      });

    this.currentChannel = channelName;
  }

  /**
   * Show viewer with harmony response
   * @param {string} harmonyResponse - Harmony formatted response
   */
  show(harmonyResponse) {
    if (!harmonyResponse) {
      console.warn('[HarmonyResponseViewer] No response provided');
      return;
    }

    // Parse response
    if (isHarmonyFormat(harmonyResponse)) {
      this.harmonyData = parseHarmonyResponse(harmonyResponse);
    } else {
      // If not harmony format, show in final channel
      this.harmonyData = {
        analysis: 'No analysis channel found',
        commentary: 'No commentary channel found',
        final: harmonyResponse,
        raw: harmonyResponse
      };
    }

    // Populate channels
    this.channels.analysis.text(
      this.harmonyData.analysis || 'No analysis available'
    );
    this.channels.commentary.text(
      this.harmonyData.commentary || 'No commentary available'
    );
    this.channels.final.text(
      this.harmonyData.final || 'No final response available'
    );

    // Reset to first channel
    this.switchChannel('analysis');

    // Show with fade in animation
    this.css({
      display: 'block',
      opacity: 0,
      transform: 'translate(-50%, -50%) scale(0.95)'
    });

    this.clearTween().tween({
      opacity: 1,
      transform: 'translate(-50%, -50%) scale(1)'
    }, 400, 'easeOutCubic');

    // Log to console for debugging
    console.log('[HarmonyResponseViewer] Showing response:', this.harmonyData);
  }

  /**
   * Hide viewer
   */
  hide() {
    this.clearTween().tween({
      opacity: 0,
      transform: 'translate(-50%, -50%) scale(0.95)'
    }, 300, 'easeInCubic', 0, () => {
      this.css({ display: 'none' });
    });
  }

  /**
   * Update response content
   * @param {string} harmonyResponse - New harmony response
   */
  updateResponse(harmonyResponse) {
    this.show(harmonyResponse);
  }

  /**
   * Get current harmony data
   * @returns {object} Parsed harmony response
   */
  getData() {
    return this.harmonyData;
  }

  /**
   * Get current channel name
   * @returns {string} Current channel ('analysis', 'commentary', or 'final')
   */
  getCurrentChannel() {
    return this.currentChannel;
  }
}

// Export singleton instance
let harmonyViewerInstance = null;

export function getHarmonyViewer() {
  if (!harmonyViewerInstance) {
    harmonyViewerInstance = new HarmonyResponseViewer();
  }
  return harmonyViewerInstance;
}
