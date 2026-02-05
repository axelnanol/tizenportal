/**
 * TizenPortal Bundle Loader
 * 
 * Loads bundles into iframes and manages lifecycle hooks.
 * Uses new cascade: mandatory → global features → feature bundle
 */

import { getBundle, getBundleNames } from '../bundles/registry.js';
import featureLoader from '../features/index.js';

/**
 * Currently active bundle instance
 */
var activeBundle = null;

/**
 * Currently active iframe
 */
var activeIframe = null;

/**
 * Currently active card
 */
var activeCard = null;

/**
 * Load a bundle for the given iframe and card
 * @param {HTMLIFrameElement} iframe
 * @param {Object} card - Card with featureBundle property
 * @returns {Promise<Object|null>} Loaded bundle or null
 */
export async function loadBundle(iframe, card) {
  if (!iframe || !card) {
    console.warn('TizenPortal Loader: Invalid iframe or card');
    return null;
  }

  // Get feature bundle name (may be null)
  var bundleName = card.featureBundle || card.bundle || null; // Support old 'bundle' field
  
  if (bundleName) {
    console.log('TizenPortal Loader: Loading feature bundle "' + bundleName + '" for ' + card.url);
  } else {
    console.log('TizenPortal Loader: Loading with global features only for ' + card.url);
  }

  // Get bundle from registry (may be null if no feature bundle)
  var bundle = bundleName ? getBundle(bundleName) : null;
  
  if (bundleName && !bundle) {
    console.warn('TizenPortal Loader: Feature bundle "' + bundleName + '" not found');
    // Continue without feature bundle
  }

  // Store active state
  activeBundle = bundle;
  activeIframe = iframe;
  activeCard = card;

  try {
    // Step 1: Call bundle onBeforeLoad (if bundle exists)
    if (bundle && typeof bundle.onBeforeLoad === 'function') {
      console.log('TizenPortal Loader: Calling bundle onBeforeLoad');
      await bundle.onBeforeLoad(iframe, card);
    }

    // Step 2: Inject TizenPortal API into iframe (MANDATORY - same-origin only)
    injectAPI(iframe);

    // Step 3: Inject key event forwarder (MANDATORY - forwards color buttons to shell)
    injectKeyForwarder(iframe);

    // Step 4: Apply global features (from tp_features config)
    console.log('TizenPortal Loader: Applying global features');
    featureLoader.applyFeatures(iframe);

    // Step 5: Inject feature bundle CSS (if bundle exists)
    if (bundle && bundle.style) {
      injectCSS(iframe, bundle.style);
    }

    // Step 6: Inject feature bundle JS (if bundle provides inline code)
    if (bundle && bundle.code) {
      injectJS(iframe, bundle.code);
    }

    // Step 7: Call bundle onAfterLoad
    if (bundle && typeof bundle.onAfterLoad === 'function') {
      console.log('TizenPortal Loader: Calling bundle onAfterLoad');
      await bundle.onAfterLoad(iframe, card);
    }

    // Step 8: Call bundle onActivate
    if (bundle && typeof bundle.onActivate === 'function') {
      console.log('TizenPortal Loader: Calling bundle onActivate');
      await bundle.onActivate(iframe, card);
    }

    var loadType = bundle ? 'feature bundle "' + bundleName + '"' : 'global features only';
    console.log('TizenPortal Loader: Loaded ' + loadType + ' successfully');
    return bundle;

  } catch (err) {
    console.error('TizenPortal Loader: Error loading:', err.message);
    return null;
  }
}

/**
 * Unload the current bundle
 * @returns {Promise<void>}
 */
export async function unloadBundle() {
  if (!activeBundle) {
    return;
  }

  console.log('TizenPortal Loader: Unloading bundle "' + (activeBundle.name || 'unknown') + '"');

  try {
    // Call onDeactivate
    if (typeof activeBundle.onDeactivate === 'function') {
      console.log('TizenPortal Loader: Calling onDeactivate');
      await activeBundle.onDeactivate(activeIframe, activeCard);
    }
  } catch (err) {
    console.error('TizenPortal Loader: Error in onDeactivate:', err.message);
  }

  // Clear state
  activeBundle = null;
  activeIframe = null;
  activeCard = null;
}

