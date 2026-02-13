# Userscript Architecture Migration

> **Note:** This is a development artifact documenting the migration to the registry-based userscript system. For current userscript documentation, see the [User Guide](User-Guide.md#userscripts) and [API Reference](Api-Reference.md).

## Overview

This document describes the migration from bundle-based userscripts to a registry-based system completed in the PR for issue "Change the approach to userscripts".

## Problem Statement

The original implementation had userscripts inside bundles, specifically the `userscript-sandbox` bundle. This caused several issues:
- Userscripts were tied to bundle selection
- Complex editing UI needed to manage inline/URL scripts
- Bundle-specific isolation using ID prefixes (e.g., "sandbox-")
- Difficult to apply scripts selectively per-site
- No conflict detection between scripts

## Solution

Migrate all userscripts to a centralized registry with:
- Category-based organization
- Simple enable/disable toggles
- Conflict detection via 'provides' field
- Support for both global and per-site enablement

## Implementation

### 1. Userscript Registry (`features/userscript-registry.js`)

All 20 userscripts from userscript-sandbox are now defined in a central registry with metadata:

```javascript
{
  id: 'readability-booster',
  name: 'TV Readability Booster',
  category: CATEGORIES.ACCESSIBILITY,
  description: 'Optimizes text and interactive elements for TV viewing',
  defaultEnabled: true,
  source: 'inline',
  provides: ['text-enhancement', 'readability'],
  inline: "(function(){ ... })();"
}
```

**Categories:**
- `accessibility` - ♿ Accessibility features
- `reading` - 📖 Reading enhancements
- `video` - 🎬 Video controls
- `navigation` - 🧭 Navigation helpers
- `privacy` - 🔒 Privacy tools
- `experimental` - 🧪 Experimental features

### 2. Config Format Change

**Old format (tp_userscripts):**
```json
{
  "scripts": [
    {
      "id": "us-12345",
      "name": "Custom Script",
      "enabled": true,
      "source": "inline",
      "inline": "...",
      "url": "",
      "cached": "",
      "lastFetched": 0
    }
  ]
}
```

**New format (tp_userscripts_v2):**
```json
{
  "enabled": {
    "readability-booster": true,
    "dark-reading-mode": false,
    "video-speed-controller": true
  },
  "urlCache": {
    "grayscale-mode": {
      "cached": "...",
      "lastFetched": 1234567890
    }
  }
}
```

Benefits:
- Much smaller storage footprint
- Script definitions centralized
- Only enabled state persisted
- URL cache for external scripts

### 3. Execution Engine (`features/userscripts.js`)

Updated to:
- Load script definitions from registry
- Execute based on enabled state from config
- Support per-site toggles via `card.userscriptToggles`
- Check conflicts using 'provides' field

```javascript
// Global enabled
cfg.enabled['dark-reading-mode'] === true

// Per-site override
card.userscriptToggles['dark-reading-mode'] === true
```

### 4. Preferences UI (`ui/preferences.js`)

Completely rebuilt:
- Category headers with emoji labels
- Simple on/off toggles per script
- Section summary shows "Enabled: X of Y"
- Removed ~400 lines of editing code

**Before:**
- Complex editor with rename, source, edit, refresh, remove buttons
- Inline/URL source switching
- Script fetching and caching

**After:**
- Single toggle per script
- Category-organized display
- No editing needed (scripts are predefined)

### 5. Bundle Removal

Removed `bundles/userscript-sandbox` entirely:
- All 20 scripts migrated to registry
- Bundle registry regenerated
- 3 bundles remain: default, audiobookshelf, adblock

## Naming Convention

Userscript IDs now use descriptive names matching their functionality:
- `readability-booster` (was `sandbox-readability`)
- `dark-reading-mode` (was `sandbox-dark-reader`)
- `video-speed-controller` (was `sandbox-video-speed`)
- `cookie-consent` (was `sandbox-cookie-consent`)

This aligns with bundle naming (e.g., `adblock`) and allows for conflict detection.

## Conflict Detection

Scripts declare what features they provide:

```javascript
{
  id: 'dark-reading-mode',
  provides: ['dark-mode', 'reading-mode', 'clutter-removal']
}

{
  id: 'smart-dark-mode',
  provides: ['dark-mode']
}
```

The `checkConflicts()` function can detect if multiple enabled scripts provide the same feature:
- Warns about potential conflicts
- UI can show conflict indicators
- Users can make informed decisions

## Migration Path

### For End Users

When upgrading:
1. Old `tp_userscripts` config is ignored (not deleted for safety)
2. New `tp_userscripts_v2` config created with defaults
3. Only "TV Readability Booster" enabled by default
4. Users can enable other scripts in Preferences

### For Developers

Bundle userscript support removed:
- `bundle.userscripts` no longer supported
- Bundle manifests should not include userscripts
- Use registry system instead

## Remaining Work

### Site Editor UI

The site editor needs updates to show per-site toggles:
- Display userscripts by category like preferences
- Show global vs. site-specific enabled state
- Allow toggling per-site overrides

Current state:
- `card.userscriptToggles` still works
- UI shows old "User Scripts" section
- Needs category-based toggle display

### Data Migration

Add migration from old config:
- Read `tp_userscripts` if exists
- Extract enabled states
- Migrate to `tp_userscripts_v2` format
- Log migration for debugging

### Documentation

Update:
- User guide for new userscripts UI
- Developer guide for registry system
- Architecture docs with new structure
- Remove references to bundle userscripts

### Cleanup

Remove legacy code:
- `isBundleUserscript()` utility (no longer needed)
- Card fields: `userscripts`, `userscriptsByBundle`
- Bundle userscript validation in manifest-validator

## Benefits

1. **Simpler UI**: Toggle on/off vs. complex editing
2. **Less storage**: Only enabled state stored
3. **Better organization**: Category-based grouping
4. **Conflict detection**: Prevent feature overlaps
5. **Consistent naming**: No more "sandbox-" prefix
6. **Centralized definitions**: Single source of truth
7. **Easier maintenance**: Update scripts in one place

## Testing

Manual testing required:
1. Enable/disable scripts in Preferences
2. Verify scripts execute on sites
3. Test per-site toggles (when site editor updated)
4. Check conflict detection
5. Verify URL script caching
6. Test with no scripts enabled
7. Test with all scripts enabled

## Rollback

If issues arise:
1. Old `tp_userscripts` config preserved
2. Can restore userscript-sandbox bundle from git
3. Revert features/userscripts.js changes
4. Restore old preferences UI

## Future Enhancements

Possible improvements:
- Script search/filter in UI
- Script descriptions in tooltips
- Conflict resolution UI
- Custom script upload (cautiously)
- Script sharing between users
- Performance metrics per script
