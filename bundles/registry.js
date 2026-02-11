/**
 * TizenPortal Bundle Registry
 * 
 * Manages bundle registration and lookup.
 */

import { bundles as generatedBundles, bundleMeta as generatedBundleMeta, bundleManifests as generatedManifests } from './registry.generated.js';
import { validateManifest, logValidationErrors } from './manifest-validator.js';

/**
 * Registered bundles (feature bundles only, no default)
 */
var bundles = Object.assign({}, generatedBundles || {});

/**
 * Attach manifests to bundles and validate
 */
if (generatedManifests) {
  Object.keys(generatedManifests).forEach(function(key) {
    if (bundles[key]) {
      var manifest = generatedManifests[key];
      
      // Validate manifest
      var validation = validateManifest(manifest, key);
      if (!validation.valid) {
        logValidationErrors(key, validation.errors);
      }
      
      // Attach manifest to bundle
      bundles[key].manifest = manifest;
      
      // Add name property from manifest for convenience
      bundles[key].name = manifest.name;
    }
  });
}

/**
 * Register a bundle
 * @param {string} name - Bundle name
 * @param {Object} bundle - Bundle object with lifecycle hooks
 */
export function registerBundle(name, bundle) {
  if (!name || typeof name !== 'string') {
    console.error('TizenPortal: Invalid bundle name');
    return;
  }

  if (!bundle || typeof bundle !== 'object') {
    console.error('TizenPortal: Invalid bundle object');
    return;
  }

  bundles[name] = bundle;
  console.log('TizenPortal: Registered bundle:', name);
}

/**
 * Get a bundle by name
 * @param {string} name - Bundle name
 * @returns {Object|null} Bundle or null if not found
 */
export function getBundle(name) {
  return bundles[name] || null;
}

/**
 * Get the default bundle
 * @returns {Object|null}
 * @deprecated Default bundle has been replaced by global features
 */
export function getDefaultBundle() {
  console.warn('TizenPortal: getDefaultBundle is deprecated, use global features instead');
  return null;
}

/**
 * Get all registered feature bundle names
 * @returns {string[]}
 */
export function getBundleNames() {
  return Object.keys(bundles);
}

/**
 * Get list of feature bundles with metadata
 * @returns {Array<Object>}
 */
export function getFeatureBundles() {
  return Object.keys(bundles).map(function(key) {
    var bundle = bundles[key];
    var meta = (generatedBundleMeta && generatedBundleMeta[key]) || {};
    var manifest = bundle.manifest || {};
    return {
      name: key,
      displayName: manifest.displayName || key,
      description: manifest.description || 'No description available',
      jsBytes: meta.jsBytes || 0,
      cssBytes: meta.cssBytes || 0,
    };
  });
}

/**
 * Check if a bundle is registered
 * @param {string} name
 * @returns {boolean}
 */
export function hasBundle(name) {
  return bundles.hasOwnProperty(name);
}

/**
 * Get all capabilities provided by the system
 * @returns {string[]} Array of capability identifiers
 */
export function getSystemCapabilities() {
  var capabilities = [];
  
  // Collect all 'provides' from all bundles
  Object.keys(bundles).forEach(function(key) {
    var bundle = bundles[key];
    var manifest = bundle.manifest;
    if (manifest && manifest.provides && Array.isArray(manifest.provides)) {
      capabilities = capabilities.concat(manifest.provides);
    }
  });
  
  return capabilities;
}

/**
 * Check if bundle dependencies are satisfied
 * @param {string} bundleName - Bundle name to check
 * @returns {Object} { satisfied: boolean, missing: string[] }
 */
export function checkBundleDependencies(bundleName) {
  var bundle = getBundle(bundleName);
  if (!bundle || !bundle.manifest) {
    return { satisfied: true, missing: [] };
  }
  
  var manifest = bundle.manifest;
  if (!manifest.requires || !Array.isArray(manifest.requires) || manifest.requires.length === 0) {
    return { satisfied: true, missing: [] };
  }
  
  var systemCapabilities = getSystemCapabilities();
  var missing = [];
  
  for (var i = 0; i < manifest.requires.length; i++) {
    var required = manifest.requires[i];
    if (systemCapabilities.indexOf(required) === -1) {
      missing.push(required);
    }
  }
  
  return {
    satisfied: missing.length === 0,
    missing: missing
  };
}

/**
 * Log dependency warnings for a bundle
 * @param {string} bundleName - Bundle name
 */
export function logDependencyWarnings(bundleName) {
  var result = checkBundleDependencies(bundleName);
  if (!result.satisfied) {
    console.warn('TizenPortal: Bundle "' + bundleName + '" has missing dependencies:', result.missing.join(', '));
    console.warn('TizenPortal: Bundle may not function correctly without these capabilities');
  }
}
