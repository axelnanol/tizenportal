# Agent Instructions

## Role & Goal
**Role:** You are the Lead Developer for **TizenPortal**, a specialized web launcher and compatibility layer designed for legacy Samsung Smart TVs (Targeting specifically Tizen 5.0, but also aiming to assist with 3.0-recent versions too) running outdated Chromium engines (Chrome 47-69).

**Goal:** To run modern self-hosted web apps (specifically **Audiobookshelf**, Jellyfin, etc.) on these old TVs by injecting "Rescue Scripts" that fix broken layouts, provide navigation, and replace incompatible UI elements.

## Core Mandates
- **Rewrite Strategy**: The application employs a "Rewrite All" strategy for incompatible pages. Instead of just handling login forms, proxy *all* interactive elements (inputs, buttons, textareas) into a native-friendly "Lifeboat" interface.
- **Input Proxying**: When detecting inputs, create proxy elements that sync values with the original hidden DOM.
- **Focus Management**: 
    - Ensure all proxy inputs have `keydown` handlers for `Back` (10009) and `Escape` (27) keys that trigger `.blur()`. This is critical for TV remote navigation to exit text fields.
    - Implement "Break Out" navigation: Up/Down arrow keys on a text input should focus the previous/next element instead of moving the caret, preventing users from getting stuck.
- **Form Display Logic**: The proxy interface should be generated for *any* visible inputs found on the page.
- **Scraping Visibility**: **CRITICAL:** Do NOT use `display: none` to hide the original application container (e.g., `#__nuxt`). This removes elements from the render tree, causing `offsetParent` to be null and breaking input detection scripts. Use `opacity: 0.001`, `z-index: -100`, and `pointer-events: none` instead.
- **Payload Delivery**: Use the **URL Hash** (`#tp=...`) to pass the configuration payload. Do NOT use query parameters (`?tp=`) as they hit server-side URI length limits (414 errors). Do NOT use `window.name` exclusively as it can be flaky across some navigations.
- **User Agents**: Stick to simple, standard User Agents (Tizen, Mobile, Desktop). Modern spoofing (e.g., Chrome 120) can cause the server to send incompatible modern code or headers that crash the legacy Tizen browser.

## Architecture
1. **`dist/index.html` (The Launcher):**
    * Static grid of apps in `localStorage`.
    * Generates a JSON payload with CSS/JS fixes, Base64 encodes it, and appends to URL Hash: `target_url#tp=PAYLOAD`.
2. **`dist/userScript.js` (The Injector):**
    * Loaded by the target app (via TizenBrew).
    * Decodes `?tp=` OR `#tp=` payload (Hash preferred) and executes injected CSS/JS.
    * Persists config to `localStorage` to survive app restarts.

## Deployment (TizenBrew)
**Crucial Note:** TizenBrew relies on CDN caching. Updates to `master` might not propagate immediately.
1.  **Tag the Release:** Bump the Git tag for every deployment (e.g., `git tag 046`).
2.  **Update Module:** On the TV's TizenBrew interface:
    *   Add module with tag: `alexnolan/tizenportal@046`.
    *   **Delete** the old module to clear cache.

## Current Status: v0100 (Event-Driven Architecture)
- **MutationObserver**: Real-time DOM change detection replaces 2-second polling interval.
- **State Machine**: Explicit INIT → WAIT_NUXT → DETECT_PAGE → READY flow prevents race conditions.
- **Caching Layer**: Processed elements cached to avoid re-extraction and listener destruction.
- **Viewport Lock**: Responsive breakpoints disabled, TV forced to 1920px for consistent layout.
- **Readable Templates**: ABS preset code un-minified for maintainability and debugging.
- **CSS Reset**: Aggressive Tailwind overrides ensure predictable element sizing.

## Next Steps (v0.6.0)
*   **Jellyfin Preset:** Implement "Rescue Strategy" for Jellyfin (adapting ABS pattern).
*   **Video Player:** Custom Tizen-compatible video player interface.
*   **Remote Control:** Polish key handling (potentially add gamepad support).
*   **Performance Monitoring**: Add metrics for DOM scan time, MutationObserver callback frequency.