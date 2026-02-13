/**
 * TizenPortal Configuration System
 * 
 * Persistent configuration with localStorage and change events.
 */

import { safeLocalStorageSet } from './utils.js';

/**
 * Storage key for configuration
 */
var STORAGE_KEY = 'tp-configuration';

/**
 * Default configuration values
 */
var DEFAULT_CONFIG = {
  pointerMode: false,
  safeMode: false,
  lastVisitedUrl: null,
  diagnosticsEnabled: false,
  
  // Portal preferences
  tp_portal: {
    theme: 'dark',
    customColor1: '#0d1117',
    customColor2: '#161b22',
    backgroundImage: '',
    hudPosition: 'off',
    hintsPosition: 'bottom-left',
    showHints: true,
  },
  
  // Global site features
  tp_features: {
    focusStyling: true,
    focusOutlineMode: 'on',
    focusTransitions: true,
    focusTransitionMode: 'slide',
    focusTransitionSpeed: 'medium',
    tabindexInjection: true,
    scrollIntoView: true,
    safeArea: false,
    gpuHints: true,
    cssReset: true,
    hideScrollbars: false,
    wrapTextInputs: true,
    viewportMode: 'locked',
    uaMode: 'tizen',
    
    // Navigation mode: which navigation system to use
    // 'directional' - Use new library in directional mode (cone-based, forgiving) - PREFERRED
    // 'geometric' - Use new library in geometric mode (strict axis-aligned, enhanced polyfill)
    // 'polyfill' - Use legacy spatial-navigation-polyfill.js (backwards compatibility/testing ONLY)
    navigationMode: 'directional',
  },

  // Global user scripts
  tp_userscripts: {
    scripts: [
      {
        id: null,
        name: 'Custom Script 1',
        enabled: false,
        url: '',
        inline: '',
        cached: '',
        lastFetched: 0,
      }
    ]
  },
};

/**
 * In-memory configuration cache
 */
var configCache = null;

/**
 * Change event listeners
 */
var changeListeners = [];

/**
 * Load configuration from localStorage
 * @returns {Object} Configuration object
 */
function loadConfig() {
  if (configCache !== null) {
    return configCache;
  }

  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      configCache = JSON.parse(stored);
      console.log('loadConfig() - loaded from localStorage, tp_features:', configCache.tp_features);
      // Merge with defaults for any missing keys
      for (var key in DEFAULT_CONFIG) {
        if (DEFAULT_CONFIG.hasOwnProperty(key) && !configCache.hasOwnProperty(key)) {
          configCache[key] = DEFAULT_CONFIG[key];
        }
      }
      
      // Deep merge for tp_features to ensure new nested keys appear for existing users
      if (configCache.tp_features && DEFAULT_CONFIG.tp_features) {
        for (var featureKey in DEFAULT_CONFIG.tp_features) {
          if (DEFAULT_CONFIG.tp_features.hasOwnProperty(featureKey) && 
              !configCache.tp_features.hasOwnProperty(featureKey)) {
            configCache.tp_features[featureKey] = DEFAULT_CONFIG.tp_features[featureKey];
          }
        }
      }
    } else {
      configCache = Object.assign({}, DEFAULT_CONFIG);
    }
  } catch (err) {
    console.error('TizenPortal: Failed to load config:', err);
    configCache = Object.assign({}, DEFAULT_CONFIG);
  }

  return configCache;
}

/**
 * Save configuration to localStorage
 */
function saveConfig() {
  if (configCache === null) return;

  var result = safeLocalStorageSet(STORAGE_KEY, JSON.stringify(configCache));
  if (!result.success) {
    if (result.error === 'quota') {
      console.error('TizenPortal: ' + result.message);
    } else {
      console.error('TizenPortal: Failed to save config: ' + result.message);
    }
  }
}

/**
 * Initialize configuration system
 */
export function configInit() {
  loadConfig();
}

/**
 * Read a configuration value
 * @param {string} key - Configuration key
 * @returns {*} Configuration value
 */
