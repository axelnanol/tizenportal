# Unified Registry System

## Overview

As of version 1054, TizenPortal uses a unified registry system for managing both **features** (core enhancements maintained by the project team) and **userscripts** (user-contributed scripts). This architectural change provides consistency, reduces complexity, and enhances the bundle author experience.

## Architecture

### Registry Structure

The unified registry (`features/registry.js`) manages all items with a consistent structure:

```javascript
{
  id: 'unique-identifier',
  type: 'feature' | 'userscript',
  name: 'internalName',
  displayName: 'Display Name',
  category: 'category',
  description: 'Short description',
  defaultEnabled: false,
  
  // Feature-specific (type='feature')
  configKeys: ['config', 'keys'],
  implementation: { apply(), remove() },
  applyArgs: function(config) { return []; },
  
  // Userscript-specific (type='userscript')
  source: 'inline' | 'url',
  inline: 'script code',
  url: 'https://...',
  provides: ['feature-name'],
}
```

### Categories

Registry items are organized into categories for UI grouping:

**Feature Categories:**
- `core` - Core functionality
- `styling` - Visual enhancements
- `navigation` - Navigation improvements
- `performance` - Performance optimizations

**Userscript Categories:**
- `accessibility` - Accessibility enhancements
- `reading` - Reading mode scripts
- `video` - Video enhancements
- `privacy` - Privacy tools
- `experimental` - Experimental features

## API

### Unified Registry API

The unified registry is exposed via:
- `TizenPortal.registry` - Main registry access
- `TizenPortal.features.registry` - Same instance (for feature context)
- `TizenPortal.userscripts.registry` - Same instance (for userscript context)

**Core Methods:**

```javascript
// Registration
TizenPortal.registry.register(itemDef) // Register a new item

// Unified Query API - Single method with optional filters
TizenPortal.registry.query(filters)    // Query with filters: { type, category, id }
TizenPortal.registry.query()           // Get all items (no filters)
TizenPortal.registry.query({ type: 'feature' })                      // Get all features
TizenPortal.registry.query({ type: 'userscript' })                   // Get all userscripts
TizenPortal.registry.query({ category: 'styling' })                  // Get items by category
TizenPortal.registry.query({ type: 'feature', category: 'styling' }) // Features in category
TizenPortal.registry.query({ id: 'focusStyling' })                  // Get specific item

// Convenience methods (delegate to query)
TizenPortal.registry.getAll()                        // query()
TizenPortal.registry.getById(id)                     // query({ id })
TizenPortal.registry.getByType(type)                 // query({ type })
TizenPortal.registry.getByCategory(category, type)   // query({ category, type })
TizenPortal.registry.getFeatures()                   // query({ type: 'feature' })
TizenPortal.registry.getUserscripts()                // query({ type: 'userscript' })
TizenPortal.registry.getFeaturesByCategory(cat)      // query({ type: 'feature', category })
TizenPortal.registry.getUserscriptsByCategory(cat)   // query({ type: 'userscript', category })

// Validation
TizenPortal.registry.checkConflicts(enabledIds) // Check for conflicts

// Constants
TizenPortal.registry.ITEM_TYPES // { FEATURE, USERSCRIPT }
TizenPortal.registry.CATEGORIES // Category constants
```

### Architecture Principles

1. **Single Query API**: All queries go through `query(filters)` with optional filter parameters
2. **Type-Category Parity**: Features and userscripts are treated identically - both have types and categories
3. **Consistent Filtering**: Same filter parameters work for both types
4. **Convenience Methods**: Simpler methods for common queries, all delegate to `query()`
5. **Zero Duplication**: UI code uses unified query API, no manual filtering needed

### Backward Compatibility

Existing APIs are fully maintained:

```javascript
// Features API (unchanged)
TizenPortal.features.apply(doc, overrides)
TizenPortal.features.remove(doc)
TizenPortal.features.getAll()
TizenPortal.features.getConfig()
TizenPortal.features.getDefaults()

// Userscripts API (unchanged)
TizenPortal.userscripts.getConfig()
TizenPortal.userscripts.setConfig(cfg)
TizenPortal.userscripts.apply(card, bundle)
TizenPortal.userscripts.clear()
TizenPortal.userscripts.getEnabled()
TizenPortal.userscripts.getForPayload()
```

## Registering Items

### Registering a Feature

```javascript
import Registry from './registry.js';
import myFeature from './my-feature.js';

Registry.register({
  id: 'myFeature',
  type: Registry.ITEM_TYPES.FEATURE,
  name: 'myFeature',
  displayName: 'My Feature',
  category: Registry.CATEGORIES.STYLING,
  description: 'My awesome feature',
  defaultEnabled: true,
  configKeys: ['myFeature', 'myFeatureMode'],
  implementation: myFeature,
  applyArgs: function(config) {
    return [config.myFeatureMode || 'default'];
  },
});
```

### Registering a Userscript

```javascript
import Registry from './registry.js';

Registry.register({
  id: 'my-userscript',
  type: Registry.ITEM_TYPES.USERSCRIPT,
  name: 'My Userscript',
  displayName: 'My Userscript',
  category: Registry.CATEGORIES.ACCESSIBILITY,
  description: 'My awesome userscript',
  defaultEnabled: false,
  source: 'inline',
  inline: '(function() { /* code */ })();',
  provides: ['my-feature'],
});
```

## Benefits

1. **Perfect Architecture** - Single unified query API with filter parameters
2. **Type-Category Parity** - Features and userscripts treated identically
3. **Reduced Complexity** - No separate methods for features vs userscripts
4. **Consistent APIs** - Same `query(filters)` pattern throughout
5. **Single Source of Truth** - All enhancements in one registry
6. **Enhanced Developer Experience** - One API to learn, works for everything
7. **Zero Duplication** - UI code has no manual filtering logic
8. **Conflict Detection** - Unified across all item types
9. **Category Organization** - Works identically for features and userscripts

## Query Examples

```javascript
// Get all items
const all = TizenPortal.registry.query();

// Get all features
const features = TizenPortal.registry.query({ type: 'feature' });

// Get all userscripts
const userscripts = TizenPortal.registry.query({ type: 'userscript' });

// Get items in a category (both types)
const stylingItems = TizenPortal.registry.query({ category: 'styling' });

// Get features in a category
const stylingFeatures = TizenPortal.registry.query({ 
  type: 'feature', 
  category: 'styling' 
});

// Get userscripts in a category
const accessibilityScripts = TizenPortal.registry.query({ 
  type: 'userscript', 
  category: 'accessibility' 
});

// Get a specific item
const focusStyling = TizenPortal.registry.query({ id: 'focusStyling' })[0];

// Or use convenience method
const focusStyling = TizenPortal.registry.getById('focusStyling');
```

## Migration Notes

No migration is required for existing code. The unified registry system maintains full backward compatibility with the existing `TizenPortal.features` and `TizenPortal.userscripts` APIs.

New code should use the unified `query()` API for consistency and clarity.

## Implementation Details

**File Structure:**
- `features/registry.js` - Unified registry implementation with query API
- `features/index.js` - Feature loader (uses registry)
- `features/userscript-registry.js` - Userscript definitions (uses registry)
- `core/index.js` - API exposure

**Registration Count:**
- 9 features registered at startup
- 18 userscripts registered at startup
- Total: 27 items in unified registry

**Key Design Decisions:**
1. Single `query(filters)` method handles all queries
2. All convenience methods delegate to `query()`
3. Type and category are treated as equal filter parameters
4. Items should be treated as read-only once registered
5. Validation happens at registration time
6. Conflict detection uses `provides` array
7. Features and userscripts share common metadata structure
