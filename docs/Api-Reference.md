# TizenPortal API Reference

> **Version:** 4.0  
> **Date:** February 14, 2026  
> **Status:** Declarative-First Architecture  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Global API](#2-global-api)
3. [Configuration API](#3-configuration-api)
4. [Input API](#4-input-api)
5. [Focus API](#5-focus-api)
5a. [Cards API](#5a-cards-api)
5b. [Utilities API](#5b-utilities-api)
5c. [Elements API](#5c-elements-api)
6. [Key Constants](#6-key-constants)
7. [Payload Interface](#7-payload-interface)
8. [Card Interface](#8-card-interface)
9. [Bundle Interface](#9-bundle-interface)
10. [Events](#10-events)
11. [Userscript API](#11-userscript-api)

---

## 1. Overview

TizenPortal exposes a unified API via `window.TizenPortal`. The same runtime runs on both the portal page and target sites.

### Access

```js
// Check if TizenPortal is available
if (window.TizenPortal) {
  console.log('TizenPortal', window.TizenPortal.version);
}

// Example usage
TizenPortal.log('Hello from bundle');
TizenPortal.config.read('pointerMode');
```

### Versioning

Version format is 4-digit numeric for easy TV remote entry:

| Format | Example | Meaning |
|--------|---------|---------|
| `XXYY` | `0447` | Major 04, Minor 47 |

```js
// Check version
if (parseInt(TizenPortal.version) >= 300) {
  // Use 3.x features
}
```

---

## 2. Global API

### window.TizenPortal

```typescript
interface TizenPortal {
  // Metadata
  version: string;           // Current version from package.json (e.g., "1018")
  
  // Sub-APIs
  config: ConfigAPI;
  input: InputAPI;
  focus: FocusAPI;
  keys: KeyConstants;
  cards: CardsAPI;
  elements: ElementsAPI;     // Element registration API (v1.0+)
  bundles: BundlesAPI;
  polyfills: PolyfillAPI;
  
  // Navigation
  loadSite: (card: Card) => void;
  closeSite: () => void;
  returnToPortal: () => void;
  getCurrentCard: () => Card | null;
  
  // UI
  showToast: (message: string, duration?: number) => void;
  showLoading: (text: string) => void;
  hideLoading: () => void;
  toggleSiteAddressBar: () => void;
  toggleSiteDiagnostics: () => void;
  
  // Diagnostics
  isDiagnosticsPanelVisible: () => boolean;
  clearDiagnosticsLogs: () => void;
  scrollDiagnosticsLogs: (amount: number) => void;
  cycleDiagnosticsLogFilter: (direction: 1 | -1) => void;
  
  // Logging
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  
  // State
  getState: () => StateObject;
}

interface CardsAPI {
  register: (config: { selector: string; type?: 'single' | 'multi'; container?: string }) => void;
  unregister: (selector: string) => void;
  clear: () => void;
  process: () => number;
  getRegistrations: () => Array<{ selector: string; type: string; container?: string | null }>;
}

interface BundlesAPI {
  list: () => string[];
  getActive: () => any | null;
  getActiveName: () => string | null;
}

interface PolyfillAPI {
  has: (name: string) => boolean;
  loaded: () => string[];
}
```

### TizenPortal.loadSite

Navigate to a site with bundle payload.

```js
TizenPortal.loadSite({
  id: 'abc123',
  name: 'My Server',
  url: 'https://abs.example.com',
  featureBundle: 'audiobookshelf',
  userAgent: 'mobile',
});
```

**What happens:**
1. Builds payload with `bundleName` and `cardName`
2. Encodes payload to base64
3. Navigates to `card.url#tp=BASE64`

### TizenPortal.returnToPortal

Return to the portal launcher.

```js
TizenPortal.returnToPortal();
// Navigates to: https://axelnanol.github.io/tizenportal/dist/index.html
```

### TizenPortal.showToast

Display a toast notification.

```js
TizenPortal.showToast('Card saved');
TizenPortal.showToast('Error occurred', 5000); // 5 second duration
```

### TizenPortal.log / warn / error

Logging functions that output to both console and diagnostics panel.

```js
TizenPortal.log('Site loaded');
TizenPortal.warn('Deprecated feature used');
TizenPortal.error('Failed to load bundle');
```

**Log Levels:**
- `log` - General information (white in diagnostics)
- `warn` - Warnings (yellow in diagnostics)
- `error` - Errors (red in diagnostics)

Logs are captured in a circular buffer and displayed in the diagnostics panel.

### TizenPortal.isDiagnosticsPanelVisible

Check if the diagnostics panel is currently visible.

```js
if (TizenPortal.isDiagnosticsPanelVisible()) {
  TizenPortal.log('Diagnostics is open');
}
```

### TizenPortal.clearDiagnosticsLogs

Clear all logs from the diagnostics panel.

```js
TizenPortal.clearDiagnosticsLogs();
TizenPortal.log('Logs cleared');
```

**Note:** Yellow button in diagnostics also clears logs.

### TizenPortal.scrollDiagnosticsLogs

Scroll the diagnostics log view by the specified amount.

```js
// Scroll down 5 lines
TizenPortal.scrollDiagnosticsLogs(5);

// Scroll up 5 lines
TizenPortal.scrollDiagnosticsLogs(-5);
```

### TizenPortal.cycleDiagnosticsLogFilter

Cycle through log level filters (All → Log → Warn → Error → All).

```js
// Cycle forward
TizenPortal.cycleDiagnosticsLogFilter(1);

// Cycle backward
TizenPortal.cycleDiagnosticsLogFilter(-1);
```

**Filter Levels:**
- **All**: Show all log entries
- **Log**: Show only `log()` entries
- **Warn**: Show only `warn()` entries
- **Error**: Show only `error()` entries

### TizenPortal.getState

Get current runtime state.

```js
const state = TizenPortal.getState();
// {
//   initialized: true,
//   isPortalPage: false,
//   currentCard: { name: 'My Server', ... },
//   currentBundle: 'audiobookshelf',
//   siteActive: true
// }
```

---

## 3. Configuration API

### TizenPortal.config

Configuration management with localStorage persistence.

```typescript
interface ConfigAPI {
  read: (key: string) => any;
  write: (key: string, value: any) => void;
  get: (key: string) => any;          // Alias for read
  set: (key: string, value: any) => void;  // Alias for write
  getAll: () => object;                // Get entire config object
  reset: () => void;                   // Restore default settings
  onChange: (callback: (event: ConfigChangeEvent) => void) => void;
}
```

### config.read

```js
const pointerMode = TizenPortal.config.read('pointerMode');
const customSetting = TizenPortal.config.read('myBundleSetting');
```

### config.write

```js
TizenPortal.config.write('pointerMode', true);
TizenPortal.config.write('myBundleSetting', { enabled: true });
```

### config.onChange

```js
TizenPortal.config.onChange(function(event) {
  console.log('Config changed:', event.key, event.value);
});
```

### config.getAll

Get the entire configuration object.

```js
const allConfig = TizenPortal.config.getAll();
console.log('All settings:', allConfig);
```

### config.reset

Restore all settings to their default values.

```js
TizenPortal.config.reset();
TizenPortal.log('Settings reset to defaults');
```

### Built-in Config Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `pointerMode` | boolean | false | On-screen mouse enabled |
| `focusHighlight` | boolean | true | Focus indicators visible |
| `safeMode` | boolean | false | Safe mode enabled |
| `diagnosticsEnabled` | boolean | false | Debug overlay enabled |
| `lastVisitedUrl` | string | null | Last visited site URL |
| `tp_portal` | object | — | Portal preferences (theme, HUD, color hints) |
| `tp_features` | object | — | Global site feature toggles |
| `tp_userscripts` | object | — | Global userscript configuration |
| `tp_apps` | array | [] | Site card definitions |

### Portal Preferences (`tp_portal`)

```typescript
interface PortalPreferences {
  theme: 'light' | 'dark' | 'auto' | 'portal' | 'backdrop' | 'custom';
  customColor1?: string;          // Hex color for custom theme
  customColor2?: string;          // Hex color for custom theme
  backdropUrl?: string;           // Background image URL
  portalGradient?: boolean;       // Portal theme glow/gradient overlay
  hudPosition: 'off' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  hintsPosition: 'off' | 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}
```

### Feature Toggles (`tp_features`)

```typescript
interface FeatureToggles {
  focusStyling: boolean;          // Global focus styling control
  focusOutlineMode: 'on' | 'high' | 'off';  // Focus outline appearance
  tabindexInjection: boolean;     // Auto-add tabindex to elements
  scrollIntoView: boolean;        // Auto-scroll on focus
  safeArea: boolean;              // Apply TV safe area inset (5%)
  gpuHints: boolean;              // Apply GPU acceleration hints
  cssReset: boolean;              // Apply CSS normalization
  hideScrollbars: boolean;        // Visually hide scrollbars
  wrapTextInputs: boolean;        // Protect text inputs from auto-focus
  viewportMode: 'auto' | 'locked' | 'unlocked';  // Viewport control
  uaMode: 'tizen' | 'desktop' | 'mobile';        // User agent mode
}
```

---

## 4. Input API

### TizenPortal.input

Input state and handler registration.

```typescript
interface InputAPI {
  isPointerMode: () => boolean;
  togglePointer: () => boolean;
  isIMEActive: () => boolean;
  registerKeyHandler: (handler: KeyHandler) => void;
  wrapTextInputs: (selector: string) => number;
  unwrapTextInputs: (selector: string) => void;
  activateInput: (el: HTMLElement) => void;
  deactivateInput: (el: HTMLElement) => void;
}

type KeyHandler = (event: KeyboardEvent) => boolean;
```

### input.isPointerMode

Check if pointer (mouse) mode is active.

```js
if (TizenPortal.input.isPointerMode()) {
  // Pointer mode active - user can click
}
```

### input.isIMEActive

Check if TV keyboard/IME is active.

```js
if (TizenPortal.input.isIMEActive()) {
  // Keyboard active - disable spatial navigation
}
```

### input.registerKeyHandler

Register a custom key handler that runs BEFORE core handlers.

```js
TizenPortal.input.registerKeyHandler(function(event) {
  if (event.keyCode === 415) { // Play key
    playCurrentItem();
    return true; // Consumed - stop propagation
  }
  return false; // Let core handle
});
```

**Return Values:**
- `true` - Event consumed, stop further handling
- `false` - Pass to next handler / core handling

### input.wrapTextInputs

Protect text input elements from auto-opening the on-screen keyboard. User must press Enter to activate.

```js
// Wrap all text inputs
var count = TizenPortal.input.wrapTextInputs('input[type="text"], textarea');
TizenPortal.log('Protected ' + count + ' text inputs');
```

**Returns:** Number of inputs wrapped.

### input.unwrapTextInputs

Remove protection from text inputs.

```js
TizenPortal.input.unwrapTextInputs('input[type="text"]');
```

### input.activateInput

Manually activate a text input (opens on-screen keyboard).

```js
var input = document.querySelector('#search');
TizenPortal.input.activateInput(input);
```

### input.deactivateInput

Manually deactivate a text input (closes on-screen keyboard).

```js
TizenPortal.input.deactivateInput(input);
```

### Pointer Mode Functions

Additional pointer mode utilities (not in main API):

```js
// Get cursor position
var pos = TizenPortal.pointer.getPosition();
// { x: 960, y: 540 }

// Set cursor position
TizenPortal.pointer.setPosition(100, 200);

// Clear hover highlight
TizenPortal.pointer.clearHoverHighlight();
```

---

## 5. Focus API

### TizenPortal.focus

Focus management utilities.

```typescript
interface FocusAPI {
  set: (element: HTMLElement) => void;
  get: () => HTMLElement | null;
  enableScrollIntoView: (options?: ScrollOptions) => void;
  disableScrollIntoView: () => void;
  setScrollEnabled: (enabled: boolean) => void;
  setInitialFocus: (selectors: string[]) => void;
  lockViewport: () => void;
  unlockViewport: () => void;
  observeDOM: (callback: () => void) => void;
  stopObservingDOM: () => void;
}
```

### focus.set / focus.get

```js
// Set focus
TizenPortal.focus.set(document.querySelector('.my-element'));

// Get currently focused element
const focused = TizenPortal.focus.get();
```

### focus.enableScrollIntoView

Enable automatic scroll when focus changes.

```js
TizenPortal.focus.enableScrollIntoView({
  marginTop: 100,
  marginBottom: 100,
  marginLeft: 50,
  marginRight: 50,
  behavior: 'smooth' // or 'auto'
});
```

### focus.setInitialFocus

Set initial focus using selector priority list.

```js
// Tries each selector in order, focuses first match
TizenPortal.focus.setInitialFocus([
  '.currently-playing',
  '.book-card:first-child',
  'a:first-of-type'
]);
```

### focus.lockViewport

Lock viewport to 1920px width.

```js
TizenPortal.focus.lockViewport();
```

### focus.observeDOM

Watch for DOM changes (useful for SPAs).

```js
TizenPortal.focus.observeDOM(function() {
  // Called when DOM changes
  makeFocusable();
});
```

---

## 5a. Cards API

### TizenPortal.cards

Card registration system for multi-element card interactions.

```typescript
interface CardsAPI {
  register: (config: CardRegistration) => void;
  unregister: (selector: string) => void;
  clear: () => void;
  process: () => number;
  getRegistrations: () => Array<CardRegistrationInfo>;
}

interface CardRegistration {
  selector: string;              // CSS selector for card elements
  type?: 'single' | 'multi';     // Interaction type (auto-detected if omitted)
  container?: string;            // CSS selector for focus container
}

interface CardRegistrationInfo {
  selector: string;
  type: 'single' | 'multi';
  container: string | null;
}
```

### cards.register

Register a card pattern for multi-element handling.

```js
// Register book cards that can be entered
TizenPortal.cards.register({
  selector: '.book-card',
  type: 'multi',
  container: '.book-card-inner'
});

// Register with auto-detection
TizenPortal.cards.register({
  selector: '.media-item'
});
```

**Card Types:**
- **`single`**: Cards with one interactive element (Enter activates immediately)
- **`multi`**: Cards with multiple interactive elements (Enter enters card, Back exits)

### cards.unregister

Remove a card registration.

```js
TizenPortal.cards.unregister('.book-card');
```

### cards.clear

Remove all card registrations.

```js
TizenPortal.cards.clear();
```

### cards.process

Process registered cards and make them focusable. Returns the number of cards processed.

```js
const count = TizenPortal.cards.process();
TizenPortal.log('Processed ' + count + ' cards');
```

### Card Interaction Model

The card system provides a two-level navigation model:

**Single-Action Cards:**
- Contain one focusable element (button, link, etc.)
- Pressing Enter activates the element immediately
- No entering/exiting behavior

**Multi-Action Cards:**
- Contain multiple focusable elements (play, info, menu, etc.)
- Pressing Enter "enters" the card and focuses first element
- Use arrow keys to navigate between elements
- Pressing Back "exits" the card
- **Example:** Media cards with play, info, and options buttons

### Example: Media Library

```js
// Register album cards with multiple actions
TizenPortal.cards.register({
  selector: '.album-card',
  type: 'multi'
});

// Process cards after page load
setTimeout(function() {
  var count = TizenPortal.cards.process();
  TizenPortal.log('Made ' + count + ' albums focusable');
}, 500);

// Cleanup on deactivation
userscript.cleanup = function() {
  TizenPortal.cards.clear();
};
```

---

## 5b. Utilities API

TizenPortal provides utility functions for common tasks.

### TizenPortal.utils

```typescript
interface UtilsAPI {
  escapeHtml: (str: string) => string;
  isValidHttpUrl: (url: string) => boolean;
  sanitizeUrl: (raw: string) => string;
  isValidHexColor: (value: string) => boolean;
  sanitizeCss: (css: string) => string;
}
```

### utils.escapeHtml

Escape HTML special characters to prevent XSS.

```js
var safe = TizenPortal.utils.escapeHtml(userInput);
element.textContent = safe;  // Safe to use
```

### utils.isValidHttpUrl

Validate if a string is a valid HTTP/HTTPS URL.

```js
if (TizenPortal.utils.isValidHttpUrl(input)) {
  window.location.href = input;
}
```

### utils.sanitizeUrl

Sanitize and validate a URL, returning safe version or '#'.

```js
var safeUrl = TizenPortal.utils.sanitizeUrl(userInput);
link.href = safeUrl;
```

### utils.isValidHexColor

Check if a string is a valid hex color code.

```js
if (TizenPortal.utils.isValidHexColor(input)) {
  element.style.backgroundColor = input;
}
```

### utils.sanitizeCss

Sanitize CSS string for safe injection.

```js
var safeCss = TizenPortal.utils.sanitizeCss(userCss);
styleElement.textContent = safeCss;
```

---

## 5c. Elements API

**Available in:** v1.0+

Declarative element manipulation API. Register selectors and operations once; the core automatically processes existing and dynamically added elements.

### TizenPortal.elements

```typescript
interface ElementsAPI {
  register: (config: ElementRegistration) => string;  // Returns registration ID
  unregister: (id: string) => void;                   // Remove registration
  clear: () => void;                                   // Clear all registrations
  process: () => number;                               // Manual processing (usually not needed)
}

interface ElementRegistration {
  selector: string;                // CSS selector
  operation: string;               // Operation: focusable, class, attribute, style, hide, show, remove
  
  // Optional filters
  container?: string;              // Limit to container selector
  condition?: (el: Element) => boolean;  // Runtime condition function
  
  // Operation-specific options
  nav?: string;                    // For focusable: 'vertical' | 'horizontal'
  classes?: string[];              // For class: classes to add
  remove?: boolean;                // For class: remove instead of add
  attributes?: Object;             // For attribute: key-value pairs
  styles?: Object;                 // For style: CSS properties
  important?: boolean;             // For style: add !important flag
  
  // Performance options
  debounceMs?: number;             // Custom debounce (default: 100ms)
  immediate?: boolean;             // Skip debounce for critical elements
}
```

### Operations

**1. focusable** - Make elements keyboard/remote navigable

```js
TizenPortal.elements.register({
  selector: 'nav a',
  operation: 'focusable',
  nav: 'vertical'  // Optional: vertical | horizontal
});
```

Sets: `tabindex="0"`, `data-tp-nav`, `data-tp-focusable`, `role="button"` (if needed)

**2. class** - Add/remove CSS classes

```js
// Add classes
TizenPortal.elements.register({
  selector: '.card',
  operation: 'class',
  classes: ['tp-card', 'tp-focusable']
});

// Remove classes
TizenPortal.elements.register({
  selector: '.old-style',
  operation: 'class',
  classes: ['legacy-class'],
  remove: true
});
```

**3. attribute** - Set/remove HTML attributes

```js
TizenPortal.elements.register({
  selector: '#toolbar',
  operation: 'attribute',
  attributes: {
    'data-region': 'toolbar',
    'aria-label': 'Main toolbar',
    'data-tp-nav': 'horizontal'
  }
});

// Dynamic values via functions
TizenPortal.elements.register({
  selector: '.item',
  operation: 'attribute',
  attributes: {
    'aria-label': function(el) {
      return 'Item: ' + el.textContent;
    }
  }
});
```

**4. style** - Apply inline CSS styles

```js
TizenPortal.elements.register({
  selector: '#mobile-menu',
  operation: 'style',
  styles: {
    display: 'none',
    visibility: 'hidden'
  },
  important: true  // Add !important flag
});

// Supports camelCase (auto-converts to kebab-case)
TizenPortal.elements.register({
  selector: '.toolbar',
  operation: 'style',
  styles: {
    backgroundColor: '#333',
    borderRadius: '8px'
  }
});
```

**5. hide** - Hide elements (stores original display value)

```js
TizenPortal.elements.register({
  selector: '.mobile-only',
  operation: 'hide'
});
```

**6. show** - Show previously hidden elements

```js
TizenPortal.elements.register({
  selector: '.tv-only',
  operation: 'show'
});
```

**7. remove** - Remove elements from DOM (with safety checks)

```js
TizenPortal.elements.register({
  selector: '.ad-container',
  operation: 'remove',
  condition: function(el) {
    // Safety check before removal
    return !el.closest('.important-content');
  }
});
```

### Advanced Patterns

**Container Scoping** - Limit processing to specific containers for performance:

```js
TizenPortal.elements.register({
  selector: 'button',
  operation: 'focusable',
  container: '#content-area'  // Only process buttons in #content-area
});
```

**Conditional Registration** - Apply operations based on runtime conditions:

```js
TizenPortal.elements.register({
  selector: '.dynamic-content',
  operation: 'focusable',
  condition: function(el) {
    // Only if visible
    return el.offsetParent !== null;
  }
});

TizenPortal.elements.register({
  selector: 'button',
  operation: 'focusable',
  condition: function(el) {
    // Only if not disabled and not hidden
    return !el.disabled && el.getAttribute('aria-hidden') !== 'true';
  }
});
```

**Page-Specific Registration** - Apply to specific pages:

```js
TizenPortal.elements.register({
  selector: '.item-detail-button',
  operation: 'focusable',
  condition: function(el) {
    return window.location.pathname.indexOf('/item/') !== -1;
  }
});
```

### Automatic Observation

Element registrations **automatically observe the DOM** for changes. No manual observation needed:

```js
onActivate: function(window, card) {
  // Register once
  TizenPortal.elements.register({
    selector: 'nav a',
    operation: 'focusable'
  });
  
  // Core automatically:
  // 1. Processes existing elements
  // 2. Observes DOM for new elements
  // 3. Applies operations to dynamically added elements
  // 4. Cleans up on bundle deactivation
}
```

### Manual Processing

Usually not needed (automatic observation handles this), but available for edge cases:

```js
// Manually trigger processing
var count = TizenPortal.elements.process();
console.log('Processed', count, 'elements');
```

### Cleanup

Registrations are **automatically cleared** when the bundle deactivates. Manual cleanup is rarely needed:

```js
onDeactivate: function(window, card) {
  // Automatic cleanup - no action needed
  // All registrations are cleared automatically
}

// Manual cleanup (if needed)
var regId = TizenPortal.elements.register({...});
TizenPortal.elements.unregister(regId);  // Remove specific registration
TizenPortal.elements.clear();             // Remove all registrations
```

### Best Practices

1. **Use declarative first** - Prefer element registration over imperative loops
2. **Use conditions for complex logic** - Keep selector simple, add runtime conditions
3. **Scope to containers** - Use `container` option for large DOMs
4. **Avoid over-registering** - One registration handles all matching elements
5. **Trust automatic observation** - Core handles DOM changes automatically

### Example: Complete Bundle

```js
export default {
  name: 'my-bundle',
  
  onActivate: function(window, card) {
    // Navigation
    TizenPortal.elements.register({
      selector: 'nav a',
      operation: 'focusable',
      nav: 'vertical'
    });
    
    // Hide mobile elements
    TizenPortal.elements.register({
      selector: '.mobile-only, .smartphone-menu',
      operation: 'hide'
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
    
    // Make buttons focusable (with conditions)
    TizenPortal.elements.register({
      selector: 'button',
      operation: 'focusable',
      condition: function(el) {
        return !el.disabled && el.offsetParent !== null;
      }
    });
    
    // That's it! Core handles everything automatically
  }
};
```

See [Bundle Authoring Guide - Section 8.5](Bundle-Authoring.md#85-element-registration-declarative-manipulation) for complete documentation and migration examples.

---

## 6. Key Constants

### TizenPortal.keys

Samsung Tizen key code mapping.

```js
const KEYS = TizenPortal.keys;

// Navigation
KEYS.LEFT      // 37
KEYS.UP        // 38
KEYS.RIGHT     // 39
KEYS.DOWN      // 40
KEYS.ENTER     // 13

// System
KEYS.BACK      // 10009
KEYS.EXIT      // 10182

// Color buttons
KEYS.RED       // 403
KEYS.GREEN     // 404
KEYS.YELLOW    // 405
KEYS.BLUE      // 406

// Media keys
KEYS.PLAY         // 415
KEYS.PAUSE        // 19
KEYS.PLAY_PAUSE   // 10252
KEYS.STOP         // 413
KEYS.REWIND       // 412
KEYS.FAST_FORWARD // 417

// IME
KEYS.IME_DONE     // 65376
KEYS.IME_CANCEL   // 65385
```

### Key Helper Functions

```typescript
interface KeyHelpers {
  isNavigationKey: (keyCode: number) => boolean;  // Check if Left/Up/Right/Down
  isColorButton: (keyCode: number) => boolean;    // Check if Red/Green/Yellow/Blue
  isMediaKey: (keyCode: number) => boolean;       // Check if Play/Pause/Stop/etc
  getKeyName: (keyCode: number) => string;        // Get human-readable key name
}
```

```js
// Check key types
if (TizenPortal.keys.isNavigationKey(event.keyCode)) {
  // Handle directional input
}

if (TizenPortal.keys.isColorButton(event.keyCode)) {
  // Handle color button
}

// Get key name for logging
var name = TizenPortal.keys.getKeyName(event.keyCode);
TizenPortal.log('Key pressed: ' + name);
```

### Long-Press Detection

Color buttons support long-press actions (hold for 500ms).

```js
// Long-press threshold is 500ms
const LONG_PRESS_MS = 500;

// Core handler automatically detects long presses
// Your custom handlers receive the event before long-press fires
TizenPortal.input.registerKeyHandler(function(event) {
  if (event.keyCode === TizenPortal.keys.RED) {
    // This fires on keydown (before long-press)
    // Return false to allow long-press to fire
    return false;
  }
});
```

### Back Key Behavior

The BACK key (10009) has special handling:

- **On sites**: Navigate browser history backward
- **With diagnostics open**: Close diagnostics panel
- **After IME dismiss**: Suppressed for 2 seconds to prevent accidental navigation

```js
// Back key is handled by core, but you can intercept
TizenPortal.input.registerKeyHandler(function(event) {
  if (event.keyCode === TizenPortal.keys.BACK) {
    // Custom back behavior
    customBack Handler();
    return true;  // Prevent default back action
  }
  return false;
});
```

### Usage

```js
document.addEventListener('keydown', function(e) {
  if (e.keyCode === TizenPortal.keys.RED) {
    // Show address bar
  }
});
```



## 7. Payload Interface

The payload passed via URL hash when navigating to sites.

```typescript
interface Payload {
  bundleName: string;      // Feature bundle identifier
  cardName: string;        // Card display name
  css?: string;            // Bundle CSS (optional)
  js?: string;             // Bundle JS bootstrap (optional)
  ua?: string;             // User-Agent override
  viewportMode?: string;
  focusOutlineMode?: string;
  tabindexInjection?: boolean;
  scrollIntoView?: boolean;
  safeArea?: boolean;
  gpuHints?: boolean;
  cssReset?: boolean;
  hideScrollbars?: boolean;
  wrapTextInputs?: boolean;
  bundleOptions?: Record<string, any>;
  bundleOptionData?: Record<string, any>;
}
```

### Encoding

```js
const payload = {
  bundleName: 'audiobookshelf',
  cardName: 'My Server',
};

const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
const url = cardUrl + '#tp=' + encoded;
```

### Decoding

```js
const hash = window.location.hash;
const match = hash.match(/[#&]tp=([^&]+)/);
if (match) {
  try {
    const decoded = decodeURIComponent(escape(atob(match[1])));
    const payload = JSON.parse(decoded);
  } catch (e) {
    console.error('Failed to decode payload:', e);
  }
}
```

---

## 8. Card Interface

Site cards stored in localStorage.

```typescript
interface Card {
  id: string;              // Unique identifier
  name: string;            // Display name
  url: string;             // Target URL
  featureBundle: string | null; // Feature bundle name
  icon?: string | null;    // Base64 or URL
  viewportMode?: 'auto' | 'locked' | 'unlocked' | null;
  focusOutlineMode?: 'on' | 'high' | 'off' | null;
  userAgent?: 'tizen' | 'mobile' | 'desktop' | null;
  tabindexInjection?: boolean | null;
  scrollIntoView?: boolean | null;
  safeArea?: boolean | null;
  gpuHints?: boolean | null;
  cssReset?: boolean | null;
  hideScrollbars?: boolean | null;
  wrapTextInputs?: boolean | null;
  bundleOptions?: Record<string, any>;
  bundleOptionData?: Record<string, any>;
  userscripts?: Array<UserscriptEntry>; // Per-site userscripts
  userscriptToggles?: Record<string, boolean>; // Global script toggles for this site
  bundleUserscriptToggles?: Record<string, Record<string, boolean>>; // Bundle script toggles
  order?: number;          // Grid position
  createdAt?: number;
  updatedAt?: number;
}

interface UserscriptEntry {
  id: string;              // Unique script identifier
  name: string;            // Display name
  enabled: boolean;        // Whether script is enabled
  source: 'inline' | 'url'; // Script source type
  inline?: string;         // Inline script code
  url?: string;            // External script URL
  cached?: string;         // Cached script from URL
  lastFetched?: number;    // Timestamp of last fetch
}

> Note: User-agent spoofing is JavaScript-only (not network-layer). Some sites may still detect the underlying browser.
```

### Storage

Cards stored in `localStorage.tp_apps` as JSON array.

```js
// Get cards
function getCards() {
  try {
    return JSON.parse(localStorage.getItem('tp_apps')) || [];
  } catch (e) {
    return [];
  }
}

// Save cards
function saveCards(cards) {
  localStorage.setItem('tp_apps', JSON.stringify(cards));
}
```

---

## 9. Bundle Interface

Bundle definition used in the registry.

```typescript
interface Bundle {
  name: string;            // Internal identifier
  displayName: string;     // UI display name
  description: string;     // Bundle description
  style: string;           // CSS content (imported from .css file)
  userscripts?: Array<UserscriptEntry>; // Bundle-provided userscripts
  
  // Lifecycle hooks
  onBeforeLoad?: (window: Window, card: Card) => void;
  onAfterLoad?: (window: Window, card: Card) => void;
  onActivate?: (window: Window, card: Card) => void;
  onDeactivate?: (window: Window, card: Card) => void;
  onKeyDown?: (event: KeyboardEvent) => boolean;
}
```

### Registry Functions

```js
import { getBundle, getBundleNames, hasBundle } from './bundles/registry.js';

// Get bundle by name
const bundle = getBundle('audiobookshelf');

// List all bundle names
const names = getBundleNames();
// ['default', 'audiobookshelf', 'adblock']

// Check if bundle exists
if (hasBundle('my-bundle')) {
  // Bundle available
}
```

### Lifecycle Hooks

Bundles can define lifecycle hooks that are called at specific points:

#### onBeforeLoad

Called before the page's DOM is fully loaded.

```js
export default {
  name: 'my-bundle',
  
  onBeforeLoad(window, card) {
    // Runs before DOMContentLoaded
    // Use for early script injection
    TizenPortal.log('Preparing site...');
  }
};
```

**Use cases:** Early script injection, preload resources

#### onAfterLoad

Called after the page's DOM is fully loaded.

```js
export default {
  name: 'my-bundle',
  
  onAfterLoad(window, card) {
    // Runs after DOMContentLoaded
    // DOM is ready for manipulation
    registerCards();
    setInitialFocus();
  }
};
```

**Use cases:** DOM manipulation, focus setup, card registration

#### onActivate

Called when the bundle becomes active (user navigates to site).

```js
export default {
  name: 'my-bundle',
  
  onActivate(window, card) {
    // Bundle is now active
    TizenPortal.log('Bundle activated:', card.name);
    
    // Setup event listeners
    document.addEventListener('myEvent', handleEvent);
  }
};
```

**Use cases:** Event listener setup, initialization, state setup

#### onDeactivate

Called when the bundle is deactivated (user navigates away).

```js
export default {
  name: 'my-bundle',
  
  onDeactivate(window, card) {
    // Bundle is being deactivated
    TizenPortal.log('Cleaning up...');
    
    // Remove event listeners
    document.removeEventListener('myEvent', handleEvent);
    
    // Clear intervals/timeouts
    clearInterval(myInterval);
  }
};
```

**Use cases:** Cleanup, remove listeners, clear timers

#### onNavigate

Called when URL changes within the same site (SPA navigation).

```js
export default {
  name: 'my-bundle',
  
  onNavigate(url) {
    // URL changed (SPA navigation)
    TizenPortal.log('Navigated to:', url);
    
    // Re-process cards for new content
    setTimeout(function() {
      TizenPortal.cards.process();
    }, 500);
  }
};
```

**Use cases:** SPA navigation handling, re-processing cards

**Note:** Not currently triggered by core, may need manual invocation or URL watching.

#### onKeyDown

Intercept key events before core processing.

```js
export default {
  name: 'my-bundle',
  
  onKeyDown(event) {
    // Intercept Play key for custom behavior
    if (event.keyCode === TizenPortal.keys.PLAY) {
      playCurrentItem();
      return true;  // Consumed - stop propagation
    }
    
    return false;  // Let core handle
  }
};
```

**Return values:**
- `true` - Event consumed, stop further handling
- `false` - Pass to core handling

**Use cases:** Custom key bindings, media key handling

### Complete Bundle Example

```js
import myStyles from './style.css';

export default {
  name: 'my-bundle',
  displayName: 'My Bundle',
  description: 'Enhances My Site for TV',
  style: myStyles,
  
  userscripts: [
    {
      id: 'fix-nav',
      name: 'Fix Navigation',
      enabled: true,
      source: 'inline',
      inline: 'document.querySelector(".nav").style.display = "flex";'
    }
  ],
  
  onBeforeLoad(window, card) {
    TizenPortal.log('Preparing:', card.name);
  },
  
  onAfterLoad(window, card) {
    // Register multi-action cards
    TizenPortal.cards.register({
      selector: '.media-card',
      type: 'multi'
    });
    
    // Process cards
    setTimeout(function() {
      var count = TizenPortal.cards.process();
      TizenPortal.log('Processed', count, 'cards');
    }, 500);
    
    // Set initial focus
    TizenPortal.focus.setInitialFocus([
      '.media-card:first-child',
      'button:first-of-type'
    ]);
  },
  
  onActivate(window, card) {
    TizenPortal.log('Bundle active');
  },
  
  onDeactivate(window, card) {
    TizenPortal.cards.clear();
    TizenPortal.log('Cleaned up');
  },
  
  onKeyDown(event) {
    if (event.keyCode === TizenPortal.keys.PLAY) {
      playCurrentMedia();
      return true;
    }
    return false;
  }
};
```

---

## 10. Events

### Config Change Event

Fired when configuration changes.

```typescript
interface ConfigChangeEvent {
  type: 'configChange';
  detail: {
    key: string;
    value: any;
  };
}
```

```js
TizenPortal.config.onChange(function(event) {
  if (event.detail.key === 'pointerMode') {
    updatePointerState(event.detail.value);
  }
});
```

### Key Events

Standard DOM keydown events. Use `e.keyCode` for Chrome 47 compatibility.

```js
document.addEventListener('keydown', function(e) {
  switch (e.keyCode) {
    case TizenPortal.keys.YELLOW:
      TizenPortal.returnToPortal();
      break;
    case TizenPortal.keys.BLUE:
      toggleDiagnostics();
      break;
  }
});
```

---

## 11. Userscript API

Userscripts have access to the full TizenPortal API plus a special cleanup mechanism.

### Userscript Context

```javascript
// Available in userscript execution context:
// - window: The page's global window object
// - document: The page's document object
// - TizenPortal: Full TizenPortal API
// - card: Current card object (may be null)
// - bundle: Current bundle object (may be null)
// - userscript: Runtime object for script metadata

// Example userscript:
TizenPortal.log('Userscript executing:', userscript.name);

// Modify page
document.body.style.backgroundColor = '#000';

// Register cleanup
userscript.cleanup = function() {
  document.body.style.backgroundColor = '';
  TizenPortal.log('Cleanup complete');
};
```

### Cleanup Function

Register a cleanup function to remove event listeners, timers, or other side effects when the script is deactivated:

```javascript
var intervalId = setInterval(function() {
  checkPageState();
}, 1000);

// Cleanup will be called when:
// - User navigates away
// - Script is disabled
// - Page is reloaded
userscript.cleanup = function() {
  clearInterval(intervalId);
};
```

### Best Practices

1. **Always provide cleanup** — Remove listeners, clear timers, restore modified DOM
2. **Check for elements** — Use try-catch and null checks for DOM access
3. **Log activity** — Use `TizenPortal.log()` for visibility in diagnostics
4. **Chrome 47 compatible** — Avoid modern JS features (no async/await, destructuring)
5. **Test thoroughly** — Errors in userscripts can break page functionality

### Example: Custom Navigation

```javascript
// Add custom keyboard shortcuts
function handleCustomKey(e) {
  if (e.keyCode === TizenPortal.keys.PLAY) {
    var video = document.querySelector('video');
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
      e.preventDefault();
      e.stopPropagation();
    }
  }
}

document.addEventListener('keydown', handleCustomKey, true);

// Cleanup
userscript.cleanup = function() {
  document.removeEventListener('keydown', handleCustomKey, true);
  TizenPortal.log('Custom navigation cleaned up');
};
```

---

## Appendix: Color Button Actions

| Button | Short Press | Long Press |
|--------|-------------|------------|
| Red (403) | Address bar | Reload |
| Green (404) | Pointer toggle | Focus highlight toggle |
| Yellow (405) | Preferences (portal) / Return to portal (sites) | Add Site (portal) / Return to portal (sites) |
| Blue (406) | Diagnostics | Safe mode |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-12 | Initial version (APP mode) |
| 2.0 | 2026-01-20 | MOD mode architecture |
| 3.0 | 2026-01-31 | Universal runtime, focus API |

---

*End of API Reference*