export function configRead(key) {
  var config = loadConfig();
  var value = config.hasOwnProperty(key) ? config[key] : undefined;
  if (key === 'tp_features') {
    console.log('configRead(tp_features):', value);
  }
  return value;
}

/**
 * Write a configuration value
 * @param {string} key - Configuration key
 * @param {*} value - Value to write
 */
export function configWrite(key, value) {
  var config = loadConfig();
  var oldValue = config[key];

  if (key === 'tp_features') {
    console.log('configWrite(tp_features):', {
      newValue: value,
      oldValue: oldValue
    });
  }

  // For objects, always save (don't rely on reference equality)
  // This prevents bugs where object properties are modified in-place
  var shouldSave = true;
  if (typeof value !== 'object' || value === null) {
    // For primitives, can check equality
    if (oldValue === value) {
      shouldSave = false;
    }
  }

  if (shouldSave) {
    config[key] = value;
    saveConfig();
    // Emit change event
    emitChange(key, value, oldValue);
  }
}

/**
 * Emit a configuration change event
 * @param {string} key - Changed key
 * @param {*} newValue - New value
 * @param {*} oldValue - Previous value
 */
function emitChange(key, newValue, oldValue) {
  var event = {
    key: key,
    value: newValue,
    oldValue: oldValue,
  };

  for (var i = 0; i < changeListeners.length; i++) {
    try {
      changeListeners[i](event);
    } catch (err) {
      console.error('TizenPortal: Config change listener error:', err);
    }
  }
}

/**
 * Subscribe to configuration changes
 * @param {Function} callback - Callback function(event)
 * @returns {Function} Unsubscribe function
 */
export function configOnChange(callback) {
  if (typeof callback !== 'function') {
    console.warn('TizenPortal: configOnChange requires a function');
    return function() {};
  }

  changeListeners.push(callback);

  // Return unsubscribe function
  return function() {
    var index = changeListeners.indexOf(callback);
    if (index !== -1) {
      changeListeners.splice(index, 1);
    }
  };
}

/**
 * Reset configuration to defaults
 */
export function configReset() {
  configCache = Object.assign({}, DEFAULT_CONFIG);
  saveConfig();

  // Emit changes for all keys
  for (var key in DEFAULT_CONFIG) {
    if (DEFAULT_CONFIG.hasOwnProperty(key)) {
      emitChange(key, DEFAULT_CONFIG[key], undefined);
    }
  }
}

/**
 * Get all configuration values
 * @returns {Object} Copy of configuration object
 */
export function configGetAll() {
  return Object.assign({}, loadConfig());
}

/**
 * Get a config value with deep merging of defaults
 * Useful for structured configs like tp_portal, tp_features
 * @param {string} key
 * @returns {*}
 */
export function configGet(key) {
  var value = configRead(key);
  
  // If value doesn't exist, return default
  if (value === undefined && DEFAULT_CONFIG.hasOwnProperty(key)) {
    if (key === 'tp_features') {
      console.log('configGet(tp_features) - value undefined, returning default');
    }
    return DEFAULT_CONFIG[key];
  }
  
  // If value is object and default is object, merge
  if (value && typeof value === 'object' && DEFAULT_CONFIG.hasOwnProperty(key) && typeof DEFAULT_CONFIG[key] === 'object') {
    var merged = {};
    for (var k in DEFAULT_CONFIG[key]) {
      if (DEFAULT_CONFIG[key].hasOwnProperty(k)) {
        merged[k] = value.hasOwnProperty(k) ? value[k] : DEFAULT_CONFIG[key][k];
      }
    }
    if (key === 'tp_features') {
      console.log('configGet(tp_features) - merging stored with defaults:', {
        storedTextScale: value.textScale,
        defaultTextScale: DEFAULT_CONFIG[key].textScale,
        mergedTextScale: merged.textScale,
        stored: value,
        merged: merged
      });
    }
    return merged;
  }
  
  return value;
}

/**
 * Set a config value (alias for configWrite)
 * @param {string} key
 * @param {*} value
 */
export function configSet(key, value) {
  configWrite(key, value);
}
