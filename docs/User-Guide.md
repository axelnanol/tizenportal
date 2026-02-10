# TizenPortal User Guide

This guide covers all the features and functionality of TizenPortal.

---

## Table of Contents

1. [Portal Launcher](#portal-launcher)
2. [Managing Sites](#managing-sites)
3. [Browsing Sites](#browsing-sites)
4. [Color Button Functions](#color-button-functions)
5. [Mouse Mode](#mouse-mode)
6. [Address Bar](#address-bar)
7. [Bundle System](#bundle-system)
8. [Userscripts](#userscripts)
9. [Diagnostics Panel](#diagnostics-panel)
10. [Keyboard Input](#keyboard-input)
11. [Tips & Tricks](#tips--tricks)

---

## Portal Launcher

The portal is your home screen — a grid of site cards you can navigate with your TV remote.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│                    TizenPortal                          │
├─────────┬─────────┬─────────┬─────────┬─────────┬──────┤
│         │         │         │         │         │      │
│  Site 1 │  Site 2 │  Site 3 │  Site 4 │  Site 5 │  +   │
│         │         │         │         │         │      │
├─────────┴─────────┴─────────┴─────────┴─────────┴──────┤
│  🔴 Address  🟢 Mouse  🟡 Preferences  🔵 Diagnostics  │
└─────────────────────────────────────────────────────────┘
```

### Navigation

- Use **arrow keys** to move between cards
- Press **Enter** to open a site or the add card
- Focused cards have a blue highlight

---

## Managing Sites

### Adding a Site

1. Navigate to the **+** card
2. Press **Enter** to open the site editor
3. Fill in the form:

| Field | Description | Example |
|-------|-------------|---------|
| Name | Display name on the card | "Audiobookshelf" |
| URL | Full site URL | "https://abs.myserver.com" |
| Site-specific Bundle | Compatibility bundle | "audiobookshelf" |
| Icon | Card icon (optional) | Click "Fetch Favicon" |

4. Press **Close** when finished (changes auto-save)

### Editing a Site

1. Navigate to the site card
2. Press and **hold Enter** (or use a menu option if available)
3. Modify the fields as needed
4. Press **Close**

### Site Options (Per-Site Overrides)

In the editor, open **Site Options** to override global preferences for this site:

- **Viewport Lock Mode**
- **Focus Outline**
- **User Agent Mode**
- **Auto-focusable Elements**
- **Scroll-into-view on Focus**
- **TV Safe Area (5% inset)**
- **GPU Acceleration Hints**
- **CSS Normalization**
- **Hide Scrollbars**
- **Protect Text Inputs (TV Keyboard)**

### Deleting a Site

1. Open the site editor for the card
2. Scroll down to find **Delete**
3. Confirm deletion

### Reordering Sites

Sites appear in the order they were added. To reorder:
1. Delete and re-add cards in your preferred order
2. Or edit the order via the diagnostics console (advanced)

---

## Browsing Sites

### Opening a Site

1. Navigate to the site card
2. Press **Enter**
3. The site loads with bundle enhancements applied

### Navigating Within Sites

| Input | Action |
|-------|--------|
| Arrow Keys | Move focus between elements |
| Enter | Click/activate focused element |
| 🟢 Green | Toggle mouse mode for precise control |
| 🟡 Yellow | Return to portal |

### Card Interaction Model

Many sites display content as cards (media items, books, albums, etc.). TizenPortal provides special handling for cards with multiple interactive elements.

#### Single-Action Cards

Cards with one button or link:
- Press **Enter** to activate immediately
- Focus moves to the next card after activation

**Example:** Simple list items with one "Open" button

#### Multi-Action Cards

Cards with multiple buttons (Play, Info, Options, etc.):
1. Navigate to the card with **Arrow Keys**
2. Press **Enter** to "enter" the card
3. Use **Arrow Keys** to navigate between buttons inside the card
4. Press **Enter** to activate a button
5. Press **Back** to "exit" the card and return to card-level navigation

**Example:** Media cards with Play, Info, and Add to Library buttons

#### Visual Indicators

- **Card-level focus**: Entire card has blue outline
- **Element-level focus**: Individual button inside card has outline
- When inside a card, only elements within that card are focusable

#### Tips for Card Navigation

- Most bundles automatically configure cards for your site
- If a site's cards don't navigate properly, try mouse mode (🟢 Green)
- Some sites work better with the `default` bundle if custom bundles have issues

### Scrolling

- Use **Up/Down arrows** to scroll the page
- Some sites may require mouse mode for scrolling

### Returning to Portal

Press **🟡 Yellow** button to return to the portal launcher.

---

## Color Button Functions

### Overview

| Button | Short Press | Long Press |
|--------|-------------|------------|
| 🔴 Red | Open address bar | Reload current page |
| 🟢 Green | Toggle mouse mode | Toggle focus highlight |
| 🟡 Yellow | Preferences (portal) / Return to portal (sites) | Add Site (portal) / Return to portal (sites) |
| 🔵 Blue | Toggle diagnostics | Enter safe mode |

### Short Press vs Long Press

- **Short press**: Tap and release quickly (< 500ms)
- **Long press**: Hold for 500ms or more

---

## Mouse Mode

Mouse mode displays an on-screen cursor that you control with the D-pad.

### Activating Mouse Mode

Press **🟢 Green** to toggle mouse mode on/off.

### Using the Cursor

| Input | Action |
|-------|--------|
| Arrow Keys | Move cursor |
| Enter | Click at cursor position |
| 🟢 Green | Exit mouse mode |

### When to Use Mouse Mode

- Sites with hover menus
- Drag-and-drop interfaces
- Scrollbars and sliders
- Any element that doesn't respond to D-pad navigation

### Focus Highlight

Long-press **🟢 Green** to toggle focus highlighting. This makes the currently focused element more visible with a bright outline.

---

## Address Bar

The address bar provides browser-like navigation controls.

### Opening the Address Bar

Press **🔴 Red** to show/hide the address bar.

### Address Bar Controls

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ⎈ │ 🏠 │ ← │ → │ ↻ │ https://example.com/page                 │ → │
└──────────────────────────────────────────────────────────────────────────┘
```

| Button | Function |
|--------|----------|
| ⎈ | Return to portal |
| 🏠 | Site home URL |
| ← | Go back |
| → | Go forward |
| ↻ | Reload page |
| URL field | Edit URL (select and type) |
| → (Go) | Navigate to URL |

### Navigating to a New URL

1. Press **🔴 Red** to open address bar
2. Navigate to the URL field
3. Press **Enter** to edit
4. Type the new URL using the TV keyboard
5. Press **Enter** or navigate to confirm

### Quick Reload

Long-press **🔴 Red** to reload the current page without opening the address bar.

---

## Preferences

Open Preferences with **🟡 Yellow** on the portal.

### Appearance
- **Theme Mode**: Light, Dark, Automatic (Sunset), Custom Backdrop, Custom Colours
- **Custom Colours**: Two gradient colors (Custom Colours theme)
- **Backdrop**: Custom background image URL (Custom Backdrop theme)

### Portal
- **Debug HUD**: Off or position in any corner
- **Color Hints**: Show/hide the on-screen color button labels

### Site Features
- **Viewport Lock Mode**: Auto / Locked (1920) / Unlocked
- **Focus Outline**: On (Blue) / High Contrast (Yellow) / Off
- **User Agent Mode**: Tizen TV / Desktop / Mobile
	- Note: UA spoofing is JS-only (not network-layer), so some sites may still detect Tizen
- **Auto-focusable Elements**: Adds tabindex to make items focusable
- **Scroll-into-view on Focus**: Scrolls when focus moves
- **TV Safe Area (5% inset)**: Adds padding for TV overscan
- **GPU Acceleration Hints**: Applies GPU hint styles
- **CSS Normalization**: Applies a reset tuned for TV browsing
- **Hide Scrollbars**: Visually hides scrollbars
- **Protect Text Inputs (TV Keyboard)**: prevents the on-screen keyboard from opening until you press Enter

---

## Bundle System

Bundles are site-specific enhancements that improve TV compatibility.

### Available Bundles

| Bundle | Best For | Features |
|--------|----------|----------|
| `default` | Any site | Basic fallback bundle |
| `audiobookshelf` | Audiobookshelf | Full navigation, media keys |
| `adblock` | Ad-heavy sites | Blocks common ads and trackers |
| `userscript-sandbox` | Custom scripts | Allows custom JavaScript injection |

### Selecting a Bundle

**When adding a site:**
1. In the site editor, use the Bundle dropdown
2. Select the appropriate bundle
3. Press **Close**

### Bundle Options

Some bundles expose per-site options in the editor. For example, **Adblock** supports:

- **Strict Mode** — more aggressive blocking
- **Allowlist URL** — download allowed hosts/paths
- **Hide Cookie Banners** — remove consent popups
- **Inline Ad Heuristics** — block inline ad scripts and banner images

---

## Userscripts

TizenPortal includes a powerful userscript system that allows you to inject custom JavaScript into any site. This is useful for customizing site behavior, adding features, or working around compatibility issues.

### What are Userscripts?

Userscripts are custom JavaScript code that runs when a site loads. They can:

- Modify page elements and styling
- Add new functionality to websites
- Fix compatibility issues on specific sites
- Automate repetitive tasks
- Enhance navigation and controls

### Global vs Per-Site Userscripts

**Global Userscripts:**
- Managed in the Preferences menu
- Can be enabled per-site via toggle switches
- Useful for scripts you want to use across multiple sites

**Per-Site Userscripts:**
- Configured in the site editor
- Only run on that specific site
- Best for site-specific customizations

### Managing Global Userscripts

1. Press **🟡 Yellow** on the portal to open Preferences
2. Navigate to the **Userscripts** section
3. For each userscript slot:
   - **Name**: Give your script a descriptive name
   - **Source**: Choose "Inline" (paste code) or "URL" (load from web)
   - **Code/URL**: Enter your JavaScript code or URL
   - **Enabled**: Toggle to enable/disable globally

### Enabling Global Userscripts on Sites

Global userscripts are off by default on each site. To enable them:

1. Open the site editor for a card
2. Navigate to the **Userscripts** section
3. Toggle on the scripts you want to run on this site

### Per-Site Userscripts

To add scripts that only run on a specific site:

1. Open the site editor for the card
2. Navigate to the **Userscripts** section
3. Configure the per-site script slots:
   - **Name**: Script name
   - **Source**: Inline or URL
   - **Code/URL**: Your JavaScript
   - **Enabled**: Toggle on to activate

### Bundle Userscripts

Some bundles (like `userscript-sandbox`) include pre-built userscripts. These can be toggled on/off in the site editor under **Bundle Options**.

### Userscript API

Your scripts have access to the TizenPortal API:

```javascript
// Logging
TizenPortal.log('message');
TizenPortal.warn('warning');
TizenPortal.error('error');

// Configuration
TizenPortal.config.get('key');
TizenPortal.config.set('key', value);

// Focus management
TizenPortal.focus.set(element);
TizenPortal.focus.get();

// Cleanup function (called when script is deactivated)
userscript.cleanup = function() {
  // Remove event listeners, timers, etc.
};
```

### Userscript Example

Here's a simple example that makes all links open in the same page:

```javascript
// Prevent links from opening in new tabs
var links = document.querySelectorAll('a[target="_blank"]');
for (var i = 0; i < links.length; i++) {
  links[i].removeAttribute('target');
}

TizenPortal.log('Removed target="_blank" from ' + links.length + ' links');
```

### Loading Scripts from URLs

You can load userscripts from external URLs:

1. Set **Source** to "URL"
2. Enter the script URL (e.g., `https://example.com/myscript.js`)
3. TizenPortal will fetch and cache the script
4. The cache is refreshed periodically

**Note:** External scripts must be served with CORS headers that allow your TV to load them.

### Userscript Security

- Userscripts run with full page access
- Only use scripts from trusted sources
- Review code before enabling it
- Scripts can access localStorage and cookies
- Be cautious with scripts loaded from external URLs

### Troubleshooting Userscripts

**Script not running:**
- Check that it's enabled in both global and site-specific toggles
- View diagnostics (🔵 Blue) for error messages
- Verify the script syntax is valid JavaScript

**Script errors:**
- Open diagnostics to see error messages
- Check that the script is compatible with Chrome 47-69
- Avoid modern JavaScript features not supported on Tizen

**External script won't load:**
- Verify the URL is accessible from your TV
- Check that the server sends proper CORS headers
- Try using "Inline" mode and pasting the script directly

---

## Diagnostics Panel

The diagnostics panel helps troubleshoot issues and view system information.

### Opening Diagnostics

Press **🔵 Blue** to cycle through diagnostics states:

1. **Off** — Panel hidden
2. **Compact** — Shows recent logs
3. **Full** — Shows all logs with details

### Panel Contents

```
┌─────────────────────────────────────────┐
│ TizenPortal v1018 - Diagnostics         │
├─────────────────────────────────────────┤
│ [LOG] Bundle activated: audiobookshelf  │
│ [LOG] Focus set to .book-card           │
│ [WARN] Element not found: .sidebar      │
│ [LOG] Scroll into view triggered        │
└─────────────────────────────────────────┘
```

### Scrolling Logs

When the panel is open:
- **Up Arrow** — Scroll up through log history
- **Down Arrow** — Scroll down through log history
- **Left/Right Arrow** — Cycle log filter (All / Log / Warn / Error)
- **🟡 Yellow** — Clear all logs

### Log Levels

Diagnostics displays three types of log entries:

| Level | Color | Purpose |
|-------|-------|---------|
| LOG | White | General information |
| WARN | Yellow | Warnings and deprecations |
| ERROR | Red | Errors and failures |

### Log Filtering

Use **Left/Right arrows** to cycle through filters:

1. **All** — Shows all log entries (default)
2. **Log** — Shows only LOG entries
3. **Warn** — Shows only WARN entries
4. **Error** — Shows only ERROR entries

The current filter is shown in the panel header.

### Clearing Logs

Two ways to clear the log history:

1. Press **🟡 Yellow** while diagnostics is open
2. Use programmatically: `TizenPortal.clearDiagnosticsLogs()`

### Log Storage

- Logs are stored in a circular buffer (not persisted)
- Maximum log entries: ~100 (older entries are discarded)
- Logs are lost when you navigate away or reload

### Safe Mode

Long-press **🔵 Blue** to enter safe mode:
- Reloads the page without any bundle applied
- Useful for debugging bundle issues
- Returns to normal on next navigation

---

## Keyboard Input

TizenPortal protects text inputs by default to prevent the on-screen keyboard from opening automatically when you focus an input field. This gives you better control over when the keyboard appears.

### Text Input Protection

**How it works:**
- When you focus a text input, the keyboard does **not** open automatically
- Press **Enter** to activate the input and open the keyboard
- This prevents accidental keyboard popups when navigating

**Enabling/Disabling:**
- Global setting in Preferences: "Protect Text Inputs (TV Keyboard)"
- Per-site override in Site Options
- Default: **Enabled**

### Using the TV Keyboard

1. Navigate to a text input field with **Arrow Keys**
2. Press **Enter** to activate the keyboard
3. Use the on-screen keyboard to type
4. Press **Done** (65376) or **Enter** to confirm
5. Press **Cancel** (65385) to cancel without changes

### Keyboard Tips

- Use the D-pad to navigate the keyboard
- Some keyboards have a **voice input** option
- **Back** navigates browser history on sites; if diagnostics is open, it closes the panel

### IME Behavior

When the keyboard is active:
- Spatial navigation is paused
- D-pad controls the keyboard only
- Press **Done** to return to normal navigation

---

## Tips & Tricks

### General Tips

1. **Use the right bundle** — The correct bundle makes a huge difference in usability
2. **Enable focus highlight** — Makes it easier to see what's selected
3. **Check diagnostics** — If something isn't working, the logs usually explain why

### Navigation Tips

1. **Tab order** — Most sites navigate in reading order (left-to-right, top-to-bottom)
2. **Enter on links** — Press Enter to follow links, not just to click
3. **Mouse mode for tricky UI** — Some modern UI elements only work with mouse clicks

### Performance Tips

1. **Fewer cards** — Too many cards may slow down the portal
2. **Close unused sites** — Memory is limited on older TVs
3. **Use adblock** — Blocking ads improves performance significantly

### Troubleshooting Tips

1. **Page not loading?** — Check the URL in address bar
2. **Navigation not working?** — Try switching bundles
3. **Stuck?** — Press **🟡 Yellow** to return to portal
4. **Completely stuck?** — Long-press **🔵 Blue** for safe mode

---

## Accessibility

### High Contrast

Enable focus highlight (long-press 🟢 Green) for better visibility of focused elements.

### Large Text

TizenPortal uses TV-optimized font sizes. Some sites may need bundle adjustments for larger text.

### Screen Reader

TizenPortal does not currently support screen readers. This is a planned feature for a future release.

---

*For technical documentation, see the [Developer Guides](Home.md#for-developers).*
