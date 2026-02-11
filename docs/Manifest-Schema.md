# TizenPortal Bundle Manifest Schema

> **Version:** 1.0  
> **Date:** February 11, 2026  
> **Status:** Design Document

---

## Overview

This document defines the complete schema for bundle `manifest.json` files. The manifest serves as the single source of truth for bundle metadata, configuration options, and runtime behavior.

---

## Complete Schema

```json
{
  "name": "string (required)",
  "displayName": "string (required)",
  "version": "string (required)",
  "author": "string (optional)",
  "description": "string (required)",
  "homepage": "string (optional)",
  "requires": ["string array (optional)"],
  "provides": ["string array (optional)"],
  "navigationMode": "string | object (optional)",
  "viewportLock": "string | boolean (optional)",
  "options": ["array of option objects (optional)"],
  "features": "object (optional)"
}
```

---

## Field Definitions

### Core Metadata

#### `name` (string, required)
- **Description:** Unique bundle identifier
- **Format:** Lowercase, alphanumeric with hyphens
- **Example:** `"audiobookshelf"`, `"adblock"`
- **Used for:** Bundle lookup, registration, card assignment

#### `displayName` (string, required)
- **Description:** Human-readable bundle name
- **Format:** Title case, any characters
- **Example:** `"Audiobookshelf"`, `"Ad Blocker"`
- **Used for:** UI display, preferences, diagnostics

#### `version` (string, required)
- **Description:** Bundle version number
- **Format:** Semantic versioning (major.minor.patch)
- **Example:** `"1.0.0"`, `"2.1.3"`
- **Used for:** Version tracking, compatibility checks

#### `author` (string, optional)
- **Description:** Bundle author/maintainer
- **Example:** `"TizenPortal"`, `"Community"`
- **Used for:** Attribution, support contacts

#### `description` (string, required)
- **Description:** Brief description of bundle functionality
- **Format:** 1-2 sentences, under 200 characters
- **Example:** `"Media controls, library navigation, and player integration for Audiobookshelf"`
- **Used for:** Bundle selection, documentation

#### `homepage` (string, optional)
- **Description:** URL to bundle or target site homepage
- **Format:** Valid URL
- **Example:** `"https://www.audiobookshelf.org/"`
- **Used for:** Help links, documentation

---

### Capabilities

#### `requires` (array of strings, optional)
- **Description:** Features this bundle requires to function
- **Format:** Array of feature identifiers
- **Example:** `["focus-styling", "tabindex-injection"]`
- **Used for:** Dependency checking, feature enablement

#### `provides` (array of strings, optional)
- **Description:** Features this bundle provides
- **Format:** Array of feature identifiers
- **Example:** `["focus-styling", "focusable-elements", "media-controls"]`
- **Used for:** Feature discovery, bundle selection

---

### Navigation Configuration

#### `navigationMode` (string | object, optional)
- **Description:** Spatial navigation mode preference
- **Format:** 
  - String: `"directional"`, `"geometric"`, or `"polyfill"`
  - Object: `{ "mode": "string", "required": boolean }`
- **Default:** Inherits from global preference if not set
- **Priority:** Bundle required > Site override > Bundle preferred > Global
- **Examples:**
  ```json
  "navigationMode": "directional"
  ```
  ```json
  "navigationMode": {
    "mode": "directional",
    "required": false
  }
  ```
- **Used for:** Navigation system initialization

**Mode Descriptions:**
- `"directional"` - Cone-based navigation (30° arc), forgiving, PREFERRED for most sites
- `"geometric"` - Strict axis-aligned navigation, best for perfect grids
- `"polyfill"` - Legacy spatial-navigation-polyfill.js, backwards compatibility only

---

### Viewport Configuration

#### `viewportLock` (string | boolean, optional)
- **Description:** Controls viewport locking behavior
- **Format:** 
  - Boolean: `true` = lock (default), `false` = unlock
  - String: `"force"` = force lock (prevent user override)
- **Default:** `true` (locked)
- **Examples:**
  ```json
  "viewportLock": true
  ```
  ```json
  "viewportLock": "force"
  ```
- **Used for:** Disabling responsive breakpoints on target site

**Values:**
- `true` - Lock viewport to 1920px (user can override in card settings)
- `false` - Don't lock viewport (allow responsive behavior)
- `"force"` - Force viewport lock (prevent user override)

---

### Bundle Options

#### `options` (array of objects, optional)
- **Description:** User-configurable options for this bundle
- **Format:** Array of option definition objects
- **Used for:** Per-card bundle configuration UI, runtime behavior

**Option Object Schema:**
```json
{
  "key": "string (required)",
  "label": "string (required)",
  "type": "string (required)",
  "default": "any (optional)",
  "placeholder": "string (optional)",
  "description": "string (optional)",
  "validation": "object (optional)"
}
```

**Option Types:**
- `"toggle"` - Boolean on/off switch
- `"text"` - Text input field
- `"url"` - URL input with validation
- `"number"` - Numeric input
- `"select"` - Dropdown selection
- `"color"` - Color picker
- `"textarea"` - Multi-line text

**Example:**
```json
"options": [
  {
    "key": "strict",
    "label": "Strict Mode",
    "type": "toggle",
    "default": false,
    "description": "Enable stricter ad blocking rules"
  },
  {
    "key": "allowlistUrl",
    "label": "Allowlist URL",
    "type": "url",
    "placeholder": "https://example.com/allowlist.txt",
    "description": "URL to custom allowlist file"
  },
  {
    "key": "hideCookieBanners",
    "label": "Hide Cookie Banners",
    "type": "toggle",
    "default": false,
    "description": "Automatically hide cookie consent banners"
  }
]
```

