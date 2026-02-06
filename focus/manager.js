/**
 * TizenPortal Focus Manager
 * 
 * Track focus across shell and iframe.
 * Provides TV-friendly focus utilities:
 * - Scroll-into-view with margins
 * - Initial focus on page load
 * - Viewport locking for TV
 * - DOM observation for SPA content
 */

/**
 * Currently focused element
 */
var focusedElement = null;

/**
 * Whether focus is in iframe
 */
var focusInIframe = false;

/**
 * Saved focus state for restoration
 */
var savedFocus = null;

/**
 * Focus change listeners
 */
var focusListeners = [];

/**
 * Scroll-into-view listener reference
 */
var scrollIntoViewListener = null;

/**
 * DOM observer reference
 */
var domObserver = null;

/**
 * Debounce timeout for DOM observer
 */
var domObserverDebounce = null;

/**
 * Default scroll-into-view options
 */
var defaultScrollOptions = {
  marginTop: 100,      // Margin from top edge
  marginBottom: 100,   // Margin from bottom edge
  marginLeft: 100,     // Margin from left edge
  marginRight: 100,    // Margin from right edge
  topOffset: 64,       // Fixed header height (e.g., appbar)
  leftOffset: 0,       // Fixed sidebar width
  scrollContainer: null, // Horizontal scroll container selector
};

/**
 * Initialize focus manager
 */
export function initFocusManager() {
  // Track focus changes in document
  document.addEventListener('focusin', function(event) {
    focusedElement = event.target;
    focusInIframe = isElementInIframe(event.target);
    notifyListeners('focusin', event.target);
  }, true);

  document.addEventListener('focusout', function(event) {
    notifyListeners('focusout', event.target);
  }, true);

  console.log('TizenPortal: Focus manager initialized');
}

/**
 * Check if element is inside an iframe
 * @param {Element} element
 * @returns {boolean}
 */
function isElementInIframe(element) {
  try {
    return element.ownerDocument !== document;
  } catch (err) {
    return false;
  }
}

/**
 * Notify listeners of focus change
 * @param {string} type - Event type
 * @param {Element} element - Focused element
 */
function notifyListeners(type, element) {
  var event = { type: type, target: element };
  
  for (var i = 0; i < focusListeners.length; i++) {
    try {
      focusListeners[i](event);
    } catch (err) {
      console.error('TizenPortal: Focus listener error:', err);
    }
  }
}

/**
 * Get currently focused element
 * @returns {Element|null}
 */
export function getFocusedElement() {
  return focusedElement || document.activeElement;
}

/**
 * Check if focus is in iframe
 * @returns {boolean}
 */
export function isFocusInIframe() {
  return focusInIframe;
}

/**
 * Set focus to an element
 * @param {Element} element
 */
export function setFocus(element) {
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
}

/**
 * Move focus to shell (out of iframe)
 */
export function setFocusToShell() {
  var portal = document.getElementById('tp-portal');
  if (portal) {
    var firstFocusable = portal.querySelector('[tabindex="0"]');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }
}

/**
 * Save current focus state
 */
export function saveFocusState() {
  savedFocus = {
    element: focusedElement,
    inIframe: focusInIframe,
  };
}

/**
 * Restore saved focus state
 */
export function restoreFocusState() {
  if (savedFocus && savedFocus.element) {
    try {
      savedFocus.element.focus();
    } catch (err) {
      console.warn('TizenPortal: Could not restore focus:', err);
    }
  }
  savedFocus = null;
}

/**
 * Subscribe to focus changes
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function onFocusChange(callback) {
  if (typeof callback !== 'function') return function() {};

  focusListeners.push(callback);

  return function() {
    var index = focusListeners.indexOf(callback);
    if (index !== -1) {
      focusListeners.splice(index, 1);
    }
  };
}

// ============================================================================
// SCROLL INTO VIEW
// ============================================================================

/**
 * Enable automatic scroll-into-view for focused elements
 * @param {Object} options - Scroll options
 * @returns {Function} Disable function
 */
export function enableScrollIntoView(options) {
  var opts = Object.assign({}, defaultScrollOptions, options || {});
  
  // Remove existing listener if any
  if (scrollIntoViewListener) {
    document.removeEventListener('focusin', scrollIntoViewListener);
  }
  
  scrollIntoViewListener = function(e) {
    scrollElementIntoView(e.target, opts);
  };
  
  document.addEventListener('focusin', scrollIntoViewListener);
  console.log('TizenPortal [Focus]: Scroll-into-view enabled');
  
  return function() {
    disableScrollIntoView();
  };
}

/**
 * Disable automatic scroll-into-view
 */
export function disableScrollIntoView() {
  if (scrollIntoViewListener) {
    document.removeEventListener('focusin', scrollIntoViewListener);
    scrollIntoViewListener = null;
    console.log('TizenPortal [Focus]: Scroll-into-view disabled');
  }
}

/**
 * Enable or disable scroll-into-view
 * @param {boolean} enabled
 */
export function setScrollEnabled(enabled) {
  if (enabled) {
    enableScrollIntoView();
  } else {
    disableScrollIntoView();
  }
}

/**
 * Scroll an element into view with margins
 * @param {HTMLElement} el - Element to scroll into view
 * @param {Object} options - Scroll options
 */
