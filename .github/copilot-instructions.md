# Copilot Instructions for TizenPortal

## Project Scope & Constraints
- **Target:** Legacy Samsung Tizen TVs (Chrome 47-69). Stay Chrome-47-safe; avoid modern APIs unless gated/polyfilled.
- **No build step:** All code is inline JS/CSS in two files: [../dist/index.html](../dist/index.html) (launcher) and [../dist/userScript.js](../dist/userScript.js) (injector).
- **Compatibility:** Avoid ES6+, modern CSS features, large images. Keep fonts simple (Segoe UI). Test on actual Tizen hardware when possible.

## Architecture Overview
- **Launcher** ([../dist/index.html](../dist/index.html)): Static grid UI stores app cards in `localStorage.tp_apps`. Builds a payload (`__CORE__` + preset CSS/JS + UA) and navigates to `app.url#tp=BASE64(JSON)`.
- **Injector** ([../dist/userScript.js](../dist/userScript.js)): Loaded by target app via TizenBrew. Reads `#tp` (first), then `?tp`, then `sessionStorage/localStorage.tp_conf`. Applies UA override, injects CSS/JS, shows TP sidebar/console.
- **Presets:** Inline `<script type="text/template">` blocks in launcher. Audiobookshelf (`abs`) uses MutationObserver + state machine. When adding presets, update `PRESETS` object and ensure names align with dropdown options.

## Critical Rules

### Payload Delivery
- **Hash-only:** Keep payload in URL hash (`#tp=...`) to avoid 414 errors and server-side handling. Query params (`?tp=...`) are legacy fallback only.
- **Preserve payload:** When adding links/navigation helpers, always re-append `#tp` or `?tp` param so fixes persist across pages.
- **Persistence:** Payload stored in both `sessionStorage.tp_conf` and `localStorage.tp_conf` to survive reloads. Don't clear unless wiping config intentionally.

### Visibility & Scraping
- **Never `display: none`:** Hide host app with `opacity: 0.001`, `pointer-events: none`, `z-index: -100` (see `.tp-lifeboat-active #__nuxt` in [../dist/index.html](../dist/index.html)). This keeps `offsetParent` valid for input detection.
- **Nuxt readiness:** Gate scraping on Nuxt loader opacity (`#nuxt-loading` opacity !== '0'). Scraping during render causes race conditions.
- **Mode tracking:** ABS preset uses `mode` field ('form' vs 'content') to distinguish page types. Always clear boat and reset cache when switching modes.

### Input Proxying & Navigation
- **Rewrite-all mindset:** Rescue broken apps by proxying all visible inputs/buttons into TV-friendly proxies (see `TizenUtils.handleLogin`). Don't touch originals directly.
- **Proxy behavior:** Tag proxies with `data-tp-pxy`. Back/Escape (10009/27) blur. Up/Down moves between fields. Enter submits if form button exists.
- **Text input navigation:** Up/Down on text inputs must move focus (not caret). Left/Right allow editing. Back/Escape blurs. Prevent getting stuck in text fields.
- **Focus loop:** Launcher grid uses `enforceFocus()` to maintain focus. Don't break this with global event handlers.

### Remote Key Map
- **Injector (userScript.js):** 406 toggles sidebar; 403 reloads; 404 toggles mouse; 405 jumps to homeUrl; Back/Escape closes panels; Enter activates; arrows scroll/move pointer.
- **Launcher (index.html):** Arrow keys navigate grid; Enter launches (short) or edits (long press); Back closes modal.
- **Preserve these:** When adding key handling, respect existing mappings. Test with actual remote.

## ABS Preset (Audiobookshelf)

### State Machine
```
INIT → WAIT_NUXT → DETECT_PAGE → READY
```
- **WAIT_NUXT:** Poll for `window.__NUXT__` or `[id*="__nuxt"]` (100ms intervals).
- **DETECT_PAGE:** MutationObserver active. Detect books (`[id^="book-card-"]`) vs inputs.
- **Mode switching:** Books = 'content' mode; inputs (no books) = 'form' mode. Clear boat and cache when switching.

