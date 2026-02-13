/**
 * CSS Compatibility Polyfill for Chrome 47
 * 
 * Addresses critical CSS incompatibilities in Chrome 47-69:
 * 1. clamp() function not supported (added in Chrome 79)
 * 2. Browser compatibility warnings (YouTube, etc.)
 * 
 * This is a POLYFILL not a feature because it compensates for browser limitations,
 * not user preferences. It's always enabled to ensure basic usability.
 * 
 * NOTE: TV readability enhancements moved to features/text-scale.js (user-configurable)
 */

var styleElement = null;
var isApplied = false;

/**
 * Apply CSS compatibility fixes
 * This injects baseline styles that work around Chrome 47 limitations
 */
function applyCSSCompatibility() {
  if (isApplied) return false;
  
  try {
    var style = document.createElement('style');
    style.id = 'tp-css-compat';
    style.setAttribute('data-tizen-portal-polyfill', 'css-compatibility');
    
    // Browser compatibility warnings mitigation
    // Hides "unsupported browser" warnings on sites like YouTube
    style.textContent = 
      '/* CSS Compatibility Polyfill for Chrome 47 */' +
      '/* YouTube browser warning mitigation */' +
      '[class*="unsupported"],[id*="unsupported"],' +
      '[class*="browser-update"],[id*="browser-update"]{' +
        'display:none!important' +
      '}';
    
    // Wait for DOM ready
    if (document.head) {
      document.head.appendChild(style);
      styleElement = style;
      isApplied = true;
      return true;
    } else {
      // Head not ready yet, wait for it
      var observer = new MutationObserver(function() {
        if (document.head) {
          document.head.appendChild(style);
          styleElement = style;
          isApplied = true;
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true });
      return true;
    }
  } catch (err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[TizenPortal CSS Compat] Failed to apply:', err.message);
    }
    return false;
  }
}

/**
 * Polyfill CSS compatibility (auto-detects if needed).
 * Returns true on Chrome 47-69 where clamp() is not supported.
 * Uses feature detection to skip on modern browsers that support clamp().
 */
export function polyfillCSSCompatibility() {
  // Feature detection: Check if CSS.supports exists and if clamp() is supported
  var needsPolyfill = true;
  
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    try {
      // If clamp() is supported, we don't need the polyfill
      needsPolyfill = !CSS.supports('width', 'clamp(1px, 2px, 3px)');
    } catch (err) {
      // CSS.supports threw an error, assume we need the polyfill
      needsPolyfill = true;
    }
  }
  
  if (!needsPolyfill) {
    return false; // Modern browser, no polyfill needed
  }
  
  // Apply compatibility fixes
  return applyCSSCompatibility();
}

/**
 * Check if CSS compatibility polyfill is active
 */
export function isCSSCompatibilityActive() {
  return isApplied;
}
