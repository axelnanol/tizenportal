/**
 * TizenPortal Bundle Registry
 * 
 * Manages bundle registration and lookup.
 */

import defaultBundle from './default/main.js';
import adblockBundle from './adblock/main.js';
import audiobookshelfBundle from './audiobookshelf/main.js';
import jellyfinBundle from './jellyfin/main.js';

/**
 * Registered bundles
 */
var bundles = {
  'default': defaultBundle,
  'adblock': adblockBundle,
  'audiobookshelf': audiobookshelfBundle,
  'jellyfin': jellyfinBundle,
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
 * @returns {Object}
 */
export function getDefaultBundle() {
  return bundles['default'];
}

/**
 * Get all registered bundle names
 * @returns {string[]}
 */
export function getBundleNames() {
  return Object.keys(bundles);
}

/**
 * Check if a bundle is registered
 * @param {string} name
 * @returns {boolean}
 */
export function hasBundle(name) {
  return bundles.hasOwnProperty(name);
}
