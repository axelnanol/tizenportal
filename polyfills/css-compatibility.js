/**
 * CSS Compatibility Polyfill for Chrome 47
 * 
 * Addresses critical CSS incompatibilities in Chrome 47-69:
 * 1. clamp() function not supported (added in Chrome 79)
 * 2. TV readability baseline (text must be readable from 10ft/3m distance)
 * 
 * This is a POLYFILL not a feature because it compensates for browser limitations,
 * not user preferences. It's always enabled to ensure basic usability.
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
    
    // TV Readability baseline - compensates for lack of clamp() support
    // Uses fixed 24px font size readable from TV viewing distance
    // This was previously a userscript but is fundamental to TV usability
    style.textContent = 
      '/* TV Readability Baseline (Chrome 47 clamp() polyfill) */' +
      'body,p,span,div,li,td,th,a,h1,h2,h3,h4,h5,h6{' +
        'font-size:24px!important;' +
        'line-height:1.8!important;' +
        'letter-spacing:0.02em!important' +
      '}' +
      'p,li,td,th{' +
        'max-width:1200px!important;' +
      '}' +
      'a{' +
        'text-decoration:underline!important;' +
        'outline:2px solid rgba(0,255,255,0.7)!important;' +
        'outline-offset:2px!important;' +
        'padding:4px!important' +
      '}' +
      'button,input,select,textarea{' +
        'min-height:44px!important;' +
        'font-size:20px!important;' +
        'padding:8px 12px!important' +
      '}' +
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
 * Polyfill CSS compatibility (auto-detects if needed)
 * Always returns true for Chrome 47-69 as clamp() is never supported
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
