# TizenPortal Progress Tracker

> **Last Updated:** February 7, 2026  
> **Current Version:** 0443  
> **Architecture:** Universal Runtime

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Universal Runtime | ✅ Complete | Single runtime on all pages |
| Portal Launcher | ✅ Working | Grid with cards |
| Bundle Injection | ✅ Working | Payload via hash |
| Bundle Registry | ✅ Working | 3 bundles: default, audiobookshelf, adblock |
| Version System | ✅ Working | Centralized in package.json |
| Spatial Navigation | ✅ Working | W3C polyfill integrated, cross-origin safe |
| Diagnostics Panel | ✅ Working | BLUE button, 3-state toggle, log scrolling |
| Address Bar Overlay | ✅ Working | RED button, full browser chrome |
| On-Screen Pointer | ✅ Working | GREEN button |
| Input Handler | ✅ Working | Unified key handling |
| Focus Management | ✅ Working | Focus manager module |

---

## Architecture

### Universal Runtime (Current)

TizenPortal uses a single unified runtime (`tizenportal.js`) on all pages:

- **Portal page:** Full runtime with grid launcher, site editor, etc.
- **Target sites:** Same runtime, detects it's not the portal and applies bundles

**Key points:**
- TizenBrew injects `dist/tizenportal.js` into all pages
- No separate "userScript" or dual builds
- Bundles are compiled into the runtime
- Payload passed via URL hash for bundle selection

---

## Version History

### v0443 (Current)

- Re-tag of v0440 baseline to bypass CDN caching of reverted tags 0441/0442

### v0440

- Audiobookshelf bundle refactored as best-practice example
- Core utilities in focus/manager.js and input/text-input.js
- Card registration system (data-tp-card attributes)
- Geometry utilities for spatial navigation spacing
- Enhanced DOM observation for dynamic content

### v0301

- Removed legacy dual-build architecture
- Deleted obsolete `mods/` folder
- Single unified runtime

### v0214

- Arrow keys only blocked for diagnostics panel
- Address bar allows normal arrow navigation
- Diagnostics up/down scrolling retained

### v0213

- Block arrow keys when overlays visible
- Up/down scrolls diagnostics log history (100px per press)

### v0212

- Major cross-origin fix in spatial-navigation-polyfill
- Removed all parent document element storage
- Navigation stays within current document only

### v0207

- Unified build output (single runtime)

---

## Remaining Work

### Priority 1: Testing & Polish

- [ ] Test all bundles on real TV hardware
- [ ] Memory profiling (5+ minute sessions)
- [ ] Portal card D-pad navigation refinement
- [ ] Bundle auto-detection by URL pattern

### Priority 2: Bundle Enhancements

- [ ] Audiobookshelf playback controls
- [ ] Jellyfin media key integration
- [ ] Bundle settings persistence

### Priority 3: UX Improvements

- [ ] Better focus indicators
- [ ] Loading states/spinners
- [ ] Error message display
- [ ] Site favicon support

### Priority 4: Documentation

- [ ] User guide for end users
- [ ] Bundle authoring guide finalization
- [ ] Troubleshooting guide

---

## File Structure

```
tizenportal/
├── package.json              # TizenBrew manifest
├── rollup.config.js          # Build config
│
├── dist/                     # Deployed (GitHub Pages)
│   ├── index.html            # Portal launcher
│   └── tizenportal.js        # Universal runtime
│
├── core/                     # Runtime source
│   └── index.js
│
├── ui/                       # UI components
│   ├── portal.js
│   └── siteeditor.js
│
└── bundles/                  # Site bundles
    └── registry.js
```

---

## Key Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Portal boot time | ~1s | < 2s |
| Runtime size | ~320KB | < 400KB |
| Site navigation | ~200ms | < 1s |

---

## Color Button Status

| Button | Short Press | Long Press | Status |
|--------|-------------|------------|--------|
| Red | Address bar | Reload | ✅ Working |
| Green | Pointer toggle | Focus toggle | ✅ Working |
| Yellow | Preferences (portal) / Return to portal (sites) | Add Site (portal) / Return to portal (sites) | ✅ Working |
| Blue | Diagnostics | Safe mode | ✅ Working |

---

## Testing Checklist

### Portal

- [x] Loads on TizenBrew
- [x] Cards display correctly
- [x] Add card modal works
- [x] Edit card modal works
- [x] Delete card works
- [ ] D-pad navigation polished

### Runtime

- [x] Full runtime loads on target site
- [x] Payload decodes correctly
- [x] CSS injection works
- [x] JS injection works
- [x] Color buttons work on target sites

### Bundles

- [x] Default bundle compiled in (fallback)
- [x] Audiobookshelf bundle compiled in
- [x] Adblock bundle compiled in
- [ ] Bundles tested on real hardware

### Overlays

- [x] Diagnostics panel toggles (3 states)
- [x] Diagnostics scrolls with up/down
- [x] Address bar opens/closes
- [x] Address bar navigation works

### Cross-Origin Safety

- [x] No errors on arrow keys
- [x] Spatial nav stays in current document
- [x] Safe computed style wrapper
- [x] No parent document element storage

---

*End of Progress Tracker*
