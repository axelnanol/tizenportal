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
    var color = '#00a8ff';
    var width = 3;
    if (mode === 'high') {
      color = '#fcd34d';
      width = 4;
    }
    return [
      '/* TizenPortal Focus Styling */',
      ':focus {',
      '  outline: ' + width + 'px solid ' + color + ' !important;',
      '  outline-offset: 2px;',
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
      '  outline: ' + width + 'px solid ' + color + ' !important;',
      '  outline-offset: 2px;',
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
