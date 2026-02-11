/**
 * TizenPortal Bundle Manifest Validator
 * 
 * Validates bundle manifest.json files against the schema.
 */

/**
 * Valid navigation modes
 */
var VALID_NAV_MODES = ['directional', 'geometric', 'polyfill'];

/**
 * Valid viewport lock values
 */
var VALID_VIEWPORT_LOCKS = [true, false, 'force'];

/**
 * Valid option types
 */
var VALID_OPTION_TYPES = ['toggle', 'text', 'url', 'number', 'select', 'color', 'textarea'];

/**
 * Valid feature keys
 */
var VALID_FEATURES = [
  'focusStyling',
  'focusOutlineMode',
  'focusTransitions',
  'focusTransitionMode',
  'focusTransitionSpeed',
  'tabindexInjection',
  'scrollIntoView',
  'safeArea',
  'gpuHints',
  'cssReset',
  'hideScrollbars',
  'wrapTextInputs',
  'uaMode',
];

/**
 * Validate a bundle manifest
 * @param {Object} manifest - Manifest object
 * @param {string} bundleName - Bundle name (for error messages)
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateManifest(manifest, bundleName) {
  var errors = [];
  
  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest is not an object'] };
  }
  
  // Required fields
  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push('Missing or invalid "name" field');
  }
  
  if (!manifest.displayName || typeof manifest.displayName !== 'string') {
    errors.push('Missing or invalid "displayName" field');
  }
  
  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push('Missing or invalid "version" field');
  }
  
  if (!manifest.description || typeof manifest.description !== 'string') {
    errors.push('Missing or invalid "description" field');
  }
  
  // Optional fields with validation
  if (manifest.author !== undefined && typeof manifest.author !== 'string') {
    errors.push('Invalid "author" field (must be string)');
  }
  
  if (manifest.homepage !== undefined && typeof manifest.homepage !== 'string') {
    errors.push('Invalid "homepage" field (must be string)');
  }
  
  // Validate navigationMode
  if (manifest.navigationMode !== undefined) {
    if (typeof manifest.navigationMode === 'string') {
      if (VALID_NAV_MODES.indexOf(manifest.navigationMode) === -1) {
        errors.push('Invalid "navigationMode": "' + manifest.navigationMode + '" (must be one of: ' + VALID_NAV_MODES.join(', ') + ')');
      }
    } else if (typeof manifest.navigationMode === 'object') {
      if (!manifest.navigationMode.mode || VALID_NAV_MODES.indexOf(manifest.navigationMode.mode) === -1) {
        errors.push('Invalid "navigationMode.mode" (must be one of: ' + VALID_NAV_MODES.join(', ') + ')');
      }
      if (manifest.navigationMode.required !== undefined && typeof manifest.navigationMode.required !== 'boolean') {
        errors.push('Invalid "navigationMode.required" (must be boolean)');
      }
    } else {
      errors.push('Invalid "navigationMode" (must be string or object)');
    }
  }
  
  // Validate viewportLock
  if (manifest.viewportLock !== undefined) {
    if (VALID_VIEWPORT_LOCKS.indexOf(manifest.viewportLock) === -1) {
      errors.push('Invalid "viewportLock" (must be one of: true, false, "force")');
    }
  }
  
  // Validate requires/provides arrays
  if (manifest.requires !== undefined) {
    if (!Array.isArray(manifest.requires)) {
      errors.push('Invalid "requires" (must be array)');
    } else {
      for (var i = 0; i < manifest.requires.length; i++) {
        if (typeof manifest.requires[i] !== 'string') {
          errors.push('Invalid "requires[' + i + ']" (must be string)');
        }
      }
    }
  }
  
  if (manifest.provides !== undefined) {
    if (!Array.isArray(manifest.provides)) {
      errors.push('Invalid "provides" (must be array)');
    } else {
      for (var i = 0; i < manifest.provides.length; i++) {
        if (typeof manifest.provides[i] !== 'string') {
          errors.push('Invalid "provides[' + i + ']" (must be string)');
        }
      }
    }
  }
  
  // Validate options array
  if (manifest.options !== undefined) {
    if (!Array.isArray(manifest.options)) {
      errors.push('Invalid "options" (must be array)');
    } else {
      for (var i = 0; i < manifest.options.length; i++) {
        var option = manifest.options[i];
        var optionErrors = validateOption(option, i);
        errors = errors.concat(optionErrors);
      }
    }
  }
  
  // Validate features object
  if (manifest.features !== undefined) {
    if (typeof manifest.features !== 'object' || Array.isArray(manifest.features)) {
      errors.push('Invalid "features" (must be object)');
    } else {
      for (var key in manifest.features) {
        if (manifest.features.hasOwnProperty(key)) {
          if (VALID_FEATURES.indexOf(key) === -1) {
            errors.push('Invalid feature key "' + key + '" (not a recognized feature)');
          }
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

/**
 * Validate a single option object
 * @param {Object} option - Option object
 * @param {number} index - Option index (for error messages)
 * @returns {string[]} Array of error messages
 */
function validateOption(option, index) {
  var errors = [];
  var prefix = 'options[' + index + ']';
  
  if (!option || typeof option !== 'object') {
    return [prefix + ' is not an object'];
  }
  
  // Required fields
  if (!option.key || typeof option.key !== 'string') {
    errors.push(prefix + '.key is required and must be a string');
  }
  
  if (!option.label || typeof option.label !== 'string') {
    errors.push(prefix + '.label is required and must be a string');
  }
  
  if (!option.type || typeof option.type !== 'string') {
    errors.push(prefix + '.type is required and must be a string');
  } else if (VALID_OPTION_TYPES.indexOf(option.type) === -1) {
    errors.push(prefix + '.type "' + option.type + '" is invalid (must be one of: ' + VALID_OPTION_TYPES.join(', ') + ')');
  }
  
  // Optional fields
  if (option.description !== undefined && typeof option.description !== 'string') {
    errors.push(prefix + '.description must be a string');
  }
  
  if (option.placeholder !== undefined && typeof option.placeholder !== 'string') {
    errors.push(prefix + '.placeholder must be a string');
  }
  
  return errors;
}

/**
 * Log validation errors
 * @param {string} bundleName - Bundle name
 * @param {string[]} errors - Array of error messages
 */
export function logValidationErrors(bundleName, errors) {
  console.error('TizenPortal: Bundle "' + bundleName + '" manifest validation failed:');
  for (var i = 0; i < errors.length; i++) {
    console.error('  - ' + errors[i]);
  }
}

/**
 * Validate all bundle manifests
 * @param {Object} bundles - Bundle registry
 * @param {Object} manifests - Manifest registry
 * @returns {boolean} True if all valid
 */
export function validateAllManifests(bundles, manifests) {
  var allValid = true;
  
  for (var name in bundles) {
    if (bundles.hasOwnProperty(name)) {
      var manifest = manifests[name];
      
      if (!manifest) {
        console.warn('TizenPortal: Bundle "' + name + '" has no manifest');
        continue;
      }
      
      var result = validateManifest(manifest, name);
      
      if (!result.valid) {
        allValid = false;
        logValidationErrors(name, result.errors);
      }
    }
  }
  
  return allValid;
}
