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
import { configRead, configWrite, configOnChange, configInit, configGet, configSet } from './config.js';
import { initPolyfills, hasPolyfill, getLoadedPolyfills } from '../polyfills/index.js';
import { KEYS } from '../input/keys.js';
import { initInputHandler, executeColorAction, registerKeyHandler } from '../input/handler.js';
import { initPointer, isPointerActive, togglePointer } from '../input/pointer.js';
import { wrapTextInputs, unwrapTextInputs, activateInput, deactivateInput, isIMEActive } from '../input/text-input.js';
import { 
  enableScrollIntoView, disableScrollIntoView, setScrollEnabled, scrollElementIntoView,
  setInitialFocus, lockViewport, unlockViewport,
  observeDOM, stopObservingDOM 
} from '../focus/manager.js';
import { initPortal, showPortal, hidePortal, refreshPortal } from '../ui/portal.js';
import { initModal } from '../ui/modal.js';
import { initSiteEditor, showAddSiteEditor, showEditSiteEditor, isSiteEditorOpen } from '../ui/siteeditor.js';
import { initPreferences, showPreferences, closePreferences, isPreferencesOpen, applyPortalPreferences } from '../ui/preferences.js';
import { initAddressBar, showAddressBar, hideAddressBar, toggleAddressBar, isAddressBarVisible } from '../ui/addressbar.js';
import { initDiagnostics, log, warn, error } from '../diagnostics/console.js';
import { initDiagnosticsPanel, showDiagnosticsPanel, hideDiagnosticsPanel, toggleDiagnosticsPanel } from '../ui/diagnostics.js';
import { loadBundle, unloadBundle, getActiveBundle, getActiveBundleName, handleBundleKeyDown, setActiveBundle } from './loader.js';
import { getBundleNames, getBundle } from '../bundles/registry.js';
import { isValidHttpUrl, sanitizeCss } from './utils.js';
import featureLoader from '../features/index.js';
import { 
  registerCards, unregisterCards, clearRegistrations, getRegistrations,
  processCards, initCards, shutdownCards 
} from './cards.js';

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
      h.style.cssText = 'position:fixed;top:0;right:0;background:rgba(0,0,0,0.9);color:#0f0;padding:10px;font-size:12px;font-family:monospace;z-index:2147483647;border:2px solid #0f0;max-width:400px;word-break:break-all;';
      // Append to documentElement if body doesn't exist yet
      (document.body || document.documentElement).appendChild(h);
    }

    // Respect HUD preference (off by default)
    if (window.TizenPortal && window.TizenPortal.config) {
      var portalCfg = TizenPortal.config.get('tp_portal') || {};
      if (portalCfg.hudPosition === 'off') {
        h.style.display = 'none';
        return;
      }
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
 * Bundle matcher registry (used when payload is stripped)
 */
var bundleMatchers = [];

/**
 * Persist last matched card for cross-site navigation
 */
var LAST_CARD_KEY = 'tp_last_card';

/**
 * Text input protection state
 */
var textInputObserver = null;
var textInputInterval = null;

/**
 * Selector for text inputs to wrap (exclude TizenPortal UI inputs)
 */
var TEXT_INPUT_SELECTOR = 'input, textarea';

function resolveFocusOutlineMode(card) {
  var features = configGet('tp_features') || {};
  var mode = features.focusOutlineMode || (features.focusStyling ? 'on' : 'off');
  if (card && card.focusOutlineMode) {
    mode = card.focusOutlineMode;
  } else if (features.focusStyling === false) {
    mode = 'off';
  }
  return mode || 'on';
}

function resolveViewportMode(card, bundle) {
  if (bundle && (bundle.viewportLock === 'force' || bundle.viewportLock === true)) {
    return 'locked';
  }

  var features = configGet('tp_features') || {};
  var mode = features.viewportMode || 'locked';
  if (card && card.viewportMode) {
    mode = card.viewportMode;
  }
  return mode || 'locked';
}

function resolveUserAgentMode(card) {
  if (card && card.userAgent) {
    return card.userAgent;
  }
  var features = configGet('tp_features') || {};
  return features.uaMode || 'tizen';
}

function getCardOverrideValue(card, key) {
  if (!card) return null;
  if (card.hasOwnProperty(key) && card[key] !== null && card[key] !== undefined) {
    return card[key];
  }
  return null;
}

function buildFeatureOverrides(card) {
  var overrides = {};
  var keys = [
    'tabindexInjection',
    'scrollIntoView',
    'safeArea',
    'gpuHints',
    'cssReset',
    'hideScrollbars',
    'wrapTextInputs',
  ];

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = getCardOverrideValue(card, key);
    if (value !== null && value !== undefined) {
      overrides[key] = value;
    }
  }

  return overrides;
}

