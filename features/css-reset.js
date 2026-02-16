/**
 * CSS Reset Feature
 * 
 * Provides base CSS normalization for TV browsers.
 * Includes scrollbar styling, text selection, and box-sizing.
 */

import { injectCSS, removeCSS } from '../core/utils.js';

export default {
  name: 'cssReset',
  displayName: 'CSS Normalization',
  
  /**
   * CSS to inject
   */
  getCSS: function() {
    return [
      '/* TizenPortal CSS Reset */',
      '',
      '/* Box-sizing reset */',
      '*, *::before, *::after {',
      '  box-sizing: border-box;',
      '}',
      '',
      '/* Prevent text selection on TV (can interfere with navigation) */',
      '* {',
      '  -webkit-user-select: none;',
      '  user-select: none;',
      '}',
      '',
      '/* But allow selection in input fields */',
      'input, textarea, [contenteditable="true"] {',
      '  -webkit-user-select: text;',
      '  user-select: text;',
      '}',
      '',
      '/* Remove tap highlight */',
      '* {',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
      '',
      '/* Font smoothing */',
      'body {',
      '  -webkit-font-smoothing: antialiased;',
      '  -moz-osx-font-smoothing: grayscale;',
      '}',
      '',
      '/* Cursor hints for interactive elements */',
      'a, button, [role="button"] {',
      '  cursor: pointer;',
      '}',
    ].join('\n');
  },
  
  /**
   * Apply feature to document
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;
    injectCSS(doc, 'tp-css-reset', this.getCSS());
    TizenPortal.log('CSS reset: Applied normalization');
  },
  
  /**
   * Remove feature from document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    removeCSS(doc, 'tp-css-reset');
    TizenPortal.log('CSS reset: Removed');
  },
};
