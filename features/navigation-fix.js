/**
 * Navigation Fix Feature
 * 
 * Improves spatial navigation on target sites by ensuring child elements
 * don't block hit testing for focusable parent elements.
 */

import { injectCSS, removeCSS } from '../core/utils.js';

export default {
  name: 'navigationFix',
  displayName: 'Navigation Hit Test Fix',
  
  /**
   * CSS to inject
   */
  getCSS: function() {
    return [
      '/* TizenPortal Navigation Fix */',
      '/* Ensure child elements don\'t block spatial navigation hit testing */',
      '',
      '/* Generic focusable containers */',
      '[tabindex]:not([tabindex="-1"]) > *,',
      'button > *,',
      'a[href] > *,',
      '[role="button"] > *,',
      '[role="link"] > *,',
      '[role="menuitem"] > *,',
      '[role="tab"] > *,',
      '[role="option"] > * {',
      '  pointer-events: none !important;',
      '}',
      '',
      '/* Re-enable for nested interactive elements */',
      '[tabindex]:not([tabindex="-1"]) > button,',
      '[tabindex]:not([tabindex="-1"]) > a[href],',
      '[tabindex]:not([tabindex="-1"]) > input,',
      '[tabindex]:not([tabindex="-1"]) > select,',
      '[tabindex]:not([tabindex="-1"]) > textarea,',
      '[tabindex]:not([tabindex="-1"]) > [tabindex]:not([tabindex="-1"]),',
      'button > button,',
      'button > a[href],',
      'button > input,',
      'a[href] > button,',
      'a[href] > a[href] {',
      '  pointer-events: auto !important;',
      '}',
    ].join('\n');
  },
  
  /**
   * Apply feature to document
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;
    this.remove(doc);
    injectCSS(doc, 'tp-navigation-fix', this.getCSS());
    TizenPortal.log('Navigation fix CSS injected');
  },
  
  /**
   * Remove feature from document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    removeCSS(doc, 'tp-navigation-fix');
    TizenPortal.log('Navigation fix CSS removed');
  },
};
