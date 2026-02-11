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
      
      // Merge manifest properties into bundle for backward compatibility
      // Priority: main.js export > manifest.json
      if (manifest.displayName && !bundles[key].displayName) {
        bundles[key].displayName = manifest.displayName;
      }
      if (manifest.description && !bundles[key].description) {
        bundles[key].description = manifest.description;
      }
      if (manifest.viewportLock !== undefined && bundles[key].viewportLock === undefined) {
        bundles[key].viewportLock = manifest.viewportLock;
      }
      if (manifest.options && !bundles[key].options) {
        bundles[key].options = manifest.options;
      }
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
    return {
      name: key,
      displayName: bundle.displayName || key,
      description: bundle.description || 'No description available',
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
