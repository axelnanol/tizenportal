/**
 * TizenPortal Card Registration System
 * 
 * Provides a centralized API for bundles to register elements as navigable cards.
 * Bundles declare selectors and card types, and the core handles:
 * - Setting tabindex for focusability
 * - Marking cards with data-tp-card for interaction handling
 * - Observing DOM for dynamically added elements
 * - Periodic rescanning for lazy-loaded content
 * 
 * Usage in bundles:
 *   TizenPortal.cards.register({
 *     selector: '[id^="book-card-"]',
 *     type: 'multi',  // 'single' or 'multi'
 *     container: '#bookshelf'  // optional, scope the selector
 *   });
 */

/**
 * Registered card definitions
 * @type {Array<{selector: string, type: string, container?: string}>}
 */
var registrations = [];

/**
 * MutationObserver for watching DOM changes
 */
var observer = null;

/**
 * Debounce timer for processing
 */
var processTimer = null;

/**
 * Interval timer for periodic rescans
 */
var rescanInterval = null;

/**
 * Register a card selector
 * @param {Object} config - Card registration config
 * @param {string} config.selector - CSS selector for card elements
 * @param {string} config.type - 'single' or 'multi'
 * @param {string} [config.container] - Optional container selector to scope the search
 */
export function registerCards(config) {
  if (!config || !config.selector) {
    console.warn('TizenPortal [Cards]: Invalid registration - selector required');
    return;
  }
  
  var type = config.type || 'single';
  if (type !== 'single' && type !== 'multi') {
    console.warn('TizenPortal [Cards]: Invalid type "' + type + '", defaulting to "single"');
    type = 'single';
  }
  
  // Check if already registered
  for (var i = 0; i < registrations.length; i++) {
    if (registrations[i].selector === config.selector) {
      // Update existing
      registrations[i].type = type;
      registrations[i].container = config.container;
      console.log('TizenPortal [Cards]: Updated registration for', config.selector);
      processCards();
      return;
    }
  }
  
  // Add new registration
  registrations.push({
    selector: config.selector,
    type: type,
    container: config.container || null
  });
  
  console.log('TizenPortal [Cards]: Registered', config.selector, 'as', type);
  
  // Process immediately
  processCards();
}

/**
 * Unregister a card selector
 * @param {string} selector - The selector to unregister
 */
export function unregisterCards(selector) {
  for (var i = registrations.length - 1; i >= 0; i--) {
    if (registrations[i].selector === selector) {
      registrations.splice(i, 1);
      console.log('TizenPortal [Cards]: Unregistered', selector);
    }
  }
}

/**
 * Clear all registrations
 */
export function clearRegistrations() {
  registrations = [];
  console.log('TizenPortal [Cards]: Cleared all registrations');
}

/**
 * Get all registrations (for debugging)
 * @returns {Array}
 */
export function getRegistrations() {
  return registrations.slice();
}

/**
 * Process all registered card selectors
 * Sets tabindex and data-tp-card on matching elements
 * @returns {number} Number of cards processed
 */
export function processCards() {
  var count = 0;
  
  for (var i = 0; i < registrations.length; i++) {
    var reg = registrations[i];
    var container = reg.container ? document.querySelector(reg.container) : document;
    
    if (!container) continue;
    
    try {
      var elements = container.querySelectorAll(reg.selector);
      
      for (var j = 0; j < elements.length; j++) {
        var el = elements[j];
        
        // Skip already processed
        if (el.getAttribute('data-tp-card') === reg.type && 
            el.getAttribute('tabindex') === '0') {
          continue;
        }
        
        // Make focusable
        if (el.getAttribute('tabindex') !== '0') {
          el.setAttribute('tabindex', '0');
        }
        
        // Mark card type
        el.setAttribute('data-tp-card', reg.type);
        
        // Add accessibility role if not a native interactive element
        var tagName = el.tagName.toUpperCase();
        if (tagName !== 'A' && tagName !== 'BUTTON' && !el.hasAttribute('role')) {
          el.setAttribute('role', 'button');
        }
        
        count++;
      }
    } catch (err) {
      console.warn('TizenPortal [Cards]: Error processing selector', reg.selector, err.message);
    }
  }
  
  if (count > 0) {
    console.log('TizenPortal [Cards]: Processed', count, 'new cards');
  }
  
  return count;
}

