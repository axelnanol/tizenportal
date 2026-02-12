/**
 * Userscript Engine
 * 
 * Manages global and per-site user scripts.
 * Scripts are stored in localStorage via config and per-card data.
 */

import { configGet, configSet } from '../core/config.js';
import { isBundleUserscript } from '../core/utils.js';

var activeCleanups = [];
var activeScripts = [];

function generateId() {
  return 'us-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}

function createDefaultScript(index) {
  return {
    id: generateId(),
    name: 'Custom Script ' + index,
    enabled: false,
    source: 'inline',
    url: '',
    inline: '',
    cached: '',
    lastFetched: 0,
  };
}

function normalizeScriptEntry(entry, index) {
  var normalized = entry && typeof entry === 'object' ? entry : {};

  if (!normalized.id) normalized.id = generateId();
  if (!normalized.name) normalized.name = 'Custom Script ' + (index + 1);
  normalized.enabled = normalized.enabled !== false;
  normalized.source = normalized.source === 'url' ? 'url' : 'inline';
  normalized.url = typeof normalized.url === 'string' ? normalized.url : '';
  normalized.inline = typeof normalized.inline === 'string' ? normalized.inline : '';
  normalized.cached = typeof normalized.cached === 'string' ? normalized.cached : '';
  normalized.lastFetched = typeof normalized.lastFetched === 'number' ? normalized.lastFetched : 0;

  if (normalized.source === 'inline' && !normalized.inline && normalized.cached) {
    normalized.source = 'url';
  }

  return normalized;
}

function normalizeScriptsArray(scripts) {
  var list = Array.isArray(scripts) ? scripts : [];
  var normalized = [];

  for (var i = 0; i < list.length; i++) {
    normalized.push(normalizeScriptEntry(list[i], i));
  }

  if (!normalized.length) {
    normalized.push(createDefaultScript(1));
  }

  return normalized;
}

function getDefaultConfig() {
  return {
    scripts: [createDefaultScript(1)],
  };
}

function getUserscriptsConfig() {
  var cfg = configGet('tp_userscripts');
  var changed = false;

  if (!cfg || typeof cfg !== 'object') {
    cfg = getDefaultConfig();
    changed = true;
  }

  if (!Array.isArray(cfg.scripts)) {
    cfg.scripts = [];
    changed = true;
  }

  // Filter out any bundle-scoped userscripts from global config
  // These should never be in global config, only in bundle definitions
  var filtered = [];
  for (var i = 0; i < cfg.scripts.length; i++) {
    var script = cfg.scripts[i];
    if (script && script.id && isBundleUserscript(script.id)) {
      // Skip bundle userscripts that accidentally got into global config
      changed = true;
      continue;
    }
    filtered.push(script);
  }
  cfg.scripts = filtered;

  var normalized = normalizeScriptsArray(cfg.scripts);
  if (normalized.length !== cfg.scripts.length) {
    changed = true;
  }

  cfg.scripts = normalized;

  if (changed) {
    configSet('tp_userscripts', cfg);
  }

  return cfg;
}

function setUserscriptsConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') {
    cfg = getDefaultConfig();
  }

  if (!Array.isArray(cfg.scripts)) {
    cfg.scripts = [];
  }

  cfg.scripts = normalizeScriptsArray(cfg.scripts);
  configSet('tp_userscripts', cfg);
}

function cloneScripts(scripts) {
  var cloned = [];
  for (var i = 0; i < scripts.length; i++) {
    var s = scripts[i] || {};
    cloned.push({
      id: s.id || generateId(),
      name: s.name || 'Custom Script ' + (i + 1),
      enabled: s.enabled !== false,
      source: s.source === 'url' ? 'url' : 'inline',
      url: s.url || '',
      inline: s.inline || '',
      cached: s.cached || '',
      lastFetched: typeof s.lastFetched === 'number' ? s.lastFetched : 0,
    });
  }
  return cloned;
}

function getGlobalUserscriptsForPayload() {
  var cfg = getUserscriptsConfig();
  return cloneScripts(cfg.scripts);
}

function getCardUserscriptsForPayload(card) {
  if (card && Array.isArray(card.userscripts)) {
    return cloneScripts(normalizeScriptsArray(card.userscripts));
  }
  return [];
}

function resolveScriptSource(script) {
  if (!script) return '';
  if (script.source === 'url') {
    var cached = (script.cached || '').trim();
    if (cached) return cached;
    return '';
  }
  var inline = (script.inline || '').trim();
  if (inline) return inline;
  return '';
}

function getBundleSiteScripts(card, bundle) {
  if (card && bundle && card.userscriptsByBundle && card.userscriptsByBundle[bundle.name]) {
    // Use bundle-scoped userscripts for this specific bundle
    return normalizeScriptsArray(card.userscriptsByBundle[bundle.name]);
  }
  
  if (card && card._payload && Array.isArray(card._payload.userscripts)) {
    // Fallback to payload userscripts for backward compatibility
    return normalizeScriptsArray(card._payload.userscripts);
  }
  
  return [];
}

