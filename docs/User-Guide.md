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

There are two ways to add a site:

**From the portal:**
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

**From a site (quick-add):**
1. Navigate to the site you want to add
2. **Long-press 🟡 Yellow** (hold for 500ms)
3. The current page is automatically saved as a new card (URL, title, and favicon are captured)
4. TizenPortal returns to the portal, where the new card is immediately visible

### Editing a Site

1. Navigate to the site card
2. Press and **hold Enter** (or use a menu option if available)
3. Modify the fields as needed
4. Press **Close**

### Site Options (Per-Site Overrides)

In the editor, open **Site Options** to override global preferences for this site:

- **Navigation Mode**
- **Viewport Lock Mode**
- **Text Scale**
- **Focus Outline**
- **Focus Transition Style**
- **Focus Transition Speed**
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
| 🟡 Yellow | Return to portal (short press) / Add current site as card + return to portal (long press) |

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

### Following Links to Other Sites

When you follow a link to a different domain (e.g. from your Audiobookshelf to an external site), TizenPortal automatically carries your bundle configuration along via the URL. The same bundle and settings that were active on the original card continue to apply on the new site.

If the new site needs different settings, return to the portal and open it as its own card.

### Returning to Portal

Press **🟡 Yellow** (short press) to return to the portal launcher. **Long-press 🟡 Yellow** to save the current site as a new portal card and return to the portal.

---

## Color Button Functions

### Overview

| Button | Short Press | Long Press |
|--------|-------------|------------|
| 🔴 Red | Open address bar | Reload current page |
| 🟢 Green | Toggle mouse mode | Toggle focus highlight |
| 🟡 Yellow | Preferences (portal) / Return to portal (sites) | Add Site (portal) / **Add current site as card + return to portal** (sites) |
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
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⎈ │ 🏠 │ ← │ → │ ↻ │ https://example.com/page                 │ → │ ℹ │
└──────────────────────────────────────────────────────────────────────────────┘
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
| ℹ | Open TizenPortal documentation |

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

### Global Preferences
Global defaults that can be overridden per-site in the editor.

**Appearance**
- **Text Scale**: Off / Small (+10%) / Medium (+25%) / Large (+50%)
  - Scales all text for improved TV legibility while maintaining relative sizing

**Navigation**
- **Focus Outline**: On (Blue) / High Contrast (Yellow) / Off
- **Focus Transition Style**: Slide / Scale / Glow / Off
- **Focus Transition Speed**: Fast / Medium / Slow

### Portal Preferences

**Appearance**
- **Theme Mode**: Light, Dark, Automatic (Sunset), Portal (Blue & Orange), Custom Backdrop, Custom Colours
- **Portal Filter**: Glow / Crisp / Flat / Vignette (applies to non-backdrop themes)
- **Portal Accent Positions**: Corners / Opposite Corners / Top Arc / Bottom Arc / Sides
- **Custom Colours**: Two gradient colors (Custom Colours theme)
- **Backdrop**: Custom background image URL (Custom Backdrop theme)

**HUD & Hints**
- **Debug HUD**: Off or position in any corner
- **Color Hints**: Show/hide the on-screen color button labels

### Site Preferences

**Navigation**
- **Navigation Mode**: Smart Navigation (Directional) / Grid Navigation (Geometric) / Legacy Polyfill
- **Viewport Lock Mode**: Auto / Locked (1920) / Unlocked

**Compatibility**
- **User Agent Mode**: Tizen TV / Desktop / Mobile
  - Note: UA spoofing is JS-only (not network-layer), so some sites may still detect Tizen

**Input**
- **Auto-focusable Elements**: Adds tabindex to make items focusable
- **Scroll-into-view on Focus**: Scrolls when focus moves
- **Protect Text Inputs (TV Keyboard)**: prevents the on-screen keyboard from opening until you press Enter

**Layout**
- **TV Safe Area (5% inset)**: Adds padding for TV overscan
- **CSS Normalization**: Applies a reset tuned for TV browsing
- **Hide Scrollbars**: Visually hides scrollbars

