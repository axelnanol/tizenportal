/**
 * Focus Styling Feature
 *
 * Provides visible focus indicators for TV navigation.
 */

import { injectCSS, removeCSS } from '../core/utils.js';

export default {
  name: 'focusStyling',
  displayName: 'Focus Styling',
  _ringMode: 'on',
  _ringWidthPx: 3,
  _ringOffsetPx: 2,
  _ringRadiusPx: 10,
  _ringShadowCss: '0 0 0 3px rgba(0, 178, 255, 0.45), 0 8px 24px rgba(0, 0, 0, 0.5)',

  getRingVisualConfig: function(mode) {
    var color = '#00b2ff';
    var ringAlpha = 0.45;
    var ringWidth = 3;
    var ringOffset = 2;
    var ringRadius = 10;
    if (mode === 'high') {
      color = '#fcd34d';
      ringAlpha = 0.7;
      ringWidth = 4;
    }
    var ringColorCss = hexToRgba(color, ringAlpha);
    var dropShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
    var ringShadow = '0 0 0 ' + ringWidth + 'px ' + hexToRgba(color, ringAlpha) + ', 0 8px 24px rgba(0, 0, 0, 0.5)';
    return {
      color: color,
      ringColorCss: ringColorCss,
      width: ringWidth,
      offset: ringOffset,
      radius: ringRadius,
      dropShadow: dropShadow,
      shadow: ringShadow,
    };
  },

  getCSS: function(mode) {
    var ring = this.getRingVisualConfig(mode);
    var color = ring.color;
    var ringWidth = ring.width;
    var ringColorCss = ring.ringColorCss;
    var ringOffset = ring.offset;
    var ringRadius = ring.radius;
    var ringShadow = ring.shadow;

    return [
      '/* TizenPortal Focus Styling */',
      ':focus,',
      ':focus-visible,',
      'body.tp-focus-mode-on :focus,',
      'body.tp-focus-mode-on :focus-visible,',
      'body.tp-focus-mode-high :focus {',
      '  outline: ' + ringWidth + 'px solid ' + color + ' !important;',
      '  outline-offset: ' + ringOffset + 'px !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  -webkit-border-radius: ' + ringRadius + 'px !important;',
      '  border-radius: ' + ringRadius + 'px !important;',
      '}',
      '',
      'a:focus,',
      'button:focus,',
      '[role="button"]:focus,',
      '[role="link"]:focus,',
      '[role="menuitem"]:focus,',
      '[role="tab"]:focus,',
      '[role="option"]:focus,',
      '[tabindex]:focus,',
      'input:focus,',
      'select:focus,',
      'textarea:focus {',
      '  outline: ' + ringWidth + 'px solid ' + color + ' !important;',
      '  outline-offset: ' + ringOffset + 'px !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  -webkit-border-radius: ' + ringRadius + 'px !important;',
      '  border-radius: ' + ringRadius + 'px !important;',
      '}',
      '',
      '*:focus {',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
    ].join('\n');
  },

  apply: function(doc) {
    if (!doc) return;
    var mode = arguments.length > 1 ? arguments[1] : 'on';
    var ring = this.getRingVisualConfig(mode);
    this._ringWidthPx = ring.width;
    this._ringOffsetPx = ring.offset;
    this._ringRadiusPx = ring.radius;
    this._ringShadowCss = ring.shadow;
    this._ringMode = mode;
    this.remove(doc);
    if (mode === 'off') return;
    injectCSS(doc, 'tp-focus-styling', this.getCSS(mode));
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

