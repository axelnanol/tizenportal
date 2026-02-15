/**
 * TizenPortal Security Utilities
 *
 * Shared sanitization and validation helpers.
 * All modules should import from here instead of defining local copies.
 */

/**
 * Escape all five HTML-significant characters.
 * Use this whenever inserting dynamic text into HTML strings.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Check whether a URL string uses an allowed scheme (http or https).
 * Returns false for javascript:, data:, vbscript:, and any other scheme.
 *
 * @param {string} url - The URL to validate (should already be trimmed)
 * @returns {boolean} true if the URL is http:// or https://
 */
export function isValidHttpUrl(url) {
  if (!url || typeof url !== 'string') return false;

  // After trimming, must start with http:// or https://
  var lower = url.toLowerCase().replace(/^\s+/, '');
  return lower.indexOf('http://') === 0 || lower.indexOf('https://') === 0;
}

/**
 * Normalise a user-entered URL, returning null if the result is unsafe.
 *
 * Rules:
 *   - If the string already has a scheme, it must be http(s).
 *   - If no scheme is present, https:// is prepended.
 *   - javascript:, data:, vbscript:, blob: etc. are rejected.
 *
 * @param {string} raw - Raw user input
 * @returns {string|null} Sanitised URL or null if unsafe
 */
export function sanitizeUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;

  var url = raw.trim();
  if (!url) return null;

  // If it contains a scheme delimiter, enforce http(s) only
  if (url.indexOf('://') !== -1 || /^[a-z][a-z0-9+\-.]*:/i.test(url)) {
    return isValidHttpUrl(url) ? url : null;
  }

  // No scheme at all – prepend https://
  return 'https://' + url;
}

/**
 * Validate a CSS hex colour string (e.g. #0d1117).
 * Accepts 3-, 4-, 6- and 8-digit hex values.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidHexColor(value) {
  if (!value || typeof value !== 'string') return false;
  return /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

/**
 * Sanitize a CSS string from an untrusted source.
 *
 * Strips constructs that can exfiltrate data or execute code:
 *   - @import rules (external stylesheet loading)
 *   - url() values (network requests, data: URIs)
 *   - expression() (IE CSS expressions)
 *   - -moz-binding (XBL binding)
 *   - behavior (IE DHTML behaviors)
 *   - javascript: inside any value
 *   - HTML tags that could break out of a <style> context
 *
 * Designed for Chrome 47-69 (Tizen TVs). Legitimate bundle CSS compiled
 * into the build should NOT be passed through this — only untrusted
 * CSS from external payloads (e.g. the #tp= URL hash).
 *
 * @param {string} css - Raw CSS string
 * @returns {string} Sanitised CSS (may be empty if everything was stripped)
 */
export function sanitizeCss(css) {
  if (!css || typeof css !== 'string') return '';

  var sanitized = css;

  // Strip </style> tags that could break out of the style element context
  sanitized = sanitized.replace(/<\/?style[^>]*>/gi, '/* [blocked] */');

  // Strip @import (prevents loading external stylesheets)
  sanitized = sanitized.replace(/@import\s+[^;]+;?/gi, '/* [blocked @import] */');

  // Strip @charset (not dangerous but unnecessary and could confuse parsing)
  sanitized = sanitized.replace(/@charset\s+[^;]+;?/gi, '/* [blocked @charset] */');

  // Strip url(...) values — prevents network exfiltration via background-image,
  // list-style-image, cursor, content, etc.
  // Handles url("..."), url('...'), and url(...)
  sanitized = sanitized.replace(/url\s*\([^)]*\)/gi, '/* [blocked url()] */');

  // Strip expression(...) — IE CSS expressions (execute JS)
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '/* [blocked expression()] */');

  // Strip -moz-binding — Mozilla XBL (execute arbitrary code)
  sanitized = sanitized.replace(/-moz-binding\s*:[^;]+;?/gi, '/* [blocked -moz-binding] */');

  // Strip behavior — IE DHTML behaviors
  sanitized = sanitized.replace(/behavior\s*:[^;]+;?/gi, '/* [blocked behavior] */');

  // Strip any remaining javascript: references
  sanitized = sanitized.replace(/javascript\s*:/gi, '/* [blocked] */');

  // Strip any remaining data: references (could be used for exfiltration via content property)
  sanitized = sanitized.replace(/data\s*:/gi, '/* [blocked] */');

  return sanitized;
}

