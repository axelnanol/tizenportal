/**
 * Userscript Engine
 * 
 * Manages global and per-site user scripts.
 * Scripts are stored in localStorage via config and per-card data.
 */

import { configGet, configSet } from '../core/config.js';

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

  var globalScripts = getUserscriptsConfig().scripts || [];
  var siteToggleMap = card && card.userscriptToggles && typeof card.userscriptToggles === 'object' ? card.userscriptToggles : null;
  var bundleToggleMap = null;

  if (card && bundle && card.bundleUserscriptToggles && card.bundleUserscriptToggles[bundle.name]) {
    bundleToggleMap = card.bundleUserscriptToggles[bundle.name];
  }

  var bundleScripts = [];
  if (bundle && Array.isArray(bundle.userscripts)) {
    bundleScripts = normalizeScriptsArray(bundle.userscripts);
  }

  var legacySiteScripts = [];
  if (card && Array.isArray(card.userscripts)) {
    legacySiteScripts = normalizeScriptsArray(card.userscripts);
  } else if (card && card._payload && Array.isArray(card._payload.userscripts)) {
    legacySiteScripts = normalizeScriptsArray(card._payload.userscripts);
  }

  for (var i = 0; i < bundleScripts.length; i++) {
    var bScript = bundleScripts[i];
    if (!bScript) continue;
    var bundleEnabled = bScript.enabled !== false;
    if (bundleToggleMap && bundleToggleMap.hasOwnProperty(bScript.id)) {
      bundleEnabled = bundleToggleMap[bScript.id] === true;
    }
    if (bundleEnabled) {
      executeUserscript(bScript, card, bundle);
    }
  }

  for (var j = 0; j < globalScripts.length; j++) {
    var gScript = globalScripts[j];
    if (!gScript) continue;
    if (siteToggleMap && siteToggleMap[gScript.id] === true) {
      executeUserscript(gScript, card, bundle);
    }
  }

  for (var k = 0; k < legacySiteScripts.length; k++) {
    var lScript = legacySiteScripts[k];
    if (!lScript || lScript.enabled !== true) continue;
    executeUserscript(lScript, card, bundle);
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
