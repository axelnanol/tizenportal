# Audiobookshelf Bundle

**Version:** 1.0.0  
**Purpose:** TV-optimized interface for Audiobookshelf media server

## Overview

The Audiobookshelf bundle provides comprehensive TV remote control support for [Audiobookshelf](https://www.audiobookshelf.org/), a self-hosted audiobook and podcast server. It enables full navigation and media playback control using only your Samsung TV remote.

## Features

### 1. TV Remote Navigation

Complete D-pad navigation for all Audiobookshelf interfaces:
- **Library browsing** - Navigate book cards with arrow keys
- **Media controls** - Play/pause, rewind, fast-forward using media keys
- **Modal handling** - Proper focus management in dialogs and modals
- **Player integration** - Control the audiobook/podcast player without touching your phone

### 2. Card-Based Navigation

Optimized for Audiobookshelf's card layouts:
- **Book cards** (1:1 aspect ratio) - Square book covers
- **Series cards** (2:1 aspect ratio) - Series collections
- **Collection cards** (2:1 aspect ratio) - Custom collections
- **Author cards** - Author photos and listings
- **Playlist cards** - Podcast and playlist items

All cards are automatically made focusable and navigable with proper spacing.

### 3. Media Key Support

Full media control integration:
- **Play/Pause** - Control playback
- **Rewind/Fast Forward** - Skip backward/forward
- **Stop** - Stop playback
- **Previous/Next Track** - Navigate chapters or episodes

### 4. Focus Management

Intelligent focus handling:
- **Initial focus** - Automatically focuses the first interactive element on page load
- **Modal trapping** - Keeps focus inside open modals
- **DOM observation** - Detects dynamically added content and updates focus
- **Focus restoration** - Returns focus to appropriate elements after modal closure

### 5. Login Page Support

Special handling for Audiobookshelf login:
- Auto-focuses username field
- Proper tab order (username → password → submit button)
- OpenID authentication button support
- Form submission via Enter key

### 6. Spatial Navigation

Uses **Directional Mode** (preferred) for natural TV navigation:
- Cone-based navigation (±30° from navigation axis)
- Handles imperfect alignment gracefully
- Feels right for human interaction
- Configurable fallbacks

### 7. Viewport Lock

Forces 1920×1080 resolution:
- Prevents responsive breakpoints from triggering
- Ensures consistent TV layout
- Disables mobile/tablet layouts

## Configuration

The bundle uses these settings:

```json
{
  "navigationMode": {
    "mode": "directional",
    "required": false
  },
  "viewportLock": "force",
  "features": {
    "tabindexInjection": true,
    "scrollIntoView": true,
    "wrapTextInputs": true
  }
}
```

### Navigation Mode

- **Default:** Directional (cone-based, forgiving)
- **Fallback:** If user preferences override, respects their choice
- **Why Directional:** Handles Audiobookshelf's irregular card grids better than geometric mode

### Features Enabled

- **tabindexInjection** - Makes all interactive elements keyboard-accessible
- **scrollIntoView** - Auto-scrolls focused elements into view
- **wrapTextInputs** - Enables text input with TV keyboard

## Key Mappings

In addition to standard color button mappings, the bundle provides:

| Key | Function |
|-----|----------|
| **Media Keys** | |
| Play/Pause | Control audiobook playback |
| Stop | Stop playback |
| Rewind | Skip backward |
| Fast Forward | Skip forward |
| Previous/Next | Navigate chapters/episodes |
| **D-Pad** | |
| Arrow keys | Navigate cards and UI elements |
| Enter | Activate selected item |
| Back | Go back / close modal |

## Installation

1. Open TizenPortal on your TV
2. Press **Yellow** (Add Site)
3. Enter your Audiobookshelf URL (e.g., `http://192.168.1.100:13378`)
4. Select **Audiobookshelf** from the bundle dropdown
5. Save the card

The bundle will be automatically loaded when you navigate to your Audiobookshelf site.

## Supported Audiobookshelf Pages

The bundle handles all major Audiobookshelf interfaces:

- **Home/Library** - Browse books, series, collections
- **Item Detail** - Book/podcast details and playback
- **Player** - Full-screen player controls
- **Search** - Search results navigation
- **Collections** - Collection browsing
- **Authors** - Author listings
- **Series** - Series browsing
- **Login** - Authentication page

## Requirements

- **Audiobookshelf:** Version 2.x or later
- **TizenPortal:** Latest version (see [CHANGELOG](../../docs/CHANGELOG.md))
- **TV Browser:** Chrome 47+ (all Samsung Tizen TVs)

## Core Integration

This bundle leverages TizenPortal core utilities:

- **focus/manager.js** - `setInitialFocus()`, `observeDOM()`
- **navigation/helpers.js** - `focusElement()`, `focusFirst()`, `getFocusableElements()`
- **navigation/card-interaction.js** - `isInsideCard()`, `exitCard()`
- **navigation/geometry.js** - `injectSpacingCSS()`, spacing validation

**Note:** The bundle does NOT reimplement core functionality. It uses the provided utilities for consistency.

## Troubleshooting

### Cards Not Focusable

If book/series cards aren't responding to arrow keys:

1. Press **Blue** (Diagnostics) and check console for errors
2. Verify the bundle is loaded (should show "Audiobookshelf bundle activated")
3. Try pressing **Blue** + long press for safe mode (reloads without bundles)
4. Check if your Audiobookshelf version has different DOM structure

### Focus Lost in Modals

If focus escapes from open modals:

1. The bundle has focus trap logic - this shouldn't happen
2. Check diagnostics for error messages
3. Report the specific modal that's problematic (include page URL)

### Media Keys Not Working

If play/pause doesn't control playback:

1. Ensure your TV remote supports media keys
2. Check that TizenBrew has registered the media keys (package.json)
3. Verify playback is active (keys only work when player is open)

### Navigation Feels Wrong

If navigation jumps unexpectedly:

1. Try switching to **Geometric Mode** in site preferences
2. Press **Yellow** (Preferences) → Select your ABS card → Change Navigation Mode
3. Geometric mode is stricter (axis-aligned only)

## Files

- **main.js** - Bundle logic, key handlers, focus management
- **style.css** - TV-optimized styles for ABS UI
- **manifest.json** - Bundle metadata and configuration
- **README.md** - This documentation

## Credits

Bundle authored by the TizenPortal team for the Audiobookshelf community.

Audiobookshelf is developed by [advplyr](https://github.com/advplyr/audiobookshelf).

## Support

For bundle issues:
- Check the [Troubleshooting guide](/docs/Troubleshooting.md)
- Open an issue on the TizenPortal GitHub
- Include diagnostics output (Blue button → copy logs)

For Audiobookshelf issues:
- Visit [audiobookshelf.org](https://www.audiobookshelf.org/)
- Check the [ABS GitHub](https://github.com/advplyr/audiobookshelf)
