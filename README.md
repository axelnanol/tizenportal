# TizenPortal (v0.2.0 Alpha)

**A Universal Web App Launcher & OS Replacement Overlay for Samsung Tizen TVs.**

TizenPortal enables you to run modern, self-hosted web applications (Audiobookshelf, Jellyfin, Home Assistant) on older Samsung TVs (2016-2020) running outdated Chromium engines (Chrome 63/69).

It is not just a launcher; it acts as an **injection middleware**, wrapping your apps in a modern compatibility layer that adds a Virtual Mouse, a Debug Console, User Agent spoofing, and system-level shortcuts.

## 🚀 v0.2.0 Highlights: "The Tooling Update"

* **System Sidekick:** A slide-out sidebar menu (Blue Button) for quick access to system tools while in-app.
* **Workspace Mode:** Maximize the sidebar to view full-screen debug logs and inspect the raw HTML source code of running apps.
* **Robust Input:** Rewritten input driver with "Edge Scrolling" (Auto-Pan) for the Virtual Mouse and a "Hard Focus" loop to prevent the remote from disconnecting.
* **Legacy Engine Support:** Entire codebase rewritten in **ES5** (no Classes, no `?.` chaining) to guarantee injection works on Tizen 4.0 and 5.0.

## ✨ Features

### 🖥️ The Launcher

* **Manual Grid Navigation:** Custom focus engine ensuring arrow keys always work, even if the browser loses state.
* **Edit Mode:** Long-press **ENTER** on any app to Edit or Delete it.
* **Smart State:** App list updates instantly without reloading the page, preventing TizenBrew from killing the remote connection.

### 🛠️ The Injector (Overlay)

Once an app launches, TizenPortal injects a "Sidekick" overlay that provides:

* **User Agent Spoofing:** Force apps to load in **Mobile Mode** (faster, single-column) or **Desktop Mode** (feature complete).
* **Virtual Mouse (Green Key):** A cursor for apps that don't support TV remotes. Move the cursor to the screen edge to auto-scroll the page.
* **Aspect Ratio Toggle:** Force video players to Fit, Fill, or Stretch to remove black bars.
* **View Source:** Dumps the running application's HTML source code to the on-screen console for debugging CSS issues.

## 📺 Installation

### Prerequisites

You must have **TizenBrew** installed on your Samsung TV.

### Install TizenPortal

1. Open **TizenBrew**.
2. Navigate to the **Folder Icon** (Module Manager).
3. Select **Add GitHub Module**.
4. Enter the repository tag: `alexnolan/tizenportal@v0.2.0`
5. **Launch.**

*(Note: Using the `@v0.2.0` tag is recommended to bypass CDN caching issues).*

## 🕹 Controls

| Button | Context | Function |
| --- | --- | --- |
| **Arrows** | Global | Navigate / Move Mouse |
| **Enter** | Launcher | Launch App |
| **Enter (Hold 1s)** | Launcher | **Edit / Delete App** |
| **Enter** | In-App | Click / Select |
| **🔴 RED** | Global | **Force Reload** (Preserves Config) |
| **🟢 GREEN** | Global | **Toggle Virtual Mouse** |
| **🟡 YELLOW** | Global | **Exit to Launcher** (Home) |
| **🔵 BLUE** | Global | **Open Sidekick Menu** |
| **Back** | Global | Back / Close Menu |

## ⚙️ Configuration

### Adding an App

1. Select **"Add App"** in the grid.
2. **Name:** Label for the card.
3. **URL:** Your local IP (e.g., `http://192.168.1.50:8123`).
4. **Preset:** Applies CSS fixes for specific apps (Audiobookshelf, Jellyfin).
5. **Device Profile (UA):**
* *Default:* TV Native.
* *Mobile:* Forces Android/Touch layout (Recommended for slow TVs).
* *Desktop:* Forces Windows/PC layout.



## 🐛 Debugging

If an app fails to load or looks broken:

1. Press **BLUE** to open the Sidekick.
2. Select **"Logs"** to see JavaScript errors.
3. Select **"Maximize"** to view logs full-screen.
4. Select **"View Source"** to capture the current DOM state.

## 🏗 Architecture

* **Zero-Dependency:** Written in pure, vanilla ES5 JavaScript. No Webpack, no Babel, no npm required for the runtime.
* **URL Injection:** Configuration is passed to the injector via Base64-encoded URL parameters (`?tp=...`), ensuring settings survive cross-origin redirects from GitHub Pages to Local HTTP.
* **Session Persistence:** Config is backed up to `sessionStorage`, allowing you to reload the page (Red Button) without crashing the app.

## ⚠️ Known Issues

* **Video Players:** Some custom video players (like YouTube's TV client) may hijack the key events, preventing the Sidekick from opening. Use the **Virtual Mouse** to navigate out of them.
* **HTTP/HTTPS:** The Launcher is hosted on HTTPS (GitHub), but most self-hosted apps are HTTP. The browser handles this transition fine, but `window.name` data is often cleared for security, which is why we use URL Parameter injection.

## 📄 License

MIT License.