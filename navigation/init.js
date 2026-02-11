/**
 * Navigation System Initializer
 * 
 * Manages the initialization and configuration of the spatial navigation system
 * based on global config, site overrides, and bundle preferences.
 * 
 * THREE NAVIGATION MODES:
 * - directional: New library with cone-based navigation (PREFERRED for most cases)
 * - geometric: New library with strict axis-aligned navigation (for perfect grids)
 * - polyfill: Legacy spatial-navigation-polyfill.js (backwards compatibility/testing ONLY)
 * 
 * Priority order:
 * 1. Bundle required mode (if set)
 * 2. Site override (if set)
 * 3. Bundle preferred mode (if set)
 * 4. Global default from preferences
 */

/**
 * Current navigation mode state
 */
var currentMode = null;
var spatialNavLibraryLoaded = false;

/**
 * Get the effective navigation mode based on priority
 * @param {Object} options
 * @param {string} options.bundleMode - Bundle's preferred/required mode
 * @param {boolean} options.bundleRequired - Whether bundle mode is required
 * @param {string} options.siteMode - Site-specific override
 * @param {string} options.globalMode - Global default from preferences
 * @returns {string} The effective navigation mode
 */
export function getEffectiveMode(options) {
  options = options || {};
  
  // Priority 1: Bundle required mode
  if (options.bundleRequired && options.bundleMode) {
    return options.bundleMode;
  }
  
  // Priority 2: Site override (if not null/undefined)
  if (options.siteMode && options.siteMode !== 'null') {
    return options.siteMode;
  }
  
  // Priority 3: Bundle preferred mode
  if (options.bundleMode && !options.bundleRequired) {
    return options.bundleMode;
  }
  
  // Priority 4: Global default (defaults to 'directional' if not set)
  return options.globalMode || 'directional';
}

/**
 * Initialize the spatial navigation library for geometric/directional modes
 * @returns {boolean} Success
 */
function initSpatialNavigationLibrary() {
  if (spatialNavLibraryLoaded) {
    return true;
  }
  
  try {
    // Check if library is already loaded
    if (window.SpatialNavigation && typeof window.SpatialNavigation.configure === 'function') {
      spatialNavLibraryLoaded = true;
      console.log('TizenPortal [Navigation]: SpatialNavigation library already loaded');
      return true;
    }
    
    // Try to load the library dynamically
    // Note: In production, spatial-navigation.js should be bundled or loaded via script tag
    console.log('TizenPortal [Navigation]: SpatialNavigation library not found, using polyfill');
    return false;
  } catch (err) {
    console.error('TizenPortal [Navigation]: Failed to initialize SpatialNavigation library:', err);
    return false;
  }
}

/**
 * Configure the navigation system for geometric mode
 */
function configureGeometricMode() {
  if (!window.SpatialNavigation) {
    console.warn('TizenPortal [Navigation]: Geometric mode requested but library not available, using polyfill');
    return false;
  }
  
  try {
    window.SpatialNavigation.configure({
      mode: 'geometric',
      fallback: 'none',
    });
    console.log('TizenPortal [Navigation]: Configured for geometric mode');
    return true;
  } catch (err) {
    console.error('TizenPortal [Navigation]: Failed to configure geometric mode:', err);
    return false;
  }
}

/**
 * Configure the navigation system for directional mode
 * @param {Object} options - Optional directional mode settings
 */
function configureDirectionalMode(options) {
  if (!window.SpatialNavigation) {
    console.warn('TizenPortal [Navigation]: Directional mode requested but library not available, using polyfill');
    return false;
  }
  
  try {
    var config = {
      mode: 'directional',
      coneAngle: 30,
      primaryWeight: 1,
      secondaryWeight: 0.5,
      overlapBonus: true,
      rowColumnBias: true,
      fallback: 'nearest',
    };
    
    // Allow override of default settings
    if (options && typeof options === 'object') {
      for (var key in options) {
        if (options.hasOwnProperty(key)) {
          config[key] = options[key];
        }
      }
    }
    
    window.SpatialNavigation.configure(config);
    console.log('TizenPortal [Navigation]: Configured for directional mode', config);
    return true;
  } catch (err) {
    console.error('TizenPortal [Navigation]: Failed to configure directional mode:', err);
    return false;
  }
}

