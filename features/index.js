/**
 * Feature Loader
 * 
 * Manages global site features that apply to all sites.
 * Features can be toggled in preferences.
 * 
 * Now uses the unified registry system for consistent management.
 */

import Registry from './registry.js';
import focusStyling from './focus-styling.js';
import focusTransitions from './focus-transitions.js';
import tabindexInjection from './tabindex-injection.js';
import scrollIntoView from './scroll-into-view.js';
import safeArea from './safe-area.js';
import gpuHints from './gpu-hints.js';
import cssReset from './css-reset.js';
import hideScrollbars from './hide-scrollbars.js';
import navigationFix from './navigation-fix.js';
import textScale from './text-scale.js';
import textInputProtection from './text-input-protection.js';

// Register all features in the unified registry
Registry.register({
  id: 'focusStyling',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'focusStyling',
  displayName: 'Focus Styling',
  category: Registry.CATEGORIES.STYLING,
  description: 'Provides outline focus indicators for TV navigation',
  defaultEnabled: true,
  configKeys: ['focusStyling', 'focusOutlineMode'],
  implementation: focusStyling,
  applyArgs: function(config) {
    var mode = config.focusOutlineMode || 'off';
    if (config.focusStyling === false) mode = 'none';
    return [mode];
  },
});

Registry.register({
  id: 'focusTransitions',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'focusTransitions',
  displayName: 'Focus Transitions',
  category: Registry.CATEGORIES.STYLING,
  description: 'Smooth animated transitions between focused elements',
  defaultEnabled: true,
  configKeys: ['focusTransitions', 'focusTransitionMode', 'focusTransitionSpeed'],
  implementation: focusTransitions,
  applyArgs: function(config) {
    var mode = config.focusTransitionMode || 'slide';
    var speed = config.focusTransitionSpeed || 'medium';
    return [mode, speed];
  },
});

Registry.register({
  id: 'tabindexInjection',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'tabindexInjection',
  displayName: 'Tab Index Injection',
  category: Registry.CATEGORIES.NAVIGATION,
  description: 'Automatically makes elements focusable for TV navigation',
  defaultEnabled: true,
  configKeys: ['tabindexInjection'],
  implementation: tabindexInjection,
  applyArgs: function() { return []; },
});

Registry.register({
  id: 'scrollIntoView',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'scrollIntoView',
  displayName: 'Scroll Into View',
  category: Registry.CATEGORIES.NAVIGATION,
  description: 'Automatically scrolls focused elements into viewport',
  defaultEnabled: true,
  configKeys: ['scrollIntoView'],
  implementation: scrollIntoView,
  applyArgs: function() { return []; },
});

Registry.register({
  id: 'safeArea',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'safeArea',
  displayName: 'TV Safe Area',
  category: Registry.CATEGORIES.STYLING,
  description: 'Adds padding for TV overscan areas',
  defaultEnabled: false,
  configKeys: ['safeArea'],
  implementation: safeArea,
  applyArgs: function() { return []; },
});

Registry.register({
  id: 'gpuHints',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'gpuHints',
  displayName: 'GPU Acceleration',
  category: Registry.CATEGORIES.PERFORMANCE,
  description: 'Hardware acceleration hints for better performance',
  defaultEnabled: true,
  configKeys: ['gpuHints'],
  implementation: gpuHints,
  applyArgs: function() { return []; },
});

Registry.register({
  id: 'cssReset',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'cssReset',
  displayName: 'CSS Normalization',
  category: Registry.CATEGORIES.CORE,
  description: 'Base CSS normalization for TV browsers',
  defaultEnabled: true,
  configKeys: ['cssReset'],
  implementation: cssReset,
  applyArgs: function() { return []; },
});

Registry.register({
  id: 'hideScrollbars',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'hideScrollbars',
  displayName: 'Hide Scrollbars',
  category: Registry.CATEGORIES.LAYOUT,
  description: 'Hide native scrollbars while keeping scroll behavior',
  defaultEnabled: false,
  configKeys: ['hideScrollbars'],
  implementation: hideScrollbars,
  applyArgs: function() { return []; },
});

Registry.register({
  id: 'navigationFix',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'navigationFix',
  displayName: 'Navigation Fix',
  category: Registry.CATEGORIES.NAVIGATION,
  description: 'Fixes for common navigation issues',
  defaultEnabled: true,
  configKeys: ['navigationFix'],
  implementation: navigationFix,
  applyArgs: function() { return []; },
});

