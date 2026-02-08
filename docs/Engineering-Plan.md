# TizenPortal Engineering Plan

> **Version:** 5.0  
> **Date:** February 7, 2026  
> **Status:** Universal Runtime (v0464)

---

## Executive Summary

TizenPortal operates as a **TizenBrew Module** (`packageType: "mods"`) that provides a portal launcher and browser shell for Samsung Tizen TVs.

**Architecture:** Single unified runtime (`tizenportal.js`) injected into all pages by TizenBrew.

**Current Status:** All core features working:
- Portal grid with card management
- Full browser chrome (address bar, diagnostics)
- Spatial navigation with cross-origin safety
- 3 bundles (default, audiobookshelf, adblock)
- All color button functions operational

---

## Version Numbering Scheme

**Format:** 4-digit numeric tags for easy TV remote entry.

| Tag | Semantic | Notes |
|-----|----------|-------|
| `0100` | 0.1.00 | Starting version |
| `0464` | 0.4.64 | Current - generic bundle matcher API |
| `0446` | 0.4.46 | Fix bundle persistence (stale build) |
| `0445` | 0.4.45 | URL validation, shared escapeHtml, preferences hardening |
| `0444` | 0.4.44 | CSP, postMessage, adblock hardening |
| `0443` | 0.4.43 | Re-tag of 0440 baseline |
| `0440` | 0.4.40 | Unified runtime |
| `1000` | 1.0.00 | 1.0 release milestone |

**Version Source:** `package.json` is the single source of truth. Version is injected at build time via `@rollup/plugin-replace`.

---

## Table of Contents

