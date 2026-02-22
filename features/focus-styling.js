/**
 * Focus Styling Feature
 *
 * Provides visible focus indicators for TV navigation.
 */

import { injectCSS, removeCSS } from '../core/utils.js';

export default {
  name: 'focusStyling',
  displayName: 'Focus Styling',
  _ringMode: 'off',

  getCSS: function(mode) {
    // Use outline (not box-shadow) as the primary ring mechanism.
    // outline renders outside the element box and is NOT clipped by
    // overflow:hidden on parent containers - critical for card shelves.
    // box-shadow is added only as a secondary glow and may be clipped.
    var f = ':focus:not(#tp-focus-never)';
    var fv = ':focus-visible:not(#tp-focus-never)';

    return [
      '/* TizenPortal Focus Styling (outline-based, overflow-safe) */',
      '',
      // Suppress tap highlight globally
      '*:focus {',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
      '',
      // Universal fallback + off mode: subtle blue ring
      f + ', ' + fv + ',',
      'body.tp-focus-mode-off ' + f + ',',
      'body.tp-focus-mode-off ' + fv + ' {',
      '  outline: 3px solid rgba(0, 178, 255, 0.7) !important;',
      '  outline-offset: 2px !important;',
      '  box-shadow: 0 0 8px rgba(0, 178, 255, 0.35) !important;',
      '}',
      '',
      // On mode: solid full-opacity blue with more breathing room
      'body.tp-focus-mode-on ' + f + ',',
      'body.tp-focus-mode-on ' + fv + ' {',
      '  outline: 3px solid #00b2ff !important;',
      '  outline-offset: 6px !important;',
      '  box-shadow: 0 0 12px rgba(0, 178, 255, 0.55) !important;',
      '}',
      '',
      // High mode: yellow highlight
      'body.tp-focus-mode-high ' + f + ',',
      'body.tp-focus-mode-high ' + fv + ' {',
      '  outline: 3px solid #fcd34d !important;',
      '  outline-offset: 6px !important;',
      '  box-shadow: 0 0 12px rgba(252, 211, 77, 0.55) !important;',
      '}',
      '',
      // Card system visual styles (owned here, not in core/cards.js)
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
      // Entered state for multi-action cards (yellow = "you are inside")
      '[data-tp-card="multi"].tp-card-entered,',
      '[data-tp-card="multi"][data-tp-entered="true"] {',
      '  outline: 4px solid #fcd34d !important;',
      '  outline-offset: 2px !important;',
      '}',
      '',
      // Focus within entered card - inner elements get white ring
      '[data-tp-card].tp-card-entered ' + f + ',',
      '[data-tp-card][data-tp-entered="true"] ' + f + ' {',
      '  outline: 2px solid #fff !important;',
      '  outline-offset: 2px !important;',
      '}',
    ].join('\n');
  },

  // No-op: all modes are embedded directly in getCSS() above
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
    TizenPortal.log('Focus styling applied: ' + mode);
  },

  remove: function(doc) {
    if (!doc) return;
    removeCSS(doc, 'tp-focus-styling');
    TizenPortal.log('Focus styling removed');
  },
};

