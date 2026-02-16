/**
 * Hide Scrollbars Feature
 * 
 * Hides native scrollbars while preserving scroll behavior.
 */

import { injectCSS, removeCSS } from '../core/utils.js';

export default {
  name: 'hideScrollbars',
  displayName: 'Hide Scrollbars',
  
  getCSS: function() {
    return [
      '/* TizenPortal Hide Scrollbars */',
      '::-webkit-scrollbar {',
      '  width: 0px;',
      '  height: 0px;',
      '}',
      '',
      '::-webkit-scrollbar-track {',
      '  background: transparent;',
      '}',
      '',
      '::-webkit-scrollbar-thumb {',
      '  background: transparent;',
      '}',
    ].join('\n');
  },
  
  apply: function(doc) {
    if (!doc) return;
    injectCSS(doc, 'tp-hide-scrollbars', this.getCSS());
    TizenPortal.log('Hide scrollbars: Applied');
  },
  
  remove: function(doc) {
    if (!doc) return;
    removeCSS(doc, 'tp-hide-scrollbars');
    TizenPortal.log('Hide scrollbars: Removed');
  },
};
