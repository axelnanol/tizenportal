# TizenPortal Architecture Specification

> **Version:** 3.0  
> **Date:** February 7, 2026  
> **Status:** Universal Runtime (v0453)  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Universal Runtime Architecture](#2-universal-runtime-architecture)
3. [File Structure](#3-file-structure)
4. [Module Specifications](#4-module-specifications)
5. [Data Models](#5-data-models)
6. [Data Flow](#6-data-flow)
7. [Build Output](#7-build-output)
8. [Payload System](#8-payload-system)
9. [UI Components](#9-ui-components)
10. [Input Handling](#10-input-handling)

---

## 1. Overview

TizenPortal is a **TizenBrew Site Modification Module** (`packageType: "mods"`) that provides:

1. **Portal:** Launcher grid with site cards stored in localStorage
2. **Universal Runtime:** Single script that adapts to portal or target site context
3. **Bundle System:** Site-specific behaviour loaded from compiled registry
4. **Navigation:** Spatial navigation polyfill for directional input
5. **Input Handling:** Remote keys, pointer mode, color buttons
6. **Diagnostics:** Console capture and debug overlay

### Design Principles

- **Single Runtime:** One `tizenportal.js` file runs everywhere
- **Context Detection:** Runtime detects portal vs target site automatically
- **Payload Passing:** Bundle name passed via URL hash `#tp=BASE64`
- **Bundles Compiled In:** All bundles are built into the runtime
- **Graceful Degradation:** Works even if payload fails to decode
- **Feature Detection:** Polyfills loaded dynamically based on browser capabilities

---

## 2. Universal Runtime Architecture

### How TizenBrew Loads the Module

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TizenBrew                                    │
│  1. Reads package.json from GitHub tag                              │
│  2. Opens websiteURL (portal) in browser                            │
│  3. Injects tizenportal.js into ALL navigated pages                 │
└─────────────────────────────────────────────────────────────────────┘
```

### package.json Configuration

```json
{
  "packageType": "mods",
  "websiteURL": "https://alexnolan.github.io/tizenportal/dist/index.html",
  "main": "dist/tizenportal.js",
  "keys": ["ColorF0Red", "ColorF1Green", "ColorF2Yellow", "ColorF3Blue", ...]
}
```

| Field | Purpose |
|-------|---------|
| `packageType` | `"mods"` = site modification module |
| `websiteURL` | Initial page TizenBrew opens (our portal) |
| `main` | Script injected into ALL navigated pages |
| `keys` | Remote buttons TizenBrew registers for us |

### Context Detection

The runtime uses a simple check to determine where it's running:

```js
function detectContext() {
  // If tp-shell exists, we're on the portal page
  return !!document.getElementById('tp-shell');
}
```

**On Portal Page:**
- Renders card grid
- Shows site editor modal
- Handles navigation to sites

**On Target Site:**
- Reads payload from URL hash
- Applies bundle CSS/JS
- Provides overlay UI (address bar, diagnostics)

---

## 3. File Structure

```
tizenportal/
├── package.json              # TizenBrew manifest + version source
├── rollup.config.js          # Build config
│
├── dist/                     # Deployed to GitHub Pages
│   ├── index.html            # Portal launcher HTML
│   └── tizenportal.js        # Universal runtime (~320KB)
│
├── core/                     # Runtime entry
│   ├── index.js              # Main entry, exposes window.TizenPortal
│   ├── config.js             # localStorage + event emitter
│   ├── cards.js              # Card registration system
│   └── loader.js             # Bundle loading
│
├── ui/                       # UI components
│   ├── portal.js             # Grid launcher
│   ├── siteeditor.js         # Card add/edit modal
│   ├── preferences.js        # Preferences modal
│   ├── addressbar.js         # Browser chrome
│   ├── diagnostics.js        # Debug panel
│   ├── modal.js              # Modal system
│   ├── cards.js              # Card UI rendering
│
├── bundles/                  # Site-specific bundles
│   ├── registry.js           # Bundle registration
│   ├── audiobookshelf/       # ABS support
│   └── adblock/              # Ad blocking
│
├── navigation/               # Spatial navigation
│   ├── spatial-navigation-polyfill.js
│   ├── card-interaction.js   # Card multi-element handling
│   ├── geometry.js           # Spacing/collision utilities
│   └── helpers.js            # Navigation helpers
│
├── input/                    # Input handling
│   ├── handler.js            # Key dispatcher
│   ├── keys.js               # Key constants
│   ├── pointer.js            # On-screen mouse
│   └── text-input.js         # TV keyboard handling
│
├── focus/                    # Focus management
│   └── manager.js            # Focus tracking, scroll, viewport
│
├── diagnostics/              # Diagnostics system
│   └── console.js            # Console capture
│
├── features/                 # Global site feature toggles
│   ├── index.js              # Feature loader
│   ├── focus-styling.js       # Focus highlight styles
│   ├── tabindex-injection.js  # Auto-focusable elements
│   ├── scroll-into-view.js    # Focus scroll helper
│   ├── safe-area.js           # TV safe area inset
│   ├── gpu-hints.js           # GPU hint styles
│   └── css-reset.js           # CSS normalization
│
└── polyfills/                # Platform polyfills
    ├── index.js              # Polyfill loader
    └── domrect-polyfill.js   # DOMRect (from TizenTube)
```

---

## 4. Module Specifications

### 4.1 Core Runtime (`core/index.js`)

**Purpose:** Main entry point. Detects context and initializes appropriate subsystems.

**Responsibilities:**
- Import and initialize polyfills
- Detect portal vs target site context
- Initialize config, input, diagnostics
- Initialize portal UI (if on portal) or apply bundle (if on target)
- Expose `window.TizenPortal` API

**Exports:**
```js
window.TizenPortal = {
  version: string,           // From package.json via build
  config: ConfigAPI,
  keys: KeyConstants,
  input: InputAPI,
  focus: FocusAPI,
  log: (message: string) => void,
  warn: (message: string) => void,
  error: (message: string) => void,
  loadSite: (card: Card) => void,
  returnToPortal: () => void,
  showToast: (message: string) => void,
  getState: () => StateObject,
};
```

### 4.2 Bundle Registry (`bundles/registry.js`)

**Purpose:** Central registry of all built-in bundles.

**Exports:**
```js
export function registerBundle(name: string, bundle: Bundle): void;
export function getBundle(name: string): Bundle | null;
export function getBundleNames(): string[];
export function hasBundle(name: string): boolean;
```

**Built-in Bundles:**
- `default` - Basic fallback bundle
- `audiobookshelf` - Enhanced support for Audiobookshelf
- `adblock` - Ad blocking for general sites

### 4.3 Bundle Interface

```typescript
interface Bundle {
  name: string;
  displayName: string;
  description: string;
  style: string;              // CSS to inject (imported from style.css)
  onBeforeLoad?: (window, card) => void;
  onAfterLoad?: (window, card) => void;
  onActivate?: (window, card) => void;
  onDeactivate?: (window, card) => void;
  onNavigate?: (url) => void;
  onKeyDown?: (event) => boolean;
}
```

### 4.4 Focus Manager (`focus/manager.js`)

**Purpose:** Centralized focus utilities for TV navigation.

**Exports:**
```js
export function enableScrollIntoView(options): void;
export function disableScrollIntoView(): void;
export function scrollElementIntoView(element): void;
export function setInitialFocus(selectors): void;
export function lockViewport(): void;
export function unlockViewport(): void;
export function observeDOM(callback): void;
export function stopObservingDOM(): void;
```

### 4.5 Card Registration (`core/cards.js`)

**Purpose:** Allow bundles to mark interactive elements for special handling.

**Usage:**
```js
// In bundle code, mark elements with data-tp-card attribute
element.setAttribute('data-tp-card', 'single');  // Simple clickable
element.setAttribute('data-tp-card', 'multi');   // Container with multiple actions
```

**Exports:**
```js
export function registerCards(selector, options): void;
export function unregisterCards(selector): void;
export function processCards(): void;
export function initCards(): void;
export function shutdownCards(): void;
```

---

## 5. Data Models

### 5.1 Card

```typescript
interface Card {
  id: string;
  name: string;
  url: string;
  featureBundle: string | null;
  icon: string | null;
  viewportMode: 'auto' | 'locked' | 'unlocked' | null;
  focusOutlineMode: 'on' | 'high' | 'off' | null;
  userAgent: 'tizen' | 'mobile' | 'desktop' | null;
  tabindexInjection: boolean | null;
  scrollIntoView: boolean | null;
  safeArea: boolean | null;
  gpuHints: boolean | null;
  cssReset: boolean | null;
  hideScrollbars: boolean | null;
  wrapTextInputs: boolean | null;
  bundleOptions: Record<string, any>;
  bundleOptionData: Record<string, any>;
  order: number;
  createdAt: number;
  updatedAt: number;
}
```

**Storage:** `localStorage.tp_apps` (JSON array)

### 5.2 Payload

```typescript
interface Payload {
  bundleName: string;       // Feature bundle identifier
  cardName: string;         // Display name for UI
  css?: string;             // Bundle CSS (optional)
  js?: string;              // Bundle JS bootstrap (optional)
  ua?: string;              // User-Agent override (optional)
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

**Transport:** URL hash as `#tp=BASE64(JSON.stringify(payload))`

### 5.3 Config

```typescript
interface Config {
  pointerMode: boolean;
  focusHighlight: boolean;
  safeMode: boolean;
  diagnosticsEnabled: boolean;
  lastVisitedUrl: string | null;
  tp_portal: {
    theme: 'dark' | 'light' | 'auto' | 'backdrop' | 'custom';
    customColor1: string;
    customColor2: string;
    backgroundImage: string;
    hudPosition: 'off' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    showHints: boolean;
  };
  tp_features: {
    focusStyling: boolean;
    focusOutlineMode: 'on' | 'high' | 'off';
    tabindexInjection: boolean;
    scrollIntoView: boolean;
    safeArea: boolean;
    gpuHints: boolean;
    cssReset: boolean;
    hideScrollbars: boolean;
    wrapTextInputs: boolean;
    viewportMode: 'auto' | 'locked' | 'unlocked';
    uaMode: 'tizen' | 'desktop' | 'mobile';
  };
  [key: string]: any;
}
```

**Storage:** `localStorage.tp-configuration` (JSON object)

### 5.4 LogEntry

```typescript
interface LogEntry {
  timestamp: number;
  level: 'log' | 'warn' | 'error';
  message: string;
}
```

**Storage:** In-memory circular buffer (not persisted)

---

## 6. Data Flow

### 6.1 Portal Boot Sequence

```
1. TizenBrew loads module, opens websiteURL (dist/index.html)
2. Portal HTML has <div id="tp-shell">
3. Browser executes dist/tizenportal.js
4. Runtime detects tp-shell → portal mode
5. Polyfills initialize (DOMRect, core-js, fetch)
6. Config loads from localStorage
7. Input handler attaches to document
8. Portal UI renders from localStorage.tp_apps
9. First card receives focus
10. Portal ready
```

### 6.2 Site Navigation Sequence

```
1. User presses Enter on card
2. Portal builds payload:
  - bundleName from card.featureBundle
   - cardName from card.name
   - Encode as base64
3. Portal navigates: window.location.href = card.url + '#tp=' + base64
4. Browser navigates to target site
5. TizenBrew injects tizenportal.js
6. Runtime detects no tp-shell → target site mode
7. Runtime reads #tp= from location.hash
8. Runtime decodes payload
9. Gets bundle from compiled registry
10. Injects bundle CSS via <style> element
11. Calls bundle lifecycle hooks (onActivate)
12. Creates overlay UI (address bar, diagnostics available)
```

### 6.3 Return to Portal

```
1. User presses YELLOW button (short or long)
2. Runtime navigates to HOME_URL (portal)
3. TizenBrew injects tizenportal.js into portal
4. Portal re-renders
```

---

## 7. Build Output

### 7.1 Single Build Output

```
dist/
├── index.html        # Portal HTML with tp-shell element
└── tizenportal.js    # Universal runtime (~320KB)
```

### 7.2 Version Injection

Version is centralized in `package.json` and injected at build time:

```js
// rollup.config.js
import replace from '@rollup/plugin-replace';
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const plugins = [
  replace({ '__VERSION__': pkg.version }),
  // ...
];
```

Source files use placeholder:
```js
const VERSION = '__VERSION__';  // Becomes "0453" at build time
```

### 7.3 tizenportal.js Structure (IIFE)

```js
(function () {
  'use strict';
  
  const VERSION = '0453';
  
  // Polyfills (core-js, fetch, DOMRect, spatial-navigation)
  // Config (localStorage wrapper)
  // Input handling (keys, pointer, text-input)
  // Focus management
  // Navigation (spatial-navigation-polyfill)
  // Diagnostics (console capture)
  // UI components (portal, siteeditor, overlays)
  // Bundle registry (feature bundles: audiobookshelf, adblock)
  // Core init and window.TizenPortal exposure
  
})();
```

---

## 8. Payload System

### 8.1 Payload Encoding

Portal builds and encodes payload before navigation:

```js
function buildPayload(card) {
  const payload = {
    bundleName: card.featureBundle || 'default',
    cardName: card.name,
    ua: card.userAgent || undefined,
    viewportMode: card.viewportMode || null,
    focusOutlineMode: card.focusOutlineMode || null,
    bundleOptions: card.bundleOptions || {},
    bundleOptionData: card.bundleOptionData || {}
  };
  
  // Use btoa with UTF-8 encoding
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function navigateToSite(card) {
  const encoded = buildPayload(card);
  window.location.href = card.url + '#tp=' + encoded;
}
```

### 8.2 Payload Decoding

Runtime reads and decodes payload on target site:

```js
function getCardFromHash() {
  const hash = window.location.hash;
  if (!hash) return null;
  
  // Look for tp= parameter in hash
  const match = hash.match(/[#&]tp=([^&]+)/);
  if (!match) return null;
  
  try {
    const decoded = decodeURIComponent(escape(atob(match[1])));
    const payload = JSON.parse(decoded);
    
    // Convert to card format
    return {
      name: payload.cardName || 'Unknown Site',
      url: window.location.href.replace(/[#&]tp=[^&#]+/, ''),
      featureBundle: payload.bundleName || 'default',
      viewportMode: payload.viewportMode || null,
      focusOutlineMode: payload.focusOutlineMode || null,
      userAgent: payload.ua || null,
      bundleOptions: payload.bundleOptions || {},
      bundleOptionData: payload.bundleOptionData || {},
      _payload: payload
    };
  } catch (e) {
    console.error('Failed to parse hash payload');
    return null;
  }
}
```

### 8.3 Bundle Application

```js
async function applyBundleToPage(card) {
  const bundleName = card.featureBundle || 'default';
  let bundle = getBundle(bundleName);
  
  if (!bundle) {
    bundle = getBundle('default');
  }
  
  // Inject bundle CSS
  if (bundle.style) {
    const style = document.createElement('style');
    style.id = 'tp-bundle-css';
    style.textContent = bundle.style;
    document.head.appendChild(style);
  }
  
  // Call lifecycle hooks
  if (bundle.onBeforeLoad) bundle.onBeforeLoad(window, card);
  
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }
  
  if (bundle.onAfterLoad) bundle.onAfterLoad(window, card);
  if (bundle.onActivate) bundle.onActivate(window, card);
}
```

---

## 9. UI Components

### 9.1 Portal Grid (`ui/portal.js`)

Renders the card launcher interface on the portal page.

### 9.2 Site Editor (`ui/siteeditor.js`)

Modal for adding/editing site cards.

### 9.3 Address Bar (`ui/addressbar.js`)

Browser chrome overlay (RED button) showing current URL.

### 9.4 Diagnostics (`ui/diagnostics.js`)

Debug panel overlay (BLUE button) with console output.

---

## 10. Input Handling

### Key Constants

```js
export const KEYS = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  ENTER: 13,
  BACK: 10009,
  EXIT: 10182,
  RED: 403,
  GREEN: 404,
  YELLOW: 405,
  BLUE: 406,
  PLAY: 415,
  PAUSE: 19,
  PLAY_PAUSE: 10252,
  STOP: 413,
  REWIND: 412,
  FAST_FORWARD: 417,
};
```

### Color Button Mappings

| Key | Short Press | Long Press |
|-----|-------------|------------|
| Red | Address bar | Reload page |
| Green | Pointer toggle | Focus highlight |
| Yellow | Preferences (portal) / Return to portal (sites) | Add Site (portal) / Return to portal (sites) |
| Blue | Diagnostics | Safe mode |

---

*End of Architecture Specification*