/**
 * Initialize navigation system with the specified mode
 * @param {string} mode - Navigation mode: 'polyfill', 'geometric', or 'directional'
 * @param {Object} options - Optional configuration for directional mode
 * @returns {boolean} Success
 */
export function initializeNavigationMode(mode, options) {
  if (!mode) {
    mode = 'polyfill';
  }
  
  console.log('TizenPortal [Navigation]: Initializing navigation mode:', mode);
  
  // Store current mode
  currentMode = mode;
  
  // For polyfill mode, use the existing spatial-navigation-polyfill
  if (mode === 'polyfill') {
    // Polyfill is already loaded in core/index.js
    console.log('TizenPortal [Navigation]: Using spatial-navigation-polyfill');
    return true;
  }
  
  // For geometric or directional, we need the spatial-navigation library
  if (mode === 'geometric' || mode === 'directional') {
    // Try to initialize the library
    if (!initSpatialNavigationLibrary()) {
      console.warn('TizenPortal [Navigation]: Falling back to polyfill mode');
      currentMode = 'polyfill';
      return false;
    }
    
    // Configure the appropriate mode
    if (mode === 'geometric') {
      return configureGeometricMode();
    } else if (mode === 'directional') {
      return configureDirectionalMode(options);
    }
  }
  
  console.warn('TizenPortal [Navigation]: Unknown mode "' + mode + '", using polyfill');
  currentMode = 'polyfill';
  return false;
}

/**
 * Get the current navigation mode
 * @returns {string} Current mode
 */
export function getCurrentMode() {
  return currentMode || 'polyfill';
}

/**
 * Check if the spatial navigation library is loaded
 * @returns {boolean}
 */
export function isSpatialNavigationLibraryAvailable() {
  return window.SpatialNavigation && typeof window.SpatialNavigation.configure === 'function';
}

/**
 * Apply navigation mode based on current context
 * @param {Object} card - Current card/site configuration
 * @param {Object} bundle - Active bundle
 */
export function applyNavigationMode(card, bundle) {
  // Get bundle navigation preferences
  var bundleMode = null;
  var bundleRequired = false;
  
  if (bundle && bundle.manifest && bundle.manifest.navigationMode) {
    var navConfig = bundle.manifest.navigationMode;
    
    if (typeof navConfig === 'string') {
      // Simple string: preferred mode
      bundleMode = navConfig;
      bundleRequired = false;
    } else if (typeof navConfig === 'object') {
      // Object with mode and required flag
      bundleMode = navConfig.mode || null;
      bundleRequired = navConfig.required === true;
    }
  }
  
  // Get site override
  var siteMode = card && card.navigationMode ? card.navigationMode : null;
  
  // Get global default (null lets getEffectiveMode apply the default)
  var globalMode = null;
  if (window.TizenPortal && window.TizenPortal.config) {
    var features = window.TizenPortal.config.get('tp_features');
    if (features && features.navigationMode) {
      globalMode = features.navigationMode;
    }
  }
  
  // Determine effective mode
  var effectiveMode = getEffectiveMode({
    bundleMode: bundleMode,
    bundleRequired: bundleRequired,
    siteMode: siteMode,
    globalMode: globalMode,
  });
  
  console.log('TizenPortal [Navigation]: Applying navigation mode', {
    bundle: bundleMode,
    bundleRequired: bundleRequired,
    site: siteMode,
    global: globalMode,
    effective: effectiveMode,
  });
  
  // Initialize with the effective mode
  initializeNavigationMode(effectiveMode);
}

/**
 * Initialize navigation with global defaults (for portal page)
 */
export function initializeGlobalNavigation() {
  // Default to 'directional' mode, overridden by global preferences if set
  var globalMode = 'directional';
  
  if (window.TizenPortal && window.TizenPortal.config) {
    var features = window.TizenPortal.config.get('tp_features');
    if (features && features.navigationMode) {
      globalMode = features.navigationMode;
    }
  }
  
  console.log('TizenPortal [Navigation]: Initializing global navigation, mode:', globalMode);
  initializeNavigationMode(globalMode);
}