1. [Goals & Non-Goals](#1-goals--non-goals)
2. [Architecture Overview](#2-architecture-overview)
3. [Phase Status](#3-phase-status)
4. [Build System](#4-build-system)
5. [Remaining Work](#5-remaining-work)
6. [Success Criteria](#6-success-criteria)
7. [Risk Mitigation](#7-risk-mitigation)
8. [Agent Instructions](#8-agent-instructions)

---

## 1. Goals & Non-Goals

### Goals (1.0 Release)

- ✅ **TizenBrew Integration:** Runs as `mods` module
- ✅ **Portal Grid:** Launcher grid with site cards stored in localStorage
- ✅ **Payload System:** Bundle name passed via URL hash
- ✅ **Universal Runtime:** Single runtime on all pages
- ✅ **Version Injection:** Single source of truth in package.json
- ✅ **Spatial Navigation:** W3C-compliant polyfill, cross-origin safe
- ✅ **Bundle System:** Bundles with CSS/JS injection (default + site-specific)
- ✅ **Focus Management:** Focus manager module
- ✅ **Input Handling:** Unified key handling for remote
- ✅ **Diagnostics:** Blue-menu debug overlay with scrolling
- ✅ **Address Bar:** Red-button browser chrome
- ✅ **On-Screen Pointer:** Green-button mouse emulation
- ⏳ **Hardware Testing:** Full validation on Tizen TV

### Non-Goals (Deferred)

- **Video Player:** Custom playback UI (deferred to 2.0)

---

## 2. Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        TizenBrew                            │
│  1. Loads module from GitHub tag                            │
│  2. Opens websiteURL (portal) in browser                    │
│  3. Injects tizenportal.js into ALL pages                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Portal (dist/index.html)                  │
│  - Runtime detects portal page                              │
│  - Renders site card grid from localStorage                 │
│  - User selects a card                                      │
│  - Navigates to: card.url#tp=BASE64(payload)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Target Site (e.g., Audiobookshelf)           │
│  - TizenBrew injects tizenportal.js                         │
│  - Runtime reads #tp= from URL hash                         │
│  - Applies bundle CSS/JS from compiled registry             │
│  - Provides overlay UI (address bar, diagnostics, etc.)     │
│  - YELLOW button returns to portal                          │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
tizenportal/
├── package.json              # TizenBrew manifest + version source
├── rollup.config.js          # Build config
│
├── dist/                     # Deployed to GitHub Pages
│   ├── index.html            # Portal launcher HTML
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
├── bundles/                  # Site-specific bundles
│   ├── registry.js           # Bundle registration
│   ├── default/              # Fallback bundle
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
└── polyfills/                # Platform polyfills
    ├── index.js              # Polyfill loader
    └── domrect-polyfill.js   # DOMRect (from TizenTube)
```

---

## 3. Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| Foundation | ✅ Complete | Project structure, build system |
| Universal Runtime | ✅ Complete | Single runtime on all pages |
| Version System | ✅ Complete | Centralized in package.json |
| Portal UI | ✅ Complete | Grid launcher with card management |
| Bundle System | ✅ Complete | Registry with 4 bundles |
| Spatial Nav | ✅ Complete | Cross-origin safe polyfill |
| Input Handler | ✅ Complete | Unified key handling |
| Focus Manager | ✅ Complete | Focus tracking module |
| Address Bar | ✅ Complete | RED button browser chrome |
| Diagnostics | ✅ Complete | BLUE button debug overlay |
| On-Screen Pointer | ✅ Complete | GREEN button mouse |
| Hardware Testing | ⏳ Pending | Real TV validation |

---

## 4. Build System

### Rollup Configuration

Single output build:

```js
export default [
  {
    input: 'core/index.js',
    output: { file: 'dist/tizenportal.js', format: 'iife', name: 'TizenPortal' },
    plugins: [replace, string, nodeResolve, commonjs, babel, terser],
  },
];
```

### Version Injection

```js
replace({
  preventAssignment: true,
  values: { '__VERSION__': pkg.version },
})
```

### Payload Format

```js
{
  bundleName: "audiobookshelf",
  cardName: "My Server",
  css: "/* bundle styles */",
  js: "",
  ua: ""  // optional UA override
}
```

Encoded as: `#tp=eyJidW5kbGVOYW1lIjoiLi4uIn0=`

---

## 5. Remaining Work

### Priority 1: Bundle Refinement

- [ ] Audiobookshelf playback controls
- [ ] Jellyfin media key integration
- [ ] Bundle auto-detection by URL pattern
- [ ] Bundle settings persistence

### Priority 2: Navigation Polish

- [ ] Portal card D-pad refinement
- [ ] Better focus indicators
- [ ] Focus trap for overlays

### Priority 3: UX Improvements

- [ ] Loading states/spinners
- [ ] Error message display
- [ ] Site favicon support

### Priority 4: Testing & Documentation

- [ ] Test on real TV hardware
- [ ] Memory profiling (5+ minute sessions)
- [ ] User guide
- [ ] Bundle authoring guide

---

## 6. Success Criteria

### Functional Requirements

| Requirement | Status |
|-------------|--------|
| Portal loads on TizenBrew | ✅ Working |
| Portal grid displays cards | ✅ Working |
| Navigation to site works | ✅ Working |
| Bundle CSS/JS applied | ✅ Working |
| Return to portal (YELLOW) | ✅ Working |
| Spatial navigation | ✅ Working |
| Diagnostics panel | ✅ Working |

### Performance Requirements

| Metric | Target | Status |
|--------|--------|--------|
| Portal boot time | < 2s | ✅ ~1s |
| Site navigation | < 1s | ✅ ~200ms |
| Runtime size | < 400KB | ✅ ~320KB |

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Cross-origin restrictions | Payload via URL hash works universally; iframe access is guarded |
| TizenBrew CDN caching | Always create new tag for releases |
| SPA navigation loses payload | Fall back to sessionStorage |
| BACK button handling | Close diagnostics if open, otherwise navigate history on sites |

---

## 8. Agent Instructions

### Before Starting Work

1. Read `.github/copilot-instructions.md` completely
2. Check this plan for current phase status
3. Understand target platform (Chrome 47-69)

### Critical Constraints

- All output must be ES5 (Babel transpiles)
- No frameworks — Vanilla JS only
- 1920×1080 fixed viewport

### Version Bump Workflow

```bash
# 1. Update version in package.json
# 2. Build
npm run build

# 3. Commit and tag
git add .
git commit -m "Bump to vXXXX"
git tag XXXX
git push origin master --tags
```

---

## Appendix A: Key Codes Reference

### Navigation Keys

| Key | Code | Notes |
|-----|------|-------|
| Left | 37 | Standard DOM |
| Up | 38 | Standard DOM |
| Right | 39 | Standard DOM |
| Down | 40 | Standard DOM |
| Enter | 13 | Standard DOM |
| Back | 10009 | Navigate history (sites), close diagnostics when open |
| Exit | 10182 | Exit app |

### Color Buttons

| Key | Code | TizenBrew Key Name | Action |
|-----|------|-------------------|--------|
| Red | 403 | `ColorF0Red` | Address bar |
| Green | 404 | `ColorF1Green` | Pointer toggle |
| Yellow | 405 | `ColorF2Yellow` | Preferences / Return to portal |
| Blue | 406 | `ColorF3Blue` | Diagnostics |

### Media Keys

| Key | Code | TizenBrew Key Name |
|-----|------|-------------------|
| Play | 415 | `MediaPlay` |
| Pause | 19 | `MediaPause` |
| Play/Pause | 10252 | `MediaPlayPause` |
| Stop | 413 | `MediaStop` |
| Rewind | 412 | `MediaRewind` |
| Fast Forward | 417 | `MediaFastForward` |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 4.0 | 2026-01-27 | Removed legacy dual-build references |
| 3.0 | 2026-01-22 | Universal runtime deployed |
| 2.0 | 2026-01-20 | MOD mode architecture |
| 1.0 | 2026-01-12 | Initial plan |

---

*End of Engineering Plan*
