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
 * Number of built-in core selectors.
 * Bundle-added selectors are appended after this index and can be
 * removed via resetBundleSelectors() on bundle deactivation so they
 * do not persist into the next bundle's page context.
 *
 * This value is set immediately after the static array literal above,
 * before this module is exported or any other code runs, so it always
 * captures exactly the inline core list — addNavigableSelector() (which
 * lives in features/index.js and imports this module) cannot be called
 * before this assignment.
 */
var CORE_SELECTOR_COUNT = NAVIGABLE_SELECTORS.length;

/**
 * MutationObserver instance kept for cleanup
 */
var _observer = null;

/**
 * Make a single element navigable if it matches our selectors and doesn't
 * already have a tabindex attribute.
 * @param {Element} el
 * @param {string} selectorString - pre-joined selector string for this batch
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
 * Handles both Element (nodeType 1) and DocumentFragment (nodeType 11) roots
 * so that MutationObserver addedNodes containing fragments are fully covered.
 * @param {Element|DocumentFragment} root
 * @param {string} selectorString - pre-joined selector string for this batch
 */
function processSubtree(root, selectorString) {
  if (!root) return;

  if (root.nodeType === 1) {
    // Element — check this node and all its descendants
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
    return;
  }

  if (root.nodeType === 11 && root.childNodes) {
    // DocumentFragment — iterate its element children so the subtree is
    // fully covered even when MutationObserver delivers a fragment node.
    for (var j = 0; j < root.childNodes.length; j++) {
      var child = root.childNodes[j];
      if (child && child.nodeType === 1) {
        processSubtree(child, selectorString);
      }
    }
  }
}

/**
 * Start watching the document for dynamically added nodes.
 * The selector string is recomputed once per mutation batch from the live
 * NAVIGABLE_SELECTORS array, so selectors added via addNavigableSelector()
 * after apply() take immediate effect for any new DOM nodes.
 * @param {Document} doc
 */
function startObserver(doc) {
  if (_observer || typeof MutationObserver === 'undefined') return;
  var target = doc.body || doc.documentElement;
  if (!target) return;

  _observer = new MutationObserver(function(mutations) {
    // Compute the selector string once per batch so we don't repeat the
    // join() for every added node, while still always reading from the
    // live array (picks up any addNavigableSelector() calls at any time).
    var selectorString = NAVIGABLE_SELECTORS.join(',');
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

  /**
   * Remove any selectors added by bundles via addNavigableSelector(),
   * restoring the list to built-in core defaults.
   *
   * Called automatically on bundle deactivation (applyLateCardBundle) so
   * that site-specific selectors from one bundle do not persist into the
   * next bundle's page context when bundles are swapped without a full
   * page reload.
   */
  resetBundleSelectors: function() {
    if (NAVIGABLE_SELECTORS.length > CORE_SELECTOR_COUNT) {
      var removed = NAVIGABLE_SELECTORS.length - CORE_SELECTOR_COUNT;
      NAVIGABLE_SELECTORS.splice(CORE_SELECTOR_COUNT);
      console.log('TizenPortal [TabindexInjection]: Removed ' + removed + ' bundle-added selector(s); ' + CORE_SELECTOR_COUNT + ' core selectors remain');
    }
  },
};
