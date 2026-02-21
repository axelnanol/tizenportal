# Default Bundle

**Version:** 1.0.0  
**Purpose:** Basic fallback bundle with focus styling and focusable elements

## Overview

The Default bundle is automatically applied to sites that don't have a specific bundle configured. It provides essential functionality for TV remote navigation without any site-specific customizations.

**Note:** This bundle is a fallback. For better experiences, use site-specific bundles (Audiobookshelf, etc.) or create custom bundles for your sites.

## Features

### 1. Focus Styling

Provides visual feedback for focused elements:
- Outlines focused elements for visibility
- Ensures users can see where they are navigating
- Compatible with TV remote D-pad navigation

### 2. Focusable Elements

Makes interactive elements keyboard-accessible:
- Automatically adds `tabindex` to clickable elements
- Ensures links, buttons, and inputs are reachable via remote
- No manual configuration required

### 3. Basic Lifecycle Hooks

Implements standard bundle lifecycle:
- `onBeforeLoad` - Called before page content loads
- `onAfterLoad` - Called after page content has loaded
- `onActivate` - Called when bundle is activated
- `onNavigate` - Called when navigation occurs
- `onDeactivate` - Called when bundle is deactivated
- `onKeyDown` - Called on keydown events

All hooks provide logging output for diagnostics.

## Configuration

The default bundle uses:
- **Navigation Mode:** Directional (preferred smart navigation)
- **Features Enabled:**
  - `focusStyling: true`
  - `tabindexInjection: true`

## When to Use

The default bundle is appropriate for:
- **Static websites** - Simple HTML pages without complex JavaScript
- **Content sites** - Blogs, news sites, documentation
- **Temporary testing** - Trying out a new site before creating a custom bundle

## When NOT to Use

Create a custom bundle instead for:
- **Single Page Applications (SPAs)** - React, Vue, Angular apps
- **Media servers** - Plex, Audiobookshelf, etc.
- **Complex web apps** - Admin panels, dashboards, interactive tools
- **Sites with specific navigation patterns** - Modals, dropdowns, custom controls

## Creating Custom Bundles

If the default bundle doesn't work well for your site, create a custom bundle:

1. See the [Bundle Authoring Guide](/docs/Bundle-Authoring.md)
2. Check the [Bundle Navigation Guide](/docs/Bundle-Navigation-Guide.md)
3. Review examples in other bundle folders (adblock, audiobookshelf, userscript-sandbox)

## Manifest

```json
{
  "name": "default",
  "displayName": "Default",
  "version": "1.0.0",
  "author": "TizenPortal",
  "description": "Basic bundle with focus styling and focusable elements. Used as fallback when no site-specific bundle is configured.",
  "requires": [],
  "provides": ["focus-styling", "focusable-elements"],
  "navigationMode": "directional",
  "features": {
    "focusStyling": true,
    "tabindexInjection": true
  }
}
```

## Files

- **main.js** - Bundle logic and lifecycle hooks
- **style.css** - Basic focus styling
- **manifest.json** - Bundle metadata and configuration
- **README.md** - This documentation

## Support

For help with the default bundle:
- Check the [FAQ](/docs/FAQ.md)
- See the [Troubleshooting guide](/docs/Troubleshooting.md)
- Open an issue on GitHub

For creating custom bundles:
- Read the [Bundle Authoring Guide](/docs/Bundle-Authoring.md)
- Review the [API Reference](/docs/Api-Reference.md)
