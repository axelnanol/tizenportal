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

**Methods:**

```javascript
// Registration
TizenPortal.registry.register(itemDef) // Register a new item

// Retrieval
TizenPortal.registry.getAll() // Get all registered items
TizenPortal.registry.getById(id) // Get item by ID
TizenPortal.registry.getByType(type) // Get items by type
TizenPortal.registry.getByCategory(category) // Get items by category
TizenPortal.registry.getFeatures() // Get all features
TizenPortal.registry.getUserscripts() // Get all userscripts

// Validation
TizenPortal.registry.checkConflicts(enabledIds) // Check for conflicts

// Constants
TizenPortal.registry.ITEM_TYPES // { FEATURE, USERSCRIPT }
TizenPortal.registry.CATEGORIES // Category constants
```

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

1. **Reduced Complexity** - Single registry system instead of two separate implementations
2. **Consistent APIs** - Same verbs and patterns for both features and userscripts
3. **Single Source of Truth** - All enhancements in one place
4. **Enhanced Developer Experience** - Unified patterns make it easier to add new items
5. **Conflict Detection** - Unified conflict detection across all items
6. **Category Organization** - Consistent categorization for UI organization
7. **Full Backward Compatibility** - Existing code continues to work without changes

## Migration Notes

No migration is required for existing code. The unified registry system maintains full backward compatibility with the existing `TizenPortal.features` and `TizenPortal.userscripts` APIs.

However, new features and userscripts should be registered using the unified registry system for consistency.

## Implementation Details

**File Structure:**
- `features/registry.js` - Unified registry implementation
- `features/index.js` - Feature loader (uses registry)
- `features/userscript-registry.js` - Userscript definitions (uses registry)
- `core/index.js` - API exposure

**Registration Count:**
- 9 features registered at startup
- 18 userscripts registered at startup
- Total: 27 items in unified registry

**Key Design Decisions:**
1. Registry uses in-memory array for fast access
2. Items should be treated as read-only once registered (callers must not mutate returned objects)
3. Validation happens at registration time
4. Conflict detection uses `provides` array
5. Features include implementation reference
6. Userscripts include source code inline or URL
7. All items share common metadata structure
