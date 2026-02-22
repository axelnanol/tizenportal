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
  _ringWidthPx: 3,
  _ringOffsetPx: 2,
  _ringRadiusPx: 10,
  _ringShadowCss: '0 0 0 3px rgba(0, 178, 255, 0.45), 0 8px 24px rgba(0, 0, 0, 0.5)',

  getRingVisualConfig: function(mode) {
    var ringColor = '#00b2ff';
    var ringAlpha = 0.55;
    var ringWidth = 3;
    var ringOffset = 0;
    var ringRadius = 10;
    var highlightColor = null;
    var highlightWidth = 0;
    var highlightOffset = 0;

    if (mode === 'on') {
      highlightColor = '#00b2ff';
      highlightWidth = 2;
      highlightOffset = 6;
    } else if (mode === 'high') {
      highlightColor = '#fcd34d';
      highlightWidth = 3;
      highlightOffset = 6;
    }

    if (mode === 'high') {
      ringAlpha = 0.65;
      ringWidth = 4;
    }
    var ringColorCss = hexToRgba(ringColor, ringAlpha);
    var dropShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
    var ringShadow = '0 0 0 ' + ringWidth + 'px ' + ringColorCss + ', 0 8px 24px rgba(0, 0, 0, 0.5)';
    return {
      color: ringColor,
      ringColorCss: ringColorCss,
      width: ringWidth,
      offset: ringOffset,
      radius: ringRadius,
      dropShadow: dropShadow,
      shadow: ringShadow,
      highlightColor: highlightColor,
      highlightWidth: highlightWidth,
      highlightOffset: highlightOffset,
    };
  },

  getCSS: function(mode) {
    var ring = this.getRingVisualConfig(mode);
    var ringShadow = ring.shadow;
    var ringRadius = ring.radius;
    var highlightWidth = ring.highlightWidth;
    var highlightColor = ring.highlightColor;
    var highlightOffset = ring.highlightOffset;
    var selectorBase = ':focus:not(#tp-focus-never), :focus-visible:not(#tp-focus-never)';
    var selectorOff = 'body.tp-focus-mode-off :focus:not(#tp-focus-never), body.tp-focus-mode-off :focus-visible:not(#tp-focus-never)';
    var selectorOn = 'body.tp-focus-mode-on :focus:not(#tp-focus-never), body.tp-focus-mode-on :focus-visible:not(#tp-focus-never)';
    var selectorHigh = 'body.tp-focus-mode-high :focus:not(#tp-focus-never), body.tp-focus-mode-high :focus-visible:not(#tp-focus-never)';
    var baseSelector = selectorBase + ', ' + selectorOff + ', ' + selectorOn + ', ' + selectorHigh;

    return [
      '/* TizenPortal Focus Styling */',
      baseSelector + ' {',
      '  outline: none !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  -webkit-border-radius: ' + ringRadius + 'px !important;',
      '  border-radius: ' + ringRadius + 'px !important;',
      '}',
      '',
      '*:focus {',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
      '',
      'body.tp-focus-mode-on :focus:not(#tp-focus-never),',
      'body.tp-focus-mode-on :focus-visible:not(#tp-focus-never),',
      'body.tp-focus-mode-high :focus:not(#tp-focus-never),',
      'body.tp-focus-mode-high :focus-visible:not(#tp-focus-never) {',
      '  outline-style: solid !important;',
      '}',
      '',
      '/* Card system visual styles (owned by focus-styling, not core/cards.js) */',
      '[data-tp-card] {',
      '  cursor: pointer;',
      '  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;',
      '}',
      '',
      '/* Card focus layout - ring color/shadow come from the rules above */',
      '[data-tp-card]:focus,',
      'a[data-tp-card]:focus,',
      'div[data-tp-card]:focus,',
      'button[data-tp-card]:focus {',
      '  z-index: 100 !important;',
      '  position: relative !important;',
      '  transform: scale(1.02);',
      '}',
      '',
      '/* Entered state for multi-action cards (yellow = "inside" indicator) */',
      '[data-tp-card="multi"].tp-card-entered,',
      '[data-tp-card="multi"][data-tp-entered="true"] {',
      '  outline: 4px solid #fcd34d !important;',
      '  outline-offset: 2px !important;',
      '  box-shadow: 0 0 0 4px #fcd34d, 0 0 20px rgba(252, 211, 77, 0.4) !important;',
      '}',
      '',
      '/* Focus within entered card - inner buttons get white ring */',
      '[data-tp-card].tp-card-entered :focus,',
      '[data-tp-card][data-tp-entered="true"] :focus {',
      '  outline: 2px solid #fff !important;',
      '  outline-offset: 2px;',
      '}',
    ].join('\n');
  },

  appendHighlightCSS: function(css, mode) {
    var ring = this.getRingVisualConfig(mode);
    if (!ring.highlightColor || ring.highlightWidth <= 0) {
      return css;
    }

    return css + '\n\n' + [
      'body.tp-focus-mode-' + mode + ' :focus:not(#tp-focus-never),',
      'body.tp-focus-mode-' + mode + ' :focus-visible:not(#tp-focus-never) {',
      '  outline: ' + ring.highlightWidth + 'px solid ' + ring.highlightColor + ' !important;',
      '  outline-offset: ' + ring.highlightOffset + 'px !important;',
      '}',
    ].join('\n');
  },

  apply: function(doc) {
    if (!doc) return;
    var mode = arguments.length > 1 ? arguments[1] : 'off';
    var ring = this.getRingVisualConfig(mode);
    this._ringWidthPx = ring.width;
    this._ringOffsetPx = ring.offset;
    this._ringRadiusPx = ring.radius;
    this._ringShadowCss = ring.shadow;
    this._ringMode = mode;
    this.remove(doc);
    if (mode === 'none') return;
    injectCSS(doc, 'tp-focus-styling', this.appendHighlightCSS(this.getCSS(mode), mode));
    TizenPortal.log('Focus styling applied: ' + mode);
  },

  remove: function(doc) {
    if (!doc) return;
    removeCSS(doc, 'tp-focus-styling');
    TizenPortal.log('Focus styling removed');
  },
};

function hexToRgba(hex, alpha) {
  var raw = (hex || '').replace('#', '');
  if (raw.length === 3) {
    raw = raw.charAt(0) + raw.charAt(0) + raw.charAt(1) + raw.charAt(1) + raw.charAt(2) + raw.charAt(2);
  }
  var value = parseInt(raw, 16);
  if (isNaN(value)) {
    return 'rgba(0, 178, 255, ' + alpha + ')';
  }
  var r = (value >> 16) & 255;
  var g = (value >> 8) & 255;
  var b = value & 255;
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}

