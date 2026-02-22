/**
 * TizenPortal Bundle Loader
 * 
 * Tracks the currently active bundle and provides bundle state management.
 */

import { getBundle, getBundleNames } from '../bundles/registry.js';
import userscriptEngine from '../features/userscripts.js';
import { log, warn } from './utils.js';

/**
 * Currently active bundle instance
 */
var activeBundle = null;

/**
 * Currently active card
 */
var activeCard = null;

/**
 * Set the active bundle
 * @param {Object|null} bundle - Bundle instance
 * @param {Object|null} card - Card that triggered the bundle
 */
export function setActiveBundle(bundle, card) {
  activeBundle = bundle;
  activeCard = card;
}

/**
 * Unload the current bundle
 * @returns {Promise<void>}
 */
export async function unloadBundle() {
  if (!activeBundle) {
    return;
  }

  log('TizenPortal Loader: Unloading bundle "' + (activeBundle.name || 'unknown') + '"');

  try {
    // Call onDeactivate
    if (typeof activeBundle.onDeactivate === 'function') {
      log('TizenPortal Loader: Calling onDeactivate');
      await activeBundle.onDeactivate(window, activeCard);
    }
  } catch (err) {
    warn('TizenPortal Loader: Error in onDeactivate:', err.message);
  }

  try {
    userscriptEngine.clearUserscripts();
  } catch (err2) {
    warn('TizenPortal Loader: Failed to clear userscripts:', err2.message);
  }

  // Clear state
  activeBundle = null;
  activeCard = null;
}

/**
 * Forward keydown event to bundle
 * @param {KeyboardEvent} event
 * @returns {boolean} True if bundle consumed the event
 */
export function handleBundleKeyDown(event) {
  if (!activeBundle) return false;

  try {
    if (typeof activeBundle.onKeyDown === 'function') {
      return activeBundle.onKeyDown(event);
    }
  } catch (err) {
    warn('TizenPortal Loader: Error in onKeyDown:', err.message);
  }

  return false;
}

/**
 * Get the currently active bundle
 * @returns {Object|null}
 */
export function getActiveBundle() {
  return activeBundle;
}

/**
 * Get the active bundle name
 * @returns {string|null}
 */
export function getActiveBundleName() {
  return activeBundle ? (activeBundle.name || 'unknown') : null;
}

/**
 * Get the currently active card
 * @returns {Object|null}
 */
export function getActiveCard() {
  return activeCard;
}

// Legacy export for compatibility - now a no-op
export async function loadBundle() {
  warn('TizenPortal: loadBundle() is deprecated - bundles are applied directly');
  return null;
}