/**
 * Notify bundle of navigation within iframe
 * @param {string} url - New URL
 */
export function notifyNavigation(url) {
  if (!activeBundle) return;

  try {
    if (typeof activeBundle.onNavigate === 'function') {
      activeBundle.onNavigate(url);
    }
  } catch (err) {
    console.error('TizenPortal Loader: Error in onNavigate:', err.message);
  }
}

/**
 * Forward keydown event to bundle
 * @param {KeyboardEvent} event
 * @returns {boolean} True if bundle consumed the event
 */
export function handleBundleKeyDown(event) {
  if (!activeBundle) return false;

  try {
    if (typeof activeBundle.onKeyDown === 'function') {
      return activeBundle.onKeyDown(event);
    }
  } catch (err) {
    console.error('TizenPortal Loader: Error in onKeyDown:', err.message);
  }

  return false;
}

/**
 * Get the currently active bundle
 * @returns {Object|null}
 */
export function getActiveBundle() {
  return activeBundle;
}

/**
 * Get the active bundle name
 * @returns {string|null}
 */
export function getActiveBundleName() {
  return activeBundle ? (activeBundle.name || 'unknown') : null;
}

// ============================================================================
// INJECTION HELPERS
// ============================================================================

/**
 * Inject TizenPortal API into iframe
 * @param {HTMLIFrameElement} iframe
 */
function injectAPI(iframe) {
  try {
    var contentWindow = iframe.contentWindow;
    if (!contentWindow) {
      console.warn('TizenPortal Loader: No contentWindow');
      return;
    }

    // Create a minimal API for bundles running inside the iframe
    contentWindow.TizenPortal = {
      version: window.TizenPortal ? window.TizenPortal.version : 'unknown',
      
      // Logging (redirects to main window)
      log: function(msg) {
        if (window.TizenPortal && window.TizenPortal.log) {
          window.TizenPortal.log('[Bundle] ' + msg);
        } else {
          console.log('[Bundle]', msg);
        }
      },
      warn: function(msg) {
        if (window.TizenPortal && window.TizenPortal.warn) {
          window.TizenPortal.warn('[Bundle] ' + msg);
        } else {
          console.warn('[Bundle]', msg);
        }
      },
      error: function(msg) {
        if (window.TizenPortal && window.TizenPortal.error) {
          window.TizenPortal.error('[Bundle] ' + msg);
        } else {
          console.error('[Bundle]', msg);
        }
      },

      // Configuration (read-only from iframe)
      config: {
        read: function(key) {
          return window.TizenPortal && window.TizenPortal.config 
            ? window.TizenPortal.config.read(key) 
            : undefined;
        },
      },

      // Input state
      input: {
        isPointerMode: function() {
          return window.TizenPortal && window.TizenPortal.input
            ? window.TizenPortal.input.isPointerMode()
            : false;
        },
        isIMEActive: function() {
          return window.TizenPortal && window.TizenPortal.input
            ? window.TizenPortal.input.isIMEActive()
            : false;
        },
      },

      // Key constants
      keys: window.TizenPortal ? window.TizenPortal.keys : {},
    };

    console.log('TizenPortal Loader: API injected into iframe');

  } catch (err) {
    // Cross-origin - cannot inject API
    console.log('TizenPortal Loader: Cannot inject API (cross-origin)');
  }
}

/**
 * Inject key event forwarder into iframe
 * This forwards color button and other shell keys from iframe to parent
 * @param {HTMLIFrameElement} iframe
 */
