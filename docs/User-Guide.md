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
8. [Diagnostics Panel](#diagnostics-panel)
9. [Keyboard Input](#keyboard-input)
10. [Tips & Tricks](#tips--tricks)

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
│ TizenPortal v0456 - Diagnostics         │
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
- **Left/Right Arrow** — Cycle log filter (All / Log / Info / Warn / Error)
- **🟡 Yellow** — Clear logs

### Safe Mode

Long-press **🔵 Blue** to enter safe mode:
- Reloads the page without any bundle applied
- Useful for debugging bundle issues
- Returns to normal on next navigation

---

## Keyboard Input

Text inputs are protected by default to prevent the TV keyboard from opening on focus.

### Using the TV Keyboard

1. Navigate to a text input field
2. Press **Enter** to activate the keyboard
3. Use the on-screen keyboard to type
4. Press **Done** or **Enter** to confirm

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