**Access in Bundle:**
```js
onActivate(window, card) {
  const options = card.bundleOptions || {};
  const strictMode = options.strict !== undefined ? options.strict : false;
  const allowlistUrl = card.bundleOptionData?.allowlistUrl || '';
  
  if (strictMode) {
    // Apply strict rules
  }
  
  if (allowlistUrl) {
    // Load allowlist from URL
  }
}
```

---

### Feature Overrides

#### `features` (object, optional)
- **Description:** Default feature overrides for this bundle
- **Format:** Object with feature keys and boolean/string values
- **Used for:** Bundle-specific feature defaults that differ from global

**Available Features:**
```json
"features": {
  "focusStyling": true,
  "focusOutlineMode": "on",
  "focusTransitions": true,
  "focusTransitionMode": "slide",
  "focusTransitionSpeed": "medium",
  "tabindexInjection": true,
  "scrollIntoView": true,
  "safeArea": false,
  "gpuHints": true,
  "cssReset": true,
  "hideScrollbars": false,
  "wrapTextInputs": true,
  "uaMode": "tizen"
}
```

**Example:**
```json
"features": {
  "tabindexInjection": false,
  "scrollIntoView": false,
  "hideScrollbars": true
}
```

**Priority:** Card override > Bundle default > Global preference

---

## Complete Examples

### Minimal Bundle

```json
{
  "name": "my-bundle",
  "displayName": "My Bundle",
  "version": "1.0.0",
  "description": "Basic bundle with focus styling and navigation"
}
```

### Feature Bundle with Options

```json
{
  "name": "adblock",
  "displayName": "Ad Blocker",
  "version": "1.0.0",
  "author": "TizenPortal",
  "description": "Blocks advertisements and tracking scripts for cleaner browsing",
  "provides": ["ad-blocking", "tracker-blocking", "cookie-banner-hiding"],
  "navigationMode": "geometric",
  "viewportLock": false,
  "options": [
    {
      "key": "strict",
      "label": "Strict Mode",
      "type": "toggle",
      "default": false,
      "description": "Enable stricter ad blocking rules"
    },
    {
      "key": "allowlistUrl",
      "label": "Allowlist URL",
      "type": "url",
      "placeholder": "https://example.com/allowlist.txt",
      "description": "URL to custom allowlist file"
    },
    {
      "key": "hideCookieBanners",
      "label": "Hide Cookie Banners",
      "type": "toggle",
      "default": false,
      "description": "Automatically hide cookie consent banners"
    },
    {
      "key": "inlineHeuristics",
      "label": "Inline Ad Heuristics",
      "type": "toggle",
      "default": true,
      "description": "Use heuristics to detect inline ad scripts"
    }
  ],
  "features": {
    "cssReset": false,
    "hideScrollbars": false
  }
}
```

### Site-Specific Bundle

```json
{
  "name": "audiobookshelf",
  "displayName": "Audiobookshelf",
  "version": "1.0.0",
  "author": "TizenPortal",
  "description": "Media controls, library navigation, and player integration for Audiobookshelf",
  "homepage": "https://www.audiobookshelf.org/",
  "requires": ["focus-styling", "media-keys"],
  "provides": ["media-controls", "library-navigation", "player-integration"],
  "navigationMode": {
    "mode": "directional",
    "required": false
  },
  "viewportLock": "force",
  "features": {
    "tabindexInjection": true,
    "scrollIntoView": true,
    "wrapTextInputs": true
  }
}
```

---

## Implementation Notes

### Loading Manifest at Build Time

The manifest should be loaded during the Rollup build and merged with the bundle object:

```js
// rollup.config.js
function generateBundleRegistry() {
  // ... existing code ...
  
  for (var j = 0; j < bundleDirs.length; j++) {
    var name = bundleDirs[j];
    var manifestPath = path.join(bundlesDir, name, 'manifest.json');
    
    if (existsSync(manifestPath)) {
      var manifestContent = readFileSync(manifestPath, 'utf-8');
      // Manifest will be imported and merged at runtime
    }
  }
}
```

### Accessing Manifest in Bundle

```js
// In bundle main.js lifecycle hooks
export default {
  // manifest will be attached automatically at runtime
  
  onActivate(window, card) {
    // Access via this.manifest
    const manifest = this.manifest;
    console.log('Bundle:', manifest.displayName);
    console.log('Version:', manifest.version);
    
    // Or access via bundle reference
    const bundle = TizenPortal.loader.getActiveBundle();
    console.log('Navigation mode:', bundle.manifest.navigationMode);
  }
}
```

### Validation

Runtime should validate manifests on load:
- Required fields present
- Valid navigationMode values
- Valid viewportLock values
- Valid option types
- Valid feature keys

---

## Migration Path

### Phase 1: Add Manifest Loading (v1.1)
- Update rollup.config.js to read manifest.json
- Attach manifest to bundle objects at build time
- No breaking changes (manifests optional)

### Phase 2: Move Metadata (v1.2)
- Move `displayName`, `description`, `author` from main.js to manifest.json
- Update existing bundles
- Deprecation warnings for main.js metadata

### Phase 3: Move Configuration (v1.3)
- Move `navigationMode`, `viewportLock`, `options` from main.js to manifest.json
- Update all bundles
- Remove deprecated main.js properties

### Phase 4: Add Features (v1.4)
- Implement `features` overrides
- Implement `requires`/`provides` dependency system
- Full manifest validation

---

## See Also

- [Bundle Authoring Guide](Bundle-Authoring.md)
- [API Reference](Api-Reference.md)
- [Architecture](Architecture.md)
