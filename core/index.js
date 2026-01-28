/**
 * TizenPortal Core Runtime
 * 
 * Main entry point. Initializes all subsystems and exposes the global API.
 * Runs on both the portal page and injected into target sites.
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

// Import spatial navigation polyfill (local copy with fixes, sets up window.navigate)
import '../navigation/spatial-navigation-polyfill.js';

// ============================================================================
// APPLICATION MODULES
// ============================================================================

// Import core modules
import { configRead, configWrite, configOnChange, configInit } from './config.js';
import { initPolyfills, hasPolyfill, getLoadedPolyfills } from '../polyfills/index.js';
import { KEYS } from '../input/keys.js';
import { initInputHandler, executeColorAction, registerKeyHandler } from '../input/handler.js';
import { initPointer, isPointerActive, togglePointer } from '../input/pointer.js';
import { wrapTextInputs, unwrapTextInputs, activateInput, deactivateInput } from '../input/text-input.js';
import { 
  enableScrollIntoView, disableScrollIntoView, scrollElementIntoView,
  setInitialFocus, lockViewport, unlockViewport,
  observeDOM, stopObservingDOM 
} from '../focus/manager.js';
import { initPortal, showPortal, hidePortal, refreshPortal } from '../ui/portal.js';
import { initModal } from '../ui/modal.js';
import { initSiteEditor, showAddSiteEditor, showEditSiteEditor, isSiteEditorOpen } from '../ui/siteeditor.js';
import { initAddressBar, showAddressBar, hideAddressBar, toggleAddressBar, isAddressBarVisible } from '../ui/addressbar.js';
import { initBundleMenu, showBundleMenu, hideBundleMenu, toggleBundleMenu, isBundleMenuVisible, cycleBundle } from '../ui/bundlemenu.js';
import { initDiagnostics, log, warn, error } from '../diagnostics/console.js';
import { initDiagnosticsPanel, showDiagnosticsPanel, hideDiagnosticsPanel, toggleDiagnosticsPanel } from '../ui/diagnostics.js';
import { loadBundle, unloadBundle, getActiveBundle, getActiveBundleName, handleBundleKeyDown } from './loader.js';
import { getBundleNames, getBundle } from '../bundles/registry.js';

/**
 * TizenPortal version - injected from package.json at build time
 */
const VERSION = '__VERSION__';

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
  isPortalPage: false, // true when on portal, false when injected into site
  currentCard: null,
  currentBundle: null,
  siteActive: false,
};

/**
 * Check if we're on the portal page vs injected into a target site
 */
function detectContext() {
  // If tp-shell exists, we're on the portal page
  return !!document.getElementById('tp-shell');
}

/**
 * Initialize TizenPortal
 */
async function init() {
  if (state.initialized) {
    warn('TizenPortal already initialized');
    return;
  }

  // Detect where we are
  state.isPortalPage = detectContext();
  tpHud(state.isPortalPage ? 'Portal page' : 'Target site');
  
  log('TizenPortal ' + VERSION + ' initializing...');

  try {
    // Step 1: Initialize polyfills
    tpHud('Loading polyfills...');
    const loadedPolyfills = await initPolyfills();
    log('Polyfills loaded: ' + (loadedPolyfills.length > 0 ? loadedPolyfills.join(', ') : 'none needed'));
    log('Spatial nav: window.navigate=' + (typeof window.navigate) + ', __spatialNavigation__=' + (typeof window.__spatialNavigation__));

    // Step 2: Initialize configuration
    tpHud('Config init...');
    configInit();
    log('Configuration initialized');

    // Step 3: Initialize diagnostics (console capture)
    initDiagnostics();
    log('Diagnostics initialized');

    // Step 4: Initialize diagnostics panel UI
    initDiagnosticsPanel();
    log('Diagnostics panel initialized');

    // Step 5: Initialize pointer/mouse mode
    initPointer();
    log('Pointer mode initialized');

    // Step 6: Initialize input handler
    initInputHandler();
    log('Input handler initialized');

    if (state.isPortalPage) {
      // Portal-specific initialization
      await initPortalPage();
    } else {
      // Target site initialization
      await initTargetSite();
    }

    state.initialized = true;
    tpHud('Ready!');
    log('TizenPortal ' + VERSION + ' ready');
    showToast('TizenPortal ' + VERSION);

  } catch (err) {
    error('Initialization failed: ' + err.message);
    console.error(err);
  }
}

