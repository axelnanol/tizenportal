/**
 * TV Safe Area Feature
 * 
 * Adds 5% inset for TVs with overscan.
 * Prevents content from being cut off at screen edges.
 */

import { injectCSS, removeCSS } from '../core/utils.js';

export default {
  name: 'safeArea',
  displayName: 'TV Safe Area (5% inset)',
  
  /**
   * CSS to inject
   */
  getCSS: function() {
    return [
      '/* TizenPortal TV Safe Area */',
      'html, body {',
      '  padding: 54px 96px !important; /* 5% of 1080px / 1920px */',
      '  box-sizing: border-box !important;',
      '}',
    ].join('\n');
  },
  
  /**
   * Apply feature to document
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;
    var applied = injectCSS(doc, 'tp-safe-area', this.getCSS());
    if (applied) {
      TizenPortal.log('TV safe area: Applied 5% inset');
    } else {
      TizenPortal.warn('TV safe area: Failed to apply 5% inset');
    }
  },
  
  /**
   * Remove feature from document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    var removed = removeCSS(doc, 'tp-safe-area');
    if (removed) {
      TizenPortal.log('TV safe area: Removed');
    }
  },
};
