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

// Import the new dual-mode spatial navigation library
import '../navigation/spatial-navigation.js';

// Import navigation initialization system
import { 
  initializeNavigationMode, 
  applyNavigationMode, 
  initializeGlobalNavigation,
  getCurrentMode,
  getEffectiveMode,
} from '../navigation/init.js';

// ============================================================================
// APPLICATION MODULES
// ============================================================================

// Import core modules
import { configRead, configWrite, configOnChange, configInit, configGet, configSet } from './config.js';
import { initPolyfills, hasPolyfill, getLoadedPolyfills } from '../polyfills/index.js';
import { KEYS } from '../input/keys.js';
import { initInputHandler, executeColorAction, registerKeyHandler, setBackHandler } from '../input/handler.js';
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
import { loadBundle, unloadBundle, getActiveBundle, getActiveBundleName, handleBundleKeyDown, handleBundleNavigate, setActiveBundle, registerBundleCleanup } from './loader.js';
import { getBundleNames, getBundle, logDependencyWarnings } from '../bundles/registry.js';
import { isValidHttpUrl, sanitizeCss, safeLocalStorageSet, once } from './utils.js';
import { addCard, getCardById } from '../ui/cards.js';
import featureLoader from '../features/index.js';
import textInputProtection from '../features/text-input-protection.js';
import userscriptEngine from '../features/userscripts.js';
import userscriptRegistry from '../features/userscript-registry.js';
import { 
  registerCards, unregisterCards, clearRegistrations, getRegistrations,
  processCards, initCards, shutdownCards 
} from './cards.js';
import {
  registerElements, unregisterElements, clearRegistrations as clearElementRegistrations,
  getRegistrations as getElementRegistrations, processElements,
  initElements, shutdownElements
} from './elements.js';
import {
  navigate,
  focusElement,
  focusFirst,
  focusLast,
  getFocusableElements,
  focusRelative,
  focusNext,
  focusPrevious,
  getCurrentFocus,
  scrollIntoViewIfNeeded,
  setNavigationEnabled,
  isNavigationEnabled,
} from '../navigation/helpers.js';

function registerTvKey(keyName) {
  try {
    if (!window.tizen || !tizen.tvinputdevice) return false;
    if (tizen.tvinputdevice.getKey && !tizen.tvinputdevice.getKey(keyName)) {
      return false;
    }
    tizen.tvinputdevice.registerKey(keyName);
    log('Registered TV key: ' + keyName);
    return true;
  } catch (err) {
    warn('Failed to register TV key ' + keyName + ': ' + err.message);
  }
  return false;
}

function unregisterTvKey(keyName) {
  try {
    if (!window.tizen || !tizen.tvinputdevice) return false;
    if (tizen.tvinputdevice.getKey && !tizen.tvinputdevice.getKey(keyName)) {
      return false;
    }
    tizen.tvinputdevice.unregisterKey(keyName);
    log('Unregistered TV key: ' + keyName);
    return true;
  } catch (err) {
    warn('Failed to unregister TV key ' + keyName + ': ' + err.message);
  }
  return false;
}

var exitKeyRegistered = false;

function setExitKeyCapture(enabled) {
  if (enabled && !exitKeyRegistered) {
    exitKeyRegistered = registerTvKey('Exit');
  } else if (!enabled && exitKeyRegistered) {
    unregisterTvKey('Exit');
    exitKeyRegistered = false;
  }
}

/**
 * TizenPortal version - injected from package.json at build time
 */
const VERSION = '__VERSION__';

/**
 * Base URL of the TizenPortal GitHub Pages deployment
 */
var PORTAL_BASE_URL = 'https://axelnanol.github.io/tizenportal/dist';

/**
 * TizenPortal's own favicon URL — used as a fallback icon for cards
 */
var TIZENPORTAL_FAVICON_URL = PORTAL_BASE_URL + '/assets/favicon.ico';

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
 * Synchronous capture of the URL hash and query string at the exact moment
 * this script is executed.  Target-site SPA routers often call
 * history.replaceState() or modify window.location.hash very early in the
 * page lifecycle, which can silently discard the #tp= / ?tp= payload before
 * TizenPortal's async init() gets a chance to read it.  Capturing the values
 * synchronously here — before any async work — guarantees that the URL
 * parameter injection mechanism remains the authoritative source of card/
 * bundle data regardless of what the host page does to its own URL.
 */
var capturedHash = (function() {
  try { return window.location.hash || ''; } catch(e) { return ''; }
}());
var capturedSearch = (function() {
  try { return window.location.search || ''; } catch(e) { return ''; }
}());

/**
 * Return the URL hash to use for a given payload parameter pattern.
 *
 * Two-phase strategy:
 *  1. If the synchronously captured hash contains the pattern → return it.
 *     This is immune to SPA router rewrites that happen after script load.
 *  2. Otherwise fall back to the live window.location.hash so that payloads
 *     that arrive *after* script load (e.g. via a server redirect that adds
 *     the hash) are still detected.
 *
 * @param {RegExp} requiredPattern - Pattern the hash must contain (e.g. /[#&]tp=/)
 * @returns {string}
 */
function getCapturedHash(requiredPattern) {
  return (capturedHash && requiredPattern.test(capturedHash))
    ? capturedHash
    : (window.location.hash || '');
}

/**
 * Return the URL query string to use for a given payload parameter pattern.
 * Follows the same two-phase strategy as getCapturedHash():
 *  1. Use synchronously captured search when it contains the pattern.
 *  2. Fall back to live window.location.search otherwise.
 *
 * @param {RegExp} requiredPattern - Pattern the search must contain (e.g. /[?&]tp=/)
 * @returns {string}
 */
function getCapturedSearch(requiredPattern) {
  return (capturedSearch && requiredPattern.test(capturedSearch))
    ? capturedSearch
    : (window.location.search || '');
}

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
var builtInMatchersRegistered = false;

/**
 * Persist last matched card for cross-site navigation
 */
var LAST_CARD_KEY = 'tp_last_card';

/**
 * Text input protection state
 */
var textInputObserver = null;
var textInputInterval = null;
var userscriptUrlWatcher = null;

/**
 * Selector for text inputs to wrap (exclude TizenPortal UI inputs)
 */
var TEXT_INPUT_SELECTOR = 'input, textarea';

function resolveFocusOutlineMode(card, bundle) {
  var features = configGet('tp_features') || {};
  var mode = features.focusOutlineMode || 'off';
  
  // Apply bundle manifest default if no card override
  if (bundle && bundle.manifest && bundle.manifest.features && bundle.manifest.features.focusOutlineMode && !card.focusOutlineMode) {
    mode = bundle.manifest.features.focusOutlineMode;
  }
  
  // Card override takes highest priority
  if (card && card.focusOutlineMode) {
    mode = card.focusOutlineMode;
  } else if (card && card.hasOwnProperty('focusStyling') && card.focusStyling === false) {
    mode = 'none';
  } else if (features.focusStyling === false) {
    mode = 'none';
  }
  return mode || 'off';
}

