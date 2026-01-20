/**
 * TizenPortal Core Runtime
 * 
 * Main entry point. Initializes all subsystems and exposes the global API.
 * Supports both APP mode (portal launcher) and MOD mode (injected into sites).
 * 
 * @version 0200
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
import { initDiagnosticsPanel, showDiagnosticsPanel, hideDiagnosticsPanel } from '../ui/diagnostics.js';
import { loadBundle, unloadBundle, getActiveBundle, getActiveBundleName, handleBundleKeyDown } from './loader.js';
import { getBundleNames, getBundle } from '../bundles/registry.js';

/**
 * TizenPortal version
 */
const VERSION = '0200';

/**
 * Early debug HUD - shows immediately before full init
 * This helps debug whether the script is loading at all
 */
function tpHud(msg) {
  try {
    var h = document.getElementById('tp-hud');
    if (!h) {
      h = document.createElement('div');
      h.id = 'tp-hud';
      h.style.cssText = 'position:fixed;top:0;right:0;background:rgba(0,0,0,0.9);color:#0f0;padding:10px;font-size:12px;font-family:monospace;z-index:2147483647;border-left:2px solid #0f0;border-bottom:2px solid #0f0;max-width:400px;word-break:break-all;';
      // Append to documentElement if body doesn't exist yet
      (document.body || document.documentElement).appendChild(h);
    }
    h.textContent = '[TP ' + VERSION + '] ' + msg;
    // Auto-hide after 8 seconds
    if (h._timer) clearTimeout(h._timer);
    h._timer = setTimeout(function() { 
      if (h) h.style.opacity = '0.3'; 
    }, 8000);
  } catch (e) {
    // Silently fail
  }
}

// Show HUD immediately when script loads
tpHud('Script loaded, waiting for DOM...');

/**
 * Application state
 */
const state = {
  initialized: false,
  mode: null, // 'app' or 'mod'
  currentCard: null,
  currentBundle: null,
  siteActive: false,
};

/**
 * Check if we're running in MOD mode (injected into external site)
 * vs APP mode (portal launcher)
 */
function detectMode() {
  // If tp-shell exists, we're in APP mode (portal HTML loaded)
  if (document.getElementById('tp-shell')) {
    return 'app';
  }
  // Otherwise we're injected into an external site
  return 'mod';
}

/**
 * Initialize TizenPortal
 */
async function init() {
  if (state.initialized) {
    warn('TizenPortal already initialized');
    return;
  }

  // Detect which mode we're in
  state.mode = detectMode();
  tpHud('Mode: ' + state.mode.toUpperCase());
  
  log('TizenPortal ' + VERSION + ' initializing in ' + state.mode.toUpperCase() + ' mode...');

  if (state.mode === 'mod') {
    await initModMode();
  } else {
    await initAppMode();
  }
}

/**
 * Initialize MOD mode - injected into external site
 */