/**
 * Start observing DOM for changes
 */
export function startObserver() {
  if (observer) return;
  
  if (typeof MutationObserver === 'undefined') {
    console.warn('TizenPortal [Cards]: MutationObserver not available, using interval only');
    startRescanInterval();
    return;
  }
  
  observer = new MutationObserver(function(mutations) {
    // Debounce processing
    if (processTimer) clearTimeout(processTimer);
    processTimer = setTimeout(function() {
      processCards();
    }, 100);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('TizenPortal [Cards]: Observer started');
  
  // Also start periodic rescan for edge cases
  startRescanInterval();
}

/**
 * Stop observing DOM
 */
export function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (processTimer) {
    clearTimeout(processTimer);
    processTimer = null;
  }
  stopRescanInterval();
  console.log('TizenPortal [Cards]: Observer stopped');
}

/**
 * Start periodic rescan interval
 * Catches elements that may be missed by MutationObserver
 */
function startRescanInterval() {
  if (rescanInterval) return;
  
  rescanInterval = setInterval(function() {
    processCards();
  }, 2000);
}

/**
 * Stop periodic rescan
 */
function stopRescanInterval() {
  if (rescanInterval) {
    clearInterval(rescanInterval);
    rescanInterval = null;
  }
}

/**
 * Inject core card focus styles
 * These apply to ALL registered cards automatically
 * 
 * NOTE: Uses both outline and box-shadow for maximum visibility across different
 * card backgrounds and layouts. Respects global focus styling preferences.
 */
function injectFocusStyles() {
  if (document.getElementById('tp-card-focus-styles')) return;
  
  var style = document.createElement('style');
  style.id = 'tp-card-focus-styles';
  style.textContent = [
    '/* TizenPortal Core Card Focus Styles */',
    '',
    '/* Base card styles - cursor and transition */',
    '[data-tp-card] {',
    '  cursor: pointer;',
    '  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;',
    '}',
    '',
    '/* Universal focus indicator for ALL registered cards */',
    '/* Uses both outline (for edge definition) and box-shadow (for glow) */',
    '/* Use high specificity to override any resets */',
    '[data-tp-card]:focus,',
    'a[data-tp-card]:focus,',
    'div[data-tp-card]:focus,',
    'button[data-tp-card]:focus {',
    '  outline: 4px solid #1ad691 !important;',
    '  outline-offset: 2px !important;',
    '  box-shadow: 0 0 0 4px #1ad691, 0 0 20px rgba(26, 214, 145, 0.4) !important;',
    '  z-index: 100 !important;',
    '  position: relative !important;',
    '  transform: scale(1.02);',
    '}',
    '',
    '/* Entered state for multi-action cards - use yellow to distinguish */',
    '[data-tp-card="multi"].tp-card-entered,',
    '[data-tp-card="multi"][data-tp-entered="true"] {',
    '  outline: 4px solid #fcd34d !important;',
    '  outline-offset: 2px !important;',
    '  box-shadow: 0 0 0 4px #fcd34d, 0 0 20px rgba(252, 211, 77, 0.4) !important;',
    '}',
    '',
    '/* Focus within entered card - inner buttons get white outline */',
    '[data-tp-card].tp-card-entered :focus,',
    '[data-tp-card][data-tp-entered="true"] :focus {',
    '  outline: 2px solid #fff !important;',
    '  outline-offset: 2px;',
    '}'
  ].join('\n');
  
  var head = document.head || document.documentElement;
  head.insertBefore(style, head.firstChild);
  
  console.log('TizenPortal [Cards]: Focus styles injected');
}

/**
 * Initialize the card system
 * Called automatically when bundle is loaded
 */
export function initCards() {
  // Inject focus styles first
  injectFocusStyles();
  
  // Process any existing registrations
  processCards();
  
  // Start observing
  startObserver();
  
  console.log('TizenPortal [Cards]: Initialized');
}

/**
 * Shutdown the card system
 * Called when navigating away or unloading bundle
 */
export function shutdownCards() {
  stopObserver();
  clearRegistrations();
  console.log('TizenPortal [Cards]: Shutdown');
}
