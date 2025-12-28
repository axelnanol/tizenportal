# TizenPortal (Alpha v0.1.0)

**A Universal Web App Launcher & Polyfill Injection System for Samsung Tizen TVs.**

TizenPortal allows you to run modern self-hosted web applications (Audiobookshelf, Jellyfin, Home Assistant) on older Samsung TVs (2016-2020) that run outdated versions of Chromium (Chrome 63). It fixes rendering bugs, adds remote control support, and injects a modern system overlay with debugging tools.

## 🚀 The Problem

Modern web apps rely on CSS features like `gap`, `aspect-ratio`, and `focus-visible`. Samsung TVs running Tizen 3.0, 4.0, or 5.0 **do not support these features**.

* **Result:** Apps look broken ("Exploding Images"), crash, or cannot be navigated with a remote.
* **Solution:** TizenPortal acts as a "Launcher Middleware." It configures a polyfill payload, smuggles it into the app context, and patches the browser engine on the fly.

## ✨ Features

### 🎮 Input & Navigation

* **Spatial Navigation:** Navigate touch-based web apps using the physical Arrow Keys.
* **Virtual Mouse Mode (Green Button):** Injects a fake cursor for apps that completely lack keyboard support. Use arrow keys to move and click.
* **Media Key Passthrough:** Ensures Play/Pause/Forward/Rewind buttons actually control the media player in ABS/Jellyfin.

### 🛠 Compatibility Fixes

* **The "Rescue Pack":** Auto-patches Flexbox bugs (Chrome 63) to prevent images from stretching infinitely.
* **User Agent Spoofing:** Force apps to load their full **Desktop** interface instead of a stripped-down "Mobile/TV" version.
* **Modern JS Polyfills:** Adds support for `globalThis`, `replaceAll`, and `ResizeObserver`.

### 💻 System Tools

* **Debug HUD:** A built-in overlay to view console logs (JS errors), memory usage, and resolution info directly on the TV.
* **Wakelock:** Prevents the TV screensaver from interrupting audio playback.

## 📺 Installation

This application is loaded via **TizenBrew**.

1. Open **TizenBrew** on your Samsung TV.
2. Go to **Add Repository**.
3. Enter URL: `https://github.com/alexnolan/tizenportal`
4. Install the **TizenPortal** module.
5. Launch.

## ⚙️ Configuration

### Adding Apps

1. Click the **+ (Add)** button on the launcher grid.
2. **Name:** Label for the app.
3. **URL:** The local IP address (e.g., `http://192.168.1.50:13378`).
4. **Preset:** Select "Audiobookshelf" or "Jellyfin" for app-specific fixes.
5. **Device Type:**
* *Default:* Uses the TV's native User Agent.
* *Desktop:* Spoofs Windows 10 Chrome (Forces PC view).
* *Mobile:* Spoofs Android Chrome (Forces Touch view).



## 🕹 Controls

| Button | Function |
| --- | --- |
| **Arrows** | Navigate Grid / Move Virtual Mouse |
| **Enter / OK** | Click / Select |
| **Green** | **Toggle Virtual Mouse Mode** (Use arrows to move cursor) |
| **Red** | **Force Reload** (Refreshes the current page) |
| **Blue** | **Toggle System HUD** (Debug Menu) |
| **Back (Short)** | Go Back in History |
| **Back (Hold 1s)** | Open System HUD (Alternative if Blue button fails) |

## 🐞 Troubleshooting & Debugging

If an app crashes or fails to load:

1. Press the **Blue Button** to open the HUD.
2. Navigate to the **CONSOLE** tab.
3. Read the logs. Look for red `[ERR]` messages to identify syntax errors or blocked requests.

## 🏗 Architecture

TizenPortal uses a "Smuggler" architecture to bypass Cross-Origin restrictions between the remote Launcher and your Local Network.

1. **Launcher (GitHub Pages):** You configure apps here.
2. **Handshake:** The launcher packs CSS/JS/UA settings into a JSON string and saves it to `window.name`.
3. **Redirect:** The browser navigates to your local IP. `window.name` persists.
4. **Injector (Local Script):** The TizenBrew user script reads `window.name`, unpacks the payload, and applies fixes immediately.

## ⚠️ Status: Alpha

This project is currently in active development.

* **Target Environment:** Samsung Tizen 5.0 (2019 Models) running Chromium 69.
* **Status:** Unverified. Testing in progress.

## 📄 License

MIT License.