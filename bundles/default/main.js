/**
 * Default Bundle
 * 
 * Fallback bundle used when no site-specific bundle is configured.
 * Provides basic functionality without site-specific customizations.
 */

import defaultStyles from './style.css';

export default {
  name: 'default',
  displayName: 'Default',
  description: 'Basic TV browser support with focus styling',
  
  /**
   * CSS to inject
   */
  style: defaultStyles,

  /**
   * Called before page content loads
   * @param {Window} win
   * @param {Object} card
   */
  onBeforeLoad: function(win, card) {
    console.log('TizenPortal [default]: Loading', card.url);
  },

  /**
   * Called after page content has loaded
   * @param {Window} win
   * @param {Object} card
   */
  onAfterLoad: function(win, card) {
    console.log('TizenPortal [default]: Loaded', card.url);

    // Try to inject basic focusable styling
    try {
      var doc = win.document || document;
      if (doc) {
        this.injectBasicStyles(doc);
        this.makeFocusable(doc);
      }
    } catch (err) {
      console.warn('TizenPortal [default]: Error accessing document');
    }
  },

  /**
   * Called when bundle is activated
   * @param {Window} win
   * @param {Object} card
   */
  onActivate: function(win, card) {
    console.log('TizenPortal [default]: Activated');
  },

  /**
   * Called when bundle is deactivated
   * @param {Window} win
   * @param {Object} card
   */
  onDeactivate: function(win, card) {
    console.log('TizenPortal [default]: Deactivated');
  },

  /**
   * Called when navigation occurs
   * @param {string} url
   */
  onNavigate: function(url) {
    console.log('TizenPortal [default]: Navigated to', url);
  },

  /**
   * Called on keydown events
   * @param {KeyboardEvent} event
   * @returns {boolean} True to consume event
   */
  onKeyDown: function(event) {
    return false; // Let default handling proceed
  },

  // Helper methods

  /**
   * Inject basic focus styling
   * @param {Document} doc
   */
  injectBasicStyles: function(doc) {
    var style = doc.createElement('style');
    style.id = 'tp-default-styles';
    style.textContent = [
      '/* TizenPortal Default Bundle Styles */',
      ':focus {',
      '  outline: 3px solid #00a8ff !important;',
      '  outline-offset: 2px;',
      '}',
      '',
      'a:focus, button:focus, [role="button"]:focus {',
      '  outline: 3px solid #00a8ff !important;',
      '  outline-offset: 2px;',
      '}',
    ].join('\n');

    var head = doc.head || doc.documentElement;
    head.appendChild(style);
  },

  /**
   * Make interactive elements focusable
   * @param {Document} doc
   */
  makeFocusable: function(doc) {
    var selectors = [
      'a[href]',
      'button',
      '[role="button"]',
      '[role="link"]',
      'input',
      'select',
      'textarea',
    ];

    var elements = doc.querySelectorAll(selectors.join(','));

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex', '0');
      }
    }

    console.log('TizenPortal [default]: Made', elements.length, 'elements focusable');
  },
};
