/** Minimal DOM helpers for the shell. All dynamic text goes through esc(). */

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when keyboard shortcuts should not fire (typing in a field). */
export function isTypingTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

export const TONE_BY_STATE = Object.freeze({
  online: 'up',
  live: 'up',
  vacant: 'up',
  occupied: 'warn',
  checking: 'busy',
  connecting: 'busy',
  stale: 'warn',
  preview: 'warn',
  blocked: 'down',
  offline: 'down',
  unconfigured: 'idle',
  unknown: 'idle',
});

export function toneFor(state) {
  return TONE_BY_STATE[state] || 'idle';
}