function resolveViewportMode(card, bundle) {
  var manifest = bundle && bundle.manifest;
  // Only force lock when explicitly set to 'force'
  if (manifest && manifest.viewportLock === 'force') {
    return 'locked';
  }

  var features = configGet('tp_features') || {};
  var mode = features.viewportMode || 'locked';
  if (card && card.viewportMode) {
    mode = card.viewportMode;
  }
  
  // If bundle has viewportLock: true (but not 'force'), use as default but allow override
  if (manifest && manifest.viewportLock === true && !card.viewportMode) {
    return 'locked';
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
  if (!card) {
    log('[Config] ' + key + ': null (no card)');
    return null;
  }
  if (card.hasOwnProperty(key) && card[key] !== null && card[key] !== undefined) {
    log('[Config] ' + key + ': ' + JSON.stringify(card[key]) + ' (per-site override)');
    return card[key];
  }
  
  // Fall back to global settings if card doesn't have an override
  // This ensures global preferences (text scale, etc.) apply even without site override
  try {
    var globalConfig = configGet('tp_features') || {};
    if (globalConfig.hasOwnProperty(key)) {
      log('[Config] ' + key + ': ' + JSON.stringify(globalConfig[key]) + ' (global default)');
      return globalConfig[key];
    }
  } catch (err) {
    warn('[Config] Error reading global config for ' + key + ': ' + err.message);
  }
  
  log('[Config] ' + key + ': undefined (no global or site setting)');
  return null;
}

function buildFeatureOverrides(card) {
  var overrides = {};
  var keys = [
    'focusStyling',
    'tabindexInjection',
    'scrollIntoView',
    'safeArea',
    'gpuHints',
    'cssReset',
    'hideScrollbars',
    'wrapTextInputs',
    'focusTransitions',
    'focusTransitionMode',
    'focusTransitionSpeed',
    'navigationFix',
    'textScale',
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
  target.classList.remove('tp-focus-mode-none');

  if (mode === 'high') {
    target.classList.add('tp-focus-mode-high');
  } else if (mode === 'none') {
    target.classList.add('tp-focus-mode-none');
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
  log('[Config] ==== Merged Configuration for ' + (card ? (card.name || card.url) : 'unknown') + ' ====');
  
  var focusMode = resolveFocusOutlineMode(card, bundle);
  var viewportMode = resolveViewportMode(card, bundle);
  var overrides = buildFeatureOverrides(card);
  // Only set focusOutlineMode in overrides after bundle features are merged
  
  // Apply bundle manifest feature overrides
  // Priority: card overrides > bundle defaults > global config
  if (bundle && bundle.manifest && bundle.manifest.features) {
    log('[Config] Bundle ' + (bundle.name || 'unknown') + ' defines features: ' + JSON.stringify(bundle.manifest.features));
    var bundleFeatures = bundle.manifest.features;
    for (var key in bundleFeatures) {
      if (bundleFeatures.hasOwnProperty(key)) {
        // Only apply if card hasn't already overridden it
        if (!overrides.hasOwnProperty(key)) {
          log('[Config] Applying bundle feature ' + key + ': ' + bundleFeatures[key]);
          overrides[key] = bundleFeatures[key];
        }
      }
    }
  }
  
  // Set focusOutlineMode after bundle features (already resolved with priority)
  overrides.focusOutlineMode = focusMode;

  log('[Config] Final merged config to apply: ' + JSON.stringify(overrides));
  log('[Config] ================================================');
  
  try {
    featureLoader.applyFeatures(document, overrides);
    log('[Feature] Features applied successfully');
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
      cardId: card.id || null,
      name: card.name || '',
      url: card.url || '',
      featureBundle: featureBundle || 'default',
      viewportMode: card.hasOwnProperty('viewportMode') ? card.viewportMode : null,
      focusOutlineMode: card.hasOwnProperty('focusOutlineMode') ? card.focusOutlineMode : null,
      focusStyling: card.hasOwnProperty('focusStyling') ? card.focusStyling : null,
      userAgent: resolvedUserAgent,
      tabindexInjection: card.hasOwnProperty('tabindexInjection') ? card.tabindexInjection : null,
      scrollIntoView: card.hasOwnProperty('scrollIntoView') ? card.scrollIntoView : null,
      safeArea: card.hasOwnProperty('safeArea') ? card.safeArea : null,
      gpuHints: card.hasOwnProperty('gpuHints') ? card.gpuHints : null,
      cssReset: card.hasOwnProperty('cssReset') ? card.cssReset : null,
      hideScrollbars: card.hasOwnProperty('hideScrollbars') ? card.hideScrollbars : null,
      wrapTextInputs: card.hasOwnProperty('wrapTextInputs') ? card.wrapTextInputs : null,
      focusTransitions: card.hasOwnProperty('focusTransitions') ? card.focusTransitions : null,
      focusTransitionMode: card.hasOwnProperty('focusTransitionMode') ? card.focusTransitionMode : null,
      focusTransitionSpeed: card.hasOwnProperty('focusTransitionSpeed') ? card.focusTransitionSpeed : null,
      navigationFix: card.hasOwnProperty('navigationFix') ? card.navigationFix : null,
      textScale: card.hasOwnProperty('textScale') ? card.textScale : null,
      icon: card.icon || null,
      bundleOptions: card.bundleOptions || {},
      bundleOptionData: card.bundleOptionData || {},
      userscripts: card.userscripts || [],
      userscriptToggles: card.userscriptToggles || {},
      bundleUserscriptToggles: card.bundleUserscriptToggles || {},
      globalUserscripts: userscriptEngine.getGlobalUserscriptsForPayload(),
      crossHistory: card.crossHistory || [],
      crossForward: card.crossForward || [],
    };
    var json = JSON.stringify(payload);
    sessionStorage.setItem(LAST_CARD_KEY, json);
    // Note: window.name is no longer used. All cross-origin navigations
    // must route through the portal via the link interceptor and crossnav relay.
  } catch (err) {
    // Ignore
  }
}

/**
 * Load card from sessionStorage (same-origin fallback).
 * When navigating within the same origin, sessionStorage contains
 * the previously loaded card config from saveLastCard().
 */
function loadLastCard() {
  try {
    var stored = sessionStorage.getItem(LAST_CARD_KEY);
    if (!stored) return null;
    var card = JSON.parse(stored);
    if (!card) return null;
    // saveLastCard() stores the card id as 'cardId', not 'id'.
    // Normalise so that state.currentCard.id is always set, which is
    // required for installLinkInterceptor() to intercept cross-origin
    // links and route them through the portal relay.
    if (!card.id && card.cardId) card.id = card.cardId;
    return card;
  } catch (err) {
    return null;
  }
}

function startTextInputProtection() {
  textInputProtection.apply(document);
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
  textInputProtection.remove(document);
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

function registerBuiltInMatchers() {
  if (builtInMatchersRegistered) return;
  builtInMatchersRegistered = true;

  // Audiobookshelf matcher (used when payload is missing)
  registerBundleMatcher({
    bundleName: 'audiobookshelf',
    titleContains: ['audiobookshelf'],
    selectors: ['#siderail-buttons-container', '#appbar', '#mediaPlayerContainer'],
    match: function() {
      try {
        var loc = window.location || {};
        var port = loc.port || '';
        if (port === '13378') return true;
        var host = loc.host || '';
        if (host.indexOf(':13378') !== -1) return true;
        var href = loc.href || '';
        return href.indexOf(':13378') !== -1;
      } catch (e) {
        return false;
      }
    }
  });
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

    // Register built-in matchers for payload-less detection
    registerBuiltInMatchers();

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

  } catch (err) {
    error('Initialization failed: ' + err.message);
    console.error(err);
  }
}

/**
 * Initialize when on the portal page
 */
async function initPortalPage() {
  // Check for a cross-site navigation relay request from a target site.
  // installLinkInterceptor() sends the browser here with #crossnav=BASE64({cardId, targetUrl, history, forward})
  // so the portal can look up the full card config from its localStorage and
  // call loadSite() directly — no script source is ever embedded in the URL.
  try {
    // Use the captured hash so that any JS running before initPortalPage()
    // cannot discard the crossnav payload by modifying window.location.hash.
    var hash = getCapturedHash(/[#&]crossnav=/);
    var crossnavMatch = hash.match(/[#&]crossnav=([^&]+)/);
    if (crossnavMatch) {
      var nav = JSON.parse(decodeURIComponent(escape(atob(crossnavMatch[1]))));
      if (nav && nav.cardId && nav.targetUrl && isValidHttpUrl(nav.targetUrl)) {
        var relayCard = getCardById(nav.cardId);
        if (relayCard) {
          // Build a launch card: use all settings from the stored card but
          // navigate to the target URL and carry the history/forward stacks.
          // IMPORTANT: Override featureBundle with the one from crossnav payload
          // to preserve the originating site's bundle across the relay.
          var launchCard = Object.assign({}, relayCard, {
            url: nav.targetUrl,
            crossHistory: nav.history || [],
            crossForward: nav.forward || [],
            featureBundle: nav.bundleName || relayCard.featureBundle || 'default'
          });
          log('Cross-site relay: card=' + nav.cardId + ' → ' + nav.targetUrl +
              ' (history depth ' + launchCard.crossHistory.length + ')');
          try {
            history.replaceState(null, '', window.location.href.replace(/[#&]crossnav=[^&]*/g, '').replace(/#$/, ''));
          } catch (e) { /* ignore */ }
          // Hide portal UI to avoid a flash during the relay transition
          try { if (document.body) document.body.style.visibility = 'hidden'; } catch (e) { /* ignore */ }
          loadSite(launchCard);
          return; // Skip normal portal initialisation
        } else {
          warn('Cross-site relay: card not found: ' + nav.cardId);
        }
      }
    }
  } catch (e) {
    warn('Failed to process crossnav relay: ' + e.message);
  }

  // Check for a pending card addition passed via URL from a target site.
  // addCurrentSiteAndReturn() encodes the card as #addcard=BASE64(JSON) so
  // that the card is added to the portal's own localStorage (correct origin).
  try {
    var hash = getCapturedHash(/[#&]addcard=/);
    var addCardMatch = hash.match(/[#&]addcard=([^&]+)/);
    if (addCardMatch) {
      var cardData = JSON.parse(decodeURIComponent(escape(atob(addCardMatch[1]))));
      addCard(cardData);
      log('Card added from URL parameter: ' + (cardData.name || cardData.url));
      // Clean up the hash so it doesn't persist on refresh
      try {
        history.replaceState(null, '', window.location.href.replace(/[#&]addcard=[^&]*/g, '').replace(/[?&]#/, '#').replace(/[?&]$/, '').replace(/#$/, ''));
      } catch (e) { /* ignore */ }
    }
  } catch (e) {
    warn('Failed to process pending card from URL: ' + e.message);
  }

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

  // Apply global feature settings to portal page (textScale, focusTransitions, etc.)
  try {
    log('Applying global features to portal page');
    featureLoader.applyFeatures(document, {
      focusStyling: false,
      focusOutlineMode: 'off',
    });
  } catch (e) {
    warn('Failed to apply features to portal: ' + e.message);
  }

  // Initialize and render portal UI (card grid)
  initPortal();
  log('Portal UI initialized');

  // Initialize color button hints (make clickable)
  initColorHints();
  log('Color hints initialized');
  
  // Initialize navigation mode for portal
  try {
    log('Initializing navigation mode for portal...');
    initializeGlobalNavigation();
  } catch (e) {
    error('Failed to initialize navigation mode: ' + e.message);
  }
}

/**
 * Wait briefly for #tp= or ?tp= payload to appear in the URL
 */
function waitForPayload(maxWaitMs, intervalMs) {
  return new Promise(function(resolve) {
    var start = Date.now();
    var interval = intervalMs || 50;

    function hasPayload() {
      // Check the captured values first (immune to SPA router rewrites),
      // then fall back to the live location for any late-arriving payload.
      var hash = getCapturedHash(/[#&]tp=/);
      var search = getCapturedSearch(/[?&]tp=/);
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

  // Apply portal theme to target sites (dark mode)
  try {
    applyPortalPreferences();
  } catch (e) {
    warn('Failed to apply site theme: ' + e.message);
  }

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

  // Fallback: reuse last card from session (same-origin navigations only).
  // When navigating within the same origin (e.g. SPA page loads), sessionStorage
  // contains the previously loaded card config. For cross-origin navigations,
  // everything must come via the portal with a #tp= payload (no sessionStorage).
  if (!matchedCard) {
    var lastCard = loadLastCard();
    if (lastCard) {
      // Verify this is a same-origin session reuse, not a cross-origin leak
      var lastOrigin = (lastCard.url || '').split('/').slice(0, 3).join('/');
      var currentOrigin = window.location.href.split('/').slice(0, 3).join('/');
      if (lastOrigin === currentOrigin) {
        matchedCard = Object.assign({}, lastCard, {
          url: window.location.href,
          name: lastCard.name || document.title || 'Unknown Site'
        });
        log('Using last card bundle (same-origin): ' + (matchedCard.featureBundle || 'default'));
        tpHud('Card (session): ' + (matchedCard.name || 'Last Card'));
      } else {
        log('Session card origin mismatch; not reusing (last: ' + lastOrigin + ', current: ' + currentOrigin + ')');
      }
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

  installCardPersistenceHooks();

  applyUserAgentOverride(resolveUserAgentMode(matchedCard));

  // Apply bundle to the current page
  tpHud('Applying bundle...');
  await applyBundleToPage(matchedCard);

  // Re-apply userscripts when SPA navigation changes the URL
  startUserscriptUrlWatcher();

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

function installCardPersistenceHooks() {
  if (state.isPortalPage) return;
  if (installCardPersistenceHooks._installed) return;
  installCardPersistenceHooks._installed = true;

  function persistCard() {
    if (!state.currentCard) return;
    try {
      saveLastCard(state.currentCard);
    } catch (e) {
      // Ignore persistence failures during unload
    }
  }

  window.addEventListener('beforeunload', persistCard);
  window.addEventListener('pagehide', persistCard);

  // Route cross-origin link clicks through the portal so the portal can look
  // up the full card config from its localStorage and inject it correctly.
  installLinkInterceptor();

  // Intercept BACK key when there is a cross-site navigation history stack.
  setBackHandler(function(event) {
    if (!state.currentCard) return false;
    var crossHistory = state.currentCard.crossHistory;
    if (!crossHistory || !crossHistory.length) return false;

    var newHistory = crossHistory.slice(0, -1);
    var prevUrl = crossHistory[crossHistory.length - 1];
    var forward = (state.currentCard.crossForward || []).slice();
    forward.unshift(getCleanCurrentUrl());

    var relayBundleName = state.currentBundle || state.currentCard.featureBundle || 'default';
    var portalUrl = buildCrossNavUrl(state.currentCard.id, prevUrl, newHistory, forward, relayBundleName);
    if (!portalUrl) return false;

    window.location.href = portalUrl;
    return true;
  });
}

/**
 * Return the current page URL stripped of any tp= / crossnav= parameters
 * so that clean URLs are stored in the cross-site navigation history.
 */
function getCleanCurrentUrl() {
  try {
    var href = window.location.href;
    // Remove tp= from query string (?tp=VALUE or &tp=VALUE)
    href = href.replace(/([?&])tp=[^&#]*(&?)/, function(m, pre, post) {
      if (pre === '?' && post) return '?';
      if (pre === '?' && !post) return '';
      return post ? pre : '';
    }).replace(/[?&]$/, '');
    // Remove tp= from hash (tp= may be the first or any subsequent hash param)
    var hashIdx = href.indexOf('#');
    if (hashIdx !== -1) {
      var base = href.substring(0, hashIdx);
      var frag = href.substring(hashIdx + 1)
        .split('&')
        .filter(function(part) { return part.indexOf('tp=') !== 0; })
        .join('&');
      href = frag ? base + '#' + frag : base;
    }
    return href;
  } catch (e) {
    return window.location.href;
  }
}

/**
 * Build a portal relay URL for cross-site navigation.
 * The portal reads the crossnav hash, looks up the card by ID from its
 * localStorage (which has the complete config), and calls loadSite().
 * The bundleName is also passed to ensure the originating bundle is preserved
 * even if the card lookup returns a different bundle setting.
 * @param {string} cardId - ID of the card whose settings should apply
 * @param {string} targetUrl - Destination URL
 * @param {Array} history - URLs visited before targetUrl (for back navigation)
 * @param {Array} forward - URLs visited after (populated when going back)
 * @param {string} bundleName - Current bundle name to preserve across navigation
 * @returns {string} Portal relay URL, or empty string on failure
 */
function buildCrossNavUrl(cardId, targetUrl, history, forward, bundleName) {
  if (!cardId || !targetUrl) return '';
  try {
    var nav = {
      cardId: cardId,
      targetUrl: targetUrl,
      history: history || [],
      forward: forward || [],
      bundleName: bundleName || 'default'
    };
    var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(nav))));
    return PORTAL_BASE_URL + '/index.html?v=' + encodeURIComponent(VERSION) + '#crossnav=' + encoded;
  } catch (e) {
    warn('buildCrossNavUrl failed: ' + e.message);
    return '';
  }
}

/**
 * Intercept cross-origin anchor clicks and route them through the portal.
 * The portal looks up the card by ID from its own localStorage, merges the
 * complete configuration (features + all userscripts), and launches the
 * target URL via loadSite() — keeping everything in one consistent place.
 */
function installLinkInterceptor() {
  if (installLinkInterceptor._installed) return;
  installLinkInterceptor._installed = true;

  document.addEventListener('click', function(e) {
    if (!state.currentCard || !state.currentCard.id) return;

    // Find the closest anchor element (Element.closest is available since Chrome 41)
    var el = e.target && typeof e.target.closest === 'function'
      ? e.target.closest('a')
      : (function() {
          var node = e.target;
          while (node && node !== document) {
            if (node.tagName && node.tagName.toUpperCase() === 'A') return node;
            node = node.parentElement;
          }
          return null;
        })();
    if (!el) return;

    // Skip hash-only or empty links (same-page scroll, no navigation)
    var attr = el.getAttribute('href') || '';
    if (!attr || attr.charAt(0) === '#') return;

    // Get the resolved absolute URL
    var resolvedHref = el.href;
    if (!resolvedHref) return;

    // Only handle http/https links
    if (resolvedHref.indexOf('http://') !== 0 && resolvedHref.indexOf('https://') !== 0) return;

    // Skip if already a portal URL (avoid relay loops)
    if (resolvedHref.indexOf(PORTAL_BASE_URL) === 0) return;

    // Only intercept cross-origin navigation; same-origin is handled by sessionStorage
    var currentBase = window.location.protocol + '//' + window.location.host;
    if (
      resolvedHref === currentBase ||
      resolvedHref.indexOf(currentBase + '/') === 0 ||
      resolvedHref.indexOf(currentBase + '?') === 0 ||
      resolvedHref.indexOf(currentBase + '#') === 0
    ) {
      return;
    }

    // Build history: add current page to the back stack
    var crossHistory = (state.currentCard.crossHistory || []).slice();
    crossHistory.push(getCleanCurrentUrl());

    var relayBundleName = state.currentBundle || state.currentCard.featureBundle || 'default';
    var portalUrl = buildCrossNavUrl(state.currentCard.id, resolvedHref, crossHistory, [], relayBundleName);
    if (!portalUrl) return;

    e.preventDefault();
    e.stopPropagation();
    window.location.href = portalUrl;
    log('Cross-origin link intercepted: routing via portal to ' + resolvedHref);
  }, true); // Capture phase so we run before site handlers
}


/**
 * Re-apply userscripts and notify the active bundle when the URL changes on
 * SPA navigations.  Polling runs every 500 ms; popstate covers back/forward.
 */
function startUserscriptUrlWatcher() {
  if (userscriptUrlWatcher) return;

  var lastUrl = window.location.href;

  function onUrlChange() {
    try {
      var currentUrl = window.location.href;
      if (currentUrl === lastUrl) return;
      lastUrl = currentUrl;

      if (state.currentCard) {
        state.currentCard.url = currentUrl;
        saveLastCard(state.currentCard);
      }

      // Notify the active bundle of the navigation event.
      try {
        handleBundleNavigate(currentUrl);
      } catch (navErr) {
        warn('Bundle onNavigate failed: ' + navErr.message);
      }

      try {
        var bundle = getBundle(state.currentBundle || 'default');
        registerPayloadUserscripts(state.currentCard);
        userscriptEngine.applyUserscripts(state.currentCard, bundle);
        log('Userscripts re-applied after URL change');
      } catch (err) {
        warn('Userscripts re-apply failed: ' + err.message);
      }
    } catch (err2) {
      // Ignore
    }
  }

  // Poll for programmatic navigation (pushState / replaceState)
  var intervalId = setInterval(onUrlChange, 500);

  // Also respond immediately to popstate (browser back/forward)
  window.addEventListener('popstate', onUrlChange);

  // Store both the interval ID and the popstate handler so the watcher can
  // be fully torn down if needed.
  userscriptUrlWatcher = {
    intervalId: intervalId,
    popstateHandler: onUrlChange,
    stop: function() {
      clearInterval(intervalId);
      window.removeEventListener('popstate', onUrlChange);
      userscriptUrlWatcher = null;
    }
  };
}

/**
 * Extract card config from URL hash
 * Format: #tp=BASE64(JSON) or &tp=BASE64(JSON)
 * Payload format: { css, js, bundleName, cardName, ua }
 * @returns {Object|null} Card object or null
 */
function getCardFromHash() {
  try {
    // Prefer the synchronously captured hash so that SPA routers that
    // rewrite window.location.hash before our async init() runs cannot
    // discard the #tp= payload.  Fall back to the live value when the
    // captured hash contains no tp= (e.g. on pages loaded without a relay).
    var hash = getCapturedHash(/[#&]tp=/);
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
      id: payload.cardId || null,
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
      focusStyling: payload.hasOwnProperty('focusStyling') ? payload.focusStyling : null,
      focusTransitions: payload.hasOwnProperty('focusTransitions') ? payload.focusTransitions : null,
      focusTransitionMode: payload.hasOwnProperty('focusTransitionMode') ? payload.focusTransitionMode : null,
      focusTransitionSpeed: payload.hasOwnProperty('focusTransitionSpeed') ? payload.focusTransitionSpeed : null,
      navigationFix: payload.hasOwnProperty('navigationFix') ? payload.navigationFix : null,
      navigationMode: payload.hasOwnProperty('navigationMode') ? payload.navigationMode : null,
      textScale: payload.hasOwnProperty('textScale') ? payload.textScale : null,
      bundleOptions: payload.bundleOptions || {},
      bundleOptionData: payload.bundleOptionData || {},
      userscriptToggles: payload.userscriptToggles || {},
      bundleUserscriptToggles: payload.bundleUserscriptToggles || {},
      userscripts: payload.userscripts || [],
      globalUserscripts: payload.globalUserscripts || [],
      crossHistory: payload.crossHistory || [],
      crossForward: payload.crossForward || [],
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

  if (typeof payload.cardId === 'string') {
    normalized.cardId = payload.cardId;
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

  if (typeof payload.focusStyling === 'boolean') {
    normalized.focusStyling = payload.focusStyling;
  }

  if (typeof payload.tabindexInjection === 'boolean') normalized.tabindexInjection = payload.tabindexInjection;
  if (typeof payload.scrollIntoView === 'boolean') normalized.scrollIntoView = payload.scrollIntoView;
  if (typeof payload.navigationFix === 'boolean') normalized.navigationFix = payload.navigationFix;
  if (typeof payload.safeArea === 'boolean') normalized.safeArea = payload.safeArea;
  if (typeof payload.gpuHints === 'boolean') normalized.gpuHints = payload.gpuHints;
  if (typeof payload.cssReset === 'boolean') normalized.cssReset = payload.cssReset;
  if (typeof payload.hideScrollbars === 'boolean') normalized.hideScrollbars = payload.hideScrollbars;
  if (typeof payload.wrapTextInputs === 'boolean') normalized.wrapTextInputs = payload.wrapTextInputs;
  if (typeof payload.focusTransitions === 'boolean') normalized.focusTransitions = payload.focusTransitions;
  if (typeof payload.focusTransitionMode === 'string') normalized.focusTransitionMode = payload.focusTransitionMode;
  if (typeof payload.focusTransitionSpeed === 'string') normalized.focusTransitionSpeed = payload.focusTransitionSpeed;
  if (typeof payload.navigationMode === 'string') normalized.navigationMode = payload.navigationMode;
  if (typeof payload.textScale === 'string') normalized.textScale = payload.textScale;

  if (payload.bundleOptions && typeof payload.bundleOptions === 'object' && !Array.isArray(payload.bundleOptions)) {
    normalized.bundleOptions = payload.bundleOptions;
  }

  if (payload.bundleOptionData && typeof payload.bundleOptionData === 'object' && !Array.isArray(payload.bundleOptionData)) {
    normalized.bundleOptionData = payload.bundleOptionData;
  }

  if (payload.userscriptToggles && typeof payload.userscriptToggles === 'object' && !Array.isArray(payload.userscriptToggles)) {
    normalized.userscriptToggles = payload.userscriptToggles;
  }

  if (payload.bundleUserscriptToggles && typeof payload.bundleUserscriptToggles === 'object' && !Array.isArray(payload.bundleUserscriptToggles)) {
    normalized.bundleUserscriptToggles = payload.bundleUserscriptToggles;
  }

  if (payload.userscripts && Array.isArray(payload.userscripts)) {
    normalized.userscripts = payload.userscripts;
  }

  if (payload.globalUserscripts && Array.isArray(payload.globalUserscripts)) {
    normalized.globalUserscripts = payload.globalUserscripts;
  }

  if (payload.crossHistory && Array.isArray(payload.crossHistory)) {
    normalized.crossHistory = payload.crossHistory;
  }

  if (payload.crossForward && Array.isArray(payload.crossForward)) {
    normalized.crossForward = payload.crossForward;
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
    // Prefer the synchronously captured search string for the same reason as
    // getCardFromHash(): site JS may clean up the query before init() runs.
    var search = getCapturedSearch(/[?&]tp=/);
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
      id: payload.cardId || null,
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
      focusStyling: payload.hasOwnProperty('focusStyling') ? payload.focusStyling : null,
      focusTransitions: payload.hasOwnProperty('focusTransitions') ? payload.focusTransitions : null,
      focusTransitionMode: payload.hasOwnProperty('focusTransitionMode') ? payload.focusTransitionMode : null,
      focusTransitionSpeed: payload.hasOwnProperty('focusTransitionSpeed') ? payload.focusTransitionSpeed : null,
      navigationFix: payload.hasOwnProperty('navigationFix') ? payload.navigationFix : null,
      navigationMode: payload.hasOwnProperty('navigationMode') ? payload.navigationMode : null,
      textScale: payload.hasOwnProperty('textScale') ? payload.textScale : null,
      bundleOptions: payload.bundleOptions || {},
      bundleOptionData: payload.bundleOptionData || {},
      userscriptToggles: payload.userscriptToggles || {},
      bundleUserscriptToggles: payload.bundleUserscriptToggles || {},
      userscripts: payload.userscripts || [],
      globalUserscripts: payload.globalUserscripts || [],
      crossHistory: payload.crossHistory || [],
      crossForward: payload.crossForward || [],
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
    shutdownElements();
    featureLoader.resetBundleNavigableSelectors();

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
        var result = safeLocalStorageSet('tp_apps', JSON.stringify(apps));
        if (!result.success) {
          warn('Failed to save last card: ' + result.message);
        }
      }
      return card;
    }
    
    // Also check if card URL starts with current URL (handles base domain matching)
    if (cardUrl.indexOf(normalizedUrl.split('?')[0].split('#')[0]) === 0) {
      if (needsSave) {
        var result = safeLocalStorageSet('tp_apps', JSON.stringify(apps));
        if (!result.success) {
          warn('Failed to save last card: ' + result.message);
        }
      }
      return card;
    }
  }

  if (needsSave) {
    var result = safeLocalStorageSet('tp_apps', JSON.stringify(apps));
    if (!result.success) {
      warn('Failed to save last card: ' + result.message);
    }
  }
  
  return null;
}

/**
 * Register globalUserscripts from payload with the Registry
 * This ensures payload userscripts are available when applyUserscripts() queries the Registry
 * @param {Object} card - Card with _payload.globalUserscripts
 */
function registerPayloadUserscripts(card) {
  if (!card || !card._payload || !Array.isArray(card._payload.globalUserscripts)) {
    return;
  }

  var globalUserscripts = card._payload.globalUserscripts;
  log('Registering ' + globalUserscripts.length + ' payload global userscripts');

  for (var i = 0; i < globalUserscripts.length; i++) {
    var script = globalUserscripts[i];
    if (!script || !script.id) {
      warn('Skipping invalid payload userscript (no ID)');
      continue;
    }

    // Check if already registered
    var existing = userscriptRegistry.getUserscriptById(script.id);
    if (existing) {
      log('Userscript already registered: ' + script.id);
      
      // Ensure the script is marked as enabled since it came from payload
      userscriptEngine.setGlobalUserscriptEnabled(script.id, true);
      continue;
    }

    // Register with the unified Registry
    var registered = userscriptRegistry.registry.register({
      id: script.id,
      type: userscriptRegistry.registry.ITEM_TYPES.USERSCRIPT,
      name: script.name || script.id,
      displayName: script.name || script.id,
      category: script.category || 'experimental',
      description: script.description || 'Global userscript from payload',
      defaultEnabled: false, // Payload scripts are already filtered to enabled ones
      source: script.source || 'inline',
      inline: script.inline || null,
      url: script.url || null,
      provides: script.provides || [],
    });

    if (registered) {
      log('Registered payload userscript: ' + script.id);
      
      // Mark as enabled since it came from the payload (which only includes enabled scripts)
      userscriptEngine.setGlobalUserscriptEnabled(script.id, true);
    } else {
      warn('Failed to register payload userscript: ' + script.id);
    }
  }
}

/**
 * Apply bundle directly to the current page
 * @param {Object} card - Card with bundle info
 */
async function applyBundleToPage(card) {
  var bundleName = card.featureBundle || 'default';
  tpHud('Bundle: ' + bundleName);
  log('Applying bundle for card: ' + card.name + ', bundle: ' + bundleName);
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
  
  var appliedBundleName = bundleName;
  log('Applying bundle: ' + (bundle.name || appliedBundleName));
  tpHud('Applying: ' + (bundle.name || appliedBundleName));
  state.currentBundle = appliedBundleName;
  
  // Log manifest info if available
  if (bundle.manifest) {
    log('Bundle manifest loaded: v' + bundle.manifest.version);
    if (bundle.manifest.navigationMode) {
      log('Bundle navigation mode: ' + (typeof bundle.manifest.navigationMode === 'object' 
        ? bundle.manifest.navigationMode.mode 
        : bundle.manifest.navigationMode));
    }
    if (bundle.manifest.viewportLock !== undefined) {
      log('Bundle viewportLock: ' + bundle.manifest.viewportLock);
    }
    if (bundle.manifest.options && bundle.manifest.options.length > 0) {
      log('Bundle has ' + bundle.manifest.options.length + ' configurable options');
    }
    if (bundle.manifest.features) {
      log('Bundle has feature overrides: ' + Object.keys(bundle.manifest.features).join(', '));
    }
    if (bundle.manifest.provides && bundle.manifest.provides.length > 0) {
      log('Bundle provides: ' + bundle.manifest.provides.join(', '));
    }
    
    // Check and log dependencies
    logDependencyWarnings(bundle.name);
  } else {
    warn('Bundle has no manifest (legacy bundle)');
  }
  
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
  
  // Call lifecycle hooks
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

  // Apply navigation mode based on bundle preferences, site override, and global config
  try {
    log('Initializing navigation mode for site...');
    applyNavigationMode(card, bundle);
  } catch (e) {
    error('Navigation mode initialization error: ' + e.message);
  }

  // Register any global userscripts from payload before applying
  try {
    registerPayloadUserscripts(card);
  } catch (e3) {
    error('Payload userscript registration error: ' + e3.message);
  }

  try {
    userscriptEngine.applyUserscripts(card, bundle);
  } catch (e2) {
    error('Userscripts error: ' + e2.message);
  }
  
  // Initialize card registration system
  // This starts the observer and processes any cards registered by the bundle
  initCards();
  log('Card registration system initialized');
  
  // Initialize element registration system
  initElements();
  log('Element registration system initialized');
  
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
    '/* Pointer cursor - Samsung Tizen-style circular cursor */',
    '.tp-pointer {',
    '  position: fixed;',
    '  width: 28px;',
    '  height: 28px;',
    '  pointer-events: none;',
    '  z-index: 2147483647;',
    '  opacity: 0;',
    '  transition: opacity 0.15s;',
    '  transform: translate(-50%, -50%);',
    '}',
    '.tp-pointer.visible { opacity: 1; }',
    '.tp-pointer-cursor {',
    '  width: 28px;',
    '  height: 28px;',
    '  position: relative;',
    '}',
    '.tp-pointer-cursor::before {',
    '  content: "";',
    '  position: absolute;',
    '  top: 0;',
    '  left: 0;',
    '  width: 28px;',
    '  height: 28px;',
    '  background: rgba(255, 255, 255, 0.95);',
    '  border: 3px solid #00a8ff;',
    '  border-radius: 50%;',
    '  box-shadow: 0 0 8px rgba(0, 168, 255, 0.6), 0 0 16px rgba(0, 168, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.5);',
    '  transition: transform 0.1s ease, box-shadow 0.1s ease;',
    '}',
    '.tp-pointer.moving .tp-pointer-cursor::before {',
    '  box-shadow: 0 0 10px rgba(0, 168, 255, 0.8), 0 0 20px rgba(0, 168, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.5);',
    '}',
    '.tp-pointer.clicking .tp-pointer-cursor::before {',
    '  transform: scale(1.3);',
    '  background: rgba(0, 168, 255, 0.9);',
    '  box-shadow: 0 0 12px rgba(0, 168, 255, 1), 0 0 24px rgba(0, 168, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5);',
    '}',
    '.tp-pointer-hover {',
    '  outline: 2px dashed rgba(0, 168, 255, 0.8) !important;',
    '  outline-offset: 4px;',
    '  background: rgba(0, 168, 255, 0.05) !important;',
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
    '  top: auto;',
    '  right: auto;',
    '  display: -webkit-box;',
    '  display: -webkit-flex;',
    '  display: flex;',
    '  background: rgba(0,0,0,0.4);',
    '  padding: 12px 24px;',
    '  border-radius: 12px;',
    '  z-index: 2147483640;',
    '  pointer-events: auto;',
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
    '<div class="tp-site-hint"><div class="tp-site-hint-key yellow"></div><div class="tp-site-hint-text"><span>Portal</span><span class="tp-site-hint-sub">Hold: Add Site</span></div></div>',
    '<div class="tp-site-hint"><div class="tp-site-hint-key blue"></div><div class="tp-site-hint-text"><span>Console</span><span class="tp-site-hint-sub">Hold: Safe Mode</span></div></div>',
  ].join('');
  var portalConfig = configGet('tp_portal') || {};
  var hintPosition = resolveHintsPosition(portalConfig);
  applyHintsPosition(hints, hintPosition);
  if (hintPosition === 'off') {
    hints.style.display = 'none';
  }
  document.body.appendChild(hints);

  // Define click actions: color -> { short, long }
  var siteHintConfig = {
    'red':    { short: 'addressbar',  long: 'reload' },
    'green':  { short: 'pointerMode', long: 'focusHighlight' },
    'yellow': { short: 'preferences', long: 'addSite' },
    'blue':   { short: 'diagnostics', long: 'safeMode' }
  };

  var hintElements = hints.querySelectorAll('.tp-site-hint');
  for (var i = 0; i < hintElements.length; i++) {
    var hint = hintElements[i];
    var keyEl = hint.querySelector('.tp-site-hint-key');
    if (!keyEl) continue;

    var color = null;
    if (keyEl.classList.contains('red')) color = 'red';
    else if (keyEl.classList.contains('green')) color = 'green';
    else if (keyEl.classList.contains('yellow')) color = 'yellow';
    else if (keyEl.classList.contains('blue')) color = 'blue';

    if (!color || !siteHintConfig[color]) continue;

    var cfg = siteHintConfig[color];

    hint.setAttribute('data-action', cfg.short);
    hint.style.cursor = 'pointer';

    // Short-press click on the whole hint element
    hint.addEventListener('click', function(e) {
      if (e.target && e.target.classList.contains('tp-site-hint-sub')) return;
      var action = this.getAttribute('data-action');
      if (action) {
        executeColorAction(action);
      }
    });

    // Long-press click on the sub-text element
    var subEl = hint.querySelector('.tp-site-hint-sub');
    if (subEl && cfg.long) {
      subEl.setAttribute('data-action', cfg.long);
      subEl.style.cursor = 'pointer';
      subEl.addEventListener('click', function(e) {
        e.stopPropagation();
        var action = this.getAttribute('data-action');
        if (action) {
          executeColorAction(action);
        }
      });
    }

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
  window.location.href = PORTAL_BASE_URL + '/index.html?v=' + encodeURIComponent(VERSION);
}

/**
 * Add the current site as a portal card and return to portal.
 * Reads URL, document title, and favicon from the current page.
 */
function addCurrentSiteAndReturn() {
  var encoded = null;
  try {
    // Get current URL, stripping any tp= payload parameters from both query string and hash
    var href = window.location.href;
    var hashIndex = href.indexOf('#');
    var baseAndQuery = hashIndex === -1 ? href : href.substring(0, hashIndex);
    var hashPart = hashIndex === -1 ? '' : href.substring(hashIndex);

    // Remove tp= from hash fragment (#tp=... or &tp=...)
    if (hashPart) {
      hashPart = hashPart.replace(/^#tp=[^&]*/g, '').replace(/&tp=[^&]*/g, '');
      if (hashPart === '#' || hashPart === '') {
        hashPart = '';
      }
    }

    // Remove tp= from query string (?tp=... or &tp=...)
    var qIndex = baseAndQuery.indexOf('?');
    var baseOnly = baseAndQuery;
    var queryString = '';
    if (qIndex !== -1) {
      baseOnly = baseAndQuery.substring(0, qIndex);
      queryString = baseAndQuery.substring(qIndex + 1);
      if (queryString) {
        var parts = queryString.split('&');
        var cleanedParts = [];
        for (var p = 0; p < parts.length; p++) {
          if (parts[p] && parts[p].indexOf('tp=') !== 0) {
            cleanedParts.push(parts[p]);
          }
        }
        queryString = cleanedParts.length ? cleanedParts.join('&') : '';
      }
    }

    var currentUrl = baseOnly;
    if (queryString) {
      currentUrl += '?' + queryString;
    }
    if (hashPart) {
      currentUrl += hashPart;
    }

    // Use page title as card name
    var pageName = document.title || currentUrl;

    // Try to find a favicon from the page's link elements
    var faviconUrl = '';
    try {
      var links = document.querySelectorAll('link[rel~="icon"]');
      for (var i = 0; i < links.length; i++) {
        if (links[i].href) {
          faviconUrl = links[i].href;
          break;
        }
      }
      // Fall back to site's root favicon if no <link rel="icon"> found
      if (!faviconUrl) {
        faviconUrl = window.location.origin + '/favicon.ico';
      }
    } catch (e) {
      // If DOM query fails, fall back to TizenPortal's own favicon
      faviconUrl = TIZENPORTAL_FAVICON_URL;
    }

    // Encode card data to pass to the portal via URL parameter.
    // We CANNOT call addCard() here because localStorage is origin-scoped:
    // target sites (e.g. audiobookshelf.example.com) have a different
    // localStorage than the portal (axelnanol.github.io). The portal must
    // call addCard() itself when it loads so the card lands in the correct
    // origin's localStorage.
    var cardData = { 
      name: pageName, 
      url: currentUrl, 
      icon: faviconUrl,
      // Preserve the bundle from the current site so cross-site navigation works
      featureBundle: state.currentBundle || null
    };
    encoded = btoa(unescape(encodeURIComponent(JSON.stringify(cardData))));
    log('Prepared card for portal: ' + pageName + ' (' + currentUrl + ') with bundle: ' + (state.currentBundle || 'default'));
    showToast('Adding site: ' + pageName, 2000);
  } catch (err) {
    warn('Failed to prepare current site: ' + err.message);
    showToast('Failed to add site', 2000);
  }

  // Navigate to portal, passing card data in hash so portal can save it
  setTimeout(function() {
    var portalUrl = PORTAL_BASE_URL + '/index.html?v=' + encodeURIComponent(VERSION);
    if (encoded) {
      portalUrl += '#addcard=' + encoded;
    }
    window.location.href = portalUrl;
  }, 600);
}

/**
 * Initialize color button hints with click handlers
 * Makes the hints clickable for mouse users
 */
function initColorHints() {
  var hints = document.getElementById('tp-hints');
  if (!hints) return;

  // Define hint configurations: color class -> { short, long } actions
  var hintConfig = {
    'red':    { short: 'addressbar',  long: 'reload' },
    'green':  { short: 'pointerMode', long: 'editFocusedCard' },
    'yellow': { short: 'preferences', long: 'addSite' },
    'blue':   { short: 'diagnostics', long: 'safeMode' }
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

    var config = hintConfig[color];

    // Store the short-press action on the hint element
    hint.setAttribute('data-action', config.short);
    
    // Make it look clickable
    hint.style.cursor = 'pointer';
    
    // Add short-press click handler on the whole hint (but not on sub)
    hint.addEventListener('click', function(e) {
      // If the click was on the sub-text, let the sub handler deal with it
      if (e.target && e.target.classList.contains('tp-hint-sub')) return;
      var action = this.getAttribute('data-action');
      if (action) {
        executeColorAction(action);
      }
    });

    // Add long-press click handler on the sub-text element
    var subEl = hint.querySelector('.tp-hint-sub');
    if (subEl && config.long) {
      subEl.setAttribute('data-action', config.long);
      subEl.style.cursor = 'pointer';
      subEl.addEventListener('click', function(e) {
        e.stopPropagation();
        var action = this.getAttribute('data-action');
        if (action) {
          executeColorAction(action);
        }
      });
    }

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
  
  // Set up focus tracking to update hint labels contextually
  document.addEventListener('focusin', updateYellowHint);
  document.addEventListener('focusin', updateGreenHint);
  updateYellowHint(); // Initial update
  updateGreenHint(); // Initial update
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
 * Update the green hint sub-text based on current context
 */
function updateGreenHint() {
  var hintSub = null;
  var greenKey = document.querySelector('#tp-hints .tp-hint-key.green');
  if (greenKey && greenKey.parentNode) {
    var textContainer = greenKey.parentNode.querySelector('.tp-hint-text');
    if (textContainer) {
      hintSub = textContainer.querySelector('.tp-hint-sub');
    }
  }

  if (!hintSub) return;

  if (isSiteEditorOpen() || isPreferencesOpen()) {
    hintSub.textContent = 'Hold: Disabled';
    return;
  }

  hintSub.textContent = 'Hold: Edit Card';
}

/**
 * Refresh portal hint labels (yellow short/long)
 */
function updatePortalHints() {
  updateYellowHint();
  updateGreenHint();
}

function resolveHintsPosition(portalConfig) {
  if (portalConfig && portalConfig.hintsPosition) {
    return portalConfig.hintsPosition;
  }
  if (portalConfig && portalConfig.showHints === false) {
    return 'off';
  }
  return 'bottom-left';
}

function applyHintsPosition(element, position) {
  if (!element) return;
  element.style.position = 'fixed';
  element.style.top = 'auto';
  element.style.bottom = 'auto';
  element.style.left = 'auto';
  element.style.right = 'auto';

  if (position === 'top-left') {
    element.style.top = '20px';
    element.style.left = '60px';
  } else if (position === 'top-right') {
    element.style.top = '20px';
    element.style.right = '60px';
  } else if (position === 'bottom-right') {
    element.style.bottom = '20px';
    element.style.right = '60px';
  } else {
    element.style.bottom = '20px';
    element.style.left = '60px';
  }
}

function setPortalHintsPosition(position) {
  var hints = document.getElementById('tp-hints');
  if (!hints) return;
  var pos = position || 'bottom-left';
  applyHintsPosition(hints, pos);
  hints.style.display = pos === 'off' ? 'none' : 'flex';
}

/**
 * Show/hide the portal color hints
 * @param {boolean} visible
 */
function setPortalHintsVisible(visible) {
  var hints = document.getElementById('tp-hints');
  if (!hints) return;
  var portalConfig = configGet('tp_portal') || {};
  var position = resolveHintsPosition(portalConfig);
  if (!visible) {
    hints.style.display = 'none';
    return;
  }
  setPortalHintsPosition(position);
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
  
  // Merge global feature settings into card if not explicitly set
  // This ensures that portal preferences carry through to the site
  log('[Config] Merging global tp_features into card for cross-origin navigation...');
  var globalFeatures = configGet('tp_features') || {};
  for (var featureKey in globalFeatures) {
    if (!globalFeatures.hasOwnProperty(featureKey)) continue;

    // Map UA mode to card.userAgent so it survives cross-origin navigation
    if (featureKey === 'uaMode') {
      if (card.userAgent === null || card.userAgent === undefined) {
        card.userAgent = globalFeatures.uaMode;
        log('[Config] Merged global uaMode -> card.userAgent: ' + card.userAgent);
      }
      continue;
    }

    // Only use global setting if card doesn't explicitly override it (null means use global)
    if (card[featureKey] === null || card[featureKey] === undefined) {
      card[featureKey] = globalFeatures[featureKey];
      log('[Config] Merged global ' + featureKey + ': ' + JSON.stringify(card[featureKey]));
    }
  }
  log('[Config] Global merge complete');

  
  // Get the bundle for this card
  var bundle = getBundle(bundleName);
  var resolvedUa = resolveUserAgentMode(card);
  
  // Build payload with bundle info: { css, js, ua, bundleName }
  var targetUrl = card.url;
  try {
    var payload = {
      css: '',
      js: '',
      cardId: card.id || null,
      ua: resolvedUa,
      viewportMode: card.hasOwnProperty('viewportMode') ? card.viewportMode : null,
      focusOutlineMode: card.hasOwnProperty('focusOutlineMode') ? card.focusOutlineMode : null,
      tabindexInjection: card.hasOwnProperty('tabindexInjection') ? card.tabindexInjection : null,
      scrollIntoView: card.hasOwnProperty('scrollIntoView') ? card.scrollIntoView : null,
      safeArea: card.hasOwnProperty('safeArea') ? card.safeArea : null,
      gpuHints: card.hasOwnProperty('gpuHints') ? card.gpuHints : null,
      cssReset: card.hasOwnProperty('cssReset') ? card.cssReset : null,
      hideScrollbars: card.hasOwnProperty('hideScrollbars') ? card.hideScrollbars : null,
      wrapTextInputs: card.hasOwnProperty('wrapTextInputs') ? card.wrapTextInputs : null,
      focusStyling: card.hasOwnProperty('focusStyling') ? card.focusStyling : null,
      focusTransitions: card.hasOwnProperty('focusTransitions') ? card.focusTransitions : null,
      focusTransitionMode: card.hasOwnProperty('focusTransitionMode') ? card.focusTransitionMode : null,
      focusTransitionSpeed: card.hasOwnProperty('focusTransitionSpeed') ? card.focusTransitionSpeed : null,
      navigationFix: card.hasOwnProperty('navigationFix') ? card.navigationFix : null,
      navigationMode: card.hasOwnProperty('navigationMode') ? card.navigationMode : null,
      textScale: card.hasOwnProperty('textScale') ? card.textScale : null,
      bundleOptions: card.bundleOptions || {},
      bundleOptionData: card.bundleOptionData || {},
      userscriptToggles: card.userscriptToggles || {},
      bundleUserscriptToggles: card.bundleUserscriptToggles || {},
      crossHistory: card.crossHistory || [],
      crossForward: card.crossForward || [],
    };
    
    // NOTE: Do NOT embed bundle CSS in the URL payload.
    // It can exceed URL length limits and cause load failures.
    // Bundles are resolved locally by name at runtime.
    
    // Add bundle JS initialization code (if needed)
    // The bundle object has methods, so we can't directly serialize it
    // Instead, pass bundle name and let the runtime look it up
    payload.bundleName = bundleName;
    payload.cardName = card.name;
    log('Payload will include bundleName: ' + bundleName + ' for target: ' + targetUrl.substring(0, 50));
    var json = JSON.stringify(payload);
    var encoded = btoa(unescape(encodeURIComponent(json)));

    // Append to URL query + hash robustly.
    // Important: if the target URL already has a hash fragment, query params
    // must be added BEFORE '#', otherwise '?tp=' ends up inside the hash and
    // can be lost by SPA hash routers before runtime init.
    var hashIndex = targetUrl.indexOf('#');
    var baseUrl = hashIndex === -1 ? targetUrl : targetUrl.substring(0, hashIndex);
    var hashFragment = hashIndex === -1 ? '' : targetUrl.substring(hashIndex + 1);

    // Query payload (survives some redirects)
    if (!/[?&]tp=/.test(baseUrl)) {
      baseUrl += (baseUrl.indexOf('?') === -1 ? '?tp=' : '&tp=') + encoded;
    }

    // Hash payload (fast path when hash survives)
    if (!hashFragment) {
      hashFragment = 'tp=' + encoded;
    } else if (!/(^|[&?])tp=/.test(hashFragment)) {
      hashFragment += '&tp=' + encoded;
    }

    targetUrl = baseUrl + '#' + hashFragment;
    
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
 * Navigate to an arbitrary URL using the appropriate mechanism:
 * - On portal: launch via loadSite with a minimal ad-hoc card
 * - On sites: route via portal crossnav relay to preserve card context
 * Falls back to direct navigation if card context is unavailable.
 * @param {string} url - Destination URL (must be http/https)
 */
function navigateUrl(url) {
  if (!url) return;
  if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) return;

  if (state.isPortalPage) {
    // id is intentionally null: this card is not saved to localStorage,
    // so the crossnav relay can't look it up. installLinkInterceptor skips
    // cards without an id, which is the correct behaviour for ad-hoc pages.
    var adhocCard = {
      id: null,
      name: url,
      url: url,
      featureBundle: 'default',
    };
    loadSite(adhocCard);
    return;
  }

  // On a site: avoid relay loops back to the portal itself
  if (url.indexOf(PORTAL_BASE_URL) === 0) {
    window.location.href = url;
    return;
  }

  // Same-origin navigation is handled by the sessionStorage relay —
  // no need to round-trip through the portal crossnav relay.
  var currentBase = window.location.protocol + '//' + window.location.host;
  if (
    url === currentBase ||
    url.indexOf(currentBase + '/') === 0 ||
    url.indexOf(currentBase + '?') === 0 ||
    url.indexOf(currentBase + '#') === 0
  ) {
    window.location.href = url;
    return;
  }

  // Cross-origin: route via portal crossnav relay to preserve card context
  if (!state.currentCard || !state.currentCard.id) {
    warn('navigateUrl: no current card context, falling back to direct navigation');
    window.location.href = url;
    return;
  }
  var crossHistory = (state.currentCard.crossHistory || []).slice();
  crossHistory.push(getCleanCurrentUrl());
  var relayBundleName = state.currentBundle || state.currentCard.featureBundle || 'default';
  var portalUrl = buildCrossNavUrl(state.currentCard.id, url, crossHistory, [], relayBundleName);
  if (!portalUrl) {
    warn('navigateUrl: crossnav URL build failed, falling back to direct navigation');
    window.location.href = url;
    return;
  }
  window.location.href = portalUrl;
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
    setExitKeyCapture: setExitKeyCapture,
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

  // Navigation helpers - standard methods for bundles
  navigation: {
    navigate: navigate,
    focusElement: focusElement,
    focusFirst: focusFirst,
    focusLast: focusLast,
    getFocusableElements: getFocusableElements,
    focusRelative: focusRelative,
    focusNext: focusNext,
    focusPrevious: focusPrevious,
    getCurrentFocus: getCurrentFocus,
    scrollIntoViewIfNeeded: scrollIntoViewIfNeeded,
    setEnabled: setNavigationEnabled,
    isEnabled: isNavigationEnabled,
  },

  // Card registration system - bundles register selectors, core handles the rest
  cards: {
    register: registerCards,
    unregister: unregisterCards,
    clear: clearRegistrations,
    process: processCards,
    getRegistrations: getRegistrations,
  },

  // Element registration system - declarative element manipulation
  elements: {
    register: registerElements,
    unregister: unregisterElements,
    clear: clearElementRegistrations,
    process: processElements,
    getRegistrations: getElementRegistrations,
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
  navigateUrl: navigateUrl,
  addCurrentSiteAndReturn: addCurrentSiteAndReturn,
  setPortalHintsVisible: setPortalHintsVisible,
  setPortalHintsPosition: setPortalHintsPosition,
  updatePortalHints: updatePortalHints,
  getCurrentCard: function() {
    return state.currentCard;
  },

  // Bundle system
  bundles: {
    list: getBundleNames,
    getActive: getActiveBundle,
    getActiveName: getActiveBundleName,
    get: getBundle,
    getManifest: function(bundleName) {
      var bundle = getBundle(bundleName);
      return bundle ? bundle.manifest : null;
    },
  },

  /**
   * Register a cleanup function to be called automatically when the active
   * bundle deactivates (inside unloadBundle).  Bundles call this instead of
   * storing references for manual teardown in onDeactivate.
   *
   * Example:
   *   TizenPortal.onCleanup(function() { stopMyObserver(); });
   *
   * @param {Function} fn - Cleanup function (no arguments)
   */
  onCleanup: registerBundleCleanup,

  /**
   * Attach a one-time event listener that removes itself after the first call.
   * Returns a cancel function that removes the listener before it fires.
   *
   * Example:
   *   TizenPortal.once(document, 'DOMContentLoaded', function() { init(); });
   *
   * @param {EventTarget} element - DOM element or event target
   * @param {string} eventType - Event type
   * @param {Function} handler - Listener to invoke once
   * @returns {Function} Cancel function
   */
  once: once,

  // Features system
  features: {
    apply: featureLoader.applyFeatures,
    remove: featureLoader.removeFeatures,
    getAll: featureLoader.getFeatures,
    getConfig: featureLoader.getConfig,
    getDefaults: featureLoader.getDefaults,
    registry: featureLoader.registry,  // Expose unified registry
    addNavigableSelector: featureLoader.addNavigableSelector,
  },

  // Userscript engine
  userscripts: {
    getConfig: userscriptEngine.getUserscriptsConfig,
    setConfig: userscriptEngine.setUserscriptsConfig,
    apply: userscriptEngine.applyUserscripts,
    clear: userscriptEngine.clearUserscripts,
    getEnabled: userscriptEngine.getEnabledGlobalUserscripts,
    getForPayload: userscriptEngine.getGlobalUserscriptsForPayload,
    registry: featureLoader.registry,  // Updated to use unified registry
  },
  
  // Unified registry (for advanced use - accesses same registry as features/userscripts)
  registry: featureLoader.registry,

  // UI helpers
  showToast: showToast,
  showLoading: showLoading,
  hideLoading: hideLoading,
  
  // Site overlay controls
  toggleSiteAddressBar: toggleSiteAddressBar,
  toggleSiteDiagnostics: toggleSiteDiagnostics,

  // TizenPortal's own favicon URL (used as fallback icon for cards with no icon)
  _portalFaviconUrl: TIZENPORTAL_FAVICON_URL,

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

// Define feature loader as a non-writable, non-configurable internal property
Object.defineProperty(TizenPortalAPI, '_featureLoader', {
  value: featureLoader,
  writable: false,
  configurable: false,
  enumerable: false,
});

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
