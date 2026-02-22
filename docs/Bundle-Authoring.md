# TizenPortal Bundle Authoring Guide

> **Version:** 4.0  
> **Date:** February 14, 2026  
> **Status:** Declarative-First Architecture  

---

## ⚡ Quick Start (Minimum Viable Bundle)

Need to create a bundle quickly? Here's all you need:

**1. Create `bundles/my-site/manifest.json`:**
```json
{
  "name": "my-site",
  "displayName": "My Site",
  "version": "1.0.0",
  "description": "TV support for My Site",
  "author": "Your Name"
}
```

**2. Create `bundles/my-site/style.css`:**
```css
/* Viewport lock for TV */
html, body { width: 1920px !important; overflow-x: hidden; }
/* Focus visibility */
*:focus { outline: 3px solid #00a8ff !important; }
```

**3. Create `bundles/my-site/main.js`:**
```js
import myStyles from './style.css';
export default {
  style: myStyles,
  onActivate(window, card) {
    // Make interactive elements focusable
    window.TizenPortal.elements.register({ selector: 'a, button', operation: 'focusable' });
  }
};
```

**4. Run `npm run build`** — that's it! The bundle is automatically discovered, registered, and compiled in.

> 💡 See [Section 3](#3-creating-a-bundle) for the full step-by-step guide and [Section 5](#5-using-core-utilities) for all the things the core can do for you automatically.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Bundle Structure](#2-bundle-structure)
3. [Creating a Bundle](#3-creating-a-bundle)
4. [Lifecycle Hooks](#4-lifecycle-hooks)
   - [Cleanup Best Practices](#41-cleanup-best-practices--critical)
5. [Using Core Utilities](#5-using-core-utilities)
6. [CSS Guidelines](#6-css-guidelines)
7. [JavaScript Guidelines](#7-javascript-guidelines)
8. [Card Registration](#8-card-registration)
   - [Element Registration](#85-element-registration-declarative-manipulation)
9. [Focus Management](#9-focus-management)
10. [Input Handling](#10-input-handling)
11. [Logging & Debugging](#11-logging--debugging)
12. [Example: Audiobookshelf Bundle](#12-example-audiobookshelf-bundle)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Introduction

A **bundle** is a collection of CSS and JavaScript that fixes or enhances a specific website for Tizen TV browsing. Bundles are **compiled into the runtime** and activated based on the card's configuration.

### Modern Declarative Approach

**TizenPortal v1.0+ uses a declarative-first architecture.** Instead of writing imperative DOM manipulation code, you declare what you want and the core handles the implementation:

- ✅ **Declarative element registration** - Register selectors and operations, core observes DOM automatically
- ✅ **Declarative card registration** - Register card selectors, core processes them
- ✅ **Declarative manifest options** - Configure navigation mode, viewport, features via manifest.json

**Benefits:**
- Often reduces repetitive DOM manipulation code
- No manual DOM observation needed
- Automatic handling of dynamic content
- Consistent patterns across all bundles

### What the Core Does For You (Free!)

The TizenPortal core handles a lot automatically — you don't need to implement these yourself:

| Feature | How to use it |
|---------|---------------|
| **Spatial navigation** | Core provides D-pad navigation between focusable elements automatically |
| **DOM observation** | Once you register elements/cards, core watches for new DOM nodes and applies registrations automatically |
| **CSS injection** | Set `style: myStyles` in main.js — core injects it at the right time |
| **Viewport locking** | Set `"viewportLock": true` in manifest.json |
| **Navigation mode** | Optional: set `"navigationMode": "geometric"` (or directional) only when needed |
| **Tabindex injection** | Set `"features": { "tabindexInjection": true }` in manifest.json |
| **Scroll-into-view** | Set `"features": { "scrollIntoView": true }` in manifest.json |
| **Focus outline** | Always active; style configurable via the Focus Outline preference (5 modes: Subtle Blue, Blue Ring, Yellow Ring, Portal Style, White Ring) |
| **Custom navigable selectors** | Call `TizenPortal.features.addNavigableSelector('.my-selector')` — core observer picks them up for new DOM nodes automatically |
| **Card two-level nav** | Register cards via `TizenPortal.cards.register()` — Enter/Back handled automatically |
| **Cleanup on exit** | Registered elements/cards are automatically cleaned up on deactivation |
| **Safe-area inset** | Set `"features": { "safeArea": true }` in manifest.json |
| **Bundle options UI** | Declare `options` in manifest.json — the site editor renders the UI automatically |
| **Payload passing** | Bundle name, options, and settings are passed to the site automatically via URL hash |

### What Bundles Can Do

- **Declare** element manipulations (focusable, styles, classes, attributes)
- **Declare** card interactions (single/multi-action cards)
- **Register custom navigable selectors** via `addNavigableSelector()` so site-specific interactive elements are automatically covered by the global tabindex injection and focus ring system
- Inject CSS to fix layout issues
- Handle custom key events for site-specific actions
- Configure via manifest (navigation mode, viewport lock, etc.)
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
5. Element and card registrations automatically processed

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
  "navigationMode": "geometric",
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
  "navigationMode": "geometric",
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

Implement lifecycle hooks using the **declarative-first approach**:

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
    
    // 1. Register element manipulations (declarative)
    window.TizenPortal.elements.register({
      selector: 'nav a, #menu a',
      operation: 'focusable',
      nav: 'vertical'
    });
    
    window.TizenPortal.elements.register({
      selector: 'button',
      operation: 'focusable'
    });
    
    // 2. Register cards if needed
    window.TizenPortal.cards.register({
      selector: '.media-item',
      type: 'single'
    });
    
    // 3. Custom bundle-specific logic (if needed)
    if (featureX) {
      // Initialize feature X with custom logic
      this.initializeFeatureX();
    }
    
    // Core automatically:
    // - Observes DOM for dynamic content
    // - Processes registrations
    // - Cleans up on deactivation
  },
  
  onDeactivate(window, card) {
    console.log('[my-site] Bundle deactivated');
    // Registrations automatically cleared
    // Only cleanup custom bundle-specific code here
  },
  
  initializeFeatureX: function() {
    // Custom bundle logic
  }
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

## 4.1 Cleanup Best Practices ⚠️ CRITICAL

**ALWAYS clean up global modifications in `onDeactivate` to prevent memory leaks and state pollution.**

When bundles are deactivated (switching to another bundle or returning to portal), **all global modifications must be reversed**. Failure to clean up causes:
- Memory leaks from accumulated event listeners
- Nested interceptors interfering with each other
- Stale state persisting across activations
- Unpredictable behavior when bundle is reactivated

### What Requires Cleanup

| Modification Type | Storage Pattern | Cleanup Method |
|-------------------|-----------------|----------------|
| **Event Listeners** | Store handler references | `removeEventListener` |
| **Timers** | Store timer IDs | `clearInterval`, `clearTimeout` |
| **Observers** | Store observer references | `disconnect()` |
| **DOM Modifications** | Store original prototypes | Restore originals |
| **Request Interception** | Store original XHR/fetch | Restore originals |
| **Injected Elements** | Store element references | `remove()` or `removeChild()` |
| **Global Flags** | Module variables | Reset to defaults |

### Cleanup Pattern

```js
// Module-level state tracking
var eventHandlers = {
  click: null,
  focus: null,
};
var observerInstance = null;
var pollInterval = null;
var originalXHROpen = null;
var targetWindow = null;

export default {
  onActivate(window, card) {
    // Store window reference for cleanup
    targetWindow = window;
    
    // Event listener with stored reference
    eventHandlers.click = function(e) {
      console.log('Clicked');
    };
    document.addEventListener('click', eventHandlers.click);
    
    // Observer with stored reference
    observerInstance = new MutationObserver(function() {
      console.log('DOM changed');
    });
    observerInstance.observe(document.body, { childList: true });
    
    // Timer with stored ID
    pollInterval = setInterval(function() {
      console.log('Polling');
    }, 1000);
    
    // Request interception with stored original
    originalXHROpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url) {
      console.log('XHR:', method, url);
      return originalXHROpen.apply(this, arguments);
    };
  },
  
  onDeactivate(window, card) {
    console.log('Cleaning up...');
    
    // Remove event listeners
    if (eventHandlers.click) {
      document.removeEventListener('click', eventHandlers.click);
      eventHandlers.click = null;
    }
    
    // Disconnect observers
    if (observerInstance) {
      observerInstance.disconnect();
      observerInstance = null;
    }
    
    // Clear timers
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    
    // Restore intercepted methods
    if (originalXHROpen && targetWindow) {
      targetWindow.XMLHttpRequest.prototype.open = originalXHROpen;
      originalXHROpen = null;
    }
    
    targetWindow = null;
  },
};
```

### Real-World Example: Audio Element Cleanup

```js
// Module state
var monitoredAudioElement = null;
var audioHandlers = {
  play: null,
  pause: null,
  error: null,
};

export default {
  onActivate(window, card) {
    var audio = document.getElementById('audio-player');
    if (!audio) return;
    
    // Store element reference
    monitoredAudioElement = audio;
    
    // Add listeners with stored references
    audioHandlers.play = function() { console.log('Playing'); };
    audioHandlers.pause = function() { console.log('Paused'); };
    audioHandlers.error = function() { console.error('Error'); };
    
    audio.addEventListener('play', audioHandlers.play);
    audio.addEventListener('pause', audioHandlers.pause);
    audio.addEventListener('error', audioHandlers.error);
  },
  
  onDeactivate(window, card) {
    if (monitoredAudioElement) {
      // Remove all listeners
      if (audioHandlers.play) {
        monitoredAudioElement.removeEventListener('play', audioHandlers.play);
      }
      if (audioHandlers.pause) {
        monitoredAudioElement.removeEventListener('pause', audioHandlers.pause);
      }
      if (audioHandlers.error) {
        monitoredAudioElement.removeEventListener('error', audioHandlers.error);
      }
      
      monitoredAudioElement = null;
    }
    
    // Reset handler references
    audioHandlers = {
      play: null,
      pause: null,
      error: null,
    };
  },
};
```

### Real-World Example: Request Interception Cleanup

```js
// Module state
var requestState = {
  intercepted: false,
  originalXHROpen: null,
  originalXHRSend: null,
  originalFetch: null,
  targetWindow: null,
};

export default {
  onActivate(window, card) {
    // Guard against duplicate interception
    if (requestState.intercepted) return;
    
    // Store window and originals
    requestState.targetWindow = window;
    requestState.originalXHROpen = window.XMLHttpRequest.prototype.open;
    requestState.originalXHRSend = window.XMLHttpRequest.prototype.send;
    
    // Intercept
    window.XMLHttpRequest.prototype.open = function(method, url) {
      if (shouldBlock(url)) return;
      return requestState.originalXHROpen.apply(this, arguments);
    };
    
    window.XMLHttpRequest.prototype.send = function() {
      return requestState.originalXHRSend.apply(this, arguments);
    };
    
    // Intercept fetch if available
    if (window.fetch && typeof window.fetch === 'function') {
      requestState.originalFetch = window.fetch;
      window.fetch = function(url, options) {
        if (shouldBlock(url)) {
          return Promise.reject(new Error('Blocked'));
        }
        return requestState.originalFetch.apply(this, arguments);
      };
    }
    
    requestState.intercepted = true;
  },
  
  onDeactivate(window, card) {
    if (!requestState.intercepted) return;
    
    var win = requestState.targetWindow;
    if (!win) {
      console.error('Cannot cleanup: targetWindow not available');
      return;
    }
    
    // Restore XHR methods
    if (requestState.originalXHROpen && win.XMLHttpRequest && win.XMLHttpRequest.prototype) {
      win.XMLHttpRequest.prototype.open = requestState.originalXHROpen;
    }
    if (requestState.originalXHRSend && win.XMLHttpRequest && win.XMLHttpRequest.prototype) {
      win.XMLHttpRequest.prototype.send = requestState.originalXHRSend;
    }
    
    // Restore fetch
    if (requestState.originalFetch && win.fetch && typeof win.fetch === 'function') {
      win.fetch = requestState.originalFetch;
    }
    
    // Reset state
    requestState = {
      intercepted: false,
      originalXHROpen: null,
      originalXHRSend: null,
      originalFetch: null,
      targetWindow: null,
    };
  },
};
```

### Cleanup Checklist

Before marking your bundle complete, verify:

- [ ] All `addEventListener` calls have corresponding `removeEventListener` in `onDeactivate`
- [ ] All `setInterval`/`setTimeout` IDs are stored and cleared
- [ ] All `MutationObserver`/`IntersectionObserver` instances are disconnected
- [ ] All prototype modifications (XHR, fetch, DOM methods) are restored
- [ ] All injected style elements are removed
- [ ] All module-level state variables are reset
- [ ] Window/element references are cleared to prevent memory leaks
- [ ] Guard flags prevent duplicate setup on reactivation

**Testing:** Activate your bundle, then switch to another bundle and back. Verify:
1. No console errors
2. No duplicate listeners/observers
3. Expected behavior on reactivation
4. No memory growth over multiple cycles

---

## 5. Using Core Utilities

**Best Practice:** Use declarative registration APIs instead of imperative DOM manipulation.

### Declarative Element Registration (Preferred)

The primary way to manipulate elements in modern bundles:

```js
export default {
  name: 'my-bundle',
  
  onActivate(window, card) {
    // Make navigation elements focusable
    window.TizenPortal.elements.register({
      selector: 'nav a',
      operation: 'focusable',
      nav: 'vertical'
    });
    
    // Hide mobile-only elements
    window.TizenPortal.elements.register({
      selector: '.mobile-only',
      operation: 'hide'
    });
    
    // Style toolbar for TV
    window.TizenPortal.elements.register({
      selector: '#toolbar',
      operation: 'style',
      styles: {
        position: 'fixed',
        top: '0',
        right: '320px'
      },
      important: true
    });
    
    // Core automatically observes DOM and processes elements
    // No manual observation needed!
  },
  
  onDeactivate(window, card) {
    // Element registrations automatically cleared by core
  }
};
```

See [Section 8.5: Element Registration](#85-element-registration-declarative-manipulation) for complete documentation.

### Declarative Card Registration

For sites with multi-element cards (media items, books, etc.):

```js
onActivate(window, card) {
  // Register cards for multi-element interaction
  window.TizenPortal.cards.register({
    selector: '.media-card',
    type: 'multi'  // or 'single', or omit for auto-detect
  });
  
  // Core automatically processes cards and observes DOM
}

onDeactivate(window, card) {
  // Card registrations automatically cleared by core
}
```

**Card Types:**
- **`single`**: Cards with one focusable element (Enter activates immediately)
- **`multi`**: Cards with multiple elements (Enter enters card, Back exits)
- **Auto-detect**: Omit `type` to detect based on focusable children count

See [API Reference - Cards API](Api-Reference.md#5a-cards-api) for complete documentation.

### Focus Utilities (For Special Cases)

Use these for cases that can't be handled declaratively:

```js
import { 
  enableScrollIntoView,
  disableScrollIntoView,
  setInitialFocus,
  lockViewport,
} from '../../focus/manager.js';

export default {
  name: 'my-bundle',
  
  onActivate(window, card) {
    // Enable smooth scroll-into-view for focused elements
    enableScrollIntoView({
      marginTop: 100,
      marginBottom: 100,
    });
    
    // Lock viewport to 1920px (or use manifest.json "viewportLock": true)
    lockViewport();
    
    // Set initial focus on first card
    setInitialFocus(['.card', '.item', 'a']);
  },
  
  onDeactivate(window, card) {
    disableScrollIntoView();
  },
};
```

### Manual DOM Observation (Rarely Needed)

**Note:** Element and card registrations automatically observe DOM. Only use manual observation for custom bundle-specific logic:

```js
import { observeDOM, stopObservingDOM } from '../../focus/manager.js';

onActivate(window, card) {
  // Only for bundle-specific logic that can't use declarative APIs
  var stopObserver = observeDOM(function() {
    // Custom bundle logic here
    updateCustomState();
  });
}

onDeactivate(window, card) {
  stopObservingDOM();
}
```

### Text Input Wrapping

```js
import { wrapTextInputs } from '../../input/text-input.js';

onActivate(window, card) {
  // Make text inputs TV-friendly (or enable globally via features)
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

## 8.5. Element Registration (Declarative Manipulation)

**New in v1050+**: The element registration system provides a declarative way to manipulate DOM elements, significantly reducing bundle code complexity.

### Why Use Element Registration?

Instead of imperative DOM manipulation:

```js
// ❌ Imperative (verbose, error-prone)
var links = document.querySelectorAll('#sidebar a');
for (var i = 0; i < links.length; i++) {
  if (!links[i].hasAttribute('tabindex')) {
    links[i].setAttribute('tabindex', '0');
  }
}
// Need to watch for dynamic content, handle timing issues, etc.
```

Use declarative registration:

```js
// ✅ Declarative (concise, automatic)
TizenPortal.elements.register({
  selector: '#sidebar a',
  operation: 'focusable'
});
// Core handles observation, timing, duplicates automatically
```

### Supported Operations

| Operation | Purpose | Config Options |
|-----------|---------|----------------|
| `focusable` | Make elements keyboard/remote navigable | `nav`, `classes` |
| `class` | Add/remove CSS classes | `classes`, `remove` |
| `attribute` | Set HTML attributes | `attributes` |
| `style` | Apply inline CSS styles | `styles`, `important` |
| `hide` | Hide elements | - |
| `show` | Show elements | - |
| `remove` | Remove elements from DOM | - |

### Basic Examples

#### Making Elements Focusable

```js
onActivate(window, card) {
  // Make toolbar buttons focusable with horizontal navigation
  TizenPortal.elements.register({
    selector: '#toolbar button',
    operation: 'focusable',
    nav: 'horizontal'
  });
  
  // Make siderail links focusable with vertical navigation
  TizenPortal.elements.register({
    selector: '#sidebar a',
    operation: 'focusable',
    nav: 'vertical',
    classes: ['tp-spacing']  // Add spacing class
  });
}
```

#### Adding CSS Classes

```js
// Add utility classes
TizenPortal.elements.register({
  selector: '.card',
  operation: 'class',
  classes: ['tp-card', 'tp-focusable']
});

// Remove classes
TizenPortal.elements.register({
  selector: '.mobile-only',
  operation: 'class',
  classes: ['visible'],
  remove: true
});
```

#### Setting Attributes

```js
// Set ARIA labels for accessibility
TizenPortal.elements.register({
  selector: 'button.icon-only',
  operation: 'attribute',
  attributes: {
    'aria-label': 'Close dialog',
    'role': 'button'
  }
});

// Dynamic attribute values
TizenPortal.elements.register({
  selector: '[data-id]',
  operation: 'attribute',
  attributes: {
    'aria-label': function(element) {
      return 'Item ' + element.getAttribute('data-id');
    }
  }
});
```

#### Applying Inline Styles

```js
// Position toolbar for TV layout
TizenPortal.elements.register({
  selector: '#toolbar',
  operation: 'style',
  styles: {
    position: 'fixed',
    top: '0',
    right: '320px',
    zIndex: '100',
    display: 'flex'
  },
  important: true  // Apply with !important
});

// Note: camelCase is automatically converted to kebab-case
```

#### Hiding/Showing Elements

```js
// Hide mobile keyboard hints
TizenPortal.elements.register({
  selector: '.mobile-keyboard-hint',
  operation: 'hide'
});

// Show desktop-only menus
TizenPortal.elements.register({
  selector: '.desktop-only-menu',
  operation: 'show'
});
```

#### Removing Elements

```js
// Remove ads (use carefully - cannot be undone)
TizenPortal.elements.register({
  selector: '.ad-container',
  operation: 'remove'
});

// Protected elements (html, head, body) cannot be removed
```

### Advanced Patterns

#### Conditional Registration

```js
// Only apply if element meets criteria
TizenPortal.elements.register({
  selector: '.dynamic-content',
  operation: 'focusable',
  condition: function(element) {
    // Only if not already focusable
    return !element.hasAttribute('tabindex');
  }
});
```

#### Scoped Registration

```js
// Limit to specific container
TizenPortal.elements.register({
  selector: 'button',
  operation: 'focusable',
  container: '#main-content'  // Only buttons inside #main-content
});
```

#### Immediate Processing

```js
// Process immediately without debounce
TizenPortal.elements.register({
  selector: '.critical',
  operation: 'focusable',
  immediate: true
});
```

#### Custom Debounce

```js
// Custom debounce delay for performance tuning
TizenPortal.elements.register({
  selector: '.frequent-updates',
  operation: 'class',
  classes: ['styled'],
  debounceMs: 500  // Wait 500ms after last DOM change
});
```

### Automatic Features

The element registration system automatically:

- ✅ **Observes DOM changes** - Detects dynamically added elements
- ✅ **Avoids duplicates** - Tracks processed elements per registration
- ✅ **Debounces processing** - Batches changes for performance
- ✅ **Handles timing** - No need for manual delays or intervals
- ✅ **Cleans up** - Cleared automatically on bundle unload

### Migration Example

**Before (Imperative - 35 lines):**

```js
function setupSiderail() {
  var siderail = document.querySelector('[role="toolbar"]');
  if (!siderail) return;
  
  siderail.setAttribute('data-tp-nav', 'vertical');
  
  var links = siderail.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    if (!links[i].hasAttribute('tabindex')) {
      links[i].setAttribute('tabindex', '0');
    }
  }
  
  var buttons = siderail.querySelectorAll('button');
  for (var i = 0; i < buttons.length; i++) {
    if (!buttons[i].hasAttribute('tabindex')) {
      buttons[i].setAttribute('tabindex', '0');
    }
  }
}

onActivate(window, card) {
  setupSiderail();
  observeDOM(setupSiderail);
}
```

**After (Declarative - 13 lines, 63% reduction):**

```js
onActivate(window, card) {
  // Siderail container
  TizenPortal.elements.register({
    selector: '[role="toolbar"]',
    operation: 'focusable',
    nav: 'vertical'
  });
  
  // Siderail links
  TizenPortal.elements.register({
    selector: '[role="toolbar"] a',
    operation: 'focusable'
  });
  
  // Siderail buttons
  TizenPortal.elements.register({
    selector: '[role="toolbar"] button',
    operation: 'focusable'
  });
  
  // Core handles observation automatically - no manual setup needed
}
```

### Cleanup

Element registrations are automatically cleared when the bundle is unloaded. No manual cleanup needed in `onDeactivate`.

### Performance Considerations

**✅ Good Practices:**
- Use specific selectors (avoid `*`, `div`, etc.)
- Scope to containers when possible
- Use appropriate debounce values for dynamic content

**❌ Avoid:**
- Overly broad selectors matching 100+ elements
- Registering inside loops or frequently called functions
- Using `remove` operation on critical page elements

### When to Use Element Registration vs Imperative Code

**Use Element Registration When:**
- ✅ Common patterns (making elements focusable, adding classes)
- ✅ No bundle-specific logic required
- ✅ Working with dynamic content (SPAs)

**Use Imperative Code When:**
- ⚠️ Complex state management specific to your bundle
- ⚠️ Event handlers with custom business logic
- ⚠️ Computations requiring runtime conditions
- ⚠️ Bundle-specific performance optimizations

### Complete Example

```js
export default {
  name: 'my-bundle',
  
  onActivate(window, card) {
    // Make navigation elements focusable
    TizenPortal.elements.register({
      selector: '#sidebar a',
      operation: 'focusable',
      nav: 'vertical'
    });
    
    TizenPortal.elements.register({
      selector: '#toolbar button',
      operation: 'focusable',
      nav: 'horizontal'
    });
    
    // Style toolbar for TV
    TizenPortal.elements.register({
      selector: '#toolbar',
      operation: 'style',
      styles: {
        position: 'fixed',
        top: '0',
        right: '320px'
      },
      important: true
    });
    
    // Hide mobile elements
    TizenPortal.elements.register({
      selector: '.mobile-hint',
      operation: 'hide'
    });
    
    // Custom logic still uses imperative code
    var player = document.querySelector('audio');
    if (player) {
      player.addEventListener('play', this.handlePlay.bind(this));
    }
  },
  
  onDeactivate(window, card) {
    // Element registrations cleared automatically
    // Only clean up custom imperative code
    var player = document.querySelector('audio');
    if (player) {
      player.removeEventListener('play', this.handlePlay);
    }
  },
  
  handlePlay: function() {
    console.log('Audio playing');
  }
};
```

---

## 9. Focus Management

**Modern Approach:** Use element registration (declarative) instead of imperative DOM manipulation.

### Making Elements Focusable (Declarative - Preferred)

```js
// ✅ Declarative - Recommended
onActivate(window, card) {
  window.TizenPortal.elements.register({
    selector: '.card',
    operation: 'focusable',
    nav: 'vertical'  // Optional navigation direction
  });
  
  // Automatically processes existing and future elements
  // No manual loops or observation needed
}
```

### Making Elements Focusable (Imperative - Legacy)

Only use imperative code for complex bundle-specific logic that can't be expressed declaratively:

```js
// ❌ Imperative - Only for special cases
document.querySelectorAll('.card').forEach(function(el) {
  if (!el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '0');
  }
});
```

### Navigation Direction

```js
// Vertical navigation (up/down)
window.TizenPortal.elements.register({
  selector: 'nav a',
  operation: 'focusable',
  nav: 'vertical'
});

// Horizontal navigation (left/right)
window.TizenPortal.elements.register({
  selector: '#toolbar button',
  operation: 'focusable',
  nav: 'horizontal'
});
```

### Adding CSS Classes

```js
// Add utility classes for styling
window.TizenPortal.elements.register({
  selector: '.card',
  operation: 'class',
  classes: ['tp-card', 'tp-focusable']
});
```

### Conditional Registration

```js
// Only apply to visible elements
window.TizenPortal.elements.register({
  selector: '.dynamic-content',
  operation: 'focusable',
  condition: function(element) {
    return element.offsetParent !== null;  // Is visible
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

**See [Section 8.5: Element Registration](#85-element-registration-declarative-manipulation) for complete API documentation including all operations (focusable, class, attribute, style, hide, show, remove) and advanced patterns.**

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

1. **Elements not receiving tabindex**: call `TizenPortal.features.addNavigableSelector('.my-selector')` in `onDOMReady` — this extends the global list and is picked up by the live observer for any new DOM nodes, with no restart required.
2. **Focus ring not visible**: the global focus-styling feature manages rings — check the user's Focus Outline preference is not set to *Subtle Blue* (lowest visibility). Site CSS using `outline: none !important` is countered by the focus-styling observer which keeps its stylesheet last in `<head>`; if a site still overrides rings, add a bundle CSS rule with `!important` for the `:focus` state.
3. **Dynamic content missing tabindex**: the tabindex injection `MutationObserver` watches `document.body` with `childList + subtree` automatically — if elements are still missed, verify `tabindexInjection` is enabled in the feature toggles.
4. **Verify elements are visible**: `display: none` prevents focus.

### Layout Broken

1. Viewport lock may conflict with site CSS
2. Check for flexbox/grid assumptions
3. Test at exactly 1920px width

### SPA Navigation Issues

1. The tabindex injection `MutationObserver` handles dynamically inserted elements automatically — no manual `observeDOM()` needed for making new elements focusable.
2. If the SPA resets styles or removes custom attributes on route change, use `watchUrlChanges()` (see the Audiobookshelf bundle as a reference) to re-process card registrations after navigation.
3. Check for route change events emitted by the framework if polling is insufficient.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-12 | Initial version (APP mode) |
| 2.0 | 2026-01-20 | MOD mode architecture |
| 3.0 | 2026-01-31 | Universal runtime, core utilities |
| 4.1 | 2026-02-22 | `addNavigableSelector()` API; focus outline expanded to 5 modes; dynamic-content observer always uses live selector list |

---

*End of Bundle Authoring Guide*
