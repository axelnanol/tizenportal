/**
 * TizenPortal Bundle Registry
 * 
 * Manages bundle registration and lookup.
 */

import adblockBundle from './adblock/main.js';
import audiobookshelfBundle from './audiobookshelf/main.js';

/**
 * Registered bundles (feature bundles only, no default)
 */
var bundles = {
  'adblock': adblockBundle,
  'audiobookshelf': audiobookshelfBundle,
};

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
    return {
      name: key,
      displayName: bundle.displayName || key,
      description: bundle.description || 'No description available',
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
