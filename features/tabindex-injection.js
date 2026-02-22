/**
 * Tabindex Injection Feature
 *
 * Automatically adds tabindex="0" to interactive elements for TV navigation.
 * Watches for dynamically added elements via MutationObserver so that SPA
 * route changes and lazy-rendered content are handled after initial load.
 *
 * The selector list is intentionally live: bundles may call
 * TizenPortal.features.addNavigableSelector() at any time and new selectors
 * are picked up immediately by both the initial scan (if called before
 * apply()) and the running MutationObserver (always, because it recomputes
 * the selector string on each mutation batch).
 */

/**
 * CSS selectors for elements that should be keyboard-navigable.
 * Covers native interactive elements, explicit ARIA roles, and common
 * SPA patterns (onclick divs, data-href anchors, details/summary).
 *
 * Bundles may extend this list at any time by calling
 * TizenPortal.features.addNavigableSelector(selector).
 * The running MutationObserver always uses the current list, so selectors
 * added after apply() are automatically covered for new DOM nodes.
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
  // Google Search and other Google properties use [data-ved] to mark
  // interactive result items (organic results, images, news cards, etc.).
  // This covers the "Google search results are hard to navigate" case
  // mentioned in the issue without being so broad that it catches
  // every decorative element.
  '[data-ved][href]',
  '[data-ved][data-hveid]',
];

/**
 * MutationObserver instance kept for cleanup
 */
var _observer = null;

/**
 * Make a single element navigable if it matches our selectors and doesn't
 * already have a tabindex attribute.
 * @param {Element} el
 */
function makeNavigable(el) {
  if (el.nodeType !== 1) return;
  if (el.hasAttribute('tabindex')) return;
  try {
    // Recompute from the live array so selectors added by addNavigableSelector
    // after apply() are always included.
    var selectorString = NAVIGABLE_SELECTORS.join(',');
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
 */
function processSubtree(root) {
  if (!root || root.nodeType !== 1) return;
  makeNavigable(root);
  try {
    // Recompute the selector string from the live array each time, so that
    // selectors registered via addNavigableSelector() after apply() are
    // always included without requiring a restart of the observer.
    var selectorString = NAVIGABLE_SELECTORS.join(',');
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
 * The observer always reads from the live NAVIGABLE_SELECTORS array so
 * that selectors added after apply() take immediate effect.
 * @param {Document} doc
 */
function startObserver(doc) {
  if (_observer || typeof MutationObserver === 'undefined') return;
  var target = doc.body || doc.documentElement;
  if (!target) return;

  _observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        processSubtree(added[j]);
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
   * Expose the selector list so it can be extended via addNavigableSelector().
   * The running observer always reads from this array, so additions take
   * effect immediately for any new DOM nodes — no restart required.
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

    // Watch for elements added by SPAs / lazy rendering.
    // The observer recomputes the selector string on each batch, so selectors
    // added via addNavigableSelector() after this call are automatically
    // picked up without any need to restart the observer.
    startObserver(doc);
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