Registry.register({
  id: 'textScale',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'textScale',
  displayName: 'Text Scale',
  category: Registry.CATEGORIES.STYLING,
  description: 'Adjustable text size for improved TV legibility',
  defaultEnabled: true,
  configKeys: ['textScale'],
  implementation: textScale,
  applyArgs: function(config) {
    var level = config.textScale || 'medium';
    return [level];
  },
});

Registry.register({
  id: 'wrapTextInputs',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'wrapTextInputs',
  displayName: 'Text Input Protection',
  category: Registry.CATEGORIES.INPUT,
  description: 'Wraps text fields so the on-screen keyboard only opens on explicit Enter/click',
  defaultEnabled: true,
  configKeys: ['wrapTextInputs'],
  implementation: textInputProtection,
  applyArgs: function() { return []; },
});

// Legacy features object for backward compatibility
var features = {
  focusStyling: focusStyling,
  focusTransitions: focusTransitions,
  tabindexInjection: tabindexInjection,
  scrollIntoView: scrollIntoView,
  safeArea: safeArea,
  gpuHints: gpuHints,
  cssReset: cssReset,
  hideScrollbars: hideScrollbars,
  navigationFix: navigationFix,
  textScale: textScale,
  wrapTextInputs: textInputProtection,
};

/**
 * Get default feature configuration
 * @returns {Object}
 */
function getDefaults() {
  return {
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
    navigationFix: true,
    textScale: 'medium',
  };
}

/**
 * Get feature configuration from config
 * @returns {Object}
 */