function getUserAgentString(mode) {
  if (!mode) return null;

  // Allow explicit UA strings
  if (mode.indexOf('Mozilla/') === 0) {
    return mode;
  }

  if (mode === 'desktop') {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  if (mode === 'mobile') {
    return 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
  }

  return null;
}

function applyUserAgentOverride(mode) {
  var uaString = getUserAgentString(mode);
  if (!uaString) return;

  try {
    var navigatorProto = window.navigator && window.navigator.__proto__;
    if (navigatorProto && Object.defineProperty) {
      Object.defineProperty(navigatorProto, 'userAgent', {
        get: function() { return uaString; },
        configurable: true
      });
      Object.defineProperty(navigatorProto, 'appVersion', {
        get: function() { return uaString; },
        configurable: true
      });
    }
    document.documentElement.setAttribute('data-tp-ua', mode);
    log('UA override applied (JS only): ' + mode);
  } catch (err) {
    warn('UA override failed: ' + err.message);
  }
}

function applyFocusModeClass(mode) {
  var target = document.body || document.documentElement;
  if (!target || !target.classList) return;

  target.classList.remove('tp-focus-mode-on');
  target.classList.remove('tp-focus-mode-high');
  target.classList.remove('tp-focus-mode-off');

  if (mode === 'high') {
    target.classList.add('tp-focus-mode-high');
  } else if (mode === 'off') {
    target.classList.add('tp-focus-mode-off');
  } else {
    target.classList.add('tp-focus-mode-on');
  }
}

function shouldLockViewportAuto() {
  var width = window.innerWidth || document.documentElement.clientWidth || 1920;
  var screenWidth = (window.screen && window.screen.width) ? window.screen.width : width;
  var maxWidth = Math.max(width, screenWidth);
  return maxWidth < 2560;
}

function applyViewportMode(mode) {
  try {
    if (mode === 'unlocked') {
      unlockViewport();
      log('Viewport: Unlocked');
      return;
    }

    if (mode === 'auto') {
      if (shouldLockViewportAuto()) {
        lockViewport({ width: 1920, initialScale: 1, userScalable: false });
        log('Viewport: Auto -> Locked (1920)');
      } else {
        unlockViewport();
        log('Viewport: Auto -> Unlocked');
      }
      return;
    }

    lockViewport({ width: 1920, initialScale: 1, userScalable: false });
    log('Viewport: Locked (1920)');
  } catch (err) {
    warn('Viewport: Failed to apply mode:', err.message);
  }
}

function applyGlobalFeaturesForCard(card, bundle) {
  var focusMode = resolveFocusOutlineMode(card);
  var viewportMode = resolveViewportMode(card, bundle);
  var overrides = buildFeatureOverrides(card);
  overrides.focusOutlineMode = focusMode;

  try {
    featureLoader.applyFeatures(document, overrides);
  } catch (e) {
    error('Failed to apply features: ' + e.message);
  }

  applyFocusModeClass(focusMode);

  applyViewportMode(viewportMode);
}

function saveLastCard(card) {
  if (!card) return;
  try {
    var featureBundle = card.featureBundle;
    if (!featureBundle && card.bundle) {
      featureBundle = card.bundle;
    }
    var resolvedUserAgent = resolveUserAgentMode(card);
    var payload = {
      name: card.name || '',
      url: card.url || '',
      featureBundle: featureBundle || 'default',
      viewportMode: card.hasOwnProperty('viewportMode') ? card.viewportMode : null,
      focusOutlineMode: card.hasOwnProperty('focusOutlineMode') ? card.focusOutlineMode : null,
      userAgent: resolvedUserAgent,
      tabindexInjection: card.hasOwnProperty('tabindexInjection') ? card.tabindexInjection : null,
      scrollIntoView: card.hasOwnProperty('scrollIntoView') ? card.scrollIntoView : null,
      safeArea: card.hasOwnProperty('safeArea') ? card.safeArea : null,
      gpuHints: card.hasOwnProperty('gpuHints') ? card.gpuHints : null,
      cssReset: card.hasOwnProperty('cssReset') ? card.cssReset : null,
      hideScrollbars: card.hasOwnProperty('hideScrollbars') ? card.hideScrollbars : null,
      wrapTextInputs: card.hasOwnProperty('wrapTextInputs') ? card.wrapTextInputs : null,
      icon: card.icon || null,
      bundleOptions: card.bundleOptions || {},
      bundleOptionData: card.bundleOptionData || {},
    };
    var json = JSON.stringify(payload);
    sessionStorage.setItem(LAST_CARD_KEY, json);
    // Also persist to window.name for cross-origin survival.
    // sessionStorage is per-origin and won't carry over when the portal
    // navigates to a different-origin target site. window.name persists
    // across navigations in the same tab, even across origins.
    try { window.name = 'tp:' + json; } catch (e) { /* ignore */ }
  } catch (err) {
    // Ignore
  }
}

/**
 * Load card from window.name (cross-origin fallback).
 * window.name persists across navigations in the same tab, even
 * across different origins — unlike sessionStorage/localStorage.
 * We prefix our data with 'tp:' to avoid collisions.
 */
function loadCardFromWindowName() {
  try {
    var name = window.name;
    if (!name || typeof name !== 'string' || name.indexOf('tp:') !== 0) return null;
    var json = name.substring(3);
    var card = JSON.parse(json);
    if (card && card.featureBundle) return card;
    return null;
  } catch (err) {
    return null;
  }
}

function loadLastCard() {
  try {
    var stored = sessionStorage.getItem(LAST_CARD_KEY);
    if (!stored) return null;
    var card = JSON.parse(stored);
    return card || null;
  } catch (err) {
    return null;
  }
}

function startTextInputProtection() {
  var count = wrapTextInputs(TEXT_INPUT_SELECTOR);
  if (window.TizenPortal && window.TizenPortal.log) {
    TizenPortal.log('TextInput: Protection enabled (wrapped ' + count + ')');
  } else {
    console.log('TizenPortal [TextInput]: Protection enabled, wrapped', count);
  }

  // Retry a few times to catch late-rendered inputs
  setTimeout(function() { wrapTextInputs(TEXT_INPUT_SELECTOR); }, 500);
  setTimeout(function() { wrapTextInputs(TEXT_INPUT_SELECTOR); }, 1500);
  setTimeout(function() { wrapTextInputs(TEXT_INPUT_SELECTOR); }, 3000);

  if (textInputObserver) {
    textInputObserver.disconnect();
    textInputObserver = null;
  }
  if (textInputInterval) {
    clearInterval(textInputInterval);
    textInputInterval = null;
  }

  if (typeof MutationObserver !== 'undefined') {
    textInputObserver = new MutationObserver(function() {
      wrapTextInputs(TEXT_INPUT_SELECTOR);
    });
    var target = document.body || document.documentElement;
    if (target) {
      textInputObserver.observe(target, { childList: true, subtree: true });
    }
  } else {
    textInputInterval = setInterval(function() {
      wrapTextInputs(TEXT_INPUT_SELECTOR);
    }, 2000);
  }
}

function stopTextInputProtection() {
  if (textInputObserver) {
    textInputObserver.disconnect();
    textInputObserver = null;
  }
  if (textInputInterval) {
    clearInterval(textInputInterval);
    textInputInterval = null;
  }
  unwrapTextInputs(TEXT_INPUT_SELECTOR);
  if (window.TizenPortal && window.TizenPortal.log) {
    TizenPortal.log('TextInput: Protection disabled');
  } else {
    console.log('TizenPortal [TextInput]: Protection disabled');
  }
}

function applyTextInputProtectionFromConfig(card) {
  var features = configGet('tp_features') || {};
  var enabled = features.wrapTextInputs !== false;
  var override = getCardOverrideValue(card, 'wrapTextInputs');
  if (override !== null && override !== undefined) {
    enabled = override;
  }
  if (window.TizenPortal && window.TizenPortal.log) {
    TizenPortal.log('TextInput: wrapTextInputs=' + enabled);
  }
  if (enabled) {
    startTextInputProtection();
  } else {
    stopTextInputProtection();
  }
}

function registerBundleMatcher(matcher) {
  if (!matcher || typeof matcher !== 'object') return;
  if (!matcher.bundleName || typeof matcher.bundleName !== 'string') return;
  bundleMatchers.push(matcher);
}

function matchBundleFromRegistry() {
  for (var i = 0; i < bundleMatchers.length; i++) {
    var matcher = bundleMatchers[i];
    try {
      if (typeof matcher.match === 'function') {
        if (matcher.match()) return matcher.bundleName;
      } else {
        var title = (document.title || '').toLowerCase();
        if (matcher.titleContains && matcher.titleContains.length) {
          for (var t = 0; t < matcher.titleContains.length; t++) {
            var token = String(matcher.titleContains[t] || '').toLowerCase();
            if (token && title.indexOf(token) !== -1) return matcher.bundleName;
          }
        }
        if (matcher.selectors && matcher.selectors.length) {
          for (var s = 0; s < matcher.selectors.length; s++) {
            var sel = matcher.selectors[s];
            if (sel && document.querySelector(sel)) return matcher.bundleName;
          }
        }
      }
    } catch (err) {
      // Ignore matcher errors
    }
  }
  return null;
}

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

  // Initialize preferences
  initPreferences();
  log('Preferences initialized');

  // Initialize address bar
  initAddressBar();
  log('Address bar initialized');


  // Initialize and render portal UI (card grid)
  initPortal();
  log('Portal UI initialized');

  // Initialize color button hints (make clickable)
  initColorHints();
  log('Color hints initialized');
}

