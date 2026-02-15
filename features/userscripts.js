/**
 * Userscript Engine
 * 
 * Manages global and per-site user scripts.
 * Scripts are now defined in userscript-registry.js and enabled/disabled via config.
 */

import { configGet, configSet } from '../core/config.js';
import UserscriptRegistry from './userscript-registry.js';

var activeCleanups = [];
var activeScripts = [];

/**
 * Get default config structure
 * New structure stores enabled state as a map of script IDs to boolean
 */
function getDefaultConfig() {
  var enabled = {};
  // Enable default-enabled scripts from registry
  var allScripts = UserscriptRegistry.getAllUserscripts();
  for (var i = 0; i < allScripts.length; i++) {
    if (allScripts[i].defaultEnabled) {
      enabled[allScripts[i].id] = true;
    }
  }
  return {
    enabled: enabled,  // Map of scriptId -> boolean
    urlCache: {},      // Map of scriptId -> {cached: string, lastFetched: number}
  };
}

/**
 * Migrate old tp_userscripts config to new tp_userscripts_v2 format
 * Returns migrated config or null if no migration needed
 */
function migrateOldConfig() {
  var oldCfg = configGet('tp_userscripts');
  if (!oldCfg || typeof oldCfg !== 'object') {
    return null;
  }

  var newCfg = {
    enabled: {},
    urlCache: {},
  };

  // Migrate scripts array to enabled map and urlCache
  if (Array.isArray(oldCfg.scripts)) {
    for (var i = 0; i < oldCfg.scripts.length; i++) {
      var script = oldCfg.scripts[i];
      if (!script || !script.id) continue;

      // Migrate enabled state
      if (script.enabled === true) {
        newCfg.enabled[script.id] = true;
      }

      // Migrate URL cache for external scripts
      if (script.source === 'url' && script.cached) {
        newCfg.urlCache[script.id] = {
          cached: script.cached,
          lastFetched: script.lastFetched || 0,
        };
      }
    }
  }

  if (window.TizenPortal && window.TizenPortal.log) {
    window.TizenPortal.log('[Userscripts] Migrated ' + Object.keys(newCfg.enabled).length + ' scripts from old config');
  }

  return newCfg;
}

/**
 * Get userscripts config from localStorage
 * Returns {enabled: {}, urlCache: {}}
 */
function getUserscriptsConfig() {
  var cfg = configGet('tp_userscripts_v2');  // New key to avoid conflicts
  var changed = false;

  // First check: if no v2 config exists, try migration
  if (!cfg || typeof cfg !== 'object') {
    var migrated = migrateOldConfig();
    if (migrated) {
      cfg = migrated;
      changed = true;
      if (window.TizenPortal && window.TizenPortal.log) {
        window.TizenPortal.log('[Userscripts] Migration complete - using migrated config');
      }
    } else {
      cfg = getDefaultConfig();
      changed = true;
    }
  }

  if (!cfg.enabled || typeof cfg.enabled !== 'object') {
    cfg.enabled = {};
    changed = true;
  }

  if (!cfg.urlCache || typeof cfg.urlCache !== 'object') {
    cfg.urlCache = {};
    changed = true;
  }

  // Check for new defaultEnabled scripts not in config
  var allScripts = UserscriptRegistry.getAllUserscripts();
  for (var i = 0; i < allScripts.length; i++) {
    var script = allScripts[i];
    if (script.defaultEnabled && !cfg.enabled.hasOwnProperty(script.id)) {
      cfg.enabled[script.id] = true;
      changed = true;
      if (window.TizenPortal && window.TizenPortal.log) {
        window.TizenPortal.log('[Userscripts] Auto-enabled default script: ' + script.name);
      }
    }
  }

  if (changed) {
    configSet('tp_userscripts_v2', cfg);
  }

  return cfg;
}

/**
 * Set userscripts config to localStorage
 */
function setUserscriptsConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') {
    cfg = getDefaultConfig();
  }

  if (!cfg.enabled || typeof cfg.enabled !== 'object') {
    cfg.enabled = {};
  }

  if (!cfg.urlCache || typeof cfg.urlCache !== 'object') {
    cfg.urlCache = {};
  }

  configSet('tp_userscripts_v2', cfg);
}

/**
 * Get enabled global userscript IDs
 */
function getEnabledGlobalUserscripts() {
  var cfg = getUserscriptsConfig();
  var enabled = [];
  for (var id in cfg.enabled) {
    if (cfg.enabled[id] === true) {
      enabled.push(id);
    }
  }
  return enabled;
}

/**
 * Set enabled state for a global userscript
 */