function injectKeyForwarder(iframe) {
  try {
    var contentWindow = iframe.contentWindow;
    var contentDocument = iframe.contentDocument;
    if (!contentWindow || !contentDocument) {
      console.warn('TizenPortal Loader: Cannot inject key forwarder');
      return;
    }

    // Color button key codes that should be forwarded to shell
    var forwardKeyCodes = [
      403,   // RED
      404,   // GREEN
      405,   // YELLOW
      406,   // BLUE
      10182, // EXIT
    ];

    /**
     * Create a keyboard event that works on Chrome 47+
     * Note: KeyboardEvent constructor doesn't set keyCode/which on older Chrome
     * We use Object.defineProperty to force the values
     */
    function createKeyEvent(type, originalEvent) {
      var event;
      try {
        event = new KeyboardEvent(type, {
          bubbles: true,
          cancelable: true,
          key: originalEvent.key || '',
          code: originalEvent.code || '',
        });
      } catch (e) {
        // Fallback for very old browsers
        event = document.createEvent('KeyboardEvent');
        event.initKeyboardEvent(type, true, true, window, originalEvent.key || '', 0, '', false, '');
      }
      
      // Force keyCode and which values (constructor ignores them on Chrome 47)
      Object.defineProperty(event, 'keyCode', { value: originalEvent.keyCode });
      Object.defineProperty(event, 'which', { value: originalEvent.keyCode });
      
      return event;
    }

    // Keydown forwarder
    contentDocument.addEventListener('keydown', function(event) {
      var keyCode = event.keyCode;
      
      // Forward color buttons and exit to parent
      if (forwardKeyCodes.indexOf(keyCode) !== -1) {
        var parentEvent = createKeyEvent('keydown', event);
        window.document.dispatchEvent(parentEvent);
        
        // Prevent default in iframe
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    // Keyup forwarder
    contentDocument.addEventListener('keyup', function(event) {
      var keyCode = event.keyCode;
      
      if (forwardKeyCodes.indexOf(keyCode) !== -1) {
        var parentEvent = createKeyEvent('keyup', event);
        window.document.dispatchEvent(parentEvent);
        
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    console.log('TizenPortal Loader: Key forwarder injected into iframe');

  } catch (err) {
    console.log('TizenPortal Loader: Cannot inject key forwarder (cross-origin):', err.message);
  }
}

/**
 * Inject CSS into iframe
 * @param {HTMLIFrameElement} iframe
 * @param {string} css
 */
function injectCSS(iframe, css) {
  if (!css) return;

  try {
    var doc = iframe.contentDocument;
    if (!doc) {
      console.warn('TizenPortal Loader: No contentDocument for CSS injection');
      return;
    }

    // Check if we already injected styles
    var existingStyle = doc.getElementById('tp-bundle-styles');
    if (existingStyle) {
      existingStyle.textContent = css;
      console.log('TizenPortal Loader: Updated bundle CSS');
      return;
    }

    var style = doc.createElement('style');
    style.id = 'tp-bundle-styles';
    style.textContent = css;

    var head = doc.head || doc.documentElement;
    head.appendChild(style);

    console.log('TizenPortal Loader: Injected bundle CSS');

  } catch (err) {
    console.log('TizenPortal Loader: Cannot inject CSS (cross-origin)');
  }
}

/**
 * Inject JavaScript into iframe
 * @param {HTMLIFrameElement} iframe
 * @param {string} code
 */
function injectJS(iframe, code) {
  if (!code) return;

  try {
    var doc = iframe.contentDocument;
    if (!doc) {
      console.warn('TizenPortal Loader: No contentDocument for JS injection');
      return;
    }

    var script = doc.createElement('script');
    script.textContent = code;
    
    // Append to body (or documentElement if no body)
    var target = doc.body || doc.documentElement;
    target.appendChild(script);

    console.log('TizenPortal Loader: Injected bundle JS');

  } catch (err) {
    console.log('TizenPortal Loader: Cannot inject JS (cross-origin)');
  }
}

/**
 * Inject the spatial navigation polyfill into iframe
 * @param {HTMLIFrameElement} iframe
 */
export function injectSpatialNavigation(iframe) {
  try {
    var doc = iframe.contentDocument;
    if (!doc) return;

    // Check if already present
    if (iframe.contentWindow && iframe.contentWindow.__spatialNavigation__) {
      console.log('TizenPortal Loader: Spatial navigation already present in iframe');
      return;
    }

    // The spatial nav polyfill needs to be re-initialized in the iframe context
    // For now, we'll inject it via the bundle's onAfterLoad hook
    // Full injection would require including the polyfill source as a string
    
    console.log('TizenPortal Loader: Spatial navigation injection requires bundle implementation');

  } catch (err) {
    console.log('TizenPortal Loader: Cannot inject spatial nav (cross-origin)');
  }
}

