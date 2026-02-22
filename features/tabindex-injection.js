/**
 * Tabindex Injection Feature
 *
 * Automatically adds tabindex="0" to interactive elements for TV navigation.
 * Watches for dynamically added elements via MutationObserver so that SPA
 * route changes and lazy-rendered content are handled after initial load.
 */

/**
 * CSS selectors for elements that should be keyboard-navigable.
 * Covers native interactive elements, explicit ARIA roles, and common
 * SPA patterns (onclick divs, data-href anchors, details/summary).
 *
 * Bundles may extend this list by pushing to NAVIGABLE_SELECTORS before
 * calling apply(), or by calling TizenPortal.features.addNavigableSelector().
 */
var NAVIGABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="tab"]',
  '[role="option"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="combobox"]',
  '[role="treeitem"]',
  '[role="gridcell"]',
  '[role="switch"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[onclick]:not(a):not(button):not(input):not(select):not(textarea)',
  '[data-href]',
];

/**
 * MutationObserver instance kept for cleanup
 */
var _observer = null;

/**
 * Make a single element navigable if it matches our selectors and doesn't
 * already have a tabindex attribute.
 * @param {Element} el
 * @param {string} selectorString - pre-joined selector string
 */
function makeNavigable(el, selectorString) {
  if (el.nodeType !== 1) return;
  if (el.hasAttribute('tabindex')) return;
  try {
    if (el.matches && el.matches(selectorString)) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('data-tp-tabindex', 'auto');
    }
  } catch (err) {
    // Ignore selector errors (e.g. very old browsers)
  }
}

/**
 * Process a newly-inserted subtree: check the root node and all descendants.
 * @param {Element} root
 * @param {string} selectorString
 */
function processSubtree(root, selectorString) {
  if (!root || root.nodeType !== 1) return;
  makeNavigable(root, selectorString);
  try {
    var children = root.querySelectorAll(selectorString);
    for (var i = 0; i < children.length; i++) {
      if (!children[i].hasAttribute('tabindex')) {
        children[i].setAttribute('tabindex', '0');
        children[i].setAttribute('data-tp-tabindex', 'auto');
      }
    }
  } catch (err) {
    // Ignore
  }
}

/**
 * Start watching the document for dynamically added nodes.
 * @param {Document} doc
 * @param {string} selectorString
 */
function startObserver(doc, selectorString) {
  if (_observer || typeof MutationObserver === 'undefined') return;
  var target = doc.body || doc.documentElement;
  if (!target) return;

  _observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        processSubtree(added[j], selectorString);
      }
    }
  });

  _observer.observe(target, { childList: true, subtree: true });
}

/**
 * Stop the dynamic-content observer.
 */
function stopObserver() {
  if (_observer) {
    _observer.disconnect();
    _observer = null;
  }
}

export default {
  name: 'tabindexInjection',
  displayName: 'Auto-focusable Elements',

  /**
   * Expose the selector list so bundles can extend it before apply().
   */
  selectors: NAVIGABLE_SELECTORS,

  /**
   * Apply feature to document.
   * Makes all matching elements focusable and begins watching for new ones.
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;

    // Stop any previous observer before re-applying
    stopObserver();

    var selectorString = NAVIGABLE_SELECTORS.join(',');

    try {
      var elements = doc.querySelectorAll(selectorString);
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
      TizenPortal.warn('Tabindex injection failed: ' + err.message);
    }

    // Watch for elements added by SPAs / lazy rendering
    startObserver(doc, selectorString);
  },

  /**
   * Remove feature from document and stop observing.
   * @param {Document} doc
   */
  remove: function(doc) {
    stopObserver();

    if (!doc) return;

    try {
      var elements = doc.querySelectorAll('[data-tp-tabindex="auto"]');

      for (var i = 0; i < elements.length; i++) {
        elements[i].removeAttribute('tabindex');
        elements[i].removeAttribute('data-tp-tabindex');
      }
    } catch (err) {
      TizenPortal.warn('Tabindex removal failed: ' + err.message);
    }
  },
};
