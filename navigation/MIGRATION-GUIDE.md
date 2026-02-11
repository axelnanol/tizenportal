# Migration Guide: Spatial Navigation Library

This guide helps you migrate to the new dual-mode spatial navigation library.

## Table of Contents

1. [Overview](#overview)
2. [Breaking Changes](#breaking-changes)
3. [Migration from W3C Polyfill](#migration-from-w3c-polyfill)
4. [Migration from Custom Navigation](#migration-from-custom-navigation)
5. [Choosing a Mode](#choosing-a-mode)
6. [Common Migration Patterns](#common-migration-patterns)
7. [Troubleshooting](#troubleshooting)

## Overview

The new spatial navigation library provides two distinct modes:

- **Geometric Mode** (default): Strict axis-aligned filtering, mathematically correct
- **Directional Mode**: Cone-based filtering, human-expectation-aligned

Both modes are **deterministic** - same geometry produces same results.

## Breaking Changes

### If You Were Using the W3C Polyfill

The library is inspired by the W3C spec but has a different API:

**Before:**
```javascript
window.navigate('right');
element.spatialNavigationSearch('down');
```

**After:**
```javascript
SpatialNavigation.navigate('right');
SpatialNavigation.findNextFocusable(element, 'down');
```

**Key Differences:**
- No global `window.navigate()` pollution
- No `Element.prototype` extensions
- Explicit configuration system
- Two distinct modes instead of one

### Configuration System

The library requires explicit configuration:

```javascript
// Old (implicit behavior)
window.navigate('right');

// New (explicit configuration)
SpatialNavigation.configure({ mode: 'geometric' });
SpatialNavigation.navigate('right');
```

## Migration from W3C Polyfill

### Step 1: Replace Polyfill

Remove the W3C polyfill:

```html
<!-- Remove this -->
<script src="spatial-navigation-polyfill.js"></script>

<!-- Add this -->
<script src="spatial-navigation.js"></script>
```

### Step 2: Update Navigate Calls

Replace all `window.navigate()` calls:

```javascript
// Before
document.addEventListener('keydown', (e) => {
  if (e.keyCode === 39) {
    window.navigate('right');
  }
});

// After
SpatialNavigation.configure({ mode: 'geometric' });

document.addEventListener('keydown', (e) => {
  if (e.keyCode === 39) {
    SpatialNavigation.navigate('right');
  }
});
```

### Step 3: Update Search Calls

Replace `spatialNavigationSearch`:

```javascript
// Before
const next = element.spatialNavigationSearch('down', {
  candidates: candidateList,
  container: container
});

// After
const next = SpatialNavigation.findNextFocusable(element, 'down', {
  candidates: candidateList,
  container: container
});
```

### Step 4: Choose Your Mode

Decide which mode best fits your use case:

```javascript
// For existing behavior (closest to W3C spec)
SpatialNavigation.configure({ mode: 'geometric' });

// For more forgiving, TV-like behavior
SpatialNavigation.configure({ 
  mode: 'directional',
  coneAngle: 30,
  fallback: 'nearest'
});
```

## Migration from Custom Navigation

### Step 1: Identify Your Navigation Style

Analyze your current navigation logic:

**Grid-based layouts** → Geometric mode
```javascript
// Your code probably has:
if (candidate.offsetLeft > origin.offsetLeft) {
  // Strict axis checks
}

// Migrate to:
SpatialNavigation.configure({ mode: 'geometric' });
```

**Irregular layouts** → Directional mode
```javascript
// Your code probably has:
const angle = Math.atan2(dy, dx);
if (Math.abs(angle) < threshold) {
  // Angle-based checks
}

// Migrate to:
SpatialNavigation.configure({ 
  mode: 'directional',
  coneAngle: 30 
});
```

### Step 2: Replace Filtering Logic

Replace your candidate filtering:

```javascript
// Before
const candidates = allElements.filter(el => {
  return el.offsetLeft > origin.offsetLeft &&
         Math.abs(el.offsetTop - origin.offsetTop) < threshold;
});

// After
SpatialNavigation.configure({ mode: 'geometric' });
const candidates = SpatialNavigation.utils.filterByDirectionGeometric(
  origin, 
  allElements, 
  'right'
);
```

### Step 3: Replace Scoring Logic

Replace your distance calculations:

```javascript
// Before
const distance = Math.sqrt(
  Math.pow(candidate.offsetLeft - origin.offsetLeft, 2) +
  Math.pow(candidate.offsetTop - origin.offsetTop, 2)
);

// After
const score = SpatialNavigation.utils.scoreGeometric(
  origin, 
  candidate, 
  'right'
);
```

### Step 4: Replace Navigation Logic

Replace your full navigation flow:

```javascript
// Before
function navigateRight() {
  const candidates = filterCandidates();
  const scored = candidates.map(c => ({ 
    element: c, 
    score: calculateScore(c) 
  }));
  scored.sort((a, b) => a.score - b.score);
  if (scored[0]) {
    scored[0].element.focus();
  }
}

// After
SpatialNavigation.configure({ mode: 'geometric' });
SpatialNavigation.navigate('right');
```

## Choosing a Mode

### Use Geometric Mode When:

✅ You have **grid-based layouts**
- Rows and columns are well-aligned
- Elements form clear grids
- Navigation should be predictable and "correct"

✅ You need **strict directional control**
- Users expect cardinal directions only
- No diagonal navigation desired
- Mathematical correctness is important

✅ You're **debugging navigation issues**
- Geometric mode is easier to reason about
- No "magic" behavior
- Pure geometry

**Example Layouts:**
- Settings menus with aligned options
- Form fields in a grid
- Calculator keyboards
- Data tables

### Use Directional Mode When:

✅ You have **irregular layouts**
- Elements are not perfectly aligned
- Responsive or fluid designs
- Organic, non-grid arrangements

✅ You want **forgiving navigation**
- Users expect "smart" behavior
- Diagonal elements should be reachable
- Fallbacks for edge cases

✅ You're building **TV/streaming UIs**
- Modern media player interfaces
- Content carousels
- Mixed content layouts

**Example Layouts:**
- Netflix-style tile grids
- YouTube-style irregular thumbnails
- Spotify-style mixed content
- TV channel guides

## Common Migration Patterns

### Pattern 1: Grid Menu (Geometric Mode)

```javascript
// Configure once at initialization
SpatialNavigation.configure({
  mode: 'geometric',
  orthogonalWeightLR: 30,
  orthogonalWeightUD: 2
});

// Handle navigation
document.addEventListener('keydown', (e) => {
  const dirs = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
  if (dirs[e.keyCode]) {
    e.preventDefault();
    SpatialNavigation.navigate(dirs[e.keyCode]);
  }
});
```

### Pattern 2: Irregular Content (Directional Mode)

```javascript
// Configure with fallback for better UX
SpatialNavigation.configure({
  mode: 'directional',
  coneAngle: 45,          // Wider cone for irregular layouts
  fallback: 'nearest',    // Always find something
  overlapBonus: true,
  rowColumnBias: true
});

// Same navigation handler works
document.addEventListener('keydown', (e) => {
  const dirs = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
  if (dirs[e.keyCode]) {
    e.preventDefault();
    SpatialNavigation.navigate(dirs[e.keyCode]);
  }
});
```

### Pattern 3: Container-Scoped Navigation

```javascript
// Navigate only within specific container
function navigateInMenu(direction) {
  const menu = document.getElementById('menu');
  const origin = document.activeElement;
  
  const next = SpatialNavigation.findNextFocusable(origin, direction, {
    container: menu
  });
  
  if (next) {
    next.focus();
  } else {
    console.log('End of menu reached');
  }
}
```

### Pattern 4: Wrapping Navigation

```javascript
// Enable wrapping for carousel-like behavior
SpatialNavigation.configure({
  mode: 'directional',
  fallback: 'wrap'  // Wrap to opposite edge
});

// Navigating right at the end wraps to beginning
SpatialNavigation.navigate('right');
```

### Pattern 5: Custom Candidates

```javascript
// Only navigate among specific elements
const buttons = document.querySelectorAll('.nav-button');

SpatialNavigation.navigate('right', {
  candidates: Array.from(buttons)
});
```

## Troubleshooting

### Issue: Navigation doesn't work at all

**Symptom:** Nothing happens when navigating

**Solutions:**
1. Ensure you've configured the library:
   ```javascript
   SpatialNavigation.configure({ mode: 'geometric' });
   ```

2. Check that elements are focusable:
   ```javascript
   <button tabindex="0">Button</button>
   ```

3. Verify elements are visible:
   ```javascript
   element.style.display !== 'none'
   element.style.visibility !== 'hidden'
   ```

### Issue: Wrong element is focused

**Symptom:** Navigation jumps to unexpected elements

**Solutions:**
1. Try directional mode with wider cone:
   ```javascript
   SpatialNavigation.configure({ 
     mode: 'directional',
     coneAngle: 45 
   });
   ```

2. Add fallback for better coverage:
   ```javascript
   SpatialNavigation.configure({ 
     mode: 'directional',
     fallback: 'nearest'
   });
   ```

3. Check element positioning with utils:
   ```javascript
   const rect = SpatialNavigation.utils.getRect(element);
   console.log('Element position:', rect);
   ```

### Issue: Can't reach diagonal elements

**Symptom:** Elements at angles can't be reached in geometric mode

**Solution:** Switch to directional mode:
```javascript
SpatialNavigation.configure({ mode: 'directional' });
```

### Issue: Navigation too sensitive to misalignment

**Symptom:** Geometric mode fails with slightly misaligned elements

**Solution:** Use directional mode with row/column bias:
```javascript
SpatialNavigation.configure({
  mode: 'directional',
  rowColumnBias: true,
  alignmentWeight: 10  // Higher = more bias toward alignment
});
```

### Issue: Need different behavior for different sections

**Solution:** Reconfigure per section:
```javascript
// Section 1: Strict grid
function enterSection1() {
  SpatialNavigation.configure({ mode: 'geometric' });
}

// Section 2: Irregular layout
function enterSection2() {
  SpatialNavigation.configure({ 
    mode: 'directional',
    fallback: 'nearest'
  });
}
```

### Issue: Performance concerns

**Solution:** Pre-filter candidates:
```javascript
// Don't let library scan entire DOM
const container = document.getElementById('active-section');
const candidates = container.querySelectorAll('[tabindex="0"]');

SpatialNavigation.navigate('right', {
  container: container,
  candidates: Array.from(candidates)
});
```

## Testing After Migration

### Visual Testing Checklist

- [ ] All elements can be reached from any starting point
- [ ] Navigation feels natural and predictable
- [ ] No unexpected jumps or skips
- [ ] Focus indicator is always visible
- [ ] Wrapping works as expected (if enabled)

### Automated Testing

```javascript
// Test determinism
const origin = document.getElementById('btn-1');
const result1 = SpatialNavigation.findNextFocusable(origin, 'right');
const result2 = SpatialNavigation.findNextFocusable(origin, 'right');

console.assert(result1 === result2, 'Navigation should be deterministic');

// Test all directions
const directions = ['left', 'right', 'up', 'down'];
directions.forEach(dir => {
  const next = SpatialNavigation.findNextFocusable(origin, dir);
  console.log(`${dir}:`, next ? next.textContent : 'null');
});
```

## Next Steps

1. **Review the [Full Documentation](SPATIAL-NAVIGATION-README.md)**
   - Complete API reference
   - All configuration options
   - More examples

2. **Try the [Interactive Demo](spatial-navigation-demo.html)**
   - Compare geometric vs directional modes
   - Experiment with configurations
   - See live status updates

3. **Run the [Test Suite](spatial-navigation-test.html)**
   - Verify the library works correctly
   - Understand expected behaviors
   - Reference for your own tests

4. **Optimize for Your Use Case**
   - Start with defaults
   - Adjust based on user feedback
   - Test with real users and devices

## Need Help?

- Read the [Architecture section](SPATIAL-NAVIGATION-README.md#architecture) to understand how it works
- Check the [Examples](SPATIAL-NAVIGATION-README.md#examples) for common patterns
- Open an issue if you find bugs or have questions

---

**Happy navigating! 🧭**