function setGlobalUserscriptEnabled(scriptId, enabled) {
  var cfg = getUserscriptsConfig();
  cfg.enabled[scriptId] = enabled === true;
  setUserscriptsConfig(cfg);
}

/**
 * Get enabled global userscripts for payload serialization
 * Returns array of script objects with full metadata for cross-origin transfer
 */
function getGlobalUserscriptsForPayload() {
  var enabledIds = getEnabledGlobalUserscripts();
  var scripts = [];
  
  for (var i = 0; i < enabledIds.length; i++) {
    var scriptDef = UserscriptRegistry.getUserscriptById(enabledIds[i]);
    if (scriptDef) {
      scripts.push({
        id: scriptDef.id,
        name: scriptDef.name,
        category: scriptDef.category,
        source: scriptDef.source,
        inline: scriptDef.inline || null,
        url: scriptDef.url || null,
      });
    }
  }
  
  return scripts;
}

/**
 * Resolve script source code
 * For URL scripts, check urlCache first
 */
function resolveScriptSource(scriptDef, urlCache) {
  if (!scriptDef) return '';
  
  if (scriptDef.source === 'url') {
    // Check cache first
    if (urlCache && urlCache[scriptDef.id] && urlCache[scriptDef.id].cached) {
      return urlCache[scriptDef.id].cached;
    }
    // No cached version available
    return '';
  }
  
  // Inline script
  return scriptDef.inline || '';
}

/**
 * Execute a userscript
 */
function executeUserscript(scriptDef, urlCache, card, bundle) {
  var source = resolveScriptSource(scriptDef, urlCache);
  if (!source) return;

  var runtime = {
    name: scriptDef.name || scriptDef.id || 'userscript',
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

/**
 * Apply userscripts for a site
 * @param {Object} card - Site card with userscript toggles
 * @param {Object} bundle - Active bundle (ignored now, bundles don't have userscripts)
 */
function applyUserscripts(card, bundle) {
  clearUserscripts();

  var cfg = getUserscriptsConfig();
  var urlCache = cfg.urlCache || {};
  
  // Log bundle info for debugging
  var bundleName = bundle && bundle.name ? bundle.name : 'unknown';
  var cardName = card && card.name ? card.name : 'unknown';
  if (window.TizenPortal && window.TizenPortal.log) {
    window.TizenPortal.log('[Userscripts] Applying for bundle: ' + bundleName + ', card: ' + cardName);
  }

  // Get all userscripts from registry
  var allScripts = UserscriptRegistry.getAllUserscripts();
  
  // Site-level toggles (per-card overrides)
  var siteToggles = card && card.userscriptToggles && typeof card.userscriptToggles === 'object' 
    ? card.userscriptToggles 
    : null;

  if (window.TizenPortal && window.TizenPortal.log) {
    window.TizenPortal.log('[Userscripts] Checking ' + allScripts.length + ' registered scripts');
    window.TizenPortal.log('[Userscripts] Site toggles:', siteToggles);
    window.TizenPortal.log('[Userscripts] Global enabled:', cfg.enabled);
  }

  var executedCount = 0;

  // Execute each script if enabled
  for (var i = 0; i < allScripts.length; i++) {
    var scriptDef = allScripts[i];
    if (!scriptDef || !scriptDef.id) continue;

    var shouldExecute = false;

    // Check if site has per-site toggle
    if (siteToggles && siteToggles.hasOwnProperty(scriptDef.id)) {
      shouldExecute = siteToggles[scriptDef.id] === true;
    } else {
      // Fall back to global enabled state
      shouldExecute = cfg.enabled[scriptDef.id] === true;
    }

    if (shouldExecute) {
      if (window.TizenPortal && window.TizenPortal.log) {
        window.TizenPortal.log('[Userscripts] Executing: ' + scriptDef.name + ' (ID: ' + scriptDef.id + ')');
      }
      executeUserscript(scriptDef, urlCache, card, bundle);
      executedCount++;
    }
  }

  if (window.TizenPortal && window.TizenPortal.log) {
    window.TizenPortal.log('[Userscripts] Executed ' + executedCount + ' of ' + allScripts.length + ' scripts');
  }
}

export default {
  getUserscriptsConfig: getUserscriptsConfig,
  setUserscriptsConfig: setUserscriptsConfig,
  getEnabledGlobalUserscripts: getEnabledGlobalUserscripts,
  setGlobalUserscriptEnabled: setGlobalUserscriptEnabled,
  getGlobalUserscriptsForPayload: getGlobalUserscriptsForPayload,
  applyUserscripts: applyUserscripts,
  clearUserscripts: clearUserscripts,
  UserscriptRegistry: UserscriptRegistry,
};