**Performance**
- **GPU Acceleration Hints**: Applies GPU hint styles

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

## Userscripts

TizenPortal includes a powerful userscript system with 18 pre-built scripts organized by category. These scripts can be enabled globally or per-site to enhance your TV browsing experience.

### What are Userscripts?

Userscripts are custom JavaScript code that runs when a site loads. They can:

- Modify page elements and styling
- Add new functionality to websites
- Fix compatibility issues on specific sites
- Automate repetitive tasks
- Enhance navigation and controls

### Pre-Built Userscripts

TizenPortal comes with 18 carefully crafted userscripts organized into categories:

**♿ Accessibility (2 scripts)**
- Subtitle Size Enhancer
- Keyboard Shortcuts Overlay

**📖 Reading (5 scripts)**
- Dark Reading Mode
- Light Reading Mode
- Smart Dark Mode
- Page Simplifier
- Grayscale Reading Mode

**🎬 Video (4 scripts)**
- Video Speed Controller
- Auto-Play Video Blocker
- Video Auto-Pause on Blur
- YouTube TV Enhancements

**🧭 Navigation (5 scripts)**
- Smart Auto-Scroll
- Focus Trap Escape
- Remove Sticky Headers
- Image Focus Zoom
- Link Target Control

**🔒 Privacy (2 scripts)**
- Cookie Consent Auto-Closer
- Video Ad Skip Helper

### Managing Global Userscripts

1. Press **🟡 Yellow** on the portal to open Preferences
2. Navigate to the **User Scripts** section
3. Scripts are organized by category
4. Toggle each script on/off:
   - **✓ Enabled** - Script will run on sites where enabled
   - **○ Disabled** - Script won't run

### Per-Site Userscript Control

Global userscripts can be overridden per-site:

1. Open the site editor for a card
2. Navigate to the **User Scripts** section
3. You'll see all userscripts with their current state:
   - **✓ Enabled (global)** - Enabled globally
   - **○ Disabled (global)** - Disabled globally
   - **✓ Enabled (site override)** - Enabled for this site only
   - **○ Disabled (site override)** - Disabled for this site only
4. Click the action button to:
   - **Enable for Site** - Enable only on this site
   - **Disable for Site** - Disable only on this site
   - **Reset to Global** - Remove site override

### Userscript Examples

**TV Readability Booster** (enabled by default):
- Increases font sizes (18-32px responsive)
- Better line height and spacing
- Makes buttons and links easier to click
- Cyan outlines on links for visibility

**Dark Reading Mode**:
- Removes sidebars, ads, and clutter
- Dark background with warm text
- Optimized typography for TV viewing
- 900px max width for comfortable reading

**Smart Auto-Scroll**:
- Smooth automatic page scrolling
- Up/Down arrows adjust speed
- Enter/Pause to toggle
- Stop/Back to exit

**Cookie Consent Auto-Closer**:
- Automatically dismisses cookie banners
- Clicks "Accept" buttons
- Hides annoying popups
- Makes browsing faster

### Data Migration

If you're upgrading from an older version:
- Old userscript configs are automatically migrated
- Enabled states are preserved
- External script cache is preserved
- No action required on your part

### Userscript API

Scripts have access to the TizenPortal API:

```javascript
// Logging
TizenPortal.log('message');
TizenPortal.warn('warning');
TizenPortal.error('error');

// Cleanup function (called when navigating away)
userscript.cleanup = function() {
  // Remove event listeners, timers, etc.
};
```

### Userscript Example

Here's a simple example from one of the built-in scripts:

```javascript
// Remove sticky headers that block content
var style = document.createElement('style');
style.id = 'tp-no-sticky';
style.textContent = `
  *[style*="position: fixed"],
  *[style*="position:fixed"] {
    position: static !important;
  }
  header[style*="position"],
  nav[style*="position"] {
    position: static !important;
  }
`;
document.head.appendChild(style);

userscript.cleanup = function() {
  var el = document.getElementById('tp-no-sticky');
  if (el) el.remove();
};
```

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
│ TizenPortal - Diagnostics               │
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
