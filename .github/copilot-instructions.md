# Copilot Instructions for TizenPortal

> **Last Updated:** February 11, 2026  
> **Current Version:** 1018  
> **Architecture:** Universal Runtime

---

## 🤖 How to Use These Instructions

This file provides comprehensive guidance for working on the TizenPortal codebase. As an AI coding agent:

1. **Read completely before starting** — Understanding context prevents mistakes
2. **Follow the constraints** — Chrome 47 compatibility is non-negotiable
3. **Make minimal changes** — Surgical edits only; don't refactor unnecessarily
4. **Test incrementally** — Build after every change
5. **Document as you go** — Update docs when behavior changes

### Critical Context

- **Target Platform:** Samsung Tizen TVs with Chrome 47-69 browser engine
- **Build System:** Rollup + Babel transpiling to ES5
- **Input Method:** TV remote only (D-pad + color buttons)
- **Testing:** Manual only (no automated tests)
- **Deployment:** Git tags → TizenBrew CDN

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Platform Constraints](#2-platform-constraints)
3. [Architecture](#3-architecture)
4. [Build System](#4-build-system)
5. [TizenBrew Integration](#5-tizenbrew-integration)
6. [Development Guidelines](#6-development-guidelines)
7. [Critical Constraints](#7-critical-constraints)
8. [Color Button Mappings](#8-color-button-mappings)
9. [Key Codes Reference](#9-key-codes-reference)
10. [Bundle System](#10-bundle-system)
11. [Deployment Workflow](#11-deployment-workflow)
12. [Common Pitfalls](#12-common-pitfalls)
13. [Agent Instructions](#13-agent-instructions)
14. [Attribution Requirements](#14-attribution-requirements)

---

## Quick Start for Copilot

### Essential Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run watch

# Clean build artifacts
npm run clean
```

### Testing
There is no automated test suite. Changes must be manually verified on a Samsung Tizen TV or through careful code review.

### Key Files to Know
- `core/index.js` — Main runtime entry point
- `bundles/registry.js` — Bundle registration system
- `ui/portal.js` — Portal launcher UI
- `input/handler.js` — Remote control key handling
- `navigation/spatial-navigation.js` — Spatial navigation library

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails with "rollup: not found" | Dependencies not installed | Run `npm install` |
| "this is undefined" warning | Normal for UMD modules | Safe to ignore |
| Code works in modern browser but not on TV | Using ES6+ features | Check Babel transpilation |
| Changes not appearing on TV | CDN cache | Create new git tag |
| localStorage errors | Quota exceeded | Implement error handling |
| Focus lost after navigation | Missing spatial nav setup | Check focus groups |

---

## 1. Project Overview

**TizenPortal** is a browser shell for Samsung Tizen TVs that provides:

- **Portal Grid:** Launcher with customizable site cards
- **Bundle System:** Site-specific fixes and enhancements
- **Spatial Navigation:** TV-remote-friendly navigation
- **Diagnostics:** Debug overlay with console capture

### Mission

Provide TizenBrew users with a **usable browser shell** that works with contemporary SPAs (Audiobookshelf, Jellyfin, etc.) on legacy Tizen hardware where the built-in browser is Chrome 47-69.

---

## 2. Platform Constraints

### Target Hardware

- **Devices:** Samsung Tizen Smart TVs (2017-2022)
- **Browser Engine:** Chrome 47-69 (Chromium-based WebKit)
- **Resolution:** 1920×1080 fixed (never use responsive layout)
- **Input:** Samsung remote (directional pad, color buttons, media keys)

### Polyfill Philosophy

**DO NOT target specific browser versions.** Instead:
- Use **feature detection** for all capability decisions
- Load polyfills **only when needed**
- Assume **V8 only** (no other JS engines)
- Avoid heavy polyfills (no full core-js)

### JavaScript Considerations

```js
// ❌ NOT SUPPORTED in Chrome 47
const { a, b } = obj;           // Destructuring (limited)
[...arr]                        // Spread operator (limited)
async/await                     // Not available
fetch()                         // Not available (use XMLHttpRequest)
class Foo {}                    // Limited class syntax
() => {}                        // Arrow functions (use Babel)
for (const x of arr)            // for...of (limited)
Object.entries/values           // Not available
Array.includes()                // Not available

// ✅ SAFE in Chrome 47 (or Babel transpiles)
var, let, const
function declarations
Array.prototype.forEach/map/filter/reduce
Object.keys()
JSON.parse/stringify
XMLHttpRequest
setTimeout/setInterval
```

> **Note:** Babel transpiles modern syntax, but use feature detection for APIs. When in doubt, check if a feature exists before using it.

### CSS Limitations

```css
/* ❌ NOT SUPPORTED */
display: grid;                  /* Use flexbox fallback */
gap: 10px;                      /* Use margin instead */
:focus-visible                  /* Use :focus */
CSS custom properties           /* Use Sass or inline values */

/* ✅ SAFE */
display: flex;
flexbox properties
transform, transition
position: absolute/fixed/relative
```

---

## 3. Architecture

TizenPortal uses a **Universal Runtime** architecture with a single `tizenportal.js` file.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TizenBrew                                    │
│  1. Loads module from GitHub tag                                    │
│  2. Opens websiteURL (portal) in browser                            │
│  3. Injects tizenportal.js into ALL pages                           │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Portal (dist/index.html)                          │
│  - Runtime detects it's on the portal page                          │
│  - Renders site card grid from localStorage                         │
│  - User selects a card                                              │
│  - Navigates to: card.url#tp=BASE64(payload)                        │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                Target Site (e.g., Audiobookshelf)                   │
│  - Runtime detects it's NOT on the portal                           │
│  - Reads #tp= from URL hash                                         │
│  - Applies bundle CSS/JS from compiled registry                     │
│  - Provides overlay UI (address bar, diagnostics)                   │
│  - Color buttons available for navigation                           │
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
| `packageType` | `"mods"` = TizenBrew injects script into pages |
| `websiteURL` | Initial page TizenBrew opens (our portal) |
| `main` | Script injected into ALL navigated pages |
| `keys` | Remote buttons TizenBrew registers for us |

### File Structure

```
tizenportal/
├── package.json              # TizenBrew module manifest + version
├── rollup.config.js          # Build config
│
├── dist/                     # Deployed to GitHub Pages
│   ├── index.html            # Portal launcher
│   └── tizenportal.js        # Universal runtime
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
│   ├── addressbar.js         # Browser chrome
│   ├── diagnostics.js        # Debug panel
│   ├── modal.js              # Modal system
│   ├── cards.js              # Card UI rendering
│   └── iframe.js             # Iframe management
│
├── input/                    # Input handling
│   ├── keys.js               # Key constants
│   ├── handler.js            # Key dispatcher
│   ├── pointer.js            # On-screen mouse
│   └── text-input.js         # TV keyboard handling
│
├── focus/                    # Focus management
│   └── manager.js            # Focus tracking, scroll, viewport
│
├── bundles/                  # Site-specific bundles
│   ├── registry.js           # Bundle registration
│   ├── default/              # Fallback bundle
│   ├── adblock/              # Ad blocking bundle
│   └── audiobookshelf/       # ABS bundle
│
├── navigation/               # Spatial navigation
│   ├── spatial-navigation-polyfill.js
│   ├── card-interaction.js   # Card multi-element handling
│   ├── geometry.js           # Spacing/collision utilities
│   └── helpers.js            # Navigation helpers
│
├── diagnostics/              # Diagnostics system
│   └── console.js            # Console capture
│
└── polyfills/                # Platform polyfills
    ├── index.js              # Polyfill loader
    └── domrect-polyfill.js   # DOMRect (from TizenTube)
```

### Data Flow

1. **TizenBrew loads module** → Opens `websiteURL` (portal)
2. **Portal renders** → Reads cards from `localStorage.tp_apps`
3. **User selects card** → Portal builds payload JSON
4. **Navigation** → `window.location.href = card.url + '#tp=' + base64(payload)`
5. **Target site loads** → TizenBrew injects `tizenportal.js`
6. **Runtime reads hash** → Decodes `#tp=` parameter
7. **Applies bundle** → Injects CSS from registry, runs JS
8. **User presses YELLOW** → Returns to portal

### Payload Format

```js
{
  bundleName: "audiobookshelf",
  cardName: "My ABS Server",
  css: "/* additional styles */",
  ua: "Mozilla/5.0 ..."  // optional UA override
}
```

Encoded as: `#tp=eyJidW5kbGVOYW1lIjoiLi4uIn0=`

---

## 4. Build System

### Single Output Build

Rollup builds a single universal runtime:

```js
// rollup.config.js
export default [
  {
    input: 'core/index.js',
    output: { file: 'dist/tizenportal.js', format: 'iife', name: 'TizenPortal' },
    plugins,
  },
];
```

### Version Injection

Version is centralized in `package.json` and injected at build time:

```js
replace({
  preventAssignment: true,
  values: { '__VERSION__': pkg.version },
})
```

In source files, use the placeholder:
```js
const VERSION = '__VERSION__';  // Replaced with "0301" at build time
```

### Build Commands

```bash
npm install       # Install dependencies
npm run build     # Production build
npm run watch     # Development with hot reload
```

### Transpilation

Babel transpiles to ES5 for Chrome 47 compatibility:

```js
babel({
  babelHelpers: 'bundled',
  presets: [['@babel/preset-env', { targets: { chrome: '47' }, modules: false }]],
  exclude: 'node_modules/**',
}),
```

---

## 5. TizenBrew Integration

### Key Registration

TizenBrew automatically calls `tizen.inputdevice.registerKey()` for each key in the `keys` array:

```json
"keys": [
  "MediaPlayPause", "MediaPlay", "MediaPause", "MediaStop",
  "MediaFastForward", "MediaRewind", "MediaTrackNext", "MediaTrackPrevious",
  "ColorF0Red", "ColorF1Green", "ColorF2Yellow", "ColorF3Blue"
]
```

**Back** is not registered in package.json; runtime may handle keyCode 10009 when received.

### CDN Caching

TizenBrew CDN caches by git tag. After pushing:

1. Delete old module: `alexnolan/tizenportal@0300`
2. Add new module: `alexnolan/tizenportal@0301`

Without a new tag, stale code is served.

---

## 6. Development Guidelines

### Code Style

```js
// ✅ Good: Explicit, ES5-safe (Babel handles let/const)
const value = getValue();
if (value != null) {
  processValue(value);
}

// ❌ Bad: Relies on modern features
const { a, b } = getValue();
processValue(a ?? b);
```

### Error Handling

```js
// ✅ Always wrap in try-catch
try {
  const doc = iframe.contentDocument;
  if (!doc) throw new Error('No contentDocument');
  processDocument(doc);
} catch (err) {
  TizenPortal.log('Failed to process iframe:', err.message);
}
```

### Logging

```js
// ✅ Use TizenPortal.log for diagnostics panel visibility
TizenPortal.log('Bundle activated:', bundleName);

// ✅ Use console.log for development (captured by diagnostics)
console.log('Debug:', someValue);
```

### DOM Manipulation

```js
// ✅ Direct DOM manipulation (no virtual DOM)
const card = document.createElement('div');
card.className = 'tp-card';
card.textContent = title;
container.appendChild(card);

// ❌ No innerHTML with user content (XSS risk)
container.innerHTML = userData;
```

### Focus Management

```js
// ✅ Use spatial navigation groups
container.setAttribute('data-focus-group', 'portal');
element.focus();

// ✅ Handle focus loss gracefully
if (!document.activeElement || document.activeElement === document.body) {
  restoreDefaultFocus();
}
```

---

## 7. Critical Constraints

### BACK Button (10009)

The runtime may handle BACK for history navigation on sites and to close diagnostics when open. Avoid intercepting BACK in other subsystems unless required.

### Cross-Origin Iframes

```js
// ✅ Always check for cross-origin before accessing
try {
  const doc = iframe.contentDocument;
  if (doc) {
    // Same-origin, safe to access
    processDocument(doc);
  }
} catch (err) {
  // Cross-origin, cannot access document
  TizenPortal.log('Cross-origin iframe, limited access');
}
```

### localStorage Limits

```js
// ✅ Guard against quota exceeded
try {
  localStorage.setItem('tp_apps', JSON.stringify(cards));
} catch (err) {
  if (err.name === 'QuotaExceededError') {
    TizenPortal.log('Storage quota exceeded');
  }
}
```

---

## 8. Color Button Mappings

| Button | Short Press | Long Press |
|--------|-------------|------------|
| **Red (403)** | Address bar (browser chrome) | Reload page |
| **Green (404)** | On-screen mouse toggle | Focus highlight toggle |
| **Yellow (405)** | Preferences (portal) / Return to portal (sites) | Add Site (portal) / Return to portal (sites) |
| **Blue (406)** | Diagnostics menu | Safe mode (reload without bundles) |

These mappings are **locked for 1.0**. Do not change without explicit approval.

---

## 9. Key Codes Reference

| Key | Code | Constant | Notes |
|-----|------|----------|-------|
| Left | 37 | `KEYS.LEFT` | |
| Up | 38 | `KEYS.UP` | |
| Right | 39 | `KEYS.RIGHT` | |
| Down | 40 | `KEYS.DOWN` | |
| Enter | 13 | `KEYS.ENTER` | |
| Back | 10009 | `KEYS.BACK` | History back on sites / close diagnostics |
| Exit | 10182 | `KEYS.EXIT` | |
| Red | 403 | `KEYS.RED` | |
| Green | 404 | `KEYS.GREEN` | |
| Yellow | 405 | `KEYS.YELLOW` | |
| Blue | 406 | `KEYS.BLUE` | |
| Play | 415 | `KEYS.PLAY` | |
| Pause | 19 | `KEYS.PAUSE` | |
| Play/Pause | 10252 | `KEYS.PLAY_PAUSE` | |
| Stop | 413 | `KEYS.STOP` | |
| Rewind | 412 | `KEYS.REWIND` | |
| Fast Forward | 417 | `KEYS.FAST_FORWARD` | |
| IME Done | 65376 | `KEYS.IME_DONE` | |
| IME Cancel | 65385 | `KEYS.IME_CANCEL` | |

---

## 10. Bundle System

### Bundle Structure

```
bundles/
└── my-bundle/
    ├── main.js           # Bundle logic (required)
    ├── style.css         # Bundle styles (optional)
    └── manifest.json     # Bundle metadata (required)
```

### manifest.json

```json
{
  "name": "my-bundle",
  "displayName": "My Bundle",
  "version": "1.0.0",
  "description": "Brief description"
}
```

### Lifecycle Hooks

```js
export default {
  name: 'my-bundle',
  
  onActivate() {
    // Bundle takes control
  },
  
  onDeactivate() {
    // Cleanup before exit
  },
};
```

### TizenPortal API (for bundles)

```js
// Logging
TizenPortal.log('message');
TizenPortal.warn('message');
TizenPortal.error('message');

// Configuration
TizenPortal.config.get('key');
TizenPortal.config.set('key', value);

// Focus
TizenPortal.focus.set(element);
TizenPortal.focus.get();

// Input state
TizenPortal.input.isPointerMode();
TizenPortal.input.isIMEActive();
```

---

## 11. Deployment Workflow

### Version Numbering Scheme

**Format:** 4-digit numeric tags for easy TV remote entry.

| Tag | Semantic | Example |
|-----|----------|--------|
| `0100` | 0.1.00 | Starting version |
| `0463` | 0.4.63 | Current version |
| `1000` | 1.0.00 | 1.0 release |

**Why:** Typing `alexnolan/tizenportal@0301` on a TV remote is much faster than `@v0.3.1`.

### Version Bumping

**Single source of truth:** `package.json` is the only place you need to update the version.

**Always bump `package.json` before tagging** so CDN cache busting is verifiable.

**Always run the build after version bump** to inject the new version into `dist/tizenportal.js`.

1. Update version in `package.json`:
   ```json
   "version": "0302"
   ```

2. Rebuild to inject version into output:
   ```bash
   npm run build
   ```

3. Commit and tag:
   ```bash
   git add .
   git commit -m "Bump version to 0302"
   git tag 0302
   git push origin master --tags
   ```

**Commit Log Requirement:** All deployment commits must include a minimum **1000-character** commit log with detailed change notes.

> Tip: These git operations can be chained in a single command when appropriate.

### TizenBrew CDN Update

1. Go to TizenBrew settings on your TV
2. Delete old module: `alexnolan/tizenportal@vOLD`
3. Add new module: `alexnolan/tizenportal@vNEW`

**Critical:** CDN caches by tag. Without a new tag, old code is served.

### Portal Cache-Busting (when portal shows old version)

If the portal page itself is stale while the injected runtime is new, also
cache-bust the **portal entrypoint**:

1. Update `package.json` `websiteURL` to include a version query:
  ```json
  "websiteURL": "https://alexnolan.github.io/tizenportal/dist/index.html?v=0453"
  ```
2. Update `dist/index.html` to load the runtime with a version query:
  ```html
  <script src="tizenportal.js?v=0453"></script>
  ```
3. Run `npm run build`, commit, tag, and push as usual.

This forces CDN and browser caches to fetch the new portal HTML + JS.

---

## 12. Common Pitfalls

### ❌ DO NOT

| Mistake | Why | Fix |
|---------|-----|-----|
| Handle BACK button (10009) | Conflicts with core behavior | Avoid intercepting in bundles |
| Use `display: none` to hide host | Breaks `offsetParent` | Use `opacity: 0.001` |
| Forget to bump tag | Stale code from CDN | Always create new tag |
| Use ES6+ without Babel | Chrome 47 breaks | Run through build system |
| Use `innerHTML` with user content | XSS vulnerability | Use `textContent` or `createElement` |
| Add external dependencies without checking | May not work on Chrome 47 | Test thoroughly first |
| Modify files outside your scope | Breaks other functionality | Make minimal, targeted changes |
| Create helper scripts in repo root | Pollutes git history | Use `/tmp` for temporary files |

### ✅ DO

| Practice | Why |
|----------|-----|
| Wrap all code in try-catch | Tizen crashes on uncaught exceptions |
| Lock viewport to 1920px | Disables responsive breakpoints |
| Cache processed DOM elements | Prevents duplicate listeners |
| Test with actual remote | D-pad behaves differently than keyboard |
| Log all state transitions | Diagnostics panel shows history |
| Use feature detection | Ensures compatibility across Tizen versions |
| Read existing code patterns first | Maintains consistency |
| Check bundle manifest schema | Prevents validation errors |

---

## 13. Agent Instructions

### Before Starting Work

1. **Read this document completely**
2. **Check `docs/Engineering-Plan.md`** for phase status and dependencies
3. **Understand target platform** — Chrome 47 on Tizen TV
4. **Know the color button mappings** — They are locked

### During Development

1. **Follow file structure exactly** — Paths are specified precisely
2. **Use Babel-safe code** — No raw ES6+ in output
3. **Handle errors gracefully** — Uncaught exceptions crash Tizen
4. **Log everything** — Use `TizenPortal.log()` for visibility
5. **Test incrementally** — Build after each change
6. **Write descriptive commit messages** — Include scope + intent (no generic “bump” only)

### Critical Reminders

| Priority | Reminder |
|----------|----------|
| 🔴 | BACK handled by core (history/diagnostics) |
| 🔴 | All output must be ES5 — Chrome 47 compatibility |
| 🔴 | No frameworks — Vanilla JS only |
| 🟡 | Test on real hardware before marking complete |
| 🟡 | Update docs when changing behavior |
| 🟢 | Cite external code in README.md |

### Phase Checklist

Before marking any phase complete:

- [ ] `npm run build` succeeds
- [ ] No console errors on boot
- [ ] Remote navigation works
- [ ] Color buttons work as documented
- [ ] Memory stable after 5 minutes

### Pull Request Standards

When submitting changes:

1. **Keep changes minimal** — Only modify files necessary for the task
2. **Test the build** — Ensure `npm run build` succeeds without errors
3. **Verify functionality** — Manually test on target platform when possible
4. **Document behavior changes** — Update relevant docs if behavior changes
5. **Follow commit message format** — Include scope and intent, minimum 1000 characters for deployments
6. **Use `.gitignore` for artifacts** — Don't commit `node_modules`, build artifacts, or temp files

### Issue Acceptance Criteria

For issues to be considered complete:

- [ ] All requirements from issue description are met
- [ ] Code follows existing patterns and style
- [ ] No new console errors or warnings
- [ ] Build succeeds without errors
- [ ] Changes are minimal and targeted
- [ ] Relevant documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Chrome 47 compatibility maintained

---

## 14. Attribution Requirements

**When using code from other projects, you MUST cite them in README.md.**

### Current Attributions Required

| Code | Source | License | Citation |
|------|--------|---------|----------|
| `spatial-navigation-polyfill.js` | TizenTube | MIT | Required |
| `domrect-polyfill.js` | TizenTube | MIT | Required |
| Build patterns (Rollup/Babel config) | TizenTube | MIT | Recommended |

### README.md Attribution Format

```markdown
## Acknowledgments

This project uses code from the following open-source projects:

- **[TizenTube](https://github.com/reisxd/TizenTube)** — Spatial navigation polyfill and DOMRect polyfill
- **[TizenBrew](https://github.com/reisxd/TizenBrew)** — Module loading platform
```

---

## Quick Reference

### Project Status

| Component | Status |
|-----------|--------|
| Universal Runtime | ✅ Deployed (v0463) |
| Portal launcher | ✅ Working |
| Bundle injection | ✅ Working |
| Address bar overlay | ✅ Working |
| Diagnostics panel | ✅ Working |
| On-screen pointer | ✅ Working |
| Focus management | ✅ Working |
| Text input handling | ✅ Working |
| Audiobookshelf bundle | ✅ Built-in |
| Adblock bundle | ✅ Built-in |
