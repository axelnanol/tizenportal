/**
 * Focus Styling Feature
 *
 * Provides visible focus indicators for TV navigation.
 *
 * Modes:
 *  off    – subtle blue outline (reliable fallback, always visible)
 *  on     – solid blue outline with glow (default)
 *  high   – yellow outline with glow (high-visibility)
 *  portal – box-shadow ring with glow matching portal card style (rounded-aware)
 *  white  – white outline for maximum contrast on dark/colourful backgrounds
 *  none   – disabled (no CSS injected; use sparingly)
 */

import { injectCSS, removeCSS } from '../core/utils.js';

// MutationObserver that keeps tp-focus-styling as the last stylesheet in <head>
// SPAs inject their own <style>/<link> tags dynamically; without this our rules
// lose source-order to any later outline:none !important in their CSS resets.
var _headObserver = null;

function startHeadObserver(doc) {
  if (_headObserver) return;
  if (typeof MutationObserver === 'undefined') return;

  var head = doc.head || doc.documentElement;
  _headObserver = new MutationObserver(function() {
    var el = doc.getElementById('tp-focus-styling');
    if (!el) return;
    // If our style is not the last child of head, move it there
    if (head.lastChild !== el) {
      head.appendChild(el);
    }
  });
  _headObserver.observe(head, { childList: true });
}

function stopHeadObserver() {
  if (_headObserver) {
    _headObserver.disconnect();
    _headObserver = null;
  }
}

export default {
  name: 'focusStyling',
  displayName: 'Focus Styling',
  _ringMode: 'off',

  getCSS: function(mode) {
    // Only use :focus - :focus-visible is not supported until Chrome 86 and
    // an unknown pseudo-class in a selector list invalidates the entire rule.
    // Target range: Chrome 47-69 (Tizen TVs).
    var f = ':focus:not(#tp-focus-never)';

    var base = [
      '/* TizenPortal Focus Styling */',
      '',
      '/* Remove browser default tap highlight */',
      '*:focus {',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
      '',
    ];

    // ── mode-specific rules ────────────────────────────────────────────
    var ring;

    if (mode === 'portal') {
      // Box-shadow ring: follows border-radius of the element (rounded-aware).
      // Uses two layers: a dark gap then the coloured ring, plus a soft glow.
      ring = [
        '/* Portal-style focus ring (box-shadow, rounded-aware) */',
        f + ' {',
        '  outline: none !important;',
        '  box-shadow:',
        '    0 0 0 2px rgba(0,0,0,0.6),',
        '    0 0 0 5px rgba(0, 178, 255, 0.9),',
        '    0 0 18px rgba(0, 178, 255, 0.55) !important;',
        '}',
      ];
    } else if (mode === 'high') {
      // Yellow ring – high visibility
      ring = [
        '/* Yellow focus ring */',
        f + ' {',
        '  outline: 3px solid #fcd34d !important;',
        '  outline-offset: 6px !important;',
        '  box-shadow: 0 0 14px rgba(252, 211, 77, 0.6) !important;',
        '}',
      ];
    } else if (mode === 'white') {
      // White ring – maximum contrast on dark/colourful backgrounds
      ring = [
        '/* White focus ring */',
        f + ' {',
        '  outline: 3px solid #ffffff !important;',
        '  outline-offset: 4px !important;',
        '  box-shadow: 0 0 10px rgba(255,255,255,0.45) !important;',
        '}',
      ];
    } else if (mode === 'off') {
      // Subtle fallback – always injected so there is *some* ring
      ring = [
        '/* Subtle blue focus ring (fallback) */',
        f + ' {',
        '  outline: 3px solid rgba(0, 178, 255, 0.7) !important;',
        '  outline-offset: 2px !important;',
        '  box-shadow: 0 0 8px rgba(0, 178, 255, 0.35) !important;',
        '}',
      ];
    } else {
      // 'on' (default) – solid blue ring with breathing room
      ring = [
        '/* Blue focus ring */',
        f + ' {',
        '  outline: 3px solid #00b2ff !important;',
        '  outline-offset: 6px !important;',
        '  box-shadow: 0 0 14px rgba(0, 178, 255, 0.55) !important;',
        '}',
      ];
    }

    // ── portal card overrides (consistent with mode colour) ────────────
    var cards = [
      '',
      '/* Portal card focus */',
      '[data-tp-card] {',
      '  cursor: pointer;',
      '  transition: transform 0.15s ease-out;',
      '}',
      '',
      '[data-tp-card]:focus,',
      'a[data-tp-card]:focus,',
      'div[data-tp-card]:focus,',
      'button[data-tp-card]:focus {',
      '  z-index: 100 !important;',
      '  position: relative !important;',
      '  transform: scale(1.02);',
      '}',
      '',
      '[data-tp-card="multi"].tp-card-entered,',
      '[data-tp-card="multi"][data-tp-entered="true"] {',
      '  outline: 4px solid #fcd34d !important;',
      '  outline-offset: 2px !important;',
      '}',
      '',
      '[data-tp-card].tp-card-entered ' + f + ',',
      '[data-tp-card][data-tp-entered="true"] ' + f + ' {',
      '  outline: 2px solid #fff !important;',
      '  outline-offset: 2px !important;',
      '}',
    ];

    return base.concat(ring).concat(cards).join('\n');
  },

  // No-op kept for backward compatibility
  appendHighlightCSS: function(css) {
    return css;
  },

  apply: function(doc) {
    if (!doc) return;
    var mode = arguments.length > 1 ? arguments[1] : 'off';
    this._ringMode = mode;
    this.remove(doc);
    if (mode === 'none') return;
    injectCSS(doc, 'tp-focus-styling', this.getCSS(mode));
    // Keep our style last so SPA-injected stylesheets can't override it
    startHeadObserver(doc);
    TizenPortal.log('Focus styling applied: ' + mode);
  },

  remove: function(doc) {
    if (!doc) return;
    stopHeadObserver();
    removeCSS(doc, 'tp-focus-styling');
    TizenPortal.log('Focus styling removed');
  },
};

