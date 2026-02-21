# Navigation Mode Configuration Guide

This guide explains how the navigation mode system works in TizenPortal and how to configure it at different levels.

## Table of Contents

1. [Overview](#overview)
2. [Navigation Modes](#navigation-modes)
3. [Configuration Levels](#configuration-levels)
4. [Priority System](#priority-system)
5. [Global Configuration](#global-configuration)
6. [Per-Site Configuration](#per-site-configuration)
7. [Bundle Configuration](#bundle-configuration)
8. [Examples](#examples)
9. [Bundle Author Guide](#bundle-author-guide)
10. [Troubleshooting](#troubleshooting)

---

## Overview

TizenPortal supports three navigation modes:

1. **Directional** - Cone-based navigation (PREFERRED for most use cases)
2. **Geometric** - Strict axis-aligned navigation (enhanced polyfill approach)
3. **Polyfill** - Legacy spatial-navigation-polyfill.js (backwards compatibility/testing ONLY)

The system uses a priority-based approach to determine which mode to use, allowing:
- **Global defaults** - Set in preferences (defaults to Directional)
- **Per-site overrides** - Configure for specific sites
- **Bundle preferences** - Bundles can suggest or require modes

---

## Navigation Modes

### Directional Mode (PREFERRED - Default)

**Best for:** Most use cases, irregular layouts, content-heavy sites, modern TV UIs

Cone-based, forgiving navigation using the new spatial-navigation.js library:
- ✅ ±30° cone filtering from navigation axis
- ✅ Weighted scoring (primary/secondary axes)
- ✅ Overlap bonus for axis-overlapping elements
- ✅ Row/column alignment bias
- ✅ Configurable fallbacks (nearest/wrap)
- ✅ Handles imperfect alignment gracefully
- ✅ "Feels right" for human interaction

**Use when:**
- Site has irregular card layouts
- Mixed card sizes (e.g., 1:1 books, 2:1 series cards)
- Content-dense library views
- Navigation needs to feel natural
- Example: Media libraries, content grids, streaming UIs
- **This is the recommended default for new sites**

**Configuration options:**
```javascript
{
  coneAngle: 30,           // ±30° default
  primaryWeight: 1,        // Distance along direction
  secondaryWeight: 0.5,    // Offset perpendicular
  overlapBonus: true,      // Favor overlapping elements
  rowColumnBias: true,     // Prefer staying in row/column
  fallback: 'nearest'      // 'none' | 'nearest' | 'wrap'
}
```

### Geometric Mode (Enhanced Polyfill)

**Best for:** Perfect grids, uniform layouts, mathematically precise navigation

Strict axis-aligned navigation using the new spatial-navigation.js library:
- ✅ Half-plane filtering perpendicular to direction
- ✅ Euclidean distance + orthogonal penalty scoring
- ✅ No fallbacks (returns null if no candidate)
- ✅ 100% deterministic
- ✅ Perfect for grids with uniform spacing
- ✅ Enhanced version of the polyfill approach

**Use when:**
- Site has a perfect grid layout
- Cards/buttons are uniformly sized and spaced
- You want mathematically correct navigation
- Example: Settings menus, app launchers, uniform grids

**Not ideal for:**
- Irregular layouts
- Mixed card sizes
- Imperfect alignment

### Polyfill Mode (Backwards Compatibility ONLY)

**Best for:** Testing, backwards compatibility, fallback only

The legacy spatial-navigation-polyfill.js (third-party script):
- ✅ Proven compatibility with Chrome 47-69
- ✅ Works with most web layouts
- ⚠️ No configuration options
- ⚠️ Less sophisticated than new library
- ⚠️ Should only be used when absolutely necessary

**Use when:**
- You need to test compatibility with legacy behavior
- New library modes are not working for some reason
- Debugging navigation issues
- **Not recommended for general use**

---

## Configuration Levels

Navigation mode can be configured at three levels:

| Level | Location | Scope | Override |
|-------|----------|-------|----------|
| **Global** | Preferences | All sites by default | Can be overridden |
| **Per-Site** | Site Editor | Specific site only | Overrides global |
| **Bundle** | Bundle Manifest | Sites using bundle | Can override or be overridden |

---

## Priority System

The system uses a strict priority order to determine the effective navigation mode:

```
1. Bundle Required Mode (highest priority - cannot override)
   ↓
2. Site Override (if configured)
   ↓
3. Bundle Preferred Mode (suggestion only)
   ↓
4. Global Default (lowest priority)
```

### Priority Examples

**Example 1: No overrides**
```
Global: polyfill
Site: (not configured)
Bundle: directional (preferred)
→ Result: directional ✓
```

**Example 2: User overrides**
```
Global: geometric
Site: polyfill
Bundle: directional (preferred)
→ Result: polyfill ✓ (site override wins)
```

**Example 3: Bundle requires**
```
Global: polyfill
Site: geometric
Bundle: directional (required)
→ Result: directional ✓ (required cannot be overridden)
```

---

## Global Configuration

### Setting Global Default

1. Open TizenPortal
2. Press **Yellow** button (Preferences)
3. Navigate to **Site Preferences → Navigation**
4. Select **Navigation Mode**
5. Choose: 
   - **Smart Navigation (Directional) - Preferred** (default, recommended)
   - **Grid Navigation (Geometric)** (for perfect grids)
   - **Legacy Polyfill (Compatibility Only)** (not recommended)
6. Auto-saves

**Config location:** `localStorage['tp-configuration']`
```json
{
  "tp_features": {
    "navigationMode": "directional"
  }
}
```

### When Global Default is Used

- Portal page navigation
- Sites with no override configured
- Sites using bundles without navigation preferences
- Fallback when bundle preference is not required

### Recommended Default

**Directional mode** is now the default and is recommended for most users because:
- Works well with both regular and irregular layouts
- Provides natural, forgiving navigation
- Handles imperfect alignment gracefully
- Best overall user experience

Only switch to geometric if you have sites with perfect grids, or to polyfill if you need backwards compatibility.

---

## Per-Site Configuration

### Setting Per-Site Override

1. Open TizenPortal
2. Navigate to a site card
3. Long-press **Enter** (Edit Site)
4. Navigate to **Site Options** section
5. Select **Navigation Mode**
6. Choose: Global (default), TV Remote, Grid Navigation, or Smart Navigation
7. Auto-saves

**Config location:** Card object
```json
{
  "id": "my-site",
  "name": "My Site",
  "url": "https://example.com",
  "navigationMode": "directional"
}
```

### When Per-Site Override is Used

- Overrides global default
- Overrides bundle preferred mode
- Does NOT override bundle required mode

### Use Cases

**Override to Geometric:**
```
Situation: Site has perfect grid but bundle suggests directional
Action: Set site navigationMode to "geometric"
Result: Uses geometric for this site, bundle suggestion ignored
```

**Override to Polyfill:**
```
Situation: Bundle suggests directional but you prefer traditional navigation
Action: Set site navigationMode to "polyfill"
Result: Uses polyfill for this site
```

---

## Bundle Configuration

### Bundle Manifest Schema

Bundles can configure navigation preferences in their `manifest.json`:

**Simple string (preferred mode):**
```json
{
  "name": "my-bundle",
  "navigationMode": "directional"
}
```

**Object with required flag:**
```json
{
  "name": "my-bundle",
  "navigationMode": {
    "mode": "directional",
    "required": false
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `mode` | string | `"polyfill"`, `"geometric"`, or `"directional"` |
| `required` | boolean | `true` = cannot be overridden, `false` = suggestion only |

### When to Use Required

**Use `required: true` when:**
- Bundle breaks without specific navigation mode
- Navigation behavior is critical to bundle functionality
- You've tested thoroughly and mode is essential

**Use `required: false` or omit when:**
- Mode is a suggestion/preference
- Bundle works fine with other modes
- You want users to have flexibility

### Built-in Bundle Configuration

| Bundle | Mode | Required | Reason |
|--------|------|----------|--------|
| **default** | geometric | - | General purpose, enhanced polyfill approach |
| **audiobookshelf** | directional | No | Irregular layouts, content cards, preferred but user can override |
| **adblock** | geometric | - | General purpose, enhanced polyfill approach |
| **userscript-sandbox** | geometric | - | General purpose, enhanced polyfill approach |

**Note:** No built-in bundles use polyfill mode. The new library (geometric/directional) is preferred for all cases.

---

## Examples

### Example 1: Audiobookshelf with Directional Mode

**Scenario:** You're using Audiobookshelf, which has mixed card sizes (square books, wide series).

**Configuration:**
```
Global: directional (default)
Site: (not configured)
Bundle: directional (preferred, not required)
```

**Result:** Uses directional mode
- Cone-based navigation handles irregular layout
- Overlap bonus helps stay in rows
- Row/column bias improves predictability

**How it works:**
1. Audiobookshelf bundle suggests directional mode
2. No site override configured
3. Global default is directional
4. Bundle preference and global default align
5. Directional mode activated

### Example 2: Forcing Geometric for Perfect Grid Site

**Scenario:** A site has a perfect grid layout, you want strict geometric navigation.

**Configuration:**
1. Edit site card
2. Navigate to Site Options → Navigation Mode
3. Select "Grid Navigation (Geometric)"
4. Save

**Result:**
```
Global: directional (default)
Site: geometric
Bundle: directional (preferred) // if using custom bundle
→ Effective: geometric ✓
```

Site override (priority 2) beats bundle preference (priority 3).

### Example 3: Bundle Requires Specific Mode

**Scenario:** You're developing a bundle that relies on directional mode's overlap detection.

**Bundle manifest:**
```json
{
  "name": "my-media-bundle",
  "navigationMode": {
    "mode": "directional",
    "required": true
  }
}
```

**Result:**
```
Global: polyfill
Site: geometric
Bundle: directional (required)
→ Effective: directional ✓
```

Bundle required (priority 1) overrides everything.

---

## Bundle Author Guide

### Choosing a Navigation Mode for Your Bundle

**Questions to ask:**

1. **What layout does the target site use?**
   - Perfect grid → Consider geometric
   - Irregular cards → Consider directional
   - Standard content → Stick with polyfill

2. **Are card sizes uniform?**
   - Yes → Geometric may work well
   - No → Directional handles better

3. **How critical is the mode to functionality?**
   - Critical → Use `required: true`
   - Preference → Use `required: false` or omit

4. **Have you tested with all three modes?**
   - Always test before requiring a specific mode

### Implementation

**Add to manifest.json:**
```json
{
  "name": "my-bundle",
  "displayName": "My Bundle",
  "version": "1.0.0",
  "navigationMode": {
    "mode": "directional",
    "required": false
  }
}
```

**Document in your bundle README:**
```markdown
## Navigation

This bundle prefers **directional mode** for optimal navigation
on [Site Name]'s irregular card layouts. Users can override
this in site settings if desired.
```

### Testing Checklist

- [ ] Test with polyfill mode
- [ ] Test with geometric mode
- [ ] Test with directional mode
- [ ] Verify navigation feels natural
- [ ] Check edge cases (first/last elements)
- [ ] Test with different card counts
- [ ] Document which mode works best

---

## Troubleshooting

### Navigation feels wrong

**Symptom:** Navigation goes to unexpected elements

**Possible causes:**
1. Wrong mode for layout type
2. Bundle preference overriding global
3. Site override set incorrectly

**Solutions:**
1. Check site's Navigation Mode setting in Site Editor
2. Try different modes to find what feels right
3. For perfect grids, try geometric mode
4. For irregular layouts, try directional mode

### Can't override navigation mode

**Symptom:** Changing mode in preferences or site editor has no effect

**Possible cause:** Bundle has `required: true`

**Solution:**
1. Check bundle manifest for `navigationMode.required`
2. If required, mode cannot be overridden
3. Contact bundle author if mode is problematic
4. Consider using a different bundle

### Polyfill works, but geometric/directional doesn't

**Symptom:** Geometric or directional mode falls back to polyfill

**Possible causes:**
1. spatial-navigation.js library not loaded
2. Browser incompatibility
3. Build issue

**Solutions:**
1. Check browser console for errors
2. Verify build included spatial-navigation.js
3. Check TizenPortal version (need 1.0.18+)
4. Fall back to polyfill mode as workaround

### Navigation works on portal but not on sites

**Symptom:** Portal navigation works, site navigation doesn't

**Possible causes:**
1. Site CSS overriding focus styles
2. Site JavaScript interfering with navigation
3. Bundle not applying navigation mode

**Solutions:**
1. Check diagnostics console for navigation init messages
2. Look for "Initializing navigation mode" log entry
3. Verify bundle is activating correctly
4. Try different navigation mode

---

## Developer API

For advanced use cases, the navigation system exposes an API:

```javascript
// Get current navigation mode
TizenPortal.navigation.getCurrentMode()
// Returns: 'polyfill' | 'geometric' | 'directional'

// Check if spatial navigation library is available
TizenPortal.navigation.isSpatialNavigationLibraryAvailable()
// Returns: boolean

// Manually apply navigation mode (advanced)
TizenPortal.navigation.applyNavigationMode(card, bundle)
```

---

## Summary

**Key Takeaways:**

1. ✅ **Three modes:** directional (preferred), geometric (enhanced polyfill), polyfill (compatibility only)
2. ✅ **Default is directional** - Best for most use cases
3. ✅ **Geometric for perfect grids** - Enhanced polyfill approach
4. ✅ **Polyfill only when necessary** - Backwards compatibility/testing only
5. ✅ **Three levels:** global default, per-site override, bundle preference
6. ✅ **Priority order:** bundle required > site override > bundle preferred > global
7. ✅ **User control:** Users can always override (unless bundle requires)
8. ✅ **New library preferred:** Geometric and directional use the enhanced library

**Quick Reference:**

| Scenario | Recommended Mode |
|----------|------------------|
| Default for new users | Directional (automatically set) |
| Most sites | Directional (cone-based, forgiving) |
| Perfect grids/settings | Geometric (strict axis-aligned) |
| Backwards compatibility | Polyfill (only if needed) |
| Irregular layouts | Directional (handles imperfect alignment) |
| Media libraries | Directional (Audiobookshelf example) |
| Testing/debugging | Polyfill (to compare with legacy) |

---

For more information:
- Bundle Navigation Guide: `docs/Bundle-Navigation-Guide.md`
- Navigation Compatibility: `docs/development/NAVIGATION-COMPATIBILITY-SUMMARY.md`
- Spatial Navigation Library: `navigation/README.md`
