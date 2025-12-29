# TizenPortal (v0.2.8)

**A Universal Web App Launcher & OS Replacement Overlay for Samsung Tizen TVs.**

TizenPortal enables you to run modern, self-hosted web applications (Audiobookshelf, Jellyfin, Home Assistant) on older Samsung TVs (2016-2020) running outdated Chromium engines (Chrome 47-69).

It is not just a launcher; it acts as an **injection middleware**, wrapping your apps in a modern compatibility layer that adds a Virtual Mouse, a Debug Console, User Agent spoofing, and "Rescue Stylesheets" to fix broken layouts.

## 🚀 v0.2.8 Highlights: "The Rescue Update"

* **ABS Rescue Mode:** A specialized CSS preset for **Audiobookshelf** that manually reconstructs the broken "Tailwind CSS" layout. It forces a grid view, fixes invisible text, and hides broken navigation bars on older engines that lack CSS Variable support.
* **Icon Jail:** Fixed a critical bug where broken favicons would expand to fill the entire screen. All icons are now strictly constrained to their grid slots.
* **Legacy Engine Core:** The entire injector codebase has been rewritten in **pure ES5** (no Classes, no `?.` chaining), ensuring compatibility with Tizen 3.0 and 4.0 devices.
* **Smart Fallbacks:** If an app's icon fails to load (common with local IPs), it automatically swaps to a generic FontAwesome icon (Book, Play, Home, etc.).

## ✨ Features

### 🖥️ The Launcher

* **Manual Grid Navigation:** A custom focus engine ensures arrow keys always work, even if the browser loses focus state.
* **Edit Mode:** Long-press **ENTER** on any app to Edit or Delete it.
* **Smart State:** The app list updates instantly in-place without reloading the page, preventing the TV remote connection from dropping.

### 🛠️ The Injector (Sidekick Overlay)

Once an app launches, TizenPortal injects a "Sidekick" overlay that provides:

* **System Sidekick:** A slide-out sidebar menu (Blue Button) for quick access to system tools.
* **Virtual Mouse (Green Key):** A cursor for apps that don't support TV remotes. Move the cursor to the screen edge to auto-scroll the page.
* **View Source:** Dumps the running application's HTML source code to the on-screen console, allowing you to debug layout issues directly on the TV.
* **Aspect Ratio Toggle:** Force video players to Fit, Fill, or Stretch to remove black bars.

## 📺 Installation

### Prerequisites

You must have **TizenBrew** installed on your Samsung TV.

### Install TizenPortal

1. Open **TizenBrew**.
2. Navigate to the **Folder Icon** (Module Manager).
3. Select **Add GitHub Module**.
4. Enter the repository tag: `alexnolan/tizenportal@025`
5. **Launch.**

*(Note: Use the `@025` tag. Do not include a 'v').*

## 🕹 Controls

| Button | Context | Function |
| --- | --- | --- |
| **Arrows** | Global | Navigate / Move Mouse / Scroll Logs |
| **Enter** | Launcher | Launch App |
| **Enter (Hold 1s)** | Launcher | **Edit / Delete App** |
| **Enter** | In-App | Click / Select |
| **🔴 RED** | Global | **Force Reload** (Preserves Config) |
| **🟢 GREEN** | Global | **Toggle Virtual Mouse** |
| **🟡 YELLOW** | Global | **Exit to Launcher** (Home) |
| **🔵 BLUE** | Global | **Open Sidekick Menu** |
| **Back** | Global | Back / Close Menu / Exit Console Focus |

## ⚙️ Configuration

### Adding an App

1. Select **"Add App"** in the grid.
2. **Name:** Label for the card.
3. **URL:** Your local IP (e.g., `http://192.168.1.50:8123`).
4. **Preset:** Critical for fixing specific apps.
* `Audiobookshelf`: Applies the **v0.2.4 Rescue Stylesheet** (Fixes black screen/broken layout).
* `Jellyfin`: Enhances focus visibility.


5. **Device Profile (UA):**
* *Default:* TV Native.
* *Mobile:* Forces Android/Touch layout (Recommended for slow TVs).



## 🐛 Debugging

If an app looks broken or "black screen":

1. Press **BLUE** to open the Sidekick.
2. Select **"Maximize"** to expand the window.
3. Select **"View Source"** to capture the current DOM state.
4. Use **Arrow Keys** to scroll through the source code.

## 🏗 Architecture

* **Zero-Dependency:** Written in pure, vanilla ES5 JavaScript.
* **URL Injection:** Configuration is passed via Base64-encoded URL parameters (`?tp=...`), ensuring settings survive redirects.
* **Session Persistence:** Config is backed up to `sessionStorage`, allowing you to reload the page without crashing the app.

## ⚠️ Known Issues

* **HTTPS/HTTP:** The Launcher is hosted on HTTPS (GitHub), but your apps are likely HTTP. Tizen handles this fine, but favicon fetching for local IPs will fail (handled by our Smart Fallback icons).
* **Video Players:** Some apps (YouTube) hijack input keys. Use the **Virtual Mouse** (Green Button) to regain control.

## 📄 License

MIT License.