### Rendering Logic
- **Navigation extraction:** Once per page load (`cache.processedNav`). Scan `[role="toolbar"]` for links, add to `#tp-navbar`.
- **Category sections:** Target `.categorizedBookshelfRow`. Find `.categoryPlacard` in parent structure for headers.
- **Book cards:** Clone `[id^="book-card-"]`, clean with `tp-rescued-card` class. Look for `img[cy-id="coverImage"]` first.
- **Caching:** `cache.processedBooks`, `cache.processedHeadings`, `cache.processedNav`. Never re-process same IDs.

### Error Handling
- **Try-catch everywhere:** Wrap MutationObserver callback, `detectAndRender()`, `renderContent()`.
- **Debug logging:** Use `this.log()` to update banner (`#tp-debug`). Log state transitions, counts, errors.
- **Console capture:** Injector wraps `console.log/error` into in-memory buffer for diagnostics pane.

## Deployment Workflow

### Version Bumping
-- **Tag format:** Four digits (e.g., `0100` = initial release). Use four-digit tags for all releases (e.g., `0100`, `0101`, `0110`). Bump the right-most digit for patch changes, the middle digits for minor, and leftmost for major releases.
- **Files to update:** `dist/index.html` (title + header), `dist/userScript.js` (toast), `README.md` (badge), `package.json` (version).
- **Command:** `git tag XXXX && git push origin XXXX` (TizenBrew pulls from tag).

### TizenBrew CDN Caching
- **Problem:** CDN caches by tag. Old code persists after `git push` without tag bump.
- **Solution:** Delete old module (`alexnolan/tizenportal@OLD_TAG`), add new (`alexnolan/tizenportal@NEW_TAG`).
- **Critical:** Version numbers in launcher/sidebar/README must match tag. Users rely on displayed version for troubleshooting.

## Common Pitfalls

### DO NOT:
- ❌ Use `display: none` to hide host app (breaks `offsetParent`).
- ❌ Scrape DOM while Nuxt loader visible (race condition).
- ❌ Clear `boat.innerHTML` without resetting cache (memory leak, duplicate listeners).
- ❌ Use query params for payload (hits 414 errors on long payloads).
- ❌ Remove `github.io` guard in injector (causes self-execution).
- ❌ Forget to bump tag when deploying to TizenBrew (CDN serves stale code).
- ❌ Create markdown documentation files in repo (add to .gitignore).

### DO:
- ✅ Use hash-based payload (`#tp=...`).
- ✅ Gate scraping on Nuxt loader opacity check.
- ✅ Track mode ('form' vs 'content') and clear state on switch.
- ✅ Wrap all ABS code in try-catch with logging.
- ✅ Cache processed elements (`processedBooks`, `processedHeadings`, `processedNav`).
- ✅ Test remote key behavior (406, 403, 404, 405, 10009, 27).
- ✅ Bump tag for every real-world test deployment.

## Key Files Reference
- **[../dist/index.html](../dist/index.html):** Launcher + PRESETS (ABS template inline)
- **[../dist/userScript.js](../dist/userScript.js):** Injector (Config, UI, Input, remote keys)
- **[../AGENT_INSTRUCTIONS.md](../AGENT_INSTRUCTIONS.md):** Deep architecture docs (not committed)
- **[../README.md](../README.md):** User-facing docs (features, installation, compatibility)
- **[../.gitignore](../.gitignore):** Excludes internal docs (REFACTOR_LOG.md, etc.)

## Current Status (v0100)
- **MutationObserver:** Event-driven DOM detection replaces 2-second polling.
- **State machine:** INIT → WAIT_NUXT → DETECT_PAGE → READY.
- **Mode tracking:** Separate 'form' vs 'content' state prevents rendering conflicts.
- **Viewport lock:** `TizenUtils.lockViewport()` forces 1920px to disable Tailwind breakpoints.
- **Caching layer:** Prevents duplicate processing of books/headings/nav.
- **Error handling:** Try-catch + logging in all ABS functions.
- **Debug banner:** On-screen `#tp-debug` shows state transitions and errors.

## Next Steps
- **Jellyfin preset:** Adapt ABS state machine for Jellyfin architecture.
- **Video player:** Custom Tizen-compatible playback interface.
- **Performance monitoring:** Metrics for MutationObserver callback frequency.

---

**For questions or missing conventions, check [../AGENT_INSTRUCTIONS.md](../AGENT_INSTRUCTIONS.md) or open a GitHub issue.**
