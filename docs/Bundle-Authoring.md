# TizenPortal Bundle Authoring Guide

> **Version:** 3.0  
> **Date:** January 31, 2026  
> **Status:** Universal Runtime  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Bundle Structure](#2-bundle-structure)
3. [Creating a Bundle](#3-creating-a-bundle)
4. [Lifecycle Hooks](#4-lifecycle-hooks)
5. [Using Core Utilities](#5-using-core-utilities)
6. [CSS Guidelines](#6-css-guidelines)
7. [JavaScript Guidelines](#7-javascript-guidelines)
8. [Card Registration](#8-card-registration)
9. [Focus Management](#9-focus-management)
10. [Input Handling](#10-input-handling)
11. [Logging & Debugging](#11-logging--debugging)
12. [Example: Audiobookshelf Bundle](#12-example-audiobookshelf-bundle)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Introduction

A **bundle** is a collection of CSS and JavaScript that fixes or enhances a specific website for Tizen TV browsing. Bundles are **compiled into the runtime** and activated based on the card's configuration.

### What Bundles Can Do

- Inject CSS to fix layout issues
- Add keyboard/remote navigation support
- Make elements focusable with proper indicators
- Handle key events for site-specific actions
- Lock viewport to prevent responsive breakpoints
- Log to the diagnostics panel

### What Bundles Cannot Do

- Access other pages/tabs
- Make synchronous blocking network calls
- Persist data outside localStorage

### Architecture

Bundles are compiled into `tizenportal.js` via Rollup. When a user navigates to a site:

1. Payload with `bundleName` passed via URL hash
2. Runtime looks up bundle in compiled registry
3. Bundle CSS injected via `<style>` element
4. Bundle lifecycle hooks called

---

## 2. Bundle Structure

Each bundle is a folder in `bundles/`:

```
bundles/
├── registry.js           # Central bundle registration
└── my-bundle/
    ├── main.js           # Bundle logic (required)
    ├── style.css         # Bundle styles (optional)
    └── manifest.json     # Bundle metadata (required)
```

### manifest.json

**Single source of truth for bundle metadata and configuration.**

The manifest defines all bundle metadata, options, and configuration. See [Manifest Schema](Manifest-Schema.md) for complete documentation.

Minimal example:

```json
{
  "name": "my-bundle",
  "displayName": "My Bundle",
  "version": "1.0.0",
  "description": "Brief description",
  "author": "Your Name"
}
```

With options and configuration:

```json
{
  "name": "my-bundle",
  "displayName": "My Bundle",
  "version": "1.0.0",
  "description": "Bundle description for site selection",
  "author": "Your Name",
  "homepage": "https://example.com/",
  "navigationMode": "directional",
  "viewportLock": true,
  "provides": ["focus-styling", "navigation"],
  "options": [
    {
      "key": "strict",
      "label": "Strict Mode",
      "type": "toggle",
      "default": false,
      "description": "Enable stricter behavior"
    },
    {
      "key": "allowlistUrl",
      "label": "Allowlist URL",
      "type": "url",
      "placeholder": "https://example.com/allowlist.txt",
      "description": "URL to custom allowlist"
    }
  ],
  "features": {
    "tabindexInjection": true,
    "scrollIntoView": true
  }
}
```

**Key Points:**
- Manifest is loaded at build time and attached to bundle
- Accessed via `bundle.manifest` or `this.manifest` in lifecycle hooks
- Only `manifest.name` is mirrored to `bundle.name` for backward compatibility; all other manifest fields remain under `bundle.manifest`
- Fields like `displayName`, `description`, `options`, etc. must be read from `bundle.manifest` (for example, `bundle.manifest.displayName`)
- See [Manifest Schema](Manifest-Schema.md) for all available fields

### main.js

The main entry point that exports the bundle object with lifecycle hooks:

```js
import myStyles from './style.css';

export default {
  // CSS to inject (required if style.css exists)
  style: myStyles,
  
  // Lifecycle hooks
  onActivate(window, card) {
    console.log('Bundle activated');
    
    // Access manifest
    const manifest = this.manifest;
    console.log('Version:', manifest.version);
    
    // Access user options
    const options = card.bundleOptions || {};
    const strict = options.strict !== undefined ? options.strict : false;
    
    if (strict) {
      // Apply strict behavior
    }
  },
  
  onDeactivate(window, card) {
    console.log('Bundle deactivated');
  },
};
```

**⚠️ IMPORTANT: Do NOT add these to main.js (they belong in manifest.json):**
- ❌ `name` - Use `manifest.json`
- ❌ `displayName` - Use `manifest.json`
- ❌ `description` - Use `manifest.json`
- ❌ `options` - Use `manifest.json`
- ❌ `viewportLock` - Use `manifest.json`
- ❌ `navigationMode` - Use `manifest.json`
- ❌ `features` - Use `manifest.json`
- ❌ `requires` - Use `manifest.json`
- ❌ `provides` - Use `manifest.json`

All bundle configuration must be in `manifest.json`. The only properties in `main.js` should be:
- ✅ `style` - CSS import
- ✅ Lifecycle hooks (`onBeforeLoad`, `onAfterLoad`, `onActivate`, `onDeactivate`, `onNavigate`, `onKeyDown`)
- ✅ `userscripts` - Pre-configured userscripts (optional, userscript-sandbox bundle only)

### style.css

CSS that gets injected into the target site:

```css
/* Viewport lock */
html, body {
  width: 1920px !important;
  min-width: 1920px !important;
}

/* Focus indicators */
a:focus, button:focus, [tabindex]:focus {
  outline: 3px solid #00a8ff !important;
  outline-offset: 2px !important;
}
```

---

## 2.1 Bundle Options (Per-Site Settings)

Bundles can declare **options** in `manifest.json` that appear in the Site Editor. These are saved per card and passed to the bundle at runtime.

Supported option types:

- `toggle` — boolean on/off
- `text` — text input field
- `url` — URL input with validation; contents can be fetched
- `number` — numeric input
- `select` — dropdown with fixed list of options
- `color` — color picker
- `textarea` — multi-line text input

Example:

```js
export default {
  name: 'my-bundle',
  options: [
    { key: 'strict', label: 'Strict Mode', type: 'toggle', default: false },
    { key: 'mode', label: 'Mode', type: 'select', options: [
      { value: 'basic', label: 'Basic' },
      { value: 'advanced', label: 'Advanced' },
    ]},
    { key: 'customCss', label: 'Custom CSS', type: 'text' },
    { key: 'allowlistUrl', label: 'Allowlist URL', type: 'url' },
  ]
};
At runtime the selected values are available on the card:

- `card.bundleOptions` — key/value map of option values
- `card.bundleOptionData` — fetched data for `url` options

Use these inside your bundle lifecycle hooks to drive behavior.

---

## 3. Creating a Bundle

### Step 1: Create Bundle Folder

```
bundles/
└── my-site/
    ├── main.js
    ├── style.css
    └── manifest.json
```

### Step 2: Write manifest.json

Define your bundle metadata and configuration:

```json
{
  "name": "my-site",
  "displayName": "My Site",
  "version": "1.0.0",
  "description": "TV support for My Site",
  "author": "Your Name",
  "navigationMode": "directional",
  "viewportLock": true,
  "provides": ["focus-styling", "navigation"],
  "options": [
    {
      "key": "enableFeatureX",
      "label": "Enable Feature X",
      "type": "toggle",
      "default": true,
      "description": "Enable experimental feature X"
    }
  ]
}
```

See [Manifest Schema](Manifest-Schema.md) for all available fields.

### Step 3: Write main.js

Implement lifecycle hooks:

```js
import myStyles from './style.css';

export default {
  // CSS to inject
  style: myStyles,
  
  onActivate(window, card) {
    console.log('[my-site] Bundle activated');
    
    // Access manifest
    console.log('Version:', this.manifest.version);
    console.log('Display Name:', this.manifest.displayName);
    
    // Access options
    const options = card.bundleOptions || {};
    const featureX = options.enableFeatureX !== undefined 
      ? options.enableFeatureX 
      : true; // Use manifest default
    
    if (featureX) {
      // Initialize feature X
    }
    
    // Your initialization code here
  },
  
  onDeactivate(window, card) {
    console.log('[my-site] Bundle deactivated');
    // Cleanup code here
  },
};
```

### Step 4: Build and Test

Bundles are **automatically registered** during build. Just run:

```bash
npm run build
```

The build system:
1. Scans `bundles/` for folders with `main.js`
2. Loads each `manifest.json`
3. Generates `bundles/registry.generated.js`
4. Validates manifests
5. Attaches manifests to bundle objects
6. Bundles everything into `dist/tizenportal.js`

**No manual registration needed!**

---

## 4. Lifecycle Hooks

Bundles can implement lifecycle hooks that are called at different points:

```js
export default {
  style: myStyles,
  
  /**
   * Called before page content loads
   * @param {Window} window - Target site's window object
   * @param {Object} card - Card configuration
   */
  onBeforeLoad(window, card) {
    console.log('Before load:', card.url);
    
    // Access manifest
    console.log('Bundle:', this.manifest.displayName);
  },
  
  /**
   * Called after DOM content loaded
   */
  onAfterLoad(window, card) {
    console.log('After load');
  },
  
  /**
   * Called when bundle is activated (main setup point)
   */
  onActivate(window, card) {
    console.log('Activated');
    // Main initialization here
  },
  
  /**
   * Called when leaving the site
   */
  onDeactivate(window, card) {
    console.log('Deactivated');
    // Cleanup here
  },
  
  /**
   * Called on keydown events
   * @returns {boolean} true to consume event, false to pass through
   */
  onKeyDown(event) {
    if (event.keyCode === 13) { // Enter
      // Custom enter handling
      return true; // Consumed
    }
    return false; // Let default handle
  },
};
```

**Note:** For complete lifecycle hook documentation with detailed examples and use cases, see [API Reference - Bundle Interface](Api-Reference.md#9-bundle-interface).

**Additional lifecycle hooks:**
- `onNavigate(url)` - Called on SPA URL changes (requires manual invocation or URL watching)

---

## 5. Using Core Utilities

**Best Practice:** Import from core modules instead of reimplementing common patterns.

### Focus Utilities

```js
import { 
  enableScrollIntoView,
  disableScrollIntoView,
  setInitialFocus,
  lockViewport,
  observeDOM,
  stopObservingDOM,
} from '../../focus/manager.js';

export default {
  name: 'my-bundle',
  
  onActivate(window, card) {
    // Enable smooth scroll-into-view for focused elements
    enableScrollIntoView({
      marginTop: 100,
      marginBottom: 100,
    });
    
    // Lock viewport to 1920px
    lockViewport();
    
    // Set initial focus on first card
    setInitialFocus(['.card', '.item', 'a']);
    
    // Watch for DOM changes (SPAs)
    observeDOM(function() {
      // Re-process focusable elements when DOM changes
    });
  },
  
  onDeactivate(window, card) {
    disableScrollIntoView();
    stopObservingDOM();
  },
};
```

### Text Input Wrapping

```js
import { wrapTextInputs } from '../../input/text-input.js';

onActivate(window, card) {
  // Make text inputs TV-friendly
  wrapTextInputs();
}
```

### Key Handler Registration

```js
// Access via window.TizenPortal to avoid circular imports
onActivate(window, card) {
  // Register custom key handler (runs BEFORE core handlers)
  window.TizenPortal.input.registerKeyHandler(function(event) {
    if (event.keyCode === 415) { // Play key
      playCurrentItem();
      return true; // Consumed
    }
    return false; // Let core handle
  });
}
```

### Card Registration

For sites with multi-element cards (media items, books, etc.):

```js
onActivate(window, card) {
  // Register cards for multi-element interaction
  window.TizenPortal.cards.register({
    selector: '.media-card',
    type: 'multi'  // or 'single', or omit for auto-detect
  });
  
  // Process cards after a short delay for dynamic content
  setTimeout(function() {
    var count = window.TizenPortal.cards.process();
    console.log('Processed', count, 'cards');
  }, 500);
}

onDeactivate(window, card) {
  // Clean up card registrations
  window.TizenPortal.cards.clear();
}
```

**Card Types:**
- **`single`**: Cards with one focusable element (Enter activates immediately)
- **`multi`**: Cards with multiple elements (Enter enters card, Back exits)
- **Auto-detect**: Omit `type` to detect based on focusable children count

See [API Reference - Cards API](Api-Reference.md#5a-cards-api) for complete documentation.

### Geometry Utilities

```js
import { 
  injectSpacingCSS, 
  SPACING_CLASS,
} from '../../navigation/geometry.js';

onActivate(window, card) {
  // Add spacing between navigable elements
  injectSpacingCSS();
}
```

---

## 6. CSS Guidelines

### Viewport Lock (Required for Most Sites)

```css
/* Force desktop width, disable responsive breakpoints */
html {
  width: 1920px !important;
  min-width: 1920px !important;
  overflow-x: hidden !important;
}

body {
  width: 1920px !important;
  min-width: 1920px !important;
}
```

### Focus Indicators

```css
/* Ensure focusable elements have visible focus */
a:focus,
button:focus,
[role="button"]:focus,
[tabindex]:focus {
  outline: 3px solid #00a8ff !important;
  outline-offset: 2px !important;
}
```

### Hide Mobile-Only Elements

```css
.mobile-nav,
.hamburger-menu,
[class*="mobile-only"] {
  display: none !important;
}
```

### Chrome 47 CSS Limitations

```css
/* ❌ NOT SUPPORTED in Chrome 47 */
display: grid;                  /* Use flexbox */
gap: 10px;                      /* Use margin */
:focus-visible                  /* Use :focus */
var(--custom-property)          /* Use literal values */

/* ✅ SAFE */
display: flex;
margin: 10px;
outline: 2px solid blue;
```

---

## 7. JavaScript Guidelines

### ES5 Compatibility

Babel transpiles your code, but avoid patterns that don't transpile well:

```js
// ❌ AVOID
const { a, b } = obj;           // Destructuring can be verbose
async/await                     // Not supported in Chrome 47

// ✅ PREFER
var a = obj.a;
var b = obj.b;

// Promises work, but not async/await syntax
doSomething().then(function(result) {
  // handle result
});
```

### Error Handling

**CRITICAL:** Uncaught errors crash Tizen. Always wrap code in try-catch:

```js
onActivate(window, card) {
  try {
    this.init();
  } catch (err) {
    console.error('[my-bundle] Init failed:', err.message);
  }
}
```

### DOM Ready Pattern

```js
onActivate(window, card) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', this.init.bind(this));
  } else {
    this.init();
  }
}
```

---

## 8. Card Registration

Mark interactive elements for special handling using `data-tp-card` attribute:

```js
// Mark a simple clickable element
element.setAttribute('data-tp-card', 'single');

// Mark a container with multiple actions
element.setAttribute('data-tp-card', 'multi');
```

**Single Cards:** Enter activates the element directly.

**Multi Cards:** Enter enters the card, allowing navigation within. Escape exits.

### Example

```js
import { registerCards, processCards } from '../../core/cards.js';

onActivate(window, card) {
  // Register card selectors
  registerCards('.book-card', { type: 'single' });
  registerCards('.player-controls', { type: 'multi' });
  
  // Process existing cards
  processCards();
  
  // Watch for new cards
  observeDOM(processCards);
}
```

---

## 9. Focus Management

### Making Elements Focusable

```js
document.querySelectorAll('.card').forEach(function(el) {
  if (!el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '0');
  }
});
```

### Using setInitialFocus

```js
import { setInitialFocus } from '../../focus/manager.js';

// Try selectors in order until one matches
setInitialFocus([
  '.currently-playing',
  '.book-card:first-child',
  'a:first-of-type'
]);
```

### Scroll Into View

```js
import { enableScrollIntoView } from '../../focus/manager.js';

// Enable with margins to keep focused element visible
enableScrollIntoView({
  marginTop: 120,    // Space from top
  marginBottom: 100, // Space from bottom
  marginLeft: 50,
  marginRight: 50,
  behavior: 'smooth' // or 'auto'
});
```

---

## 10. Input Handling

### Key Codes Reference

| Key | Code | Usage |
|-----|------|-------|
| Arrow keys | 37-40 | Navigation |
| Enter | 13 | Confirmation |
| Red | 403 | Address bar |
| Green | 404 | Pointer toggle |
| Yellow | 405 | Preferences (portal) / Return to portal (sites) |
| Blue | 406 | Diagnostics |
| Play | 415 | Media play |
| Pause | 19 | Media pause |
| Play/Pause | 10252 | Toggle |

### Custom Key Handling

```js
onKeyDown(event) {
  switch (event.keyCode) {
    case 415: // Play
      this.play();
      return true;
    case 413: // Stop
      this.stop();
      return true;
    default:
      return false; // Let core handle
  }
}
```

### BACK Button (10009)

The core runtime handles BACK for history navigation and diagnostics close. Bundles should avoid intercepting BACK unless they have a specific, well-tested reason to do so.

---

## 11. Logging & Debugging

### Console Logging

```js
console.log('[my-bundle] Initialized');
console.warn('[my-bundle] Warning:', message);
console.error('[my-bundle] Error:', error);
```

Logs appear in the diagnostics panel (Blue button).

### Using TizenPortal.log

```js
if (window.TizenPortal) {
  window.TizenPortal.log('Bundle initialized');
  window.TizenPortal.warn('Something unusual');
  window.TizenPortal.error('Something failed');
}
```

---

## 12. Example: Audiobookshelf Bundle

The Audiobookshelf bundle demonstrates best practices:

```js
// bundles/audiobookshelf/main.js
import absStyles from './style.css';
import { 
  enableScrollIntoView,
  setInitialFocus,
  lockViewport,
  observeDOM,
} from '../../focus/manager.js';
import { wrapTextInputs } from '../../input/text-input.js';
import { KEYS } from '../../input/keys.js';

var SELECTORS = {
  bookCard: '.book-card, .card',
  playButton: '[data-cy="play-button"]',
  navItem: '.nav-item a',
};

export default {
  name: 'audiobookshelf',
  displayName: 'Audiobookshelf',
  description: 'Enhanced TV support for Audiobookshelf',
  style: absStyles,
  
  onActivate(window, card) {
    try {
      lockViewport();
      enableScrollIntoView({ marginTop: 100, marginBottom: 100 });
      wrapTextInputs();
      this.makeFocusable();
      setInitialFocus([SELECTORS.bookCard, SELECTORS.navItem]);
      observeDOM(this.makeFocusable.bind(this));
    } catch (err) {
      console.error('[audiobookshelf] Activation error:', err);
    }
  },
  
  makeFocusable() {
    document.querySelectorAll(SELECTORS.bookCard).forEach(function(el) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('data-tp-card', 'single');
    });
  },
  
  onKeyDown(event) {
    if (event.keyCode === KEYS.PLAY) {
      var playBtn = document.querySelector(SELECTORS.playButton);
      if (playBtn) {
        playBtn.click();
        return true;
      }
    }
    return false;
  },
};
```

---

## 13. Troubleshooting

### Bundle CSS Not Applied

1. Check that bundle is registered in `registry.js`
2. Verify `style` property exports CSS string
3. Check for CSS syntax errors
4. Look for `!important` conflicts with site CSS

### JavaScript Errors

1. Check console for syntax errors
2. Ensure ES5 compatibility
3. Wrap all code in try-catch
4. Rebuild after changes: `npm run build`

### Focus Not Working

1. Add `tabindex="0"` to elements
2. Check for `outline: none` in site CSS
3. Add `!important` to focus styles
4. Verify elements are visible (not `display: none`)

### Layout Broken

1. Viewport lock may conflict with site CSS
2. Check for flexbox/grid assumptions
3. Test at exactly 1920px width

### SPA Navigation Issues

1. Use `observeDOM()` to watch for changes
2. Re-run initialization on DOM mutations
3. Check for route change events

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-12 | Initial version (APP mode) |
| 2.0 | 2026-01-20 | MOD mode architecture |
| 3.0 | 2026-01-31 | Universal runtime, core utilities |

---

*End of Bundle Authoring Guide*