/**
 * Wait briefly for #tp= or ?tp= payload to appear in the URL
 */
function waitForPayload(maxWaitMs, intervalMs) {
  return new Promise(function(resolve) {
    var start = Date.now();
    var interval = intervalMs || 50;

    function hasPayload() {
      var hash = window.location.hash || '';
      var search = window.location.search || '';
      return /[#&]tp=/.test(hash) || /[?&]tp=/.test(search);
    }

    function check() {
      if (hasPayload() || (Date.now() - start) >= maxWaitMs) {
        resolve(hasPayload());
        return;
      }
      setTimeout(check, interval);
    }

    check();
  });
}

/**
 * Initialize when injected into a target site
 */
async function initTargetSite() {
  tpHud('Finding card...');
  
  // Inject base CSS for overlay components (pointer, address bar, etc.)
  injectOverlayStyles();

  // Give the URL a brief moment to settle (hash/query payload may arrive late)
  await waitForPayload(200, 50);
  
  // Try to get card config from URL hash first, then localStorage
  var matchedCard = null;
  var directPayloadFound = false;
  
  // Try URL hash (passed by portal when navigating)
  var hashCard = getCardFromHash();
  if (hashCard) {
    log('Card from URL hash: ' + hashCard.name);
    matchedCard = hashCard;
    directPayloadFound = true;
    tpHud('Card (hash): ' + hashCard.name);
    saveLastCard(hashCard);
    // Clear hash after reading (clean URL)
    try {
      var cleanUrl = window.location.href.replace(/[#&]tp=[^&#]+/, '');
      history.replaceState(null, document.title, cleanUrl);
    } catch (e) {
      // Ignore - some sites may block history manipulation
    }
  }

  // Fallback: try tp payload in query string (survives some redirects)
  if (!matchedCard) {
    var queryCard = getCardFromQuery();
    if (queryCard) {
      log('Card from URL query: ' + queryCard.name);
      matchedCard = queryCard;
      directPayloadFound = true;
      tpHud('Card (query): ' + queryCard.name);
      saveLastCard(queryCard);
      // Clear query after reading (clean URL)
      try {
        var cleanQueryUrl = window.location.href.replace(/([?&])tp=[^&#]+(&?)/, function(match, prefix, trailing) {
          if (prefix === '?' && trailing) return '?';
          if (prefix === '?' && !trailing) return '';
          return prefix === '&' && trailing ? '&' : '';
        });
        cleanQueryUrl = cleanQueryUrl.replace(/[?&]$/, '');
        history.replaceState(null, document.title, cleanQueryUrl);
      } catch (e) {
        // Ignore
      }
    }
  }

  if (!matchedCard) {
    var hashHasTp = false;
    try {
      var h = window.location.hash || '';
      hashHasTp = /[#&]tp=/.test(h);
    } catch (e) {
      // Ignore
    }
    log('Card hash present: ' + (hashHasTp ? 'yes' : 'no'));
    var queryHasTp = false;
    try {
      var s = window.location.search || '';
      queryHasTp = /[?&]tp=/.test(s);
    } catch (e) {
      // Ignore
    }
    log('Card query present: ' + (queryHasTp ? 'yes' : 'no'));
  }
  
  // Fallback: check window.name (cross-origin persistence).
  // When the portal navigates to a different-origin target site,
  // sessionStorage and localStorage are inaccessible (per-origin).
  // window.name survives cross-origin navigations in the same tab.
  if (!matchedCard) {
    var windowCard = loadCardFromWindowName();
    if (windowCard) {
      matchedCard = Object.assign({}, windowCard, {
        url: window.location.href,
        name: windowCard.name || document.title || 'Unknown Site'
      });
      log('Card from window.name: ' + (matchedCard.featureBundle || 'default'));
      tpHud('Card (window): ' + (matchedCard.name || 'Window'));
      // Save to sessionStorage for this origin's future navigations
      saveLastCard(matchedCard);
    } else {
      var nameState = 'empty';
      try {
        var wn = window.name;
        if (wn && typeof wn === 'string') {
          nameState = wn.indexOf('tp:') === 0 ? 'tp: present (parse failed)' : 'non-tp value';
        }
      } catch (e) {
        nameState = 'read error';
      }
      log('Card window.name: ' + nameState);
    }
  }

  // Fallback: reuse last card from session (same-origin navigations).
  // After the first successful match on this origin, subsequent page
  // loads (e.g. SPA navigations within the site) can use sessionStorage.
  if (!matchedCard) {
    var lastCard = loadLastCard();
    if (lastCard) {
      matchedCard = Object.assign({}, lastCard, {
        url: window.location.href,
        name: lastCard.name || document.title || 'Unknown Site'
      });
      log('Using last card bundle: ' + (matchedCard.featureBundle || 'default'));
      tpHud('Card (session): ' + (matchedCard.name || 'Last Card'));
    } else {
      log('Card sessionStorage: empty');
    }
  }

  // Fallback: try matching current URL against saved cards in localStorage
  if (!matchedCard) {
    matchedCard = findMatchingCard(window.location.href);
    if (matchedCard) {
      log('Matched card from localStorage: ' + matchedCard.name + ' (bundle: ' + (matchedCard.featureBundle || 'default') + ')');
      tpHud('Card (storage): ' + matchedCard.name);
      saveLastCard(matchedCard);
    } else {
      log('Card localStorage: no match for ' + window.location.href);
    }
  }

  // Heuristic fallback using bundle matchers (when payload is stripped)
  if (!matchedCard) {
    var matchedBundle = matchBundleFromRegistry();
    if (matchedBundle) {
      matchedCard = {
        name: document.title || matchedBundle,
        url: window.location.href,
        featureBundle: matchedBundle
      };
      log('Heuristic bundle match: ' + matchedBundle);
      tpHud('Card (heuristic): ' + matchedBundle);
      saveLastCard(matchedCard);
    }
  }
  
  // Final fallback - create pseudo-card
  if (!matchedCard) {
    log('No matching card for: ' + window.location.href);
    tpHud('No card - using default');
    matchedCard = {
      name: document.title || 'Unknown Site',
      url: window.location.href,
      featureBundle: 'default'
    };
    saveLastCard(matchedCard);
  }
  
  state.currentCard = matchedCard;

  applyUserAgentOverride(resolveUserAgentMode(matchedCard));

  // Apply bundle to the current page
  tpHud('Applying bundle...');
  await applyBundleToPage(matchedCard);

  // If we started without a direct payload, poll briefly for a late payload
  scheduleLatePayloadRetry(directPayloadFound, matchedCard);

  // Protect text inputs from TV keyboard auto-popup
  applyTextInputProtectionFromConfig(state.currentCard);

  // Re-apply when preferences change
  configOnChange(function(event) {
    if (event && event.key === 'tp_features') {
      applyTextInputProtectionFromConfig(state.currentCard);
      applyGlobalFeaturesForCard(state.currentCard, getBundle(state.currentBundle || 'default'));
    }
  });

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
    var payload = normalizePayload(JSON.parse(decoded));
    if (!payload) {
      warn('Invalid payload from hash; ignoring');
      return null;
    }

    log('Decoded payload from hash: ' + JSON.stringify(payload));

    // Convert payload to card format
    var card = {
      name: payload.cardName || 'Unknown Site',
      url: window.location.href.replace(/[#&]tp=[^&#]+/, ''),
      featureBundle: payload.bundleName || 'default',
      viewportMode: payload.viewportMode || null,
      focusOutlineMode: payload.focusOutlineMode || null,
      userAgent: payload.ua || null,
      tabindexInjection: payload.hasOwnProperty('tabindexInjection') ? payload.tabindexInjection : null,
      scrollIntoView: payload.hasOwnProperty('scrollIntoView') ? payload.scrollIntoView : null,
      safeArea: payload.hasOwnProperty('safeArea') ? payload.safeArea : null,
      gpuHints: payload.hasOwnProperty('gpuHints') ? payload.gpuHints : null,
      cssReset: payload.hasOwnProperty('cssReset') ? payload.cssReset : null,
      hideScrollbars: payload.hasOwnProperty('hideScrollbars') ? payload.hideScrollbars : null,
      wrapTextInputs: payload.hasOwnProperty('wrapTextInputs') ? payload.wrapTextInputs : null,
      bundleOptions: payload.bundleOptions || {},
      bundleOptionData: payload.bundleOptionData || {},
      // Store raw payload for CSS/JS injection
      _payload: payload
    };
    
    log('Card from URL hash: ' + card.name + ' (bundle: ' + (card.featureBundle || 'default') + ')');
    return card;
  } catch (e) {
    error('Failed to parse hash card: ' + e.message);
    return null;
  }
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;

  var normalized = {};
  var bundleNames = getBundleNames ? getBundleNames() : [];

  if (typeof payload.bundleName === 'string') {
    if (bundleNames.indexOf(payload.bundleName) !== -1) {
      normalized.bundleName = payload.bundleName;
    } else {
      normalized.bundleName = 'default';
    }
  }

  if (typeof payload.cardName === 'string') {
    normalized.cardName = payload.cardName;
  }

  if (typeof payload.ua === 'string') {
    normalized.ua = payload.ua;
  }

  if (typeof payload.css === 'string') {
    // Cap size to avoid pathological payloads
    normalized.css = payload.css.length > 20000 ? payload.css.substring(0, 20000) : payload.css;
  }

  if (typeof payload.viewportMode === 'string') {
    normalized.viewportMode = payload.viewportMode;
  }

  if (typeof payload.focusOutlineMode === 'string') {
    normalized.focusOutlineMode = payload.focusOutlineMode;
  }

  if (typeof payload.tabindexInjection === 'boolean') normalized.tabindexInjection = payload.tabindexInjection;
  if (typeof payload.scrollIntoView === 'boolean') normalized.scrollIntoView = payload.scrollIntoView;
  if (typeof payload.safeArea === 'boolean') normalized.safeArea = payload.safeArea;
  if (typeof payload.gpuHints === 'boolean') normalized.gpuHints = payload.gpuHints;
  if (typeof payload.cssReset === 'boolean') normalized.cssReset = payload.cssReset;
  if (typeof payload.hideScrollbars === 'boolean') normalized.hideScrollbars = payload.hideScrollbars;
  if (typeof payload.wrapTextInputs === 'boolean') normalized.wrapTextInputs = payload.wrapTextInputs;

  if (payload.bundleOptions && typeof payload.bundleOptions === 'object' && !Array.isArray(payload.bundleOptions)) {
    normalized.bundleOptions = payload.bundleOptions;
  }

  if (payload.bundleOptionData && typeof payload.bundleOptionData === 'object' && !Array.isArray(payload.bundleOptionData)) {
    normalized.bundleOptionData = payload.bundleOptionData;
  }

  return normalized;
}

/**
 * Extract card config from URL query string
 * Format: ?tp=BASE64(JSON) or &tp=BASE64(JSON)
 * Payload format: { css, js, bundleName, cardName, ua }
 * @returns {Object|null} Card object or null
 */
function getCardFromQuery() {
  try {
    var search = window.location.search;
    if (!search) return null;

    var match = search.match(/[?&]tp=([^&]+)/);
    if (!match || !match[1]) return null;

    var decoded = decodeURIComponent(escape(atob(match[1])));
    var payload = normalizePayload(JSON.parse(decoded));
    if (!payload) {
      warn('Invalid payload from query; ignoring');
      return null;
    }

    log('Decoded payload from query: ' + JSON.stringify(payload));

    var card = {
      name: payload.cardName || 'Unknown Site',
      url: window.location.href.replace(/[?&]tp=[^&#]+/, ''),
      featureBundle: payload.bundleName || 'default',
      viewportMode: payload.viewportMode || null,
      focusOutlineMode: payload.focusOutlineMode || null,
      userAgent: payload.ua || null,
      tabindexInjection: payload.hasOwnProperty('tabindexInjection') ? payload.tabindexInjection : null,
      scrollIntoView: payload.hasOwnProperty('scrollIntoView') ? payload.scrollIntoView : null,
      safeArea: payload.hasOwnProperty('safeArea') ? payload.safeArea : null,
      gpuHints: payload.hasOwnProperty('gpuHints') ? payload.gpuHints : null,
      cssReset: payload.hasOwnProperty('cssReset') ? payload.cssReset : null,
      hideScrollbars: payload.hasOwnProperty('hideScrollbars') ? payload.hideScrollbars : null,
      wrapTextInputs: payload.hasOwnProperty('wrapTextInputs') ? payload.wrapTextInputs : null,
      bundleOptions: payload.bundleOptions || {},
      bundleOptionData: payload.bundleOptionData || {},
      _payload: payload
    };

    log('Card from URL query: ' + card.name + ' (bundle: ' + (card.featureBundle || 'default') + ')');
    return card;
  } catch (e) {
    error('Failed to parse query card: ' + e.message);
    return null;
  }
}

/**
 * Briefly poll for a late-arriving payload and re-apply the correct bundle
 */
var latePayloadHandled = false;
function scheduleLatePayloadRetry(directPayloadFound, initialCard) {
  if (directPayloadFound || latePayloadHandled) return;
  if (!initialCard || initialCard.featureBundle !== 'default') return;

  var start = Date.now();
  var maxWaitMs = 1500;
  var intervalMs = 100;

  function check() {
    if (latePayloadHandled) return;
    if ((Date.now() - start) > maxWaitMs) return;

    var lateCard = getCardFromHash() || getCardFromQuery();
    if (lateCard && lateCard.featureBundle && lateCard.featureBundle !== 'default') {
      latePayloadHandled = true;
      log('Late payload detected, switching bundle to: ' + lateCard.featureBundle);
      tpHud('Late payload: ' + lateCard.featureBundle);
      applyLateCardBundle(lateCard);
      return;
    }

    setTimeout(check, intervalMs);
  }

  setTimeout(check, intervalMs);
}

async function applyLateCardBundle(card) {
  try {
    // Unload current bundle and remove CSS
    await unloadBundle();
    var style = document.getElementById('tp-bundle-css');
    if (style && style.parentNode) style.parentNode.removeChild(style);
    shutdownCards();

    state.currentCard = card;
    applyUserAgentOverride(resolveUserAgentMode(card));
    await applyBundleToPage(card);
  } catch (e) {
    error('Late payload apply failed: ' + e.message);
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
  var needsSave = false;
  
  for (var i = 0; i < apps.length; i++) {
    var card = apps[i];
    if (!card.url) continue;

    // Migrate legacy bundle field if needed
    if (card.bundle && !card.featureBundle) {
      if (card.bundle === 'default') {
        card.featureBundle = null;
      } else {
        card.featureBundle = card.bundle;
      }
      delete card.bundle;
      needsSave = true;
    }
    if (!card.hasOwnProperty('featureBundle')) {
      card.featureBundle = null;
      needsSave = true;
    }
    
    var cardUrl = card.url.toLowerCase().replace(/\/$/, '');
    
    // Check if current URL starts with card URL (handles subpages)
    if (normalizedUrl.indexOf(cardUrl) === 0) {
      if (needsSave) {
        try {
          localStorage.setItem('tp_apps', JSON.stringify(apps));
        } catch (err) {
          // Ignore
        }
      }
      return card;
    }
    
    // Also check if card URL starts with current URL (handles base domain matching)
    if (cardUrl.indexOf(normalizedUrl.split('?')[0].split('#')[0]) === 0) {
      if (needsSave) {
        try {
          localStorage.setItem('tp_apps', JSON.stringify(apps));
        } catch (err) {
          // Ignore
        }
      }
      return card;
    }
  }

  if (needsSave) {
    try {
      localStorage.setItem('tp_apps', JSON.stringify(apps));
    } catch (err) {
      // Ignore
    }
  }
  
  return null;
}

/**
 * Apply bundle directly to the current page
 * @param {Object} card - Card with bundle info
 */
async function applyBundleToPage(card) {
  var bundleName = card.featureBundle || 'default';
  tpHud('Bundle: ' + bundleName);
  var bundle = getBundle(bundleName);
  
  if (!bundle) {
    log('Bundle not found: ' + bundleName + ', using default');
    tpHud('Bundle not found: ' + bundleName);
    bundle = getBundle('default');
  }
  
  if (!bundle) {
    warn('No bundle available');
    tpHud('No bundle available!');
    return;
  }
  
  log('Applying bundle: ' + bundle.name);
  tpHud('Applying: ' + bundle.name);
  state.currentBundle = bundle.name;
  
  // Track active bundle for state management
  setActiveBundle(bundle, card);
  
  // Inject bundle CSS (bundles export as 'style' property)
  var cssContent = bundle.style || '';
  
  // Also check for payload CSS from URL hash/query (untrusted)
  if (card._payload && card._payload.css) {
    log('Adding payload CSS from URL payload');
    var safeCss = sanitizeCss(card._payload.css);
    if (safeCss) {
      cssContent += '\n\n/* Payload CSS */\n' + safeCss;
    } else {
      warn('Payload CSS was empty after sanitization');
    }
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
  
  // Apply global features from preferences (focusStyling, tabindexInjection, etc.)
  log('Applying global features from preferences...');
  applyGlobalFeaturesForCard(card, bundle);
  
  try {
    if (bundle.onAfterLoad) {
      bundle.onAfterLoad(window, card);
    }
  } catch (e) {
    error('onAfterLoad error: ' + e.message);
  }
  
  try {
    if (bundle.onActivate) {
      tpHud('Calling onActivate...');
      bundle.onActivate(window, card);
      tpHud('onActivate done');
    }
  } catch (e) {
    error('onActivate error: ' + e.message);
    tpHud('onActivate ERROR: ' + e.message);
  }
  
  // Initialize card registration system
  // This starts the observer and processes any cards registered by the bundle
  initCards();
  log('Card registration system initialized');
  
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
    '  position: relative;',
    '  cursor: pointer;',
    '  transition: all 0.15s;',
    '  overflow: hidden;',
    '}',
    '.tp-addressbar-url-container:focus {',
    '  outline: none;',
    '  border-color: #00a8ff;',
    '}',
    '.tp-addressbar-url-display {',
    '  position: absolute;',
    '  top: 0;',
    '  left: 0;',
    '  right: 0;',
    '  bottom: 0;',
    '  padding: 0 16px;',
    '  line-height: 50px;',
    '  color: #888;',
    '  font-size: 16px;',
    '  font-family: monospace;',
    '  white-space: nowrap;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    '}',
    '.tp-addressbar-url {',
    '  display: none;',
    '  position: absolute;',
    '  top: 0;',
    '  left: 0;',
    '  right: 0;',
    '  bottom: 0;',
    '  padding: 0 16px;',
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
    '  background: rgba(0,0,0,0.4);',
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
    '.tp-site-hint-text {',
    '  display: flex;',
    '  flex-direction: column;',
    '  line-height: 1.1;',
    '}',
    '.tp-site-hint-sub {',
    '  font-size: 11px;',
    '  color: #aaa;',
    '  opacity: 0.75;',
    '  margin-top: 2px;',
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
    '#tp-diagnostics-header h2 { display: flex; align-items: center; font-size: 20px; font-weight: 500; color: #00a8ff; margin: 0; }',
    '#tp-diagnostics-filter { margin-left: 10px; font-size: 12px; font-weight: normal; color: #888; }',
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
    '#tp-diagnostics-footer { margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; font-size: 14px; color: #666; text-align: right; }',
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
    '<div class="tp-site-hint"><div class="tp-site-hint-key red"></div><div class="tp-site-hint-text"><span>Address</span><span class="tp-site-hint-sub">Hold: Reload</span></div></div>',
    '<div class="tp-site-hint"><div class="tp-site-hint-key green"></div><div class="tp-site-hint-text"><span>Mouse</span><span class="tp-site-hint-sub">Hold: Focus</span></div></div>',
    '<div class="tp-site-hint"><div class="tp-site-hint-key yellow"></div><div class="tp-site-hint-text"><span>Portal</span><span class="tp-site-hint-sub">Hold: Cycle</span></div></div>',
    '<div class="tp-site-hint"><div class="tp-site-hint-key blue"></div><div class="tp-site-hint-text"><span>Console</span><span class="tp-site-hint-sub">Hold: Safe Mode</span></div></div>',
  ].join('');
  // Respect portal preference for color hints visibility
  var portalConfig = configGet('tp_portal') || {};
  if (portalConfig.showHints === false) {
    hints.style.display = 'none';
  }
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
  window.location.href = 'https://alexnolan.github.io/tizenportal/dist/index.html?v=' + encodeURIComponent(VERSION);
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
  var hintSub = null;
  var yellowKey = document.querySelector('#tp-hints .tp-hint-key.yellow');
  if (yellowKey && yellowKey.parentNode) {
    var textContainer = yellowKey.parentNode.querySelector('.tp-hint-text');
    if (textContainer) {
      hintSub = textContainer.querySelector('.tp-hint-sub');
    }
  }

  if (!hintText && !hintSub) return;

  if (isSiteEditorOpen() || isPreferencesOpen()) {
    if (hintText) hintText.textContent = 'Disabled';
    if (hintSub) hintSub.textContent = 'Hold: Disabled';
    return;
  }

  if (hintText) hintText.textContent = 'Preferences';
  if (hintSub) hintSub.textContent = 'Hold: Add Site';
}

/**
 * Refresh portal hint labels (yellow short/long)
 */
function updatePortalHints() {
  updateYellowHint();
}

/**
 * Show/hide the portal color hints
 * @param {boolean} visible
 */
function setPortalHintsVisible(visible) {
  var hints = document.getElementById('tp-hints');
  if (!hints) return;
  var portalConfig = configGet('tp_portal') || {};
  var enabled = portalConfig.showHints !== false;
  var shouldShow = visible && enabled;
  hints.style.display = shouldShow ? 'flex' : 'none';
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

  var trimmedUrl = (card.url || '').trim();
  if (!isValidHttpUrl(trimmedUrl)) {
    error('Cannot load site: invalid URL scheme: ' + card.url);
    return;
  }
  card.url = trimmedUrl;

  log('Navigating to site: ' + card.url);
  var bundleName = card.featureBundle || 'default';
  showToast('Loading ' + (card.name || card.url) + ' (bundle: ' + bundleName + ')...');
  tpHud('Launch: ' + (card.name || card.url) + ' | bundle: ' + bundleName);

  // Store current card in state
  state.currentCard = card;
  
  // Pre-save card to sessionStorage BEFORE navigating.
  // If the target site redirects (e.g. to a login page), the #tp= hash
  // will be stripped. Saving here ensures loadLastCard() can recover it.
  saveLastCard(card);
  
  // Get the bundle for this card
  var bundle = getBundle(bundleName);
  var resolvedUa = resolveUserAgentMode(card);
  
  // Build payload with bundle info: { css, js, ua, bundleName }
  var targetUrl = card.url;
  try {
    var payload = {
      css: '',
      js: '',
      ua: resolvedUa,
      viewportMode: card.hasOwnProperty('viewportMode') ? card.viewportMode : null,
      focusOutlineMode: card.hasOwnProperty('focusOutlineMode') ? card.focusOutlineMode : null,
      bundleOptions: card.bundleOptions || {},
      bundleOptionData: card.bundleOptionData || {}
    };
    
    // NOTE: Do NOT embed bundle CSS in the URL payload.
    // It can exceed URL length limits and cause load failures.
    // Bundles are resolved locally by name at runtime.
    
    // Add bundle JS initialization code (if needed)
    // The bundle object has methods, so we can't directly serialize it
    // Instead, pass bundle name and let the runtime look it up
    payload.bundleName = bundleName;
    payload.cardName = card.name;
    
    // Encode payload
    var json = JSON.stringify(payload);
    var encoded = btoa(unescape(encodeURIComponent(json)));

    // Append to URL query (survives some redirects)
    if (targetUrl.indexOf('?') === -1) {
      targetUrl += '?tp=' + encoded;
    } else {
      targetUrl += '&tp=' + encoded;
    }

    // Append to URL hash (fast path when hash survives)
    if (targetUrl.indexOf('#') === -1) {
      targetUrl += '#tp=' + encoded;
    } else {
      targetUrl += '&tp=' + encoded;
    }
    
    log('Payload size: ' + json.length + ' bytes, encoded: ' + encoded.length);
    tpHud('Payload: ' + json.length + 'b, encoded ' + encoded.length + 'b');
  } catch (e) {
    error('Failed to encode payload: ' + e.message);
    // Continue without hash
  }
  
  log('Final URL: ' + targetUrl.substring(0, 100) + '...');

  if (state.isPortalPage) {
    showLoading('Launching ' + (card.name || card.url) + ' (bundle: ' + bundleName + ')...');
  }

  // Navigate to the site - runtime will handle bundle injection
  // Small delay ensures toast/HUD render before navigation
  setTimeout(function() {
    window.location.href = targetUrl;
  }, 250);
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
    get: configGet,
    set: configSet,
    onChange: configOnChange,
  },

  // Key constants
  keys: KEYS,

  // Input state and handlers
  input: {
    isPointerMode: isPointerActive,
    togglePointer: togglePointer,
    registerKeyHandler: registerKeyHandler,
    isIMEActive: isIMEActive,
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
    setScrollEnabled: setScrollEnabled,
    scrollElementIntoView: scrollElementIntoView,
    setInitialFocus: setInitialFocus,
    lockViewport: lockViewport,
    unlockViewport: unlockViewport,
    observeDOM: observeDOM,
    stopObservingDOM: stopObservingDOM,
  },

  // Card registration system - bundles register selectors, core handles the rest
  cards: {
    register: registerCards,
    unregister: unregisterCards,
    clear: clearRegistrations,
    process: processCards,
    getRegistrations: getRegistrations,
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
  setPortalHintsVisible: setPortalHintsVisible,
  updatePortalHints: updatePortalHints,
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

  // Bundle matcher registration
  registerBundleMatcher: registerBundleMatcher,

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
