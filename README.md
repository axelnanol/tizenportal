# 📺 TizenPortal

![Version](https://img.shields.io/badge/version-0301-blue) ![Tizen](https://img.shields.io/badge/Tizen-3.0%2B-blueviolet) ![License](https://img.shields.io/badge/license-MIT-green)

**TizenPortal** is a browser shell for Samsung Smart TVs running Tizen OS. It provides a launcher for managing self-hosted web applications (like **Audiobookshelf**, **Jellyfin**, etc.) and injects site-specific fixes for TV compatibility.

---

## ✨ Features

### 🚀 Portal Launcher
A clean, dark gradient interface to manage all your self-hosted web apps in one place.
- Grid-based layout optimized for TV remote navigation
- Site editor for adding/editing apps with custom names and icons
- Bundle selector for choosing compatibility fixes per-site

### 🔧 Site Enhancement
Runs as a TizenBrew module to inject fixes into any site.
- Bundle CSS/JS applied automatically
- Viewport locking for responsive sites
- Works universally (no cross-origin restrictions)

### 🎮 Remote Control Support
- **D-pad navigation** with spatial focus
- **Color buttons** for quick actions:
  - 🔴 Red: Address bar overlay
  - 🟢 Green: Mouse mode toggle
  - 🟡 Yellow: Bundle menu / Return to portal
  - 🔵 Blue: Diagnostics panel

---

## 📥 Installation

This project is designed to be loaded via **TizenBrew** on your Samsung TV.

1. **Open TizenBrew** on your Samsung TV
2. **Add Module:** `alexnolan/tizenportal@0301`
3. **Launch** TizenPortal from your TizenBrew dashboard

TizenBrew will open the portal and inject the runtime into all navigated pages.

---

## 🎮 Usage

### Adding Sites
1. Press **Enter** on the "+" card
2. Fill in the site details:
   - **Name:** Display name for the card
   - **URL:** Full URL including `http://` or `https://`
   - **Bundle:** Select a compatibility bundle (or "default")
   - **Icon:** Optional - click "Fetch Favicon" or enter a custom URL

### Navigating Sites
1. Select a site card and press **Enter** to open
2. Use **D-pad** for navigation or press **🟢 Green** for mouse mode
3. Press **🟡 Yellow** to return to the portal

### Color Button Reference
| Button | Short Press | Long Press |
|--------|-------------|------------|
| 🔴 Red | Address Bar | Reload Page |
| 🟢 Green | Toggle Mouse | Focus Highlight |
| 🟡 Yellow | Bundle Menu | Cycle Bundles |
| 🔵 Blue | Diagnostics | Safe Mode |

---

## 🏗️ Architecture

TizenPortal uses a **Universal Runtime** architecture:

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
│                   Portal Page                               │
│  - Runtime detects it's on the portal                       │
│  - Renders site card grid                                   │
│  - User selects card → navigates with #tp= payload          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Target Site                                  │
│  - Runtime detects it's NOT on portal                       │
│  - Reads #tp= payload for bundle name                       │
│  - Applies bundle CSS/JS                                    │
│  - Provides overlay UI (address bar, diagnostics)           │
└─────────────────────────────────────────────────────────────┘
```

### Key Points

- **Single runtime** (`tizenportal.js`) on all pages
- **No cross-origin issues** — Payload passed via URL hash
- **Full DOM access** — Runtime runs in page context  
- **Bundles compiled in** — All bundles included in runtime

---

## 🆕 What's New in v0301

- **Unified Runtime** — Single codebase for portal and target sites
- **Simplified Architecture** — Removed legacy dual-build system
- **Bundle Registry** — All bundles compiled into runtime

---

## 🤝 Compatibility

| Feature | Support Level |
| :--- | :--- |
| **Target OS** | Samsung Tizen 3.0 - 6.5 |
| **Browser Engine** | Chrome 47 - 69 (Tizen's Chromium) |
| **Tested Apps** | ✅ Audiobookshelf<br>⚠️ Jellyfin (Basic) |

---

## 🙏 Acknowledgments

This project uses code from:
- **[TizenTube](https://github.com/reisxd/TizenTube)** — Spatial navigation polyfill and DOMRect polyfill
- **[TizenBrew](https://github.com/nicholasmordecai/nicholasmordecai.github.io)** — Module loading platform

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