function executeUserscript(script, card, bundle) {
  var source = resolveScriptSource(script);
  if (!source) return;

  var runtime = {
    name: script.name || script.id || 'userscript',
    cleanup: null,
  };

  try {
    var fn = new Function('window', 'document', 'TizenPortal', 'card', 'bundle', 'userscript', source);
    fn(window, document, window.TizenPortal, card || null, bundle || null, runtime);
    if (typeof runtime.cleanup === 'function') {
      activeCleanups.push(runtime.cleanup);
    }
    activeScripts.push(runtime.name);
  } catch (err) {
    if (window.TizenPortal && window.TizenPortal.warn) {
      window.TizenPortal.warn('Userscript error (' + runtime.name + '): ' + err.message);
    } else {
      console.warn('TizenPortal Userscripts: Error in ' + runtime.name + ': ' + err.message);
    }
  }
}

function clearUserscripts() {
  for (var i = 0; i < activeCleanups.length; i++) {
    try {
      activeCleanups[i]();
    } catch (err) {
      if (window.TizenPortal && window.TizenPortal.warn) {
        window.TizenPortal.warn('Userscript cleanup failed: ' + err.message);
      }
    }
  }

  activeCleanups = [];
  activeScripts = [];
}

function applyUserscripts(card, bundle) {
  clearUserscripts();

  // Log bundle info for debugging
  var bundleName = bundle && bundle.name ? bundle.name : 'unknown';
  var cardName = card && card.name ? card.name : 'unknown';
  if (window.TizenPortal && window.TizenPortal.log) {
    window.TizenPortal.log('[Userscripts] Applying for bundle: ' + bundleName + ', card: ' + cardName);
  }

  var globalScripts = getUserscriptsConfig().scripts || [];
  var siteToggleMap = card && card.userscriptToggles && typeof card.userscriptToggles === 'object' ? card.userscriptToggles : null;
  var bundleToggleMap = null;

  if (card && bundle && card.bundleUserscriptToggles && card.bundleUserscriptToggles[bundle.name]) {
    bundleToggleMap = card.bundleUserscriptToggles[bundle.name];
  }

  var bundleScripts = [];
  if (bundle && Array.isArray(bundle.userscripts)) {
    bundleScripts = normalizeScriptsArray(bundle.userscripts);
    if (window.TizenPortal && window.TizenPortal.log) {
      window.TizenPortal.log('[Userscripts] Bundle has ' + bundleScripts.length + ' userscripts');
    }
  }

  // Per-bundle site scripts from card.userscriptsByBundle
  // This ensures scripts are isolated to their designated bundle
  // NOTE: card.userscripts is intentionally NOT used here - it's a working copy
  // for the site editor UI and may contain scripts from a different bundle
  var perBundleSiteScripts = getBundleSiteScripts(card, bundle);

  for (var i = 0; i < bundleScripts.length; i++) {
    var bScript = bundleScripts[i];
    if (!bScript) continue;
    var bundleEnabled = bScript.enabled !== false;
    if (bundleToggleMap && bundleToggleMap.hasOwnProperty(bScript.id)) {
      bundleEnabled = bundleToggleMap[bScript.id] === true;
    }
    if (bundleEnabled) {
      if (window.TizenPortal && window.TizenPortal.log) {
        window.TizenPortal.log('[Userscripts] Executing bundle script: ' + (bScript.name || bScript.id));
      }
      executeUserscript(bScript, card, bundle);
    }
  }

  if (window.TizenPortal && window.TizenPortal.log) {
    window.TizenPortal.log('[Userscripts] Checking ' + globalScripts.length + ' global scripts');
  }

  for (var j = 0; j < globalScripts.length; j++) {
    var gScript = globalScripts[j];
    if (!gScript) continue;
    if (siteToggleMap && siteToggleMap[gScript.id] === true) {
      if (window.TizenPortal && window.TizenPortal.log) {
        window.TizenPortal.log('[Userscripts] Executing global script: ' + (gScript.name || gScript.id));
      }
      executeUserscript(gScript, card, bundle);
    }
  }

  if (window.TizenPortal && window.TizenPortal.log) {
    window.TizenPortal.log('[Userscripts] Checking ' + perBundleSiteScripts.length + ' per-bundle site scripts');
  }

  for (var k = 0; k < perBundleSiteScripts.length; k++) {
    var sScript = perBundleSiteScripts[k];
    if (!sScript || sScript.enabled !== true) continue;
    if (window.TizenPortal && window.TizenPortal.log) {
      window.TizenPortal.log('[Userscripts] Executing site script: ' + (sScript.name || sScript.id));
    }
    executeUserscript(sScript, card, bundle);
  }
}

export default {
  getUserscriptsConfig: getUserscriptsConfig,
  setUserscriptsConfig: setUserscriptsConfig,
  normalizeScriptsArray: normalizeScriptsArray,
  createDefaultScript: createDefaultScript,
  applyUserscripts: applyUserscripts,
  clearUserscripts: clearUserscripts,
  getGlobalUserscriptsForPayload: getGlobalUserscriptsForPayload,
  getCardUserscriptsForPayload: getCardUserscriptsForPayload,
};
