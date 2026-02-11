# Examples: Spatial Navigation Library

Practical examples for common use cases.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Grid Layouts](#grid-layouts)
3. [Irregular Layouts](#irregular-layouts)
4. [TV UI Patterns](#tv-ui-patterns)
5. [Advanced Techniques](#advanced-techniques)
6. [Integration Patterns](#integration-patterns)

---

## Basic Setup

### Minimal Working Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Spatial Navigation Example</title>
</head>
<body>
  <div id="menu">
    <button tabindex="0">Home</button>
    <button tabindex="0">Movies</button>
    <button tabindex="0">TV Shows</button>
    <button tabindex="0">Settings</button>
  </div>

  <script src="spatial-navigation.js"></script>
  <script>
    // Configure navigation
    SpatialNavigation.configure({ mode: 'geometric' });
    
    // Handle arrow keys
    document.addEventListener('keydown', (e) => {
      const dirs = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
      if (dirs[e.keyCode]) {
        e.preventDefault();
        SpatialNavigation.navigate(dirs[e.keyCode]);
      }
    });
    
    // Focus first button on load
    window.addEventListener('load', () => {
      document.querySelector('button').focus();
    });
  </script>
</body>
</html>
```

---

## Grid Layouts

### Example 1: 3x3 Grid Menu

```html
<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 200px);
    gap: 10px;
  }
  
  .grid button {
    height: 100px;
    font-size: 18px;
  }
  
  button:focus {
    outline: 3px solid #4CAF50;
    outline-offset: 2px;
  }
</style>

<div class="grid">
  <button tabindex="0">1</button>
  <button tabindex="0">2</button>
  <button tabindex="0">3</button>
  <button tabindex="0">4</button>
  <button tabindex="0">5</button>
  <button tabindex="0">6</button>
  <button tabindex="0">7</button>
  <button tabindex="0">8</button>
  <button tabindex="0">9</button>
</div>

<script>
  // Geometric mode is perfect for grids
  SpatialNavigation.configure({ mode: 'geometric' });
</script>
```

### Example 2: Settings Menu

```html
<style>
  .settings {
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-width: 500px;
  }
  
  .setting-row {
    display: flex;
    justify-content: space-between;
    padding: 15px;
    background: #f0f0f0;
    border-radius: 8px;
  }
  
  .setting-row button {
    min-width: 80px;
  }
</style>

<div class="settings">
  <div class="setting-row">
    <span>Volume</span>
    <button tabindex="0">10</button>
  </div>
  <div class="setting-row">
    <span>Brightness</span>
    <button tabindex="0">80%</button>
  </div>
  <div class="setting-row">
    <span>Language</span>
    <button tabindex="0">English</button>
  </div>
  <div class="setting-row">
    <span>Subtitles</span>
    <button tabindex="0">Off</button>
  </div>
</div>

<script>
  SpatialNavigation.configure({ 
    mode: 'geometric',
    orthogonalWeightUD: 1  // Reduce vertical bias for this layout
  });
</script>
```

---

## Irregular Layouts

### Example 3: Hero Banner + Content Grid

```html
<style>
  .hero {
    margin-bottom: 20px;
  }
  
  .hero button {
    width: 200px;
    height: 60px;
    margin-right: 10px;
  }
  
  .content {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .tile {
    width: 180px;
    height: 120px;
  }
</style>

<div class="hero">
  <button tabindex="0">▶ Play</button>
  <button tabindex="0">+ My List</button>
  <button tabindex="0">ℹ Info</button>
</div>

<div class="content">
  <button class="tile" tabindex="0">Movie 1</button>
  <button class="tile" tabindex="0">Movie 2</button>
  <button class="tile" tabindex="0">Movie 3</button>
  <button class="tile" tabindex="0">Movie 4</button>
  <button class="tile" tabindex="0">Movie 5</button>
  <button class="tile" tabindex="0">Movie 6</button>
</div>

<script>
  // Directional mode handles the irregular spacing better
  SpatialNavigation.configure({
    mode: 'directional',
    coneAngle: 40,
    fallback: 'nearest',
    overlapBonus: true
  });
</script>
```

### Example 4: Floating Action Buttons

```html
<style>
  .content {
    position: relative;
    width: 800px;
    height: 600px;
    background: #f5f5f5;
  }
  
  .fab {
    position: absolute;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #2196F3;
    color: white;
    border: none;
  }
</style>

<div class="content">
  <button class="fab" tabindex="0" style="top: 50px; left: 50px;">A</button>
  <button class="fab" tabindex="0" style="top: 80px; left: 200px;">B</button>
  <button class="fab" tabindex="0" style="top: 150px; left: 120px;">C</button>
  <button class="fab" tabindex="0" style="top: 200px; left: 350px;">D</button>
  <button class="fab" tabindex="0" style="top: 300px; left: 100px;">E</button>
</div>

<script>
  // Wide cone + nearest fallback for scattered elements
  SpatialNavigation.configure({
    mode: 'directional',
    coneAngle: 60,
    fallback: 'nearest',
    primaryWeight: 0.8,
    secondaryWeight: 0.3
  });
</script>
```

---

## TV UI Patterns

### Example 5: Netflix-Style Rows

```html
<style>
  .row {
    margin-bottom: 30px;
  }
  
  .row-title {
    font-size: 20px;
    margin-bottom: 10px;
  }
  
  .row-content {
    display: flex;
    gap: 10px;
    overflow-x: auto;
  }
  
  .thumbnail {
    min-width: 200px;
    height: 120px;
    background: #333;
    color: white;
  }
</style>

<div class="row">
  <div class="row-title">Continue Watching</div>
  <div class="row-content">
    <button class="thumbnail" tabindex="0">Show 1</button>
    <button class="thumbnail" tabindex="0">Show 2</button>
    <button class="thumbnail" tabindex="0">Show 3</button>
    <button class="thumbnail" tabindex="0">Show 4</button>
  </div>
</div>

<div class="row">
  <div class="row-title">Trending Now</div>
  <div class="row-content">
    <button class="thumbnail" tabindex="0">Movie 1</button>
    <button class="thumbnail" tabindex="0">Movie 2</button>
    <button class="thumbnail" tabindex="0">Movie 3</button>
    <button class="thumbnail" tabindex="0">Movie 4</button>
  </div>
</div>

<script>
  // Row-aligned navigation with column bias
  SpatialNavigation.configure({
    mode: 'directional',
    rowColumnBias: true,
    alignmentWeight: 10,  // Strong preference to stay in rows
    overlapBonus: true,
    fallback: 'none'  // Don't jump rows unexpectedly
  });
</script>
```

### Example 6: TV Guide Grid

```html
<style>
  .guide {
    display: grid;
    grid-template-columns: 100px repeat(6, 150px);
    gap: 2px;
  }
  
  .channel {
    background: #666;
    color: white;
    padding: 10px;
  }
  
  .program {
    background: #e0e0e0;
    padding: 10px;
  }
</style>

<div class="guide">
  <!-- Time headers -->
  <div></div>
  <div>8:00 PM</div>
  <div>8:30 PM</div>
  <div>9:00 PM</div>
  <div>9:30 PM</div>
  <div>10:00 PM</div>
  <div>10:30 PM</div>
  
  <!-- Channel rows -->
  <div class="channel">NBC</div>
  <button class="program" tabindex="0">News</button>
  <button class="program" tabindex="0">News</button>
  <button class="program" tabindex="0">Drama</button>
  <button class="program" tabindex="0">Drama</button>
  <button class="program" tabindex="0">Late Show</button>
  <button class="program" tabindex="0">Late Show</button>
  
  <div class="channel">ABC</div>
  <button class="program" tabindex="0">Game Show</button>
  <button class="program" tabindex="0">Game Show</button>
  <button class="program" tabindex="0">Sitcom</button>
  <button class="program" tabindex="0">Sitcom</button>
  <button class="program" tabindex="0">News</button>
  <button class="program" tabindex="0">News</button>
</div>

<script>
  // Perfect for geometric mode - strict grid
  SpatialNavigation.configure({
    mode: 'geometric',
    orthogonalWeightLR: 20,
    orthogonalWeightUD: 2
  });
</script>
```

---

## Advanced Techniques

### Example 7: Container Transitions

```javascript
// Smooth transitions between different navigation zones

let currentZone = 'menu';

const zones = {
  menu: {
    element: document.getElementById('menu'),
    config: {
      mode: 'geometric',
      fallback: 'none'
    }
  },
  content: {
    element: document.getElementById('content'),
    config: {
      mode: 'directional',
      coneAngle: 45,
      fallback: 'nearest'
    }
  }
};

function enterZone(zoneName) {
  currentZone = zoneName;
  const zone = zones[zoneName];
  
  // Reconfigure for this zone
  SpatialNavigation.configure(zone.config);
  
  // Focus first element in zone
  const first = SpatialNavigation.findFirstFocusable(zone.element);
  if (first) first.focus();
}

// Detect zone changes
document.addEventListener('focusin', (e) => {
  Object.entries(zones).forEach(([name, zone]) => {
    if (zone.element.contains(e.target) && currentZone !== name) {
      enterZone(name);
    }
  });
});
```

### Example 8: Infinite Carousel with Wrapping

```javascript
// Horizontal carousel that wraps
SpatialNavigation.configure({
  mode: 'directional',
  coneAngle: 10,  // Narrow cone for horizontal-only
  fallback: 'wrap'  // Wrap around
});

const carousel = document.getElementById('carousel');

document.addEventListener('keydown', (e) => {
  if (e.keyCode === 37 || e.keyCode === 39) {
    e.preventDefault();
    
    const direction = e.keyCode === 37 ? 'left' : 'right';
    const current = document.activeElement;
    
    // Try navigation within carousel
    const next = SpatialNavigation.findNextFocusable(current, direction, {
      container: carousel
    });
    
    if (next) {
      next.focus();
      // Smooth scroll the carousel
      next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
});
```

### Example 9: Context-Aware Navigation

```javascript
// Different behavior based on context

function handleNavigation(direction) {
  const focused = document.activeElement;
  
  // Check if we're in a special component
  if (focused.closest('.video-player')) {
    // In video player - use simple nearest
    SpatialNavigation.configure({
      mode: 'directional',
      fallback: 'nearest'
    });
  } else if (focused.closest('.settings-grid')) {
    // In settings - use geometric
    SpatialNavigation.configure({
      mode: 'geometric'
    });
  } else {
    // General content - use directional
    SpatialNavigation.configure({
      mode: 'directional',
      coneAngle: 30,
      fallback: 'none'
    });
  }
  
  SpatialNavigation.navigate(direction);
}

document.addEventListener('keydown', (e) => {
  const dirs = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
  if (dirs[e.keyCode]) {
    e.preventDefault();
    handleNavigation(dirs[e.keyCode]);
  }
});
```

### Example 10: Custom Filtering

```javascript
// Only navigate to elements with specific attributes

function navigateWithFilter(direction, filterFn) {
  const origin = document.activeElement;
  const container = document.body;
  
  // Get all focusable elements
  const allCandidates = Array.from(container.querySelectorAll('[tabindex="0"]'));
  
  // Apply custom filter
  const filteredCandidates = allCandidates.filter(filterFn);
  
  // Find next
  const next = SpatialNavigation.findNextFocusable(origin, direction, {
    candidates: filteredCandidates
  });
  
  if (next) next.focus();
}

// Example: Only navigate to elements with data-group="primary"
document.addEventListener('keydown', (e) => {
  if (e.keyCode === 39) {
    e.preventDefault();
    navigateWithFilter('right', el => el.dataset.group === 'primary');
  }
});
```

---

## Integration Patterns

### With React

```jsx
import { useEffect } from 'react';
import SpatialNavigation from './spatial-navigation';

function NavigableGrid({ items }) {
  useEffect(() => {
    SpatialNavigation.configure({ mode: 'geometric' });
    
    const handleKeyDown = (e) => {
      const dirs = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
      if (dirs[e.keyCode]) {
        e.preventDefault();
        SpatialNavigation.navigate(dirs[e.keyCode]);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="grid">
      {items.map((item, i) => (
        <button key={i} tabIndex={0}>
          {item.name}
        </button>
      ))}
    </div>
  );
}
```

### With Vue

```vue
<template>
  <div class="grid">
    <button 
      v-for="item in items" 
      :key="item.id"
      tabindex="0"
    >
      {{ item.name }}
    </button>
  </div>
</template>

<script>
import SpatialNavigation from './spatial-navigation';

export default {
  mounted() {
    SpatialNavigation.configure({ mode: 'directional' });
    
    document.addEventListener('keydown', this.handleKeyDown);
  },
  
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  },
  
  methods: {
    handleKeyDown(e) {
      const dirs = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
      if (dirs[e.keyCode]) {
        e.preventDefault();
        SpatialNavigation.navigate(dirs[e.keyCode]);
      }
    }
  }
};
</script>
```

### With Vanilla JS Class

```javascript
class NavigableMenu {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.init();
  }
  
  init() {
    // Configure spatial navigation
    SpatialNavigation.configure({
      mode: this.options.mode || 'geometric',
      ...this.options.config
    });
    
    // Bind keyboard handler
    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Focus first element
    this.focusFirst();
  }
  
  handleKeyDown(e) {
    const dirs = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
    if (dirs[e.keyCode]) {
      e.preventDefault();
      this.navigate(dirs[e.keyCode]);
    }
  }
  
  navigate(direction) {
    const origin = document.activeElement;
    
    if (!this.container.contains(origin)) {
      this.focusFirst();
      return;
    }
    
    const next = SpatialNavigation.findNextFocusable(origin, direction, {
      container: this.container
    });
    
    if (next) next.focus();
  }
  
  focusFirst() {
    const first = SpatialNavigation.findFirstFocusable(this.container);
    if (first) first.focus();
  }
  
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

// Usage
const menu = new NavigableMenu(document.getElementById('menu'), {
  mode: 'directional',
  config: { coneAngle: 45, fallback: 'nearest' }
});
```

---

## More Examples

See the [interactive demo](spatial-navigation-demo.html) for live examples with configuration controls.

See the [test suite](spatial-navigation-test.html) for edge case examples.

---

**Need more examples? Check the [full documentation](SPATIAL-NAVIGATION-README.md) or open an issue!**
