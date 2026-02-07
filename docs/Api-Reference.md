# TizenPortal API Reference

> **Version:** 3.0  
> **Date:** February 7, 2026  
> **Status:** Universal Runtime (v0449)  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Global API](#2-global-api)
3. [Configuration API](#3-configuration-api)
4. [Input API](#4-input-api)
5. [Focus API](#5-focus-api)
6. [Key Constants](#6-key-constants)
7. [Payload Interface](#7-payload-interface)
8. [Card Interface](#8-card-interface)
9. [Bundle Interface](#9-bundle-interface)
10. [Events](#10-events)

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
  version: string;           // "0447"
  
  // Sub-APIs
  config: ConfigAPI;
  input: InputAPI;
  focus: FocusAPI;
  keys: KeyConstants;
  cards: CardsAPI;
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
// Navigates to: https://alexnolan.github.io/tizenportal/dist/index.html
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
  get: (key: string) => any;
  set: (key: string, value: any) => void;
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

### Built-in Config Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `pointerMode` | boolean | false | On-screen mouse enabled |
| `focusHighlight` | boolean | true | Focus indicators visible |
| `safeMode` | boolean | false | Safe mode enabled |
| `diagnosticsEnabled` | boolean | false | Debug overlay enabled |
| `tp_portal` | object | — | Portal preferences (theme, HUD, color hints) |
| `tp_features` | object | — | Global site feature toggles |

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
  order?: number;          // Grid position
  createdAt?: number;
  updatedAt?: number;
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
