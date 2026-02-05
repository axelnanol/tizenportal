/**
 * Tabindex Injection Feature
 * 
 * Automatically adds tabindex="0" to interactive elements for TV navigation.
 * Extracted from default bundle.
 */

export default {
  name: 'tabindexInjection',
  displayName: 'Auto-focusable Elements',
  
  /**
   * Apply feature to iframe document
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;
    
    var selectors = [
      'a[href]',
      'button',
      '[role="button"]',
      '[role="link"]',
      'input',
      'select',
      'textarea',
    ];
    
    try {
      var elements = doc.querySelectorAll(selectors.join(','));
      var count = 0;
      
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        if (!el.hasAttribute('tabindex')) {
          el.setAttribute('tabindex', '0');
          el.setAttribute('data-tp-tabindex', 'auto');
          count++;
        }
      }
      
      if (count > 0) {
        TizenPortal.log('Tabindex injection: Made ' + count + ' elements focusable');
      }
    } catch (err) {
      TizenPortal.warn('Tabindex injection failed:', err.message);
    }
  },
  
  /**
   * Remove feature from iframe document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    
    try {
      var elements = doc.querySelectorAll('[data-tp-tabindex="auto"]');
      
      for (var i = 0; i < elements.length; i++) {
        elements[i].removeAttribute('tabindex');
        elements[i].removeAttribute('data-tp-tabindex');
      }
    } catch (err) {
      TizenPortal.warn('Tabindex removal failed:', err.message);
    }
  },
};
