/**
 * Focus Styling Feature
 * 
 * Provides blue outline focus indicators for TV navigation.
 * Extracted from default bundle.
 */

import { injectCSS, removeCSS } from '../core/utils.js';

export default {
  name: 'focusStyling',
  displayName: 'Focus Styling',
  
  /**
   * CSS to inject
   */
  getCSS: function(mode) {
    var color = '#00b2ff';
    var ringAlpha = 0.45;
    var ringWidth = 3;
    if (mode === 'high') {
      color = '#fcd34d';
      ringAlpha = 0.7;
      ringWidth = 4;
    }
    var ringShadow = '0 0 0 ' + ringWidth + 'px ' + hexToRgba(color, ringAlpha) + ', 0 8px 24px rgba(0, 0, 0, 0.5)';
    return [
      '/* TizenPortal Focus Styling */',
      ':focus {',
      '  outline: none !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  border-radius: 10px !important;',
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
      '  outline: none !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  border-radius: 10px !important;',
      '}',
      '',
      '*:focus {',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
    ].join('\n');
  },
  
  /**
   * Apply feature to document
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;
    var mode = arguments.length > 1 ? arguments[1] : 'on';
    this.remove(doc);
    if (mode === 'off') return;
    injectCSS(doc, 'tp-focus-styling', this.getCSS(mode));
    TizenPortal.log('Focus styling applied: ' + mode);
  },
  
  /**
   * Remove feature from document
   * @param {Document} doc
   */
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
