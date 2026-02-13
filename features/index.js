/**
 * Feature Loader
 * 
 * Manages global site features that apply to all sites.
 * Features can be toggled in preferences.
 */

import focusStyling from './focus-styling.js';
import focusTransitions from './focus-transitions.js';
import tabindexInjection from './tabindex-injection.js';
import scrollIntoView from './scroll-into-view.js';
import safeArea from './safe-area.js';
import gpuHints from './gpu-hints.js';
import cssReset from './css-reset.js';
import navigationFix from './navigation-fix.js';
import textScale from './text-scale.js';

// Feature registry
var features = {
  focusStyling: focusStyling,
  focusTransitions: focusTransitions,
  tabindexInjection: tabindexInjection,
  scrollIntoView: scrollIntoView,
  safeArea: safeArea,
  gpuHints: gpuHints,
  cssReset: cssReset,
  navigationFix: navigationFix,
  textScale: textScale,
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
    textScale: 'off',
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

  var focusMode = effectiveConfig.focusOutlineMode || (effectiveConfig.focusStyling ? 'on' : 'off');
  if (effectiveConfig.focusStyling === false) {
    focusMode = 'off';
  }
  
  try {
    // Apply scroll-into-view (doesn't need document)
    if (effectiveConfig.scrollIntoView && features.scrollIntoView) {
      if (window.TizenPortal) window.TizenPortal.log('[Features] Applying scrollIntoView');
      features.scrollIntoView.apply();
    }
    
    // Apply document-based features
    if (effectiveConfig.cssReset && features.cssReset) {
      if (window.TizenPortal) window.TizenPortal.log('[Features] Applying cssReset');
      features.cssReset.apply(doc, { hideScrollbars: effectiveConfig.hideScrollbars === true });
    }
    
    if (features.focusStyling) {
      if (focusMode === 'off') {
        if (window.TizenPortal) window.TizenPortal.log('[Features] Removing focusStyling');
        features.focusStyling.remove(doc);
      } else {
        if (window.TizenPortal) window.TizenPortal.log('[Features] Applying focusStyling: ' + focusMode);
        features.focusStyling.apply(doc, focusMode);
      }
    }
    
    if (features.focusTransitions) {
      var transitionMode = effectiveConfig.focusTransitionMode || 'slide';
      var transitionSpeed = effectiveConfig.focusTransitionSpeed || 'medium';
      if (effectiveConfig.focusTransitions === false || transitionMode === 'off') {
        if (window.TizenPortal) window.TizenPortal.log('[Features] Removing focusTransitions');
        features.focusTransitions.remove(doc);
      } else {
        if (window.TizenPortal) window.TizenPortal.log('[Features] Applying focusTransitions: ' + transitionMode + ' / ' + transitionSpeed);
        features.focusTransitions.apply(doc, transitionMode, transitionSpeed);
      }
    }
    
    if (effectiveConfig.gpuHints && features.gpuHints) {
      if (window.TizenPortal) window.TizenPortal.log('[Features] Applying gpuHints');
      features.gpuHints.apply(doc);
    }
    
    if (effectiveConfig.safeArea && features.safeArea) {
      if (window.TizenPortal) window.TizenPortal.log('[Features] Applying safeArea');
      features.safeArea.apply(doc);
    }
    
    if (effectiveConfig.tabindexInjection && features.tabindexInjection) {
      if (window.TizenPortal) window.TizenPortal.log('[Features] Applying tabindexInjection');
      features.tabindexInjection.apply(doc);
    }
    
    if (features.navigationFix) {
      if (effectiveConfig.navigationFix) {
        if (window.TizenPortal) window.TizenPortal.log('[Features] Applying navigationFix');
        features.navigationFix.apply(doc);
      } else if (effectiveConfig.navigationFix === false) {
        if (window.TizenPortal) window.TizenPortal.log('[Features] Removing navigationFix');
        features.navigationFix.remove(doc);
      }
    }
    
    if (features.textScale) {
      var textScaleLevel = effectiveConfig.textScale || 'off';
      if (window.TizenPortal) window.TizenPortal.log('[Features] Applying textScale: ' + textScaleLevel);
      if (textScaleLevel === 'off') {
        if (window.TizenPortal) window.TizenPortal.log('[Features] Removing textScale');
        features.textScale.remove(doc);
      } else {
        if (window.TizenPortal) window.TizenPortal.log('[Features] Applying textScale level: ' + textScaleLevel);
        features.textScale.apply(doc, textScaleLevel);
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
    // Remove all features
    Object.keys(features).forEach(function(key) {
      var feature = features[key];
      if (feature && feature.remove) {
        feature.remove(doc);
      }
    });
    
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
  return Object.keys(features).map(function(key) {
    var feature = features[key];
    return {
      key: key,
      name: feature.name,
      displayName: feature.displayName,
    };
  });
}

export default {
  applyFeatures: applyFeatures,
  removeFeatures: removeFeatures,
  getFeatures: getFeatures,
  getDefaults: getDefaults,
  getConfig: getConfig,
};
