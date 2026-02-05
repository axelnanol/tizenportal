/**
 * TV Safe Area Feature
 * 
 * Adds 5% inset for TVs with overscan.
 * Prevents content from being cut off at screen edges.
 */

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
   * Apply feature to iframe document
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;
    
    var style = doc.createElement('style');
    style.id = 'tp-safe-area';
    style.textContent = this.getCSS();
    
    var head = doc.head || doc.documentElement;
    if (head) {
      head.appendChild(style);
      TizenPortal.log('TV safe area: Applied 5% inset');
    }
  },
  
  /**
   * Remove feature from iframe document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    
    var style = doc.getElementById('tp-safe-area');
    if (style) {
      style.parentNode.removeChild(style);
      TizenPortal.log('TV safe area: Removed');
    }
  },
};
