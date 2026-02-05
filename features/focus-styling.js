/**
 * Focus Styling Feature
 * 
 * Provides blue outline focus indicators for TV navigation.
 * Extracted from default bundle.
 */

export default {
  name: 'focusStyling',
  displayName: 'Focus Styling',
  
  /**
   * CSS to inject
   */
  getCSS: function() {
    return [
      '/* TizenPortal Focus Styling */',
      ':focus {',
      '  outline: 3px solid #00a8ff !important;',
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
      '  outline: 3px solid #00a8ff !important;',
      '  outline-offset: 2px;',
      '}',
      '',
      '*:focus {',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
    ].join('\n');
  },
  
  /**
   * Apply feature to iframe document
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;
    
    var style = doc.createElement('style');
    style.id = 'tp-focus-styling';
    style.textContent = this.getCSS();
    
    var head = doc.head || doc.documentElement;
    if (head) {
      head.appendChild(style);
    }
  },
  
  /**
   * Remove feature from iframe document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    
    var style = doc.getElementById('tp-focus-styling');
    if (style) {
      style.parentNode.removeChild(style);
    }
  },
};