function getConfig() {
  if (!window.TizenPortal || !window.TizenPortal.config) {
    return getDefaults();
  }
  
  var stored = TizenPortal.config.get('tp_features');
  console.log('getConfig() - stored from localStorage:', stored);
  
  if (!stored) {
    console.log('getConfig() - no stored config, using defaults');
    stored = getDefaults();
    TizenPortal.config.set('tp_features', stored);
  } else {
    // Merge defaults into stored config to pick up new features
    var defaults = getDefaults();
    var needsUpdate = false;
    for (var key in defaults) {
      if (!(key in stored)) {
        console.log('getConfig() - adding missing key from defaults:', key, '=', defaults[key]);
        stored[key] = defaults[key];
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      console.log('getConfig() - saving updated config with new defaults');
      TizenPortal.config.set('tp_features', stored);
    }
  }
  
  // DIAGNOSTIC: Log what we're returning, especially textScale
  console.log('getConfig() returning:', {
    textScale: stored.textScale,
    focusOutlineMode: stored.focusOutlineMode,
    full: stored
  });
  
  return stored;
}

/**
 * Apply enabled features to a document
 * @param {Document} [doc] - Document to apply features to (defaults to current document)
 */
function applyFeatures(doc, overrides) {
  if (!doc) {
    doc = document;
  }
  
  var config = getConfig();
  var effectiveConfig = Object.assign({}, config);
  if (overrides) {
    Object.keys(overrides).forEach(function(key) {
      if (overrides.hasOwnProperty(key) && overrides[key] !== null && overrides[key] !== undefined) {
        effectiveConfig[key] = overrides[key];
      }
    });
  }

  if (window.TizenPortal) {
    window.TizenPortal.log('[Features] Effective config: ' + JSON.stringify(effectiveConfig));
  } else {
    console.log('[Features] Effective config:', effectiveConfig);
  }

  /**
   * Helper to apply a feature with its arguments
   */
  function applyFeature(impl, doc, args) {
    impl.apply.apply(impl, [doc].concat(args));
  }

  /**
   * Check if a feature should be applied
   * Returns { shouldApply: boolean, shouldRemove: boolean, args: array }
   */
  function shouldApplyFeature(item, effectiveConfig) {
    var primaryKey = item.configKeys && item.configKeys.length > 0 ? item.configKeys[0] : item.id;
    var isEnabled = effectiveConfig[primaryKey];
    
    // Special handling for features with complex enable/disable logic
    if (item.id === 'focusStyling') {
      var focusMode = effectiveConfig.focusOutlineMode || 'off';
      if (effectiveConfig.focusStyling === false) focusMode = 'none';
      
      if (focusMode === 'none') {
        return { shouldApply: false, shouldRemove: true, args: [] };
      } else {
        var args = item.applyArgs ? item.applyArgs(effectiveConfig) : [];
        return { shouldApply: true, shouldRemove: false, args: args };
      }
    } else if (item.id === 'focusTransitions') {
      var transitionMode = effectiveConfig.focusTransitionMode || 'slide';
      if (effectiveConfig.focusTransitions === false || transitionMode === 'off') {
        return { shouldApply: false, shouldRemove: true, args: [] };
      } else {
        var args = item.applyArgs ? item.applyArgs(effectiveConfig) : [];
        return { shouldApply: true, shouldRemove: false, args: args };
      }
    } else if (item.id === 'textScale') {
      var textScaleLevel = effectiveConfig.textScale || 'off';
      if (textScaleLevel === 'off') {
        return { shouldApply: false, shouldRemove: true, args: [] };
      } else {
        var args = item.applyArgs ? item.applyArgs(effectiveConfig) : [];
        return { shouldApply: true, shouldRemove: false, args: args };
      }
    } else if (item.id === 'navigationFix') {
      if (effectiveConfig.navigationFix) {
        var args = item.applyArgs ? item.applyArgs(effectiveConfig) : [];
        return { shouldApply: true, shouldRemove: false, args: args };
      } else if (effectiveConfig.navigationFix === false) {
        return { shouldApply: false, shouldRemove: true, args: [] };
      }
      return { shouldApply: false, shouldRemove: false, args: [] };
    } else {
      // Standard boolean-enabled features
      if (isEnabled) {
        var args = item.applyArgs ? item.applyArgs(effectiveConfig) : [];
        return { shouldApply: true, shouldRemove: false, args: args };
      }
      return { shouldApply: false, shouldRemove: true, args: [] };
    }
  }

  try {
    // Get all registered features from registry using unified query API
    var registeredFeatures = Registry.query({ type: Registry.ITEM_TYPES.FEATURE });
    
    // Apply each registered feature based on config
    for (var i = 0; i < registeredFeatures.length; i++) {
      var item = registeredFeatures[i];
      var impl = item.implementation;
      
      if (!impl) continue;
      
      var decision = shouldApplyFeature(item, effectiveConfig);
      
      if (decision.shouldRemove) {
        if (window.TizenPortal) window.TizenPortal.log('[Features] Removing ' + item.id);
        if (impl.remove) impl.remove(doc);
      } else if (decision.shouldApply) {
        if (window.TizenPortal) window.TizenPortal.log('[Features] Applying ' + item.id);
        applyFeature(impl, doc, decision.args);
      }
    }
    
    if (window.TizenPortal) {
      window.TizenPortal.log('[Features] All features applied successfully');
    }
  } catch (err) {
    if (window.TizenPortal) {
      window.TizenPortal.warn('[Features] Failed to apply:', err.message);
    } else {
      console.warn('TizenPortal Features: Failed to apply:', err.message);
    }
  }
}

/**
 * Remove all features from a document
 * @param {Document} [doc] - Document to remove features from (defaults to current document)
 */
function removeFeatures(doc) {
  if (!doc) {
    doc = document;
  }
  
  try {
    // Get all registered features and remove them using unified query API
    var registeredFeatures = Registry.query({ type: Registry.ITEM_TYPES.FEATURE });
    for (var i = 0; i < registeredFeatures.length; i++) {
      var item = registeredFeatures[i];
      if (item.implementation && item.implementation.remove) {
        item.implementation.remove(doc);
      }
    }
    
    if (window.TizenPortal) {
      TizenPortal.log('Features: Removed');
    }
  } catch (err) {
    if (window.TizenPortal) {
      TizenPortal.warn('Features: Failed to remove:', err.message);
    }
  }
}

/**
 * Get list of all features with metadata
 * @returns {Array}
 */
function getFeatures() {
  // Return metadata from registry using unified query API
  return Registry.query({ type: Registry.ITEM_TYPES.FEATURE }).map(function(item) {
    return {
      key: item.id,
      name: item.name,
      displayName: item.displayName,
    };
  });
}

export default {
  applyFeatures: applyFeatures,
  removeFeatures: removeFeatures,
  getFeatures: getFeatures,
  getDefaults: getDefaults,
  getConfig: getConfig,
  
  // Expose registry for advanced use
  registry: Registry,
};
