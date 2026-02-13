# Spatial Navigation Library

> **Note:** This document provides detailed documentation for the spatial-navigation.js library used by TizenPortal. For TizenPortal-specific navigation configuration, see [docs/Navigation-Mode-Configuration.md](../docs/Navigation-Mode-Configuration.md).

A deterministic, geometry-based spatial navigation library for TV UIs, set-top boxes, and keyboard/remote interfaces.

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Navigation Modes](#navigation-modes)
- [API Reference](#api-reference)
- [Configuration Options](#configuration-options)
- [Examples](#examples)
- [Migration Guide](#migration-guide)
- [Architecture](#architecture)
- [Testing](#testing)
- [Contributing](#contributing)

## ✨ Features

- **Two Navigation Modes**
  - **Geometric Mode**: Strict axis-aligned filtering with Euclidean scoring (mathematically correct)
  - **Directional Mode**: Cone-based, human-expectation-aligned navigation
  
- **Highly Configurable**
  - Adjustable cone angles
  - Customizable scoring weights
  - Overlap bonuses and alignment biases
  - Scroll-region semantics
  - Multiple fallback strategies

- **Deterministic**
  - Same geometry + same configuration = same result
  - No randomness, no browser quirks
  - Predictable and testable

- **Pure Functions**
  - No DOM mutations
  - No side effects
  - Composable strategy functions

- **TypeScript Support**
  - Full type definitions included
  - IntelliSense-friendly

## 📦 Installation

### Browser (Global)

```html
<script src="spatial-navigation.js"></script>
<script>
  SpatialNavigation.configure({ mode: 'directional' });
</script>
```

### AMD

```javascript
define(['spatial-navigation'], function(SpatialNavigation) {
  SpatialNavigation.configure({ mode: 'directional' });
});
```

### CommonJS / Node.js

```javascript
const SpatialNavigation = require('./spatial-navigation');
SpatialNavigation.configure({ mode: 'directional' });
```

## 🚀 Quick Start

### Basic Usage

```javascript
// Configure navigation mode
SpatialNavigation.configure({
  mode: 'directional',  // or 'geometric'
  coneAngle: 30,
  fallback: 'nearest'
});

// Navigate programmatically
SpatialNavigation.navigate('right');  // Navigate right from current focus

// Or find next focusable element manually
const currentElement = document.activeElement;
const nextElement = SpatialNavigation.findNextFocusable(currentElement, 'down');
if (nextElement) {
  nextElement.focus();
}
```

### Handling Arrow Keys

```javascript
document.addEventListener('keydown', (e) => {
  const keyMap = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };
  
  const direction = keyMap[e.keyCode];
  if (direction) {
    e.preventDefault();
    SpatialNavigation.navigate(direction);
  }
});
```

## 🎯 Navigation Modes

### Geometric Mode (Default)

**Strict axis-aligned filtering** - The "mathematically correct" mode.

```javascript
SpatialNavigation.configure({ mode: 'geometric' });
```

**Characteristics:**
- Candidates must lie in strict half-plane perpendicular to direction
- Uses Euclidean distance for scoring
- Applies orthogonal bias and alignment bonuses
- No cones, no fallbacks
- 100% deterministic

**When to use:**
- When you need predictable, "correct" behavior
- Layouts with clear grid structures
- When debugging navigation issues
- When building on top of established patterns

**ASCII Diagram:**
```
For direction "right":

    │
    │  Candidates must be
    │  strictly to the right
  [A]│  of element A's center
    │
    │
```

### Directional Mode

**Cone-based, human-expectation-aligned** - Feels like modern TV UIs.

```javascript
SpatialNavigation.configure({
  mode: 'directional',
  coneAngle: 30,          // ±30° cone
  primaryWeight: 1,       // Weight for primary axis
  secondaryWeight: 0.5,   // Weight for secondary axis
  overlapBonus: true,     // Favor overlapping elements
  rowColumnBias: true,    // Prefer staying aligned
  fallback: 'nearest'     // Fallback when no candidates
});
```

**Characteristics:**
- Candidates must lie within directional cone (±30° default)
- Primary axis distance weighted higher than secondary
- Overlap bonus for perpendicular axis alignment
- Row/column bias prefers staying aligned
- Configurable fallback behavior (none/nearest/wrap)
- Feels natural and forgiving

**When to use:**
- Modern TV/streaming UI experiences
- Irregular or responsive layouts
- When users expect "smart" navigation
- When geometry isn't perfectly aligned

**ASCII Diagram:**
```
For direction "right" with ±30° cone:

           .
         .   .
       .       .  30°
     . Cone      .
   [A]─────────────>
     . Area      .
       .       . -30°
         .   .
           .
```

## 📖 API Reference

### Configuration

#### `configure(options)`

Configure the spatial navigation system.

```javascript
SpatialNavigation.configure({
  mode: 'directional',
  coneAngle: 45,
  primaryWeight: 1.5,
  fallback: 'wrap'
});
```

**Parameters:**
- `options` (Object) - Configuration options (see [Configuration Options](#configuration-options))

**Returns:** Current configuration object

**Throws:**
- `TypeError` if options is not an object or contains invalid types
- `Error` if mode, scrollBehavior, or fallback values are invalid

#### `getConfig()`

Get current configuration.

```javascript
const config = SpatialNavigation.getConfig();
console.log(config.mode);  // 'directional'
```

**Returns:** Copy of current configuration object

#### `resetConfig()`

Reset configuration to defaults.

```javascript
SpatialNavigation.resetConfig();
```

### Navigation

#### `navigate(direction, options)`

Navigate from currently focused element.

```javascript
const success = SpatialNavigation.navigate('right', {
  container: document.getElementById('grid')
});
```

**Parameters:**
- `direction` (String) - 'left', 'right', 'up', or 'down'
- `options` (Object, optional)
  - `container` (Element) - Container to search within (default: document.body)
  - `candidates` (Array<Element>) - Specific candidates to consider

**Returns:** Boolean - true if navigation succeeded, false otherwise

#### `findNextFocusable(origin, direction, options)`

Find next focusable element in direction.

```javascript
const origin = document.getElementById('btn-1');
const next = SpatialNavigation.findNextFocusable(origin, 'down', {
  container: document.getElementById('menu')
});

if (next) {
  next.focus();
}
```

**Parameters:**
- `origin` (Element) - Origin element
- `direction` (String) - 'left', 'right', 'up', or 'down'
- `options` (Object, optional)
  - `container` (Element) - Container to search within
  - `candidates` (Array<Element>) - Specific candidates to consider

**Returns:** Element or null

**Throws:**
- `Error` if origin or direction are missing or invalid

#### `findFirstFocusable(container)`

Find first focusable element in container.

```javascript
const first = SpatialNavigation.findFirstFocusable(document.getElementById('menu'));
if (first) {
  first.focus();
}
```

**Parameters:**
- `container` (Element, optional) - Container to search within (default: document.body)

**Returns:** Element or null

### Utilities

The `utils` namespace exposes internal functions for testing and extension:

```javascript
// Get normalized rect
const rect = SpatialNavigation.utils.getRect(element);

// Check visibility
const visible = SpatialNavigation.utils.isVisible(element);

// Check focusability
const focusable = SpatialNavigation.utils.isFocusable(element);

// Filter candidates (geometric)
const filtered = SpatialNavigation.utils.filterByDirectionGeometric(
  origin, candidates, 'right'
);

// Filter candidates (cone)
const filtered = SpatialNavigation.utils.filterByDirectionCone(
  origin, candidates, 'right'
);

// Score candidate (geometric)
const score = SpatialNavigation.utils.scoreGeometric(origin, candidate, 'right');

// Score candidate (directional)
const score = SpatialNavigation.utils.scoreDirectional(origin, candidate, 'right');

// Apply fallback
const fallback = SpatialNavigation.utils.applyFallback(
  origin, allCandidates, 'right'
);
```

## ⚙️ Configuration Options

### Mode

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | String | `'geometric'` | Navigation mode: `'geometric'` or `'directional'` |

### Directional Mode Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `coneAngle` | Number | `30` | Cone angle in degrees (±angle) |
| `primaryWeight` | Number | `1` | Weight for primary axis distance |
| `secondaryWeight` | Number | `0.5` | Weight for secondary axis offset |
| `overlapBonus` | Boolean | `true` | Apply bonus for perpendicular axis overlap |
| `overlapWeight` | Number | `5` | Weight for overlap bonus |
| `rowColumnBias` | Boolean | `true` | Prefer staying aligned in rows/columns |
| `alignmentWeight` | Number | `5` | Weight for row/column alignment |
| `scrollBehavior` | String | `'focus'` | `'scrollFirst'` or `'focus'` |
| `fallback` | String | `'none'` | `'none'`, `'nearest'`, or `'wrap'` |

### Geometric Mode Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `orthogonalWeightLR` | Number | `30` | Orthogonal weight for left/right navigation |
| `orthogonalWeightUD` | Number | `2` | Orthogonal weight for up/down navigation |

## 💡 Examples

### Example 1: Simple Grid

```html
<div class="grid">
  <button tabindex="0">A</button>
  <button tabindex="0">B</button>
  <button tabindex="0">C</button>
  <button tabindex="0">D</button>
  <button tabindex="0">E</button>
  <button tabindex="0">F</button>
</div>

<script>
  // Use geometric mode for perfect grid
  SpatialNavigation.configure({ mode: 'geometric' });
  
  document.addEventListener('keydown', (e) => {
    const dirs = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
    if (dirs[e.keyCode]) {
      e.preventDefault();
      SpatialNavigation.navigate(dirs[e.keyCode]);
    }
  });
  
  // Focus first element on load
  window.addEventListener('load', () => {
    const first = SpatialNavigation.findFirstFocusable();
    if (first) first.focus();
  });
</script>
```

### Example 2: Irregular Layout with Directional Mode

```html
<div class="menu">
  <button tabindex="0" style="position: absolute; left: 10px; top: 10px;">
    Home
  </button>
  <button tabindex="0" style="position: absolute; left: 120px; top: 15px;">
    Movies
  </button>
  <button tabindex="0" style="position: absolute; left: 240px; top: 8px;">
    TV Shows
  </button>
  <button tabindex="0" style="position: absolute; left: 15px; top: 80px;">
    Settings
  </button>
</div>

<script>
  // Use directional mode for forgiveness
  SpatialNavigation.configure({
    mode: 'directional',
    coneAngle: 45,        // Wider cone for irregular layout
    fallback: 'nearest'   // Always find something
  });
</script>
```

### Example 3: Custom Container and Candidates

```javascript
// Only navigate within specific container
const menu = document.getElementById('sidebar-menu');
const menuButtons = menu.querySelectorAll('button');

SpatialNavigation.navigate('down', {
  container: menu,
  candidates: Array.from(menuButtons)
});
```

### Example 4: Wrapping Navigation

```javascript
// Enable wrapping for carousel-like behavior
SpatialNavigation.configure({
  mode: 'directional',
  fallback: 'wrap'  // Wrap to opposite edge
});

// Navigate right at the end wraps to beginning
SpatialNavigation.navigate('right');
```

### Example 5: Strict Geometric Navigation

```javascript
// Use geometric mode for precise control
SpatialNavigation.configure({
  mode: 'geometric',
  orthogonalWeightLR: 50,  // Higher penalty for misalignment
  orthogonalWeightUD: 5
});

// No fallbacks - returns null if no candidate in direction
const next = SpatialNavigation.findNextFocusable(
  document.activeElement,
  'right'
);

if (!next) {
  console.log('End of row reached');
}
```

## 🔄 Migration Guide

### From W3C Spatial Navigation Polyfill

The library is inspired by the W3C spec but provides a cleaner, more configurable API.

**Before (W3C Polyfill):**
```javascript
window.navigate('right');
element.spatialNavigationSearch('down');
```

**After (This Library):**
```javascript
SpatialNavigation.navigate('right');
SpatialNavigation.findNextFocusable(element, 'down');
```

**Key Differences:**
- Explicit configuration system
- Two distinct modes (geometric/directional)
- No DOM pollution (no prototype extensions)
- TypeScript support
- Better fallback control

### From Custom Navigation

If you have custom navigation code:

1. **Identify your navigation style:**
   - Grid-based, aligned elements → Geometric mode
   - Irregular layouts, user-friendly → Directional mode

2. **Replace filtering logic:**
   ```javascript
   // Before: Custom filtering
   const candidates = elements.filter(el => el.offsetLeft > origin.offsetLeft);
   
   // After: Use library
   SpatialNavigation.configure({ mode: 'geometric' });
   const next = SpatialNavigation.findNextFocusable(origin, 'right', {
     candidates: elements
   });
   ```

3. **Replace scoring logic:**
   ```javascript
   // Before: Custom distance calculation
   const distance = Math.sqrt(dx*dx + dy*dy);
   
   // After: Built-in scoring
   const score = SpatialNavigation.utils.scoreGeometric(origin, candidate, 'right');
   ```

## 🏗️ Architecture

### Design Principles

1. **Pure Functions** - No side effects, no DOM mutations
2. **Composable Strategies** - Filtering, scoring, fallback as separate concerns
3. **Explicit Configuration** - No magic, everything is configurable
4. **Deterministic** - Same input always produces same output

### Core Algorithm Flow

```
┌─────────────────────────────────────────────────────┐
│ findNextFocusable(origin, direction, options)       │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Get candidates (auto-detect or provided)            │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Filter by direction (mode-specific):                │
│  - Geometric: Axis-aligned half-plane               │
│  - Directional: Cone-based                          │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ If no candidates and directional mode:              │
│  → Apply fallback (none/nearest/wrap)               │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Score candidates (mode-specific):                   │
│  - Geometric: Euclidean + orthogonal bias           │
│  - Directional: Weighted primary/secondary          │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Select best (lowest score)                          │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Return element or null                              │
└─────────────────────────────────────────────────────┘
```

### Scoring Formulas

**Geometric Mode:**
```
Score = A + B - C

Where:
  A = Euclidean distance between closest points
  B = Orthogonal offset × orthogonal weight
  C = Alignment bonus (overlap on perpendicular axis)
```

**Directional Mode:**
```
Score = (P × Wp) + (S × Ws) - (O × Wo) - (A × Wa)

Where:
  P = Primary axis distance
  S = Secondary axis offset
  O = Overlap bonus (0-1)
  A = Alignment bonus (0-1)
  Wp, Ws, Wo, Wa = Configurable weights
```

## 🧪 Testing

### Running Tests

Open `spatial-navigation-test.html` in a browser to run the test suite.

The test suite includes:
- ✓ Configuration validation
- ✓ Geometric mode filtering and scoring
- ✓ Directional mode cone filtering
- ✓ Directional mode weighted scoring
- ✓ Fallback behaviors (none/nearest/wrap)
- ✓ Determinism tests
- ✓ Edge cases and error handling

### Writing Custom Tests

```javascript
// Create test elements
const origin = document.createElement('button');
origin.style.position = 'absolute';
origin.style.left = '100px';
origin.style.top = '100px';
origin.tabIndex = 0;
document.body.appendChild(origin);

// Configure and test
SpatialNavigation.configure({ mode: 'geometric' });
const next = SpatialNavigation.findNextFocusable(origin, 'right');

// Assert
console.assert(next !== null, 'Should find next element');

// Cleanup
document.body.removeChild(origin);
```

## 🤝 Contributing

Contributions are welcome! Please ensure:

1. All tests pass
2. New features include tests
3. Code follows existing style
4. Documentation is updated
5. Changes are deterministic

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Inspired by:
- W3C CSS Spatial Navigation specification
- TizenTube spatial navigation polyfill
- Modern TV UI best practices

---

**Made with ❤️ for TV and remote control interfaces**
