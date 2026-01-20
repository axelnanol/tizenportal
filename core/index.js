/**
 * TizenPortal Core Runtime
 * 
 * Main entry point. Initializes all subsystems and exposes the global API.
 * 
 * @version 0120
 */

// ============================================================================
// POLYFILLS - Must be imported first, before any other code
// This matches TizenTube's approach for Tizen Chrome 47-69 compatibility
// ============================================================================

// Core-js provides ES6+ language features (Array.flat, Object.entries, etc.)
import 'core-js/stable';

// Fetch API polyfill
import 'whatwg-fetch';

// DOMRect polyfill (from Financial-Times via TizenTube)
import '../polyfills/domrect-polyfill.js';

// ============================================================================
// SPATIAL NAVIGATION
// ============================================================================

// Import spatial navigation polyfill (sets up window.navigate)
import '../navigation/spatial-navigation-polyfill.js';

// ============================================================================
// APPLICATION MODULES
// ============================================================================

// Import core modules
import { configRead, configWrite, configOnChange, configInit } from './config.js';
import { initPolyfills, hasPolyfill, getLoadedPolyfills } from '../polyfills/index.js';
import { KEYS } from '../input/keys.js';
import { initInputHandler, executeColorAction } from '../input/handler.js';
import { initPointer, isPointerActive, togglePointer } from '../input/pointer.js';
import { initPortal, showPortal, hidePortal, refreshPortal } from '../ui/portal.js';
import { initModal } from '../ui/modal.js';
import { initSiteEditor, showAddSiteEditor, showEditSiteEditor, isSiteEditorOpen } from '../ui/siteeditor.js';
import { initAddressBar, showAddressBar, hideAddressBar, toggleAddressBar, isAddressBarVisible } from '../ui/addressbar.js';
import { initBundleMenu, showBundleMenu, hideBundleMenu, toggleBundleMenu, isBundleMenuVisible, cycleBundle } from '../ui/bundlemenu.js';
import { initDiagnostics, log, warn, error } from '../diagnostics/console.js';
import { initDiagnosticsPanel } from '../ui/diagnostics.js';
import { loadBundle, unloadBundle, getActiveBundle, getActiveBundleName, handleBundleKeyDown } from './loader.js';
import { getBundleNames } from '../bundles/registry.js';

/**
 * TizenPortal version
 */
const VERSION = '0120';

/**
 * Application state
 */
const state = {
  initialized: false,
  currentCard: null,
  currentBundle: null,
  iframeActive: false,
};

/**
 * Initialize TizenPortal
 */