export function scrollElementIntoView(el, options) {
  if (!el || !el.getBoundingClientRect) return;
  
  var opts = Object.assign({}, defaultScrollOptions, options || {});
  
  try {
    var rect = el.getBoundingClientRect();
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // Vertical scroll
    // Check if element is near bottom edge
    if (rect.bottom > viewportHeight - opts.marginBottom) {
      var scrollDown = rect.bottom - (viewportHeight - opts.marginBottom);
      window.scrollBy(0, scrollDown);
    }
    
    // Check if element is near top edge (accounting for fixed header)
    if (rect.top < opts.topOffset + opts.marginTop) {
      var scrollUp = (opts.topOffset + opts.marginTop) - rect.top;
      window.scrollBy(0, -scrollUp);
    }
    
    // Horizontal scroll within container
    if (opts.scrollContainer) {
      var container = el.closest(opts.scrollContainer);
      if (container) {
        if (rect.right > viewportWidth - opts.marginRight) {
          container.scrollLeft += rect.right - (viewportWidth - opts.marginRight);
        }
        if (rect.left < opts.leftOffset + opts.marginLeft) {
          container.scrollLeft -= (opts.leftOffset + opts.marginLeft) - rect.left;
        }
      }
    }
  } catch (err) {
    console.warn('TizenPortal [Focus]: Scroll error:', err.message);
  }
}

// ============================================================================
// INITIAL FOCUS
// ============================================================================

/**
 * Set initial focus on page load
 * Tries selectors in order until one matches
 * @param {string[]} selectors - Array of CSS selectors to try
 * @param {number} delay - Delay in ms before setting focus (for SPA rendering)
 * @returns {Promise<HTMLElement|null>} Focused element or null
 */
export function setInitialFocus(selectors, delay) {
  delay = delay || 0;
  
  return new Promise(function(resolve) {
    setTimeout(function() {
      // Skip if something is already focused
      if (document.activeElement && document.activeElement !== document.body) {
        console.log('TizenPortal [Focus]: Already focused on', document.activeElement.tagName);
        resolve(document.activeElement);
        return;
      }
      
      // Try each selector in order
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el) {
          el.focus();
          console.log('TizenPortal [Focus]: Initial focus set via selector', selectors[i]);
          resolve(el);
          return;
        }
      }
      
      console.log('TizenPortal [Focus]: No initial focus target found');
      resolve(null);
    }, delay);
  });
}

// ============================================================================
// VIEWPORT
// ============================================================================

/**
 * Lock viewport for TV display
 * Disables user scaling and sets device width
 * @param {Object} options - Viewport options
 */
export function lockViewport(options) {
  var opts = Object.assign({
    width: 'device-width',
    initialScale: 1,
    userScalable: false,
  }, options || {});
  
  try {
    var viewport = document.querySelector('meta[name="viewport"]');
    
    if (viewport) {
      // Store original for restoration
      var original = viewport.getAttribute('content');
      if (original && !viewport.hasAttribute('data-tp-original')) {
        viewport.setAttribute('data-tp-original', original);
      }
    } else {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    var content = 'width=' + opts.width + ', initial-scale=' + opts.initialScale;
    if (!opts.userScalable) {
      content += ', user-scalable=no';
    }
    
    viewport.setAttribute('content', content);
    console.log('TizenPortal [Focus]: Viewport locked');
  } catch (err) {
    console.warn('TizenPortal [Focus]: Could not lock viewport:', err.message);
  }
}

/**
 * Restore original viewport
 */
export function unlockViewport() {
  try {
    var viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && viewport.hasAttribute('data-tp-original')) {
      viewport.setAttribute('content', viewport.getAttribute('data-tp-original'));
      viewport.removeAttribute('data-tp-original');
      console.log('TizenPortal [Focus]: Viewport restored');
    }
  } catch (err) {
    console.warn('TizenPortal [Focus]: Could not restore viewport:', err.message);
  }
}

// ============================================================================
// DOM OBSERVATION
// ============================================================================

/**
 * Observe DOM for dynamic content changes (SPA support)
 * Calls callback when content changes, debounced
 * @param {Function} callback - Called when DOM changes
 * @param {Object} options - Observer options
 * @returns {Function} Stop observing function
 */
export function observeDOM(callback, options) {
  var opts = Object.assign({
    debounceMs: 250,
    target: document.body,
    childList: true,
    subtree: true,
  }, options || {});
  
  // Stop any existing observer
  if (domObserver) {
    domObserver.disconnect();
  }
  
  if (domObserverDebounce) {
    clearTimeout(domObserverDebounce);
  }
  
  domObserver = new MutationObserver(function(mutations) {
    // Debounce - only call once per debounceMs
    if (domObserverDebounce) return;
    
    domObserverDebounce = setTimeout(function() {
      domObserverDebounce = null;
      try {
        callback(mutations);
      } catch (err) {
        console.error('TizenPortal [Focus]: DOM observer callback error:', err);
      }
    }, opts.debounceMs);
  });
  
  domObserver.observe(opts.target, {
    childList: opts.childList,
    subtree: opts.subtree,
  });
  
  console.log('TizenPortal [Focus]: DOM observer active');
  
  return function() {
    stopObservingDOM();
  };
}

/**
 * Stop observing DOM changes
 */
export function stopObservingDOM() {
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }
  
  if (domObserverDebounce) {
    clearTimeout(domObserverDebounce);
    domObserverDebounce = null;
  }
  
  console.log('TizenPortal [Focus]: DOM observer stopped');
}
