# 📺 TizenPortal

![Version](https://img.shields.io/badge/version-0456-blue) ![Tizen](https://img.shields.io/badge/Tizen-3.0%2B-blueviolet) ![License](https://img.shields.io/badge/license-MIT-green)

**TizenPortal** is a browser shell for Samsung Smart TVs running Tizen OS. It provides a launcher for managing any websites and injects site-specific fixes for TV compatibility (self-hosted apps like **Audiobookshelf** are a great fit, but not required).

---

## ✨ Features

### 🚀 Portal Launcher
A TV-friendly launcher with customizable themes to manage your sites in one place.
- Grid-based layout optimized for TV remote navigation
- Site editor for adding/editing apps with custom names and icons
- Bundle selector for choosing compatibility fixes per-site

### 🔧 Site Enhancement
Runs as a TizenBrew module to inject fixes into any site.
- Bundle CSS/JS applied automatically
- Viewport locking and focus tooling for responsive sites
- Cross-origin safe (iframe access is limited; runtime guards access)

### 🎮 Remote Control Support
- **D-pad navigation** with spatial focus
- **Color buttons** for quick actions:
  - 🔴 Red: Address bar overlay
  - 🟢 Green: Mouse mode toggle
  - 🟡 Yellow: Preferences (portal) / Return to portal (sites)
  - 🔵 Blue: Diagnostics panel

---

## 📥 Installation

This project is designed to be loaded via **TizenBrew** on your Samsung TV.

1. **Open TizenBrew** on your Samsung TV
2. **Add Module:** `alexnolan/tizenportal@0456`
3. **Launch** TizenPortal from your TizenBrew dashboard

TizenBrew will open the portal and inject the runtime into all navigated pages.

---

## 🎮 Usage

### Adding Sites
1. Press **Enter** on the "+" card
2. Fill in the site details:
   - **Name:** Display name for the card
   - **URL:** Full URL including `http://` or `https://`
  - **Site-specific Bundle:** Select a compatibility bundle
   - **Icon:** Optional - click "Fetch Favicon" or enter a custom URL

### Editing Sites
- Focus a site card and **long-press Enter** to open the editor
- Changes auto-save; press **Close** when finished

### Navigating Sites
1. Select a site card and press **Enter** to open
2. Use **D-pad** for navigation or press **🟢 Green** for mouse mode
3. Press **🟡 Yellow** to return to the portal

### Preferences
- Press **🟡 Yellow** on the portal to open Preferences
- Theme modes: Light, Dark, Automatic (Sunset), Custom Backdrop, Custom Colours
- Debug HUD position: Off / Top Right / Top Left / Bottom Right / Bottom Left
- Portal hints (color button labels)
- Viewport lock mode, focus outline mode, and user agent mode
- Auto-focusable elements, scroll-into-view, safe area inset
- GPU hints, CSS normalization, hide scrollbars
- Text input protection: prevents the TV keyboard from opening until Enter is pressed

### Color Button Reference
| Button | Short Press | Long Press |
|--------|-------------|------------|
| 🔴 Red | Address Bar | Reload Page |
| 🟢 Green | Toggle Mouse | Focus Highlight |
| 🟡 Yellow | Preferences (portal) / Return to portal (sites) | Add Site (portal) / Return to portal (sites) |
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
- **Cross-origin safe** — Payload passed via URL hash; iframe access is guarded
- **Full DOM access** — Runtime runs in page context  
- **Bundles compiled in** — All bundles included in runtime

---

## 🆕 Recent Updates

- **Preferences Overhaul** — Theme modes, custom colours, backdrop, and HUD position
- **Bundle Options** — Bundles can declare per-site options (with URL fetch support)
- **Adblock Enhancements** — Strict mode, allowlist, cookie/inline heuristics
- **Text Input Protection** — Prevents OSK auto-popup (toggle in Preferences)

---

## 🤝 Compatibility

| Feature | Support Level |
| :--- | :--- |
| **Target OS** | Samsung Tizen 3.0 - 6.5 |
| **Browser Engine** | Chrome 47 - 69 (Tizen's Chromium) |
| **Tested Apps** | ✅ Audiobookshelf |
| **Built-in Bundles** | default, audiobookshelf, adblock |

---

## 🙏 Acknowledgments

This project uses code from:
- **[TizenTube](https://github.com/reisxd/TizenTube)** — Spatial navigation polyfill and DOMRect polyfill
- **[TizenBrew](https://github.com/reisxd/TizenBrew)** — Module loading platform

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
