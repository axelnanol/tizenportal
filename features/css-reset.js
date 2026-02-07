/**
 * CSS Reset Feature
 * 
 * Provides base CSS normalization for TV browsers.
 * Includes scrollbar styling, text selection, and box-sizing.
 */

export default {
  name: 'cssReset',
  displayName: 'CSS Normalization',
  
  /**
   * CSS to inject
   */
  getCSS: function(options) {
    var hideScrollbars = options && options.hideScrollbars === true;
    var scrollbarCSS = [];

    if (hideScrollbars) {
      scrollbarCSS = [
        '/* Hide scrollbars globally (keep scroll) */',
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
        '',
      ];
    } else {
      scrollbarCSS = [
        '/* Scrollbar styling for TV */',
        '::-webkit-scrollbar {',
        '  width: 8px;',
        '  height: 8px;',
        '}',
        '',
        '::-webkit-scrollbar-track {',
        '  background: rgba(0, 0, 0, 0.2);',
        '}',
        '',
        '::-webkit-scrollbar-thumb {',
        '  background: rgba(255, 255, 255, 0.3);',
        '  border-radius: 4px;',
        '}',
        '',
        '::-webkit-scrollbar-thumb:hover {',
        '  background: rgba(255, 255, 255, 0.5);',
        '}',
        '',
      ];
    }

    return [
      '/* TizenPortal CSS Reset */',
      '',
      '/* Box-sizing reset */',
      '*, *::before, *::after {',
      '  box-sizing: border-box;',
      '}',
      '',
      scrollbarCSS.join('\n'),
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
   * Apply feature to iframe document
   * @param {Document} doc
   */
  apply: function(doc, options) {
    if (!doc) return;
    
    var style = doc.createElement('style');
    style.id = 'tp-css-reset';
    style.textContent = this.getCSS(options || {});
    
    var head = doc.head || doc.documentElement;
    if (head) {
      head.appendChild(style);
      TizenPortal.log('CSS reset: Applied normalization');
    }
  },
  
  /**
   * Remove feature from iframe document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    
    var style = doc.getElementById('tp-css-reset');
    if (style) {
      style.parentNode.removeChild(style);
      TizenPortal.log('CSS reset: Removed');
    }
  },
};
