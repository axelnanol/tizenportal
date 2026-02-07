# Getting Started with TizenPortal

This guide will walk you through installing and setting up TizenPortal on your Samsung TV.

---

## Prerequisites

Before you begin, make sure you have:

1. **Samsung Tizen Smart TV** (2017-2022 models recommended)
2. **TizenBrew** installed on your TV
3. **Network connectivity** between your TV and any self-hosted services

### Installing TizenBrew

If you don't have TizenBrew installed yet:

1. Visit the [TizenBrew GitHub](https://github.com/reisxd/TizenBrew)
2. Follow the installation instructions for your TV model
3. Ensure TizenBrew is working before proceeding

---

## Installation

### Step 1: Open TizenBrew

Launch TizenBrew on your Samsung TV from the app list.

### Step 2: Add the TizenPortal Module

1. Navigate to **Settings** or **Modules**
2. Select **Add Module**
3. Enter the module identifier:
   ```
   alexnolan/tizenportal@0453
   ```
4. Confirm the addition

### Step 3: Launch TizenPortal

1. Return to the TizenBrew main menu
2. Select **TizenPortal** from your module list
3. The portal launcher should appear

---

## First Launch

When TizenPortal first loads, you'll see:

- An empty grid with a **+** card to add your first site
- Color button hints at the bottom of the screen
- Version number in the corner

### Adding Your First Site

1. Use the **D-pad** to navigate to the **+** card
2. Press **Enter** to open the site editor
3. Fill in the details (changes auto-save):
   - **Name**: Display name for the card (e.g., "My Audiobookshelf")
   - **URL**: Full URL including `https://` (e.g., `https://abs.myserver.com`)
   - **Bundle**: Select from available options
   - **Icon**: Click "Fetch Favicon" or enter a custom icon URL
4. Press **Close** when you’re done

Your new site card will appear in the grid!

---

## Basic Navigation

### D-Pad Controls

| Button | Action |
|--------|--------|
| ← → ↑ ↓ | Navigate between cards and UI elements |
| Enter/OK | Select card, confirm actions |

### Color Buttons

| Button | Short Press | Long Press |
|--------|-------------|------------|
| 🔴 Red | Address bar | Reload page |
| 🟢 Green | Mouse mode | Focus highlight |
| 🟡 Yellow | Preferences (portal) / Return to portal (sites) | Add Site (portal) / Return to portal (sites) |
| 🔵 Blue | Diagnostics | Safe mode |

---

## Navigating to a Site

1. Navigate to a site card using the D-pad
2. Press **Enter** to open the site
3. The site loads with TV-optimized enhancements
4. Use D-pad to navigate the site
5. Press **🟡 Yellow** to return to the portal

---

## Next Steps

Now that you're set up:

- **[User Guide](User-Guide.md)** — Learn all the features
- **[Troubleshooting](Troubleshooting.md)** — Fix common issues
- **[FAQ](FAQ.md)** — Answers to common questions

---

## Updating TizenPortal

When a new version is released:

1. Open TizenBrew settings
2. Remove the old module: `alexnolan/tizenportal@OLDVERSION`
3. Add the new module: `alexnolan/tizenportal@NEWVERSION`
4. Relaunch TizenPortal

> **Note:** TizenBrew caches modules by version tag. You must add the new version number to get updates.

---

## Uninstalling

To remove TizenPortal:

1. Open TizenBrew settings
2. Navigate to the module list
3. Remove `alexnolan/tizenportal`

Your saved sites are stored in the TV's localStorage and will persist. To clear them, use the diagnostics panel before uninstalling.

---

*Need help? Check the [Troubleshooting](Troubleshooting.md) guide or [open an issue](https://github.com/alexnolan/tizenportal/issues).*
