# TizenPortal Project Context & Instructions (v0.4.5 - COMPLETED)

**Role:** You are the Lead Developer for **TizenPortal**, a specialized web launcher and compatibility layer designed for legacy Samsung Smart TVs (Targeting specifically Tizen 5.0, but also aiming to assist with 3.0-recent versions too) running outdated Chromium engines (Chrome 47-69).

**Project Goal:** To run modern self-hosted web apps (specifically **Audiobookshelf**, Jellyfin, etc.) on these old TVs by injecting "Rescue Scripts" that fix broken layouts, provide navigation, and replace incompatible UI elements.

## 1. Core Architecture

The project consists of two files hosted on GitHub Pages:

1. **`dist/index.html` (The Launcher):**
    * A static grid of apps stored in `localStorage`.
    * **Mechanism:** When launching an app, it generates a JSON payload containing specific CSS and JS fixes. It Base64 encodes this payload and appends it to the target URL: `target_url?tp=PAYLOAD`.
    * **Presets:** Contains app-specific "Rescue Strategies" (e.g., the ABS Lifeboat).

2. **`dist/userScript.js` (The Injector):**
    * A script loaded by the target app (via TizenBrew/Tampermonkey).
    * **Mechanism:** It reads the `?tp=` payload from the URL, decodes it, and executes the injected CSS/JS.

## 2. Status: v0.4.5 (Audiobookshelf "Hybrid Rescue" Complete)

We have successfully implemented the "Hybrid Rescue" strategy for Audiobookshelf (ABS), ensuring compatibility with Tizen 3.0 (Chrome 47).

### Key Features Implemented:

*   **Hybrid Mode:** 
    *   **Form Mode:** Detects login screens, hides the Lifeboat, and displays the original app (with high-contrast CSS overrides) or a **Proxy Form** (custom rendered form syncing to hidden inputs).
    *   **Lifeboat Mode:** Detects logged-in state, hides the original app (`display: none`), and renders a custom TV-friendly grid.
*   **Proxy Form:** A fully rendered login UI that mirrors the original form's inputs and button, bypassing layout issues on the login screen.
*   **Persistent Navigation:** Links in the Lifeboat use `TizenUtils.navigate()` to append the `?tp=` payload to the target URL, ensuring the Rescue Script survives page reloads.
*   **Dynamic Appbar:** Scrapes the hidden app's sidebar/navigation to build a working top bar in the Lifeboat.
*   **Nuxt.js Compatibility:**
    *   Uses `textContent` to scrape hidden DOM elements (fixing empty strings from `innerText`).
    *   Detects `window.__NUXT__.config.routerBasePath` for correct "Home" button linking.
    *   Waits for `#nuxt-loading` to disappear before scraping.
*   **Global Core:**
    *   Common styles (Cards, Headers, Proxy Form) moved to `__CORE__` preset.
    *   JS Utilities (`navigate`, `handleLogin`, `closest` polyfill) moved to `__CORE__` preset.
    *   Hardware acceleration (`translateZ(0)`) added for smoother scrolling.

## 3. Deployment & Versioning

**Crucial Note for TizenBrew:** TizenBrew relies on CDN caching, which means updates to the `master` branch might not propagate to the TV immediately. To force an update on the test TV:

1.  **Tag the Release:** Bump the Git tag for every deployment (e.g., `git tag 045`).
2.  **Update Module:** On the TV's TizenBrew interface:
    *   Add the new module using the specific tag: `alexnolan/tizenportal@045`.
    *   **Delete** the old module (e.g., `@044`) to ensure no cached assets conflict.

## 4. Next Steps (v0.5.0)

*   **Jellyfin Preset:** Implement a similar "Rescue Strategy" for Jellyfin, leveraging the new Global Core utilities.
*   **Video Player:** Investigate replacing the native web player with a custom Tizen-compatible video player interface if necessary.
*   **Remote Control:** Polish remote control key handling (Back, Play/Pause) for the Lifeboat interface.

**Current Action:**
v0.4.5 is complete. The codebase is ready for testing or deployment.