/**
 * Safely set a localStorage item with quota handling
 *
 * @param {string} key - localStorage key
 * @param {string} value - Value to store
 * @returns {Object} { success: boolean, error: string|null, message: string|null }
 */
export function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return { success: true, error: null, message: null };
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      return {
        success: false,
        error: 'quota',
        message: 'Storage quota exceeded. Consider removing old cards or userscripts.'
      };
    }
    return {
      success: false,
      error: 'unknown',
      message: err.message
    };
  }
}

/**
 * Inject CSS into a document by creating a style element.
 * This is a shared utility to reduce code duplication across features.
 *
 * @param {Document} doc - Target document
 * @param {string} id - Unique ID for the style element
 * @param {string} css - CSS content to inject
 * @returns {boolean} true if successful, false otherwise
 */
export function injectCSS(doc, id, css) {
  if (!doc || !id || typeof css !== 'string') return false;
  
  try {
    var style = doc.createElement('style');
    style.id = id;
    style.textContent = css;
    
    var head = doc.head || doc.documentElement;
    if (head) {
      head.appendChild(style);
      return true;
    }
    return false;
  } catch (err) {
    if (typeof window !== 'undefined' && window.TizenPortal && window.TizenPortal.warn) {
      window.TizenPortal.warn('Failed to inject CSS: ' + err.message);
    } else {
      console.warn('TizenPortal: Failed to inject CSS: ' + err.message);
    }
    return false;
  }
}

/**
 * Remove an injected CSS style element from a document.
 * This is a shared utility to reduce code duplication across features.
 *
 * @param {Document} doc - Target document
 * @param {string} id - ID of the style element to remove
 * @returns {boolean} true if element was found and removed, false otherwise
 */
export function removeCSS(doc, id) {
  if (!doc || !id) return false;
  
  try {
    var style = doc.getElementById(id);
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
      return true;
    }
    return false;
  } catch (err) {
    if (typeof window !== 'undefined' && window.TizenPortal && window.TizenPortal.warn) {
      window.TizenPortal.warn('Failed to remove CSS: ' + err.message);
    } else {
      console.warn('TizenPortal: Failed to remove CSS: ' + err.message);
    }
    return false;
  }
}

/**
 * Ensure object has specified properties, setting them to a default value if missing.
 * Used for card migration to avoid repeated hasOwnProperty checks.
 *
 * @param {Object} obj - Object to check
 * @param {Array<string>} properties - Array of property names to ensure exist
 * @param {*} defaultValue - Default value to set for missing properties (default: null)
 * @returns {boolean} true if any properties were added, false otherwise
 */
export function ensureProperties(obj, properties, defaultValue) {
  if (!obj || typeof obj !== 'object' || !Array.isArray(properties)) {
    return false;
  }
  
  var modified = false;
  var value = defaultValue !== undefined ? defaultValue : null;
  
  for (var i = 0; i < properties.length; i++) {
    if (!obj.hasOwnProperty(properties[i])) {
      obj[properties[i]] = value;
      modified = true;
    }
  }
  
  return modified;
}

/**
 * Get typed value with fallback to default if type doesn't match.
 * Reduces verbose typeof checks throughout the codebase.
 *
 * @param {*} value - Value to check
 * @param {string} expectedType - Expected type ('string', 'number', 'boolean', 'object')
 * @param {*} defaultValue - Default value if type doesn't match
 * @returns {*} The value if type matches, otherwise defaultValue
 */
export function getTypedValue(value, expectedType, defaultValue) {
  return typeof value === expectedType ? value : defaultValue;
}

/**
 * Log with TizenPortal.log fallback to console.log
 * Provides consistent logging across bundles and features.
 *
 * @param {...*} args - Arguments to log
 */
export function log() {
  if (typeof window !== 'undefined' && window.TizenPortal && typeof window.TizenPortal.log === 'function') {
    window.TizenPortal.log.apply(window.TizenPortal, arguments);
  } else if (typeof console !== 'undefined' && typeof console.log === 'function') {
    console.log.apply(console, arguments);
  }
}

/**
 * Warn with TizenPortal.warn fallback to console.warn
 * Provides consistent warning logging across bundles and features.
 *
 * @param {...*} args - Arguments to log as warning
 */
export function warn() {
  if (typeof window !== 'undefined' && window.TizenPortal && typeof window.TizenPortal.warn === 'function') {
    window.TizenPortal.warn.apply(window.TizenPortal, arguments);
  } else if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn.apply(console, arguments);
  }
}