/**
 * Initialize when on the portal page
 */
async function initPortalPage() {
  // Initialize modal system
  initModal();
  log('Modal system initialized');

  // Initialize site editor
  initSiteEditor();
  log('Site editor initialized');

  // Initialize address bar
  initAddressBar();
  log('Address bar initialized');

  // Initialize bundle menu
  initBundleMenu();
  log('Bundle menu initialized');

  // Initialize and render portal UI (card grid)
  initPortal();
  log('Portal UI initialized');

  // Initialize color button hints (make clickable)
  initColorHints();
  log('Color hints initialized');
}

/**
 * Initialize when injected into a target site
 */
async function initTargetSite() {
  tpHud('Finding card...');
  
  // Inject base CSS for overlay components (pointer, address bar, etc.)
  injectOverlayStyles();
  
  // Try to get card config from URL hash first, then localStorage
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

  // Apply bundle to the current page
  tpHud('Applying bundle...');
  await applyBundleToPage(matchedCard);

  // Initialize standard UI components (same as portal, they create their own elements)
  initAddressBar();
  log('Address bar initialized');
  
  initDiagnosticsPanel();
  log('Diagnostics panel initialized');
  
  // Create color button hints
  createSiteHints();
  log('Color hints created');
}

/**
 * Extract card config from URL hash
 * Format: #tp=BASE64(JSON) or &tp=BASE64(JSON)
 * Payload format: { css, js, bundleName, cardName, ua }
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
    var decoded = decodeURIComponent(escape(atob(match[1])));
    var payload = JSON.parse(decoded);
    
    log('Decoded payload from hash: ' + JSON.stringify(payload));
    
    // Convert payload to card format
    var card = {
      name: payload.cardName || 'Unknown Site',
      url: window.location.href.replace(/[#&]tp=[^&#]+/, ''),
      bundle: payload.bundleName || 'default',
      // Store raw payload for CSS/JS injection
      _payload: payload
    };
    
    log('Card from URL hash: ' + card.name + ' (bundle: ' + card.bundle + ')');
    return card;
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
  
  // Inject bundle CSS (bundles export as 'style' property)
  var cssContent = bundle.style || '';
  
  // Also check for payload CSS from URL hash
  if (card._payload && card._payload.css) {
    log('Adding payload CSS from URL hash');
    cssContent += '\n\n/* Payload CSS */\n' + card._payload.css;
  }
  
  if (cssContent) {
    var style = document.createElement('style');
    style.id = 'tp-bundle-css';
    style.textContent = cssContent;
    document.head.appendChild(style);
    log('Bundle CSS injected (' + cssContent.length + ' chars)');
  } else {
    warn('No CSS to inject for bundle: ' + bundle.name);
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
 * Inject overlay styles for target sites
 * These styles are normally in the portal HTML, but need to be injected on external sites
 */
function injectOverlayStyles() {
  var style = document.createElement('style');
  style.id = 'tp-overlay-styles';
  style.textContent = [
    '/* TizenPortal Overlay Styles */',
    '',
    '/* Pointer cursor */',
    '.tp-pointer {',
    '  position: fixed;',
    '  width: 32px;',
    '  height: 32px;',
    '  pointer-events: none;',
    '  z-index: 2147483647;',
    '  opacity: 0;',
    '  transition: opacity 0.15s;',
    '}',
    '.tp-pointer.visible { opacity: 1; }',
    '.tp-pointer-cursor {',
    '  width: 0;',
    '  height: 0;',
    '  border-left: 12px solid #00a8ff;',
    '  border-top: 8px solid transparent;',
    '  border-bottom: 8px solid transparent;',
    '  filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));',
    '  transform: rotate(-30deg);',
    '}',
    '.tp-pointer-hover {',
    '  outline: 3px solid #00a8ff !important;',
    '  outline-offset: 2px;',
    '}',
    '',
    '/* Address bar */',
    '.tp-addressbar {',
    '  position: fixed;',
    '  top: 0;',
    '  left: 0;',
    '  right: 0;',
    '  height: 70px;',
    '  background: linear-gradient(180deg, rgba(13,17,23,0.98) 0%, rgba(13,17,23,0.95) 100%);',
    '  border-bottom: 2px solid #00a8ff;',
    '  z-index: 2147483640;',
    '  display: none;',
    '  box-shadow: 0 4px 20px rgba(0,0,0,0.5);',
    '}',
    '.tp-addressbar.visible { display: block; }',
    '.tp-addressbar-content {',
    '  display: -webkit-box;',
    '  display: -webkit-flex;',
    '  display: flex;',
    '  -webkit-box-align: center;',
    '  -webkit-align-items: center;',
    '  align-items: center;',
    '  height: 100%;',
    '  padding: 0 20px;',
    '}',
    '.tp-addressbar-btn {',
    '  width: 50px;',
    '  min-width: 50px;',
    '  height: 50px;',
    '  margin-right: 12px;',
    '  background: linear-gradient(145deg, #1e2430 0%, #151922 100%);',
    '  border: 2px solid rgba(255,255,255,0.1);',
    '  border-radius: 8px;',
    '  color: #fff;',
    '  font-size: 20px;',
    '  cursor: pointer;',
    '  transition: all 0.15s;',
    '  display: -webkit-box;',
    '  display: -webkit-flex;',
    '  display: flex;',
    '  -webkit-box-align: center;',
    '  -webkit-align-items: center;',
    '  align-items: center;',
    '  -webkit-box-pack: center;',
    '  -webkit-justify-content: center;',
    '  justify-content: center;',
    '  -webkit-flex-shrink: 0;',
    '  flex-shrink: 0;',
    '}',
    '.tp-addressbar-btn:focus {',
    '  outline: none;',
    '  border-color: #00a8ff;',
    '  box-shadow: 0 0 0 3px rgba(0,168,255,0.3);',
    '}',
    '.tp-btn-svg {',
    '  width: 24px;',
    '  height: 24px;',
    '}',
    '.tp-btn-icon {',
    '  font-size: 20px;',
    '}',
    '.tp-addressbar-url-container {',
    '  -webkit-box-flex: 1;',
    '  -webkit-flex: 1;',
    '  flex: 1;',
    '  height: 50px;',
    '  min-width: 200px;',
    '  margin-right: 12px;',
    '  background: #000;',
    '  border: 2px solid rgba(255,255,255,0.1);',
    '  border-radius: 8px;',
    '  display: -webkit-box;',
    '  display: -webkit-flex;',
    '  display: flex;',
    '  -webkit-box-align: center;',
    '  -webkit-align-items: center;',
    '  align-items: center;',
    '  padding: 0 16px;',
    '  cursor: pointer;',
    '  transition: all 0.15s;',
    '  overflow: hidden;',
    '}',
    '.tp-addressbar-url-container:focus {',
    '  outline: none;',
    '  border-color: #00a8ff;',
    '}',
    '.tp-addressbar-url-display {',
    '  color: #888;',
    '  font-size: 16px;',
    '  font-family: monospace;',
    '  white-space: nowrap;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    '  width: 100%;',
    '}',
    '.tp-addressbar-url {',
    '  display: none;',
    '  width: 100%;',
    '  height: 100%;',
    '  background: transparent;',
    '  border: none;',
    '  color: #fff;',
    '  font-size: 16px;',
    '  font-family: monospace;',
    '  outline: none;',
    '}',
    '.tp-addressbar-url-container.editing .tp-addressbar-url { display: block; }',
    '.tp-addressbar-url-container.editing .tp-addressbar-url-display { display: none; }',
    '',
    '/* Color hints */',
    '.tp-site-hints {',
    '  position: fixed;',
    '  bottom: 20px;',
    '  left: 60px;',
    '  display: -webkit-box;',
    '  display: -webkit-flex;',
    '  display: flex;',
    '  background: rgba(0,0,0,0.85);',
    '  padding: 12px 24px;',
    '  border-radius: 12px;',
    '  z-index: 2147483640;',
    '  pointer-events: none;',
    '}',
    '.tp-site-hint {',
    '  display: flex;',
    '  align-items: center;',
    '  margin-right: 40px;',
    '}',
    '.tp-site-hint-key {',
    '  width: 24px;',
    '  height: 24px;',
    '  border-radius: 4px;',
    '  margin-right: 8px;',
    '}',
    '.tp-site-hint-key.red { background: #e91e63; }',
    '.tp-site-hint-key.green { background: #4caf50; }',
    '.tp-site-hint-key.yellow { background: #ffeb3b; }',
    '.tp-site-hint-key.blue { background: #2196f3; }',
    '.tp-site-hint span { color: #fff; font-size: 13px; }',
    '',
    '/* Toast */',
    '#tp-toast {',
    '  position: fixed;',
    '  bottom: 80px;',
    '  left: 50%;',
    '  transform: translateX(-50%);',
    '  background: rgba(0,0,0,0.95);',
    '  color: #fff;',
    '  padding: 16px 32px;',
    '  border-radius: 12px;',
    '  font-size: 18px;',
    '  z-index: 2147483647;',
    '  opacity: 0;',
    '  transition: opacity 0.3s;',
    '  pointer-events: none;',
    '}',
    '#tp-toast.visible { opacity: 1; }',
    '',
    '/* Diagnostics panel */',
    '#tp-diagnostics {',
    '  display: none;',
    '  position: fixed;',
    '  left: 0;',
    '  right: 0;',
    '  bottom: 0;',
    '  height: 300px;',
    '  background: rgba(0,0,0,0.95);',
    '  z-index: 2147483645;',
    '  flex-direction: column;',
    '  padding: 20px 40px;',
    '  font-family: Consolas, Monaco, monospace;',
    '}',
    '#tp-diagnostics.visible { display: flex; }',
    '#tp-diagnostics.compact { height: 300px; }',
    '#tp-diagnostics.fullscreen { top: 0; height: 100%; }',
    '#tp-diagnostics-header {',
    '  display: flex;',
    '  justify-content: space-between;',
    '  align-items: center;',
    '  margin-bottom: 10px;',
    '  padding-bottom: 10px;',
    '  border-bottom: 1px solid #333;',
    '}',
    '#tp-diagnostics-header h2 { font-size: 20px; font-weight: 500; color: #00a8ff; margin: 0; }',
    '#tp-diagnostics-info { font-size: 14px; color: #888; }',
    '#tp-diagnostics-logs { flex: 1; overflow-y: auto; font-size: 14px; line-height: 1.6; }',
    '.tp-log-entry { padding: 4px 0; border-bottom: 1px solid #1a1a1a; display: flex; }',
    '.tp-log-time { color: #666; flex-shrink: 0; width: 100px; margin-right: 12px; }',
    '.tp-log-level { flex-shrink: 0; width: 60px; margin-right: 12px; font-weight: bold; }',
    '.tp-log-level.log { color: #888; }',
    '.tp-log-level.info { color: #3498db; }',
    '.tp-log-level.warn { color: #f1c40f; }',
    '.tp-log-level.error { color: #e74c3c; }',
    '.tp-log-message { color: #ccc; flex: 1; word-break: break-word; }',
    '#tp-diagnostics-footer { margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; font-size: 14px; color: #666; }',
  ].join('\n');
  
  document.head.appendChild(style);
  log('Overlay styles injected');
}

/**
 * Create color button hints for target sites
 */
function createSiteHints() {
  // Create toast element (used by showToast)
  var toast = document.createElement('div');
  toast.id = 'tp-toast';
  document.body.appendChild(toast);
  
  // Create hints bar
  var hints = document.createElement('div');
  hints.className = 'tp-site-hints';
  hints.innerHTML = [
    '<div class="tp-site-hint"><div class="tp-site-hint-key red"></div><span>Address</span></div>',
    '<div class="tp-site-hint"><div class="tp-site-hint-key green"></div><span>Mouse</span></div>',
    '<div class="tp-site-hint"><div class="tp-site-hint-key yellow"></div><span>Portal</span></div>',
    '<div class="tp-site-hint"><div class="tp-site-hint-key blue"></div><span>Console</span></div>',
  ].join('');
  document.body.appendChild(hints);
}

/**
 * Toggle site address bar (uses standard addressbar module)
 */
function toggleSiteAddressBar() {
  toggleAddressBar();
}

/**
 * Toggle site diagnostics panel (uses standard diagnostics module)
 */
function toggleSiteDiagnostics() {
  toggleDiagnosticsPanel();
}

/**
 * Return to the TizenPortal portal
 */
function returnToPortal() {
  log('Returning to portal...');
  // Navigate to portal using absolute URL (works from any site)
  window.location.href = 'https://alexnolan.github.io/tizenportal/dist/index.html';
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
    'yellow': 'editSite',
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
  
  // Set up focus tracking to update yellow hint contextually
  document.addEventListener('focusin', updateYellowHint);
  updateYellowHint(); // Initial update
}

/**
 * Update the yellow hint text based on current context
 */
function updateYellowHint() {
  var hintText = document.getElementById('tp-hint-yellow-text');
  if (!hintText) return;
  
  // Check if site editor is open
  if (isSiteEditorOpen()) {
    hintText.textContent = 'Save';
    return;
  }
  
  // Check what's focused
  var focused = document.activeElement;
  if (!focused) {
    hintText.textContent = 'Add Site';
    return;
  }
  
  // If Add Site button is focused
  if (focused.classList.contains('tp-card-add')) {
    hintText.textContent = 'Add Site';
    return;
  }
  
  // If a site card is focused
  if (focused.classList.contains('tp-card') && focused.hasAttribute('data-card-id')) {
    hintText.textContent = 'Edit Site';
    return;
  }
  
  // Default
  hintText.textContent = 'Add Site';
}

/**
 * Load a site - navigates the browser to the site URL
 * Builds payload with bundle name and passes via URL hash
 * The runtime reads and applies the bundle on the target site
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
  
  // Get the bundle for this card
  var bundleName = card.bundle || 'default';
  var bundle = getBundle(bundleName);
  
  // Build payload with bundle info: { css, js, ua, bundleName }
  var targetUrl = card.url;
  try {
    var payload = {
      css: '',
      js: '',
      ua: ''
    };
    
    // Add bundle CSS
    if (bundle && bundle.style) {
      payload.css = bundle.style;
    }
    
    // Add bundle JS initialization code (if needed)
    // The bundle object has methods, so we can't directly serialize it
    // Instead, pass bundle name and let the runtime look it up
    payload.bundleName = bundleName;
    payload.cardName = card.name;
    
    // Encode payload
    var json = JSON.stringify(payload);
    var encoded = btoa(unescape(encodeURIComponent(json)));
    
    // Append to URL hash
    if (targetUrl.indexOf('#') === -1) {
      targetUrl += '#tp=' + encoded;
    } else {
      targetUrl += '&tp=' + encoded;
    }
    
    log('Payload size: ' + json.length + ' bytes, encoded: ' + encoded.length);
  } catch (e) {
    error('Failed to encode payload: ' + e.message);
    // Continue without hash
  }
  
  log('Final URL: ' + targetUrl.substring(0, 100) + '...');
  
  // Navigate to the site - runtime will handle bundle injection
  window.location.href = targetUrl;
}

/**
 * Close current site and return to portal
 */
function closeSite() {
  log('Closing site, returning to portal');
  returnToPortal();
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds (default 3000)
 */
function showToast(message, duration) {
  duration = duration || 3000;
  
  // Use standard toast element (created on both portal and target sites)
  var toast = document.getElementById('tp-toast');
  if (!toast) {
    // Fallback: create temporary toast
    toast = document.createElement('div');
    toast.id = 'tp-toast';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.95);color:#fff;padding:16px 32px;border-radius:12px;font-size:18px;z-index:2147483647;opacity:0;transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.classList.add('visible');
  toast.style.opacity = '1';

  setTimeout(function() {
    toast.classList.remove('visible');
    toast.style.opacity = '0';
  }, duration);
}

/**
 * Show loading overlay (portal page only)
 * @param {string} text - Loading text to display
 */
function showLoading(text) {
  if (!state.isPortalPage) return;
  
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
 * Hide loading overlay (portal page only)
 */
function hideLoading() {
  if (!state.isPortalPage) return;
  
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

  // Context (portal page or target site)
  get isPortalPage() { return state.isPortalPage; },

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

  // Input state and handlers
  input: {
    isPointerMode: isPointerActive,
    togglePointer: togglePointer,
    registerKeyHandler: registerKeyHandler,
    isIMEActive: function() { return false; }, // TODO: implement IME tracking
    // Text input wrapping for TV keyboard handling
    wrapTextInputs: wrapTextInputs,
    unwrapTextInputs: unwrapTextInputs,
    activateInput: activateInput,
    deactivateInput: deactivateInput,
  },

  // Focus utilities for TV
  focus: {
    enableScrollIntoView: enableScrollIntoView,
    disableScrollIntoView: disableScrollIntoView,
    scrollElementIntoView: scrollElementIntoView,
    setInitialFocus: setInitialFocus,
    lockViewport: lockViewport,
    unlockViewport: unlockViewport,
    observeDOM: observeDOM,
    stopObservingDOM: stopObservingDOM,
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
  
  // Site overlay controls
  toggleSiteAddressBar: toggleSiteAddressBar,
  toggleSiteDiagnostics: toggleSiteDiagnostics,

  // State access (read-only)
  getState: function() {
    return {
      initialized: state.initialized,
      isPortalPage: state.isPortalPage,
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