async function initModMode() {
  try {
    tpHud('MOD: Loading polyfills...');
    
    // Step 1: Initialize polyfills
    const loadedPolyfills = await initPolyfills();
    log('Polyfills loaded: ' + (loadedPolyfills.length > 0 ? loadedPolyfills.join(', ') : 'none needed'));

    tpHud('MOD: Config init...');
    
    // Step 2: Initialize configuration (to read tp_apps)
    configInit();

    // Step 3: Initialize diagnostics
    initDiagnostics();

    tpHud('MOD: Finding card...');
    
    // Step 4: Try to get card config from URL hash first, then localStorage
    var matchedCard = null;
    
    // Try URL hash (passed by portal when navigating)
    var hashCard = getCardFromHash();
    if (hashCard) {
      log('Card from URL hash: ' + hashCard.name);
      matchedCard = hashCard;
      tpHud('Card (hash): ' + hashCard.name);
      // Clear hash after reading (clean URL)
      try {
        var cleanUrl = window.location.href.replace(/[#&]tp=[^&#]+/, '');
        history.replaceState(null, document.title, cleanUrl);
      } catch (e) {
        // Ignore - some sites may block history manipulation
      }
    }
    
    // Fallback to localStorage match
    if (!matchedCard) {
      matchedCard = findMatchingCard(window.location.href);
      if (matchedCard) {
        log('Matched card from localStorage: ' + matchedCard.name + ' (bundle: ' + (matchedCard.bundle || 'default') + ')');
        state.currentCard = matchedCard;
        tpHud('Card (storage): ' + matchedCard.name);
      }
    }
    
    // Final fallback - create pseudo-card
    if (!matchedCard) {
      log('No matching card for: ' + window.location.href);
      tpHud('No card - using default');
      matchedCard = {
        name: document.title || 'Unknown Site',
        url: window.location.href,
        bundle: 'default'
      };
    }
    
    state.currentCard = matchedCard;

    tpHud('MOD: Applying bundle...');
    
    // Step 5: Apply bundle to the current page
    await applyBundleToPage(matchedCard);

    // Step 6: Initialize input handler for color buttons
    initInputHandler();
    log('Input handler initialized');

    // Step 7: Create minimal overlay UI (diagnostics, return to portal)
    createModOverlay();

    state.initialized = true;
    tpHud('MOD Ready!');
    log('TizenPortal MOD mode ready');

  } catch (err) {
    error('MOD mode initialization failed: ' + err.message);
    console.error(err);
  }
}

/**
 * Initialize APP mode - portal launcher
 */
async function initAppMode() {
  try {
    // Step 1: Initialize polyfills based on feature detection
    const loadedPolyfills = await initPolyfills();
    log('Polyfills loaded: ' + (loadedPolyfills.length > 0 ? loadedPolyfills.join(', ') : 'none needed'));

    // Check spatial navigation status
    log('Spatial nav: window.navigate=' + (typeof window.navigate) + ', __spatialNavigation__=' + (typeof window.__spatialNavigation__));

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
    log('TizenPortal ' + VERSION + ' APP mode ready');

    // Show startup toast
    showToast('TizenPortal ' + VERSION);

  } catch (err) {
    error('APP mode initialization failed: ' + err.message);
    console.error(err);
  }
}

/**
 * Extract card config from URL hash
 * Format: #tp=BASE64(JSON) or &tp=BASE64(JSON)
 * @returns {Object|null} Card object or null
 */
function getCardFromHash() {
  try {
    var hash = window.location.hash;
    if (!hash) return null;
    
    // Look for tp= parameter in hash
    var match = hash.match(/[#&]tp=([^&]+)/);
    if (!match || !match[1]) return null;
    
    // Decode base64 JSON
    var decoded = atob(match[1]);
    var cardData = JSON.parse(decoded);
    
    // Add current URL to card
    cardData.url = window.location.href.replace(/[#&]tp=[^&#]+/, '');
    
    log('Decoded card from hash: ' + JSON.stringify(cardData));
    return cardData;
  } catch (e) {
    error('Failed to parse hash card: ' + e.message);
    return null;
  }
}

/**
 * Find a card that matches the given URL
 * @param {string} url - URL to match
 * @returns {Object|null} Matching card or null
 */
function findMatchingCard(url) {
  var apps = [];
  try {
    apps = JSON.parse(localStorage.getItem('tp_apps') || '[]');
  } catch (e) {
    return null;
  }
  
  if (!Array.isArray(apps) || apps.length === 0) {
    return null;
  }
  
  // Normalize URL for comparison
  var normalizedUrl = url.toLowerCase().replace(/\/$/, '');
  
  for (var i = 0; i < apps.length; i++) {
    var card = apps[i];
    if (!card.url) continue;
    
    var cardUrl = card.url.toLowerCase().replace(/\/$/, '');
    
    // Check if current URL starts with card URL (handles subpages)
    if (normalizedUrl.indexOf(cardUrl) === 0) {
      return card;
    }
    
    // Also check if card URL starts with current URL (handles base domain matching)
    if (cardUrl.indexOf(normalizedUrl.split('?')[0].split('#')[0]) === 0) {
      return card;
    }
  }
  
  return null;
}

/**
 * Apply bundle directly to the current page (MOD mode)
 * @param {Object} card - Card with bundle info
 */
async function applyBundleToPage(card) {
  var bundleName = card.bundle || 'default';
  var bundle = getBundle(bundleName);
  
  if (!bundle) {
    log('Bundle not found: ' + bundleName + ', using default');
    bundle = getBundle('default');
  }
  
  if (!bundle) {
    warn('No bundle available');
    return;
  }
  
  log('Applying bundle: ' + bundle.name);
  state.currentBundle = bundle.name;
  
  // Inject bundle CSS
  if (bundle.css) {
    var style = document.createElement('style');
    style.id = 'tp-bundle-css';
    style.textContent = bundle.css;
    document.head.appendChild(style);
    log('Bundle CSS injected');
  }
  
  // Call lifecycle hooks with window instead of iframe
  try {
    if (bundle.onBeforeLoad) {
      bundle.onBeforeLoad(window, card);
    }
  } catch (e) {
    error('onBeforeLoad error: ' + e.message);
  }
  
  // Wait for DOM ready if needed
  if (document.readyState === 'loading') {
    await new Promise(function(resolve) {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }
  
  try {
    if (bundle.onAfterLoad) {
      bundle.onAfterLoad(window, card);
    }
  } catch (e) {
    error('onAfterLoad error: ' + e.message);
  }
  
  try {
    if (bundle.onActivate) {
      bundle.onActivate(window, card);
    }
  } catch (e) {
    error('onActivate error: ' + e.message);
  }
  
  log('Bundle applied successfully');
}

/**
 * Create minimal overlay UI for MOD mode
 */
function createModOverlay() {
  // Create a minimal diagnostics container that can be toggled
  var overlay = document.createElement('div');
  overlay.id = 'tp-mod-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999999;';
  
  // Create diagnostics panel container (hidden by default)
  var diagContainer = document.createElement('div');
  diagContainer.id = 'tp-mod-diagnostics';
  diagContainer.style.cssText = 'display:none;position:absolute;top:20px;right:20px;width:500px;max-height:80%;background:rgba(0,0,0,0.9);border:2px solid #333;border-radius:8px;color:#fff;font-family:monospace;font-size:12px;overflow:auto;pointer-events:auto;padding:16px;';
  
  var diagHeader = document.createElement('div');
  diagHeader.style.cssText = 'font-size:14px;font-weight:bold;margin-bottom:12px;color:#00a8ff;';
  diagHeader.textContent = 'TizenPortal ' + VERSION + ' (MOD)';
  diagContainer.appendChild(diagHeader);
  
  var diagInfo = document.createElement('div');
  diagInfo.id = 'tp-mod-diag-info';
  diagInfo.style.cssText = 'margin-bottom:12px;padding:8px;background:#111;border-radius:4px;';
  diagInfo.innerHTML = 
    '<div>URL: ' + window.location.href.substring(0, 60) + '...</div>' +
    '<div>Card: ' + (state.currentCard ? state.currentCard.name : 'None') + '</div>' +
    '<div>Bundle: ' + (state.currentBundle || 'default') + '</div>';
  diagContainer.appendChild(diagInfo);
  
  var diagLog = document.createElement('div');
  diagLog.id = 'tp-mod-diag-log';
  diagLog.style.cssText = 'max-height:300px;overflow:auto;';
  diagContainer.appendChild(diagLog);
  
  var diagButtons = document.createElement('div');
  diagButtons.style.cssText = 'margin-top:12px;display:flex;gap:8px;';
  diagButtons.innerHTML = 
    '<button id="tp-mod-return" style="flex:1;padding:12px;background:#00a8ff;border:none;border-radius:4px;color:#fff;font-size:14px;cursor:pointer;">Return to Portal</button>' +
    '<button id="tp-mod-close-diag" style="flex:1;padding:12px;background:#333;border:none;border-radius:4px;color:#fff;font-size:14px;cursor:pointer;">Close</button>';
  diagContainer.appendChild(diagButtons);
  
  overlay.appendChild(diagContainer);
  document.body.appendChild(overlay);
  
  // Set up button handlers
  document.getElementById('tp-mod-return').addEventListener('click', returnToPortal);
  document.getElementById('tp-mod-close-diag').addEventListener('click', function() {
    diagContainer.style.display = 'none';
  });
  
  // Store reference for toggling
  window._tpModDiagnostics = diagContainer;
}

/**
 * Toggle MOD mode diagnostics panel
 */
function toggleModDiagnostics() {
  var diag = window._tpModDiagnostics;
  if (diag) {
    diag.style.display = diag.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Return to the TizenPortal portal
 */
function returnToPortal() {
  log('Returning to portal...');
  // Navigate to the portal - relative path works since we're in the same TizenBrew context
  window.location.href = 'app/index.html';
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
 * Load a site - navigates the browser to the site URL
 * Passes card config via URL hash for the mod to pick up
 * @param {Object} card - Card object with url, bundle, etc.
 */
function loadSite(card) {
  if (!card || !card.url) {
    error('Cannot load site: invalid card');
    return;
  }

  log('Navigating to site: ' + card.url);
  showToast('Loading ' + (card.name || card.url) + '...');

  // Store current card in state
  state.currentCard = card;
  
  // Build URL with card config in hash
  // This ensures the mod can read the config even if localStorage fails
  var targetUrl = card.url;
  try {
    // Encode card data as base64 JSON in hash
    var cardPayload = {
      name: card.name,
      bundle: card.bundle || 'default',
      icon: card.icon
    };
    var encoded = btoa(JSON.stringify(cardPayload));
    
    // Append to URL hash (preserve existing hash if any)
    if (targetUrl.indexOf('#') === -1) {
      targetUrl += '#tp=' + encoded;
    } else {
      targetUrl += '&tp=' + encoded;
    }
  } catch (e) {
    error('Failed to encode card payload: ' + e.message);
    // Continue without hash - mod will try localStorage
  }
  
  log('Final URL: ' + targetUrl);
  
  // Navigate to the site - TizenBrew mod injection will handle the rest
  window.location.href = targetUrl;
}

/**
 * Close current site and return to portal
 * In mod mode, this navigates back to the portal
 */
function closeSite() {
  log('Closing site, returning to portal');
  returnToPortal();
}

/**
 * Show a toast notification
 * Works in both APP and MOD modes
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds (default 3000)
 */
function showToast(message, duration) {
  duration = duration || 3000;
  
  // In MOD mode, create a temporary toast
  if (state.mode === 'mod') {
    var existingToast = document.getElementById('tp-mod-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    var toast = document.createElement('div');
    toast.id = 'tp-mod-toast';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#fff;padding:16px 32px;border-radius:8px;font-size:18px;z-index:999999;transition:opacity 0.3s;';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(function() {
      toast.style.opacity = '0';
      setTimeout(function() { toast.remove(); }, 300);
    }, duration);
    return;
  }
  
  // APP mode - use existing toast element
  var toast = document.getElementById('tp-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');

  setTimeout(function() {
    toast.classList.remove('visible');
  }, duration);
}

/**
 * Show loading overlay (APP mode only)
 * @param {string} text - Loading text to display
 */
function showLoading(text) {
  if (state.mode === 'mod') return; // No loading in mod mode
  
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
 * Hide loading overlay (APP mode only)
 */
function hideLoading() {
  if (state.mode === 'mod') return;
  
  var loading = document.getElementById('tp-loading');
  if (loading) {
    loading.classList.remove('active');
  }
}

/**
 * Global TizenPortal API
 * Exposed on window.TizenPortal for bundles and external use
 */
var TizenPortalAPI = {
  // Version
  version: VERSION,

  // Mode (app or mod)
  get mode() { return state.mode; },

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
  returnToPortal: returnToPortal,
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
  toggleModDiagnostics: toggleModDiagnostics,

  // State access (read-only)
  getState: function() {
    return {
      initialized: state.initialized,
      mode: state.mode,
      currentCard: state.currentCard,
      currentBundle: state.currentBundle,
      siteActive: state.siteActive,
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
