# 📺 TizenPortal

![Version](https://img.shields.io/badge/version-0.5.49-blue) ![Tizen](https://img.shields.io/badge/Tizen-3.0%2B-blueviolet) ![License](https://img.shields.io/badge/license-MIT-green)

**TizenPortal** is a universal launcher and compatibility layer designed for Samsung Smart TVs running Tizen OS. It allows you to run modern self-hosted web applications (like **Audiobookshelf**, **Jellyfin**, etc.) on older TVs that might otherwise struggle with broken layouts or incompatible interfaces.

---

## ✨ Features

### 🚀 Universal Launcher
A clean, grid-based interface to manage all your self-hosted web apps in one place.

### 🛟 "Lifeboat" Mode
Automatically rescues broken apps by injecting a TV-friendly compatibility layer.
*   **📖 Readable Layouts:** Scrapes content from incompatible pages and renders them in a large, remote-friendly grid.
*   **⌨️ Input Proxying:** Provides a working keyboard interface for login screens and search bars on legacy devices.
*   **🧭 Navigation:** Adds persistent "Home" and "Back" buttons to keep you in control.

### 🎭 Device Spoofing
Choose from various **User Agent** presets to ensure the server serves the best possible content for your device:
*   📺 **Smart TVs:** Tizen 5.5, WebOS 6, Android TV
*   🎮 **Consoles:** PlayStation 5, Xbox Series X
*   📱 **Mobile:** Android, iOS

---

## 📥 Installation

This project is designed to be loaded via **TizenBrew** or a similar userscript manager on your Tizen TV.

1.  **Open TizenBrew** on your Samsung TV.
2.  **Add Module:** Enter the repository URL:
    *   `alexnolan/tizenportal`
3.  **Launch:** Select **"TizenPortal"** from your TizenBrew dashboard.

---

## 🎮 Usage

1.  **➕ Add App:** Click the "+" card on the home screen.
2.  **⚙️ Configure:**
    *   **Name:** The display name for your dashboard.
    *   **URL:** The address of your self-hosted service (e.g., `http://192.168.1.50:13378`).
    *   **Preset:** Select a "Rescue Strategy" if the app is known to be broken (e.g., "Audiobookshelf").
    *   **User Agent:** Select a device profile (Default Tizen is usually best, but try others if you have issues).
3.  **🚀 Launch:** Click the card to open the app. TizenPortal will automatically inject the necessary fixes.

### 🆕 What's New in 0.5.49
- **Verified Selectors from ABS Source**: All selectors now confirmed against actual Audiobookshelf Vue components
- **Sidebar Navigation**: Uses `#siderail-buttons-container` from `SideRail.vue`, extracts library links correctly
- **Appbar Integration**: Extracts library dropdown, settings link, and search from `#appbar`
- **Login Form Fix**: Now uses `input[name="username"]` and `input[name="password"]` (from `login.vue`)
- **Improved Content Hiding**: Hides `#app-content` AND `#__nuxt` for reliable overlay
- **Native UI Suppression**: Hides ABS siderail/appbar via ARIA role selectors to prevent overlap

### Previous: 0.5.48
- Fixed book detection (`cy-id` is Vue directive, not HTML attribute)
- Correct selectors: `[id^="book-card-"]`, `[id^="series-card-"]`
- Event-driven architecture with MutationObserver, state machine, caching

---

## 🤝 Compatibility

| Feature | Support Level |
| :--- | :--- |
| **Target OS** | Samsung Tizen 3.0 - 5.5 |
| **Browser Engine** | Optimized for legacy Chromium (Chrome 47+) |
| **Tested Apps** | ✅ Audiobookshelf<br>⚠️ Jellyfin (Basic) |

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