async function init() {
  if (state.initialized) {
    warn('TizenPortal already initialized');
    return;
  }

  log('TizenPortal ' + VERSION + ' initializing...');

  try {
    // Step 1: Initialize polyfills based on feature detection
    const loadedPolyfills = await initPolyfills();
    log('Polyfills loaded: ' + (loadedPolyfills.length > 0 ? loadedPolyfills.join(', ') : 'none needed'));

    // Check spatial navigation status
    log('Spatial nav: window.navigate=' + (typeof window.navigate) + ', __spatialNavigation__=' + (typeof window.__spatialNavigation__));
    if (window.__spatialNavigation__) {
      log('Spatial nav keyMode: ' + window.__spatialNavigation__.keyMode);
    }

    // Step 2: Initialize configuration
    configInit();
    log('Configuration initialized');

    // Step 3: Initialize diagnostics (console capture)
    initDiagnostics();
    log('Diagnostics initialized');

    // Step 4: Initialize diagnostics panel UI
    initDiagnosticsPanel();
    log('Diagnostics panel initialized');

    // Step 5: Initialize modal system (legacy)
    initModal();
    log('Modal system initialized');

    // Step 5b: Initialize new site editor
    initSiteEditor();
    log('Site editor initialized');

    // Step 6: Initialize address bar
    initAddressBar();
    log('Address bar initialized');

    // Step 7: Initialize bundle menu
    initBundleMenu();
    log('Bundle menu initialized');

    // Step 8: Initialize pointer/mouse mode
    initPointer();
    log('Pointer mode initialized');

    // Step 9: Initialize input handler
    initInputHandler();
    log('Input handler initialized');

    // Step 10: Initialize and render portal UI
    initPortal();
    log('Portal UI initialized');

    // Step 11: Initialize color button hints (make clickable)
    initColorHints();
    log('Color hints initialized');

    state.initialized = true;
    log('TizenPortal ' + VERSION + ' ready');

    // Show startup toast
    showToast('TizenPortal ' + VERSION);

  } catch (err) {
    error('Initialization failed: ' + err.message);
    console.error(err);
  }
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds (default 3000)
 */
function showToast(message, duration) {
  duration = duration || 3000;
  var toast = document.getElementById('tp-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');

  setTimeout(function() {
    toast.classList.remove('visible');
  }, duration);
}

/**
 * Show loading overlay
 * @param {string} text - Loading text to display
 */
function showLoading(text) {
  var loading = document.getElementById('tp-loading');
  var loadingText = document.getElementById('tp-loading-text');
  if (loading) {
    if (loadingText && text) {
      loadingText.textContent = text;
    }
    loading.classList.add('active');
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  var loading = document.getElementById('tp-loading');
  if (loading) {
    loading.classList.remove('active');
  }
}

/**
 * Initialize color button hints with click handlers
 * Makes the hints clickable for mouse users
 */
function initColorHints() {
  var hints = document.getElementById('tp-hints');
  if (!hints) return;

  // Define hint configurations: color class -> short press action
  var hintConfig = {
    'red': 'addressbar',
    'green': 'pointerMode',
    'yellow': 'bundleMenu',
    'blue': 'diagnostics'
  };

  // Find all hint elements and add click handlers
  var hintElements = hints.querySelectorAll('.tp-hint');
  for (var i = 0; i < hintElements.length; i++) {
    var hint = hintElements[i];
    var keyElement = hint.querySelector('.tp-hint-key');
    
    if (!keyElement) continue;

    // Determine which color this is
    var color = null;
    if (keyElement.classList.contains('red')) color = 'red';
    else if (keyElement.classList.contains('green')) color = 'green';
    else if (keyElement.classList.contains('yellow')) color = 'yellow';
    else if (keyElement.classList.contains('blue')) color = 'blue';

    if (!color || !hintConfig[color]) continue;

    // Store the action in a data attribute
    hint.setAttribute('data-action', hintConfig[color]);
    
    // Make it look clickable
    hint.style.cursor = 'pointer';
    
    // Add click handler
    hint.addEventListener('click', function(e) {
      var action = this.getAttribute('data-action');
      if (action) {
        executeColorAction(action);
      }
    });

    // Add hover effect
    hint.addEventListener('mouseenter', function() {
      this.style.opacity = '1';
      this.style.color = '#ffffff';
    });
    hint.addEventListener('mouseleave', function() {
      this.style.opacity = '';
      this.style.color = '';
    });
  }
}

/**
 * Load a site in the iframe
 * @param {Object} card - Card object with url, bundle, etc.
 */
function loadSite(card) {
  if (!card || !card.url) {
    error('Cannot load site: invalid card');
    return;
  }

  log('Loading site: ' + card.url);
  showLoading('Loading ' + (card.name || card.url) + '...');

  state.currentCard = card;
  
  var container = document.getElementById('tp-iframe-container');
  if (!container) {
    error('Iframe container not found');
    hideLoading();
    return;
  }

  // Clear existing iframe
  container.innerHTML = '';

  // Create new iframe
  var iframe = document.createElement('iframe');
  iframe.id = 'tp-iframe';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
  
  // Handle load event
  iframe.onload = function() {
    log('Site loaded: ' + card.url);
    hideLoading();
    state.iframeActive = true;
    
    // Load bundle for this site
    loadBundle(iframe, card).then(function(bundle) {
      if (bundle) {
        state.currentBundle = bundle.name || 'default';
        log('Bundle active: ' + state.currentBundle);
      }
    }).catch(function(err) {
      error('Bundle load failed: ' + err.message);
    });
  };

  // Handle error
  iframe.onerror = function(err) {
    error('Failed to load site: ' + card.url);
    hideLoading();
    showToast('Failed to load site');
  };

  // Set URL and add to container
  iframe.src = card.url;
  container.appendChild(iframe);

  // Show iframe container, hide portal
  hidePortal();
  container.style.display = 'block';
}

/**
 * Close current site and return to portal
 */
function closeSite() {
  log('Closing site');

  // Unload bundle first
  unloadBundle().then(function() {
    log('Bundle unloaded');
  }).catch(function(err) {
    error('Bundle unload error: ' + err.message);
  });

  var container = document.getElementById('tp-iframe-container');
  if (container) {
    container.innerHTML = '';
    container.style.display = 'none';
  }

  state.currentCard = null;
  state.currentBundle = null;
  state.iframeActive = false;

  showPortal();
  refreshPortal();
}

/**
 * Global TizenPortal API
 * Exposed on window.TizenPortal for bundles and external use
 */
var TizenPortalAPI = {
  // Version
  version: VERSION,

  // Logging
  log: log,
  warn: warn,
  error: error,

  // Configuration
  config: {
    read: configRead,
    write: configWrite,
    onChange: configOnChange,
  },

  // Key constants
  keys: KEYS,

  // Input state
  input: {
    isPointerMode: isPointerActive,
    togglePointer: togglePointer,
    isIMEActive: function() { return false; }, // TODO: implement IME tracking
  },

  // Polyfill info
  polyfills: {
    has: hasPolyfill,
    loaded: getLoadedPolyfills,
  },

  // Site management
  loadSite: loadSite,
  closeSite: closeSite,
  getCurrentCard: function() {
    return state.currentCard;
  },

  // Bundle system
  bundles: {
    list: getBundleNames,
    getActive: getActiveBundle,
    getActiveName: getActiveBundleName,
  },

  // UI helpers
  showToast: showToast,
  showLoading: showLoading,
  hideLoading: hideLoading,

  // State access (read-only)
  getState: function() {
    return {
      initialized: state.initialized,
      currentCard: state.currentCard,
      currentBundle: state.currentBundle,
      iframeActive: state.iframeActive,
    };
  },

  // Internal API (not for bundle use)
  _internal: {
    state: state,
    init: init,
  },
};

// Expose on window
window.TizenPortal = TizenPortalAPI;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for module use
export default TizenPortalAPI;
