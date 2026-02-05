/**
 * Feature Loader
 * 
 * Manages global site features that apply to all sites.
 * Features can be toggled in preferences.
 */

import focusStyling from './focus-styling.js';
import tabindexInjection from './tabindex-injection.js';
import scrollIntoView from './scroll-into-view.js';
import safeArea from './safe-area.js';
import gpuHints from './gpu-hints.js';
import cssReset from './css-reset.js';

// Feature registry
var features = {
  focusStyling: focusStyling,
  tabindexInjection: tabindexInjection,
  scrollIntoView: scrollIntoView,
  safeArea: safeArea,
  gpuHints: gpuHints,
  cssReset: cssReset,
};

/**
 * Get default feature configuration
 * @returns {Object}
 */
function getDefaults() {
  return {
    focusStyling: true,
    tabindexInjection: true,
    scrollIntoView: true,
    safeArea: false,
    gpuHints: true,
    cssReset: true,
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
  if (!stored) {
    stored = getDefaults();
    TizenPortal.config.set('tp_features', stored);
  }
  
  return stored;
}

/**
 * Apply enabled features to an iframe document
 * @param {HTMLIFrameElement} iframe
 */
function applyFeatures(iframe) {
  if (!iframe) return;
  
  var config = getConfig();
  
  try {
    var doc = iframe.contentDocument;
    if (!doc) {
      TizenPortal.warn('Features: No contentDocument (cross-origin?)');
      return;
    }
    
    // Apply scroll-into-view (doesn't need document)
    if (config.scrollIntoView && features.scrollIntoView) {
      features.scrollIntoView.apply();
    }
    
    // Apply document-based features
    if (config.cssReset && features.cssReset) {
      features.cssReset.apply(doc);
    }
    
    if (config.focusStyling && features.focusStyling) {
      features.focusStyling.apply(doc);
    }
    
    if (config.gpuHints && features.gpuHints) {
      features.gpuHints.apply(doc);
    }
    
    if (config.safeArea && features.safeArea) {
      features.safeArea.apply(doc);
    }
    
    if (config.tabindexInjection && features.tabindexInjection) {
      features.tabindexInjection.apply(doc);
    }
    
    TizenPortal.log('Features: Applied to', iframe.src);
  } catch (err) {
    TizenPortal.warn('Features: Failed to apply:', err.message);
  }
}

/**
 * Remove all features from an iframe document
 * @param {HTMLIFrameElement} iframe
 */
function removeFeatures(iframe) {
  if (!iframe) return;
  
  try {
    var doc = iframe.contentDocument;
    if (!doc) return;
    
    // Remove all features
    Object.keys(features).forEach(function(key) {
      var feature = features[key];
      if (feature && feature.remove) {
        feature.remove(doc);
      }
    });
    
    TizenPortal.log('Features: Removed from', iframe.src);
  } catch (err) {
    TizenPortal.warn('Features: Failed to remove:', err.message);
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
