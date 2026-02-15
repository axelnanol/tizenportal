/**
 * Unified Feature/Userscript Registry
 * 
 * Provides a consistent registry-based system for managing both features
 * (core enhancements maintained by project team) and userscripts (user-contributed).
 * 
 * Both types share the same registration, configuration, and lifecycle patterns.
 */

/**
 * Registry item types
 */
var ITEM_TYPES = {
  FEATURE: 'feature',      // Core features (CSS/DOM enhancements)
  USERSCRIPT: 'userscript', // User-contributed scripts
};

/**
 * Categories for UI organization
 */
var CATEGORIES = {
  // Feature categories
  CORE: 'core',
  STYLING: 'styling',
  NAVIGATION: 'navigation',
  PERFORMANCE: 'performance',
  
  // Userscript categories (from userscript-registry.js)
  ACCESSIBILITY: 'accessibility',
  READING: 'reading',
  VIDEO: 'video',
  PRIVACY: 'privacy',
  EXPERIMENTAL: 'experimental',
};

/**
 * Central registry of all items (features + userscripts)
 * Each item has:
 * - id: unique identifier
 * - type: 'feature' or 'userscript'
 * - name: internal name
 * - displayName: UI display name
 * - category: CATEGORIES value for UI grouping
 * - description: short description
 * - defaultEnabled: boolean (default false)
 * - configKeys: array of config keys this item uses (for features with complex config)
 * 
 * For FEATURE type, additional properties:
 * - implementation: reference to feature object with apply(doc, ...args) and remove(doc) methods
 * - applyArgs: function(config) that returns array of args to pass to apply()
 * 
 * For USERSCRIPT type, additional properties:
 * - source: 'inline' or 'url'
 * - inline: inline script code (if source='inline')
 * - url: external URL (if source='url')
 * - provides: array of feature names for conflict detection
 */
var REGISTRY = [];

/**
 * Register an item in the registry
 * @param {Object} item - Item definition
 * @returns {boolean} - Success
 */
function register(item) {
  if (!item || !item.id) {
    console.warn('Registry: Cannot register item without id');
    return false;
  }
  
  if (!item.type || (item.type !== ITEM_TYPES.FEATURE && item.type !== ITEM_TYPES.USERSCRIPT)) {
    console.warn('Registry: Invalid item type:', item.type);
    return false;
  }
  
  // Check for duplicate IDs
  var existing = getById(item.id);
  if (existing) {
    console.warn('Registry: Item already registered:', item.id);
    return false;
  }
  
  // Validate feature-specific requirements
  if (item.type === ITEM_TYPES.FEATURE) {
    if (!item.implementation || typeof item.implementation.apply !== 'function') {
      console.warn('Registry: Feature must have implementation.apply():', item.id);
      return false;
    }
  }
  
  // Validate userscript-specific requirements
  if (item.type === ITEM_TYPES.USERSCRIPT) {
    if (!item.source || (item.source !== 'inline' && item.source !== 'url')) {
      console.warn('Registry: Userscript must have valid source:', item.id);
      return false;
    }
    if (item.source === 'inline' && !item.inline) {
      console.warn('Registry: Inline userscript must have inline code:', item.id);
      return false;
    }
    if (item.source === 'url' && !item.url) {
      console.warn('Registry: URL userscript must have url:', item.id);
      return false;
    }
  }
  
  REGISTRY.push(item);
  return true;
}

/**
 * Query registry with optional filters
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.type] - Filter by ITEM_TYPES value ('feature' or 'userscript')
 * @param {string} [filters.category] - Filter by CATEGORIES value
 * @param {string} [filters.id] - Filter by specific ID
 * @returns {Array} - Array of matching items
 */
function query(filters) {
  if (!filters) {
    return REGISTRY.slice();
  }
  
  var result = [];
  for (var i = 0; i < REGISTRY.length; i++) {
    var item = REGISTRY[i];
    var matches = true;
    
    // Apply type filter
    if (filters.type && item.type !== filters.type) {
      matches = false;
    }
    
    // Apply category filter
    if (matches && filters.category && item.category !== filters.category) {
      matches = false;
    }
    
    // Apply ID filter
    if (matches && filters.id && item.id !== filters.id) {
      matches = false;
    }
    
    if (matches) {
      result.push(item);
    }
  }
  
  return result;
}

/**
 * Get all items (no filters)
 * @returns {Array}
 */
function getAll() {
  return query();
}

/**
 * Get item by ID
 * @param {string} id
 * @returns {Object|null}
 */
function getById(id) {
  var results = query({ id: id });
  return results.length > 0 ? results[0] : null;
}

/**
 * Get items by type
 * @param {string} type - ITEM_TYPES value
 * @returns {Array}
 */
function getByType(type) {
  return query({ type: type });
}

/**
 * Get items by category
 * @param {string} category - CATEGORIES value
 * @param {string} [type] - Optional type filter
 * @returns {Array}
 */
function getByCategory(category, type) {
  var filters = { category: category };
  if (type) {
    filters.type = type;
  }
  return query(filters);
}

/**
 * Get all features
 * @returns {Array}
 */
function getFeatures() {
  return query({ type: ITEM_TYPES.FEATURE });
}

/**
 * Get all userscripts
 * @returns {Array}
 */
function getUserscripts() {
  return query({ type: ITEM_TYPES.USERSCRIPT });
}

/**
 * Get features by category
 * @param {string} category - CATEGORIES value
 * @returns {Array}
 */
function getFeaturesByCategory(category) {
  return query({ type: ITEM_TYPES.FEATURE, category: category });
}

/**
 * Get userscripts by category
 * @param {string} category - CATEGORIES value
 * @returns {Array}
 */
function getUserscriptsByCategory(category) {
  return query({ type: ITEM_TYPES.USERSCRIPT, category: category });
}

/**
 * Check for conflicts between enabled items
 * Returns array of conflicting item IDs
 * @param {Array} enabledIds - Array of enabled item IDs
 * @returns {Array}
 */
function checkConflicts(enabledIds) {
  var providedFeatures = {};
  var conflicts = [];
  
  for (var i = 0; i < enabledIds.length; i++) {
    var item = getById(enabledIds[i]);
    if (!item || !item.provides) continue;
    
    for (var j = 0; j < item.provides.length; j++) {
      var feature = item.provides[j];
      if (providedFeatures[feature]) {
        // Conflict detected
        if (conflicts.indexOf(item.id) === -1) {
          conflicts.push(item.id);
        }
        if (conflicts.indexOf(providedFeatures[feature]) === -1) {
          conflicts.push(providedFeatures[feature]);
        }
      } else {
        providedFeatures[feature] = item.id;
      }
    }
  }
  
  return conflicts;
}

/**
 * Clear registry (for testing)
 */
function clear() {
  REGISTRY.length = 0;
}

export default {
  ITEM_TYPES: ITEM_TYPES,
  CATEGORIES: CATEGORIES,
  
  // Core registry operations
  register: register,
  query: query,
  clear: clear,
  
  // Convenience methods (all delegate to query)
  getAll: getAll,
  getById: getById,
  getByType: getByType,
  getByCategory: getByCategory,
  getFeatures: getFeatures,
  getUserscripts: getUserscripts,
  getFeaturesByCategory: getFeaturesByCategory,
  getUserscriptsByCategory: getUserscriptsByCategory,
  
  // Utility
  checkConflicts: checkConflicts,
};
