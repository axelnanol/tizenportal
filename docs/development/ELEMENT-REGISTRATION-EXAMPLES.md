# Element Registration API - Implementation Examples

> **Companion Document to:** ELEMENT-REGISTRATION-ABSTRACTION-FEASIBILITY.md  
> **Version:** 1.0  
> **Date:** February 14, 2026  
> **Status:** Proposed API Examples

---

## Overview

This document provides concrete implementation examples for the proposed element registration abstraction system. These examples demonstrate how the declarative API would work in practice.

---

## Table of Contents

1. [Basic Operations](#1-basic-operations)
2. [Real-World Bundle Migrations](#2-real-world-bundle-migrations)
3. [Advanced Patterns](#3-advanced-patterns)
4. [Edge Cases and Error Handling](#4-edge-cases-and-error-handling)
5. [Performance Optimization](#5-performance-optimization)
6. [Testing Examples](#6-testing-examples)

---

## 1. Basic Operations

### 1.1 Making Elements Focusable

**Use Case:** Add keyboard navigation to clickable elements that aren't focusable by default.

```javascript
// Basic focusable registration
TizenPortal.elements.register({
  selector: '.clickable-card',
  operation: 'focusable'
});

// With navigation direction
TizenPortal.elements.register({
  selector: '#sidebar nav a',
  operation: 'focusable',
  nav: 'vertical'  // Sets data-tp-nav="vertical"
});

// With spacing class
TizenPortal.elements.register({
  selector: '.grid-container',
  operation: 'focusable',
  classes: ['tp-spacing']
});

// Complete example
TizenPortal.elements.register({
  selector: '#app-header button',
  operation: 'focusable',
  nav: 'horizontal',
  classes: ['tp-spacing'],
  container: '#app-header'  // Scope to specific container
});
```

### 1.2 Applying CSS Classes

**Use Case:** Add utility classes for spacing, layout, or styling.

```javascript
// Add single class
TizenPortal.elements.register({
  selector: '.bookshelf-row',
  operation: 'class',
  classes: ['tp-spacing']
});

// Add multiple classes
TizenPortal.elements.register({
  selector: '.card',
  operation: 'class',
  classes: ['tp-card', 'tp-focusable', 'tp-elevated']
});

// Remove classes (negative operation)
TizenPortal.elements.register({
  selector: '.mobile-only',
  operation: 'class',
  classes: ['visible'],
  remove: true  // Remove instead of add
});
```

### 1.3 Setting Attributes

**Use Case:** Set ARIA labels, data attributes, or other HTML attributes.

```javascript
// Set single attribute
TizenPortal.elements.register({
  selector: 'button.icon-only',
  operation: 'attribute',
  attributes: {
    'aria-label': 'Close dialog'
  }
});

// Set multiple attributes
TizenPortal.elements.register({
  selector: '.interactive-card',
  operation: 'attribute',
  attributes: {
    'tabindex': '0',
    'role': 'button',
    'aria-label': 'Select item',
    'data-tp-card': 'single'
  }
});

// Dynamic attribute values
TizenPortal.elements.register({
  selector: '[data-id]',
  operation: 'attribute',
  attributes: {
    'aria-label': function(element) {
      return 'Item ' + element.getAttribute('data-id');
    }
  }
});
```

### 1.4 Applying Inline Styles

**Use Case:** Override specific CSS properties for TV layout.

```javascript
// Basic style application
TizenPortal.elements.register({
  selector: '#toolbar',
  operation: 'style',
  styles: {
    position: 'fixed',
    top: '0',
    right: '320px',
    zIndex: '100'
  }
});

// With !important flag
TizenPortal.elements.register({
  selector: '.mobile-menu',
  operation: 'style',
  styles: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%'
  },
  important: true  // Applies with !important
});

// Camel case support (auto-converts)
TizenPortal.elements.register({
  selector: '.animated',
  operation: 'style',
  styles: {
    backgroundColor: 'transparent',  // -> background-color
    fontSize: '24px',                 // -> font-size
    zIndex: '50'                      // -> z-index (no conversion needed)
  }
});
```

### 1.5 Hiding/Showing Elements

**Use Case:** Toggle visibility of elements that aren't needed on TV.

```javascript
// Hide elements
TizenPortal.elements.register({
  selector: '.mobile-keyboard-hint',
  operation: 'hide'
});

// Show hidden elements
TizenPortal.elements.register({
  selector: '.desktop-only-menu',
  operation: 'show'
});

// Conditional visibility
TizenPortal.elements.register({
  selector: '.adaptive-element',
  operation: 'show',
  condition: function(element) {
    // Only show if certain criteria met
    return element.getAttribute('data-visible') === 'tv';
  }
});
```

### 1.6 Removing Elements

**Use Case:** Remove ads, unnecessary UI elements, or broken components.

```javascript
// Simple removal
TizenPortal.elements.register({
  selector: '.ad-container',
  operation: 'remove'
});

// Conditional removal
TizenPortal.elements.register({
  selector: '.promo-banner',
  operation: 'remove',
  condition: function(element) {
    return element.textContent.includes('Download our app');
  }
});

// Safety: Can't remove critical elements
TizenPortal.elements.register({
  selector: 'body',  // Will fail validation
  operation: 'remove'
});
```

---

## 2. Real-World Bundle Migrations

### 2.1 Audiobookshelf Siderail Navigation

**Before (Imperative - 35 lines):**

```javascript
function setupSiderailNavigation() {
  var siderail = document.querySelector('[role="toolbar"][aria-orientation="vertical"]');
  if (!siderail) {
    return;
  }
  
  // Make siderail focusable
  if (siderail.getAttribute('tabindex') !== '0') {
    siderail.setAttribute('data-tp-nav', 'vertical');
  }
  
  // Make all links focusable
  var links = siderail.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (!link.hasAttribute('tabindex')) {
      link.setAttribute('tabindex', '0');
    }
  }
  
  // Add spacing class
  if (!siderail.classList.contains(SPACING_CLASS)) {
    siderail.classList.add(SPACING_CLASS);
  }
  
  // Add button focusability
  var buttons = siderail.querySelectorAll('button');
  for (var i = 0; i < buttons.length; i++) {
    if (!buttons[i].hasAttribute('tabindex')) {
      buttons[i].setAttribute('tabindex', '0');
    }
  }
}

// Call on load and observe for changes
setupSiderailNavigation();
observeDOM(document.body, setupSiderailNavigation);
```

**After (Declarative - 13 lines):**

```javascript
// Siderail container
TizenPortal.elements.register({
  selector: '[role="toolbar"][aria-orientation="vertical"]',
  operation: 'focusable',
  nav: 'vertical',
  classes: [SPACING_CLASS]
});

// Siderail links
TizenPortal.elements.register({
  selector: '[role="toolbar"][aria-orientation="vertical"] a',
  operation: 'focusable'
});

// Siderail buttons
TizenPortal.elements.register({
  selector: '[role="toolbar"][aria-orientation="vertical"] button',
  operation: 'focusable'
});

// Core handles DOM observation automatically
```

**Benefits:**
- 63% code reduction (35 → 13 lines)
- No manual DOM observation needed
- No conditional checks (core handles)
- Clearer intent

### 2.2 Audiobookshelf Toolbar Positioning

**Before (CSS - 48 lines):**

```css
/* style.css */
#toolbar {
  position: fixed !important;
  top: 0 !important;
  right: 320px !important;
  left: auto !important;
  width: auto !important;
  height: 64px !important;
  z-index: 100 !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 16px !important;
  margin: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* Child spacing (gap not supported in Chrome 47) */
#toolbar > * {
  margin-right: 8px !important;
}

#toolbar > *:last-child {
  margin-right: 0 !important;
}

#toolbar,
#toolbar * {
  color: #ffffff !important;
}

#toolbar button,
#toolbar [role="button"] {
  padding: 8px 12px !important;
  min-height: 40px !important;
  white-space: nowrap !important;
  color: #ffffff !important;
  background: transparent !important;
}

#toolbar button:hover,
#toolbar button:focus,
#toolbar [role="button"]:hover,
#toolbar [role="button"]:focus {
  background: rgba(255, 255, 255, 0.1) !important;
  outline: 2px solid #4a9eff !important;
}

.tp-toolbar-container {
  display: none !important;
}
```

**After (Declarative - 30 lines CSS + 15 lines JS):**

```javascript
// main.js - Position toolbar
TizenPortal.elements.register({
  selector: '#toolbar',
  operation: 'style',
  styles: {
    position: 'fixed',
    top: '0',
    right: '320px',
    left: 'auto',
    width: 'auto',
    height: '64px',
    zIndex: '100',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    margin: '0',
    background: 'transparent',
    border: 'none',
    boxShadow: 'none'
  },
  important: true
});

// Child spacing (gap not supported in Chrome 47)
TizenPortal.elements.register({
  selector: '#toolbar > *',
  operation: 'style',
  styles: {
    marginRight: '8px'
  },
  important: true
});

TizenPortal.elements.register({
  selector: '#toolbar > *:last-child',
  operation: 'style',
  styles: {
    marginRight: '0'
  },
  important: true
});

// Hide deprecated container
TizenPortal.elements.register({
  selector: '.tp-toolbar-container',
  operation: 'hide'
});
```

```css
/* style.css - Only styles that can't be inline */
#toolbar,
#toolbar * {
  color: #ffffff !important;
}

#toolbar button,
#toolbar [role="button"] {
  padding: 8px 12px !important;
  min-height: 40px !important;
  white-space: nowrap !important;
  color: #ffffff !important;
  background: transparent !important;
}

#toolbar button:hover,
#toolbar button:focus,
#toolbar [role="button"]:hover,
#toolbar [role="button"]:focus {
  background: rgba(255, 255, 255, 0.1) !important;
  outline: 2px solid #4a9eff !important;
}
```

**Benefits:**
- More maintainable (JS vs CSS for positioning)
- Centralized element-specific styles
- CSS remains for broad selectors (hover, focus)

### 2.3 Audiobookshelf Player Controls

**Before (Imperative - 40 lines):**

```javascript
function setupPlayerControls() {
  var playerContainer = document.querySelector('#mediaPlayerContainer');
  if (!playerContainer || playerContainer.style.display === 'none') {
    return;
  }
  
  // Set navigation direction
  playerContainer.setAttribute('data-tp-nav', 'horizontal');
  
  // Add spacing
  if (!playerContainer.classList.contains(SPACING_CLASS)) {
    playerContainer.classList.add(SPACING_CLASS);
  }
  
  // Make buttons focusable
  var buttons = playerContainer.querySelectorAll('button');
  for (var i = 0; i < buttons.length; i++) {
    if (!buttons[i].hasAttribute('tabindex')) {
      buttons[i].setAttribute('tabindex', '0');
    }
  }
  
  // Make progress bar focusable
  var progressBar = playerContainer.querySelector('[role="progressbar"]');
  if (progressBar && !progressBar.hasAttribute('tabindex')) {
    progressBar.setAttribute('tabindex', '0');
  }
  
  // Make volume control focusable
  var volumeSlider = playerContainer.querySelector('input[type="range"]');
  if (volumeSlider && !volumeSlider.hasAttribute('tabindex')) {
    volumeSlider.setAttribute('tabindex', '0');
  }
}

// Setup with retry logic
var playerSetupInterval = setInterval(function() {
  setupPlayerControls();
}, 1000);
setTimeout(function() {
  clearInterval(playerSetupInterval);
}, 10000);
```

**After (Declarative - 22 lines):**

```javascript
// Player container
TizenPortal.elements.register({
  selector: '#mediaPlayerContainer',
  operation: 'focusable',
  nav: 'horizontal',
  classes: [SPACING_CLASS]
});

// Player buttons
TizenPortal.elements.register({
  selector: '#mediaPlayerContainer button',
  operation: 'focusable'
});

// Progress bar
TizenPortal.elements.register({
  selector: '#mediaPlayerContainer [role="progressbar"]',
  operation: 'focusable'
});

// Volume slider
TizenPortal.elements.register({
  selector: '#mediaPlayerContainer input[type="range"]',
  operation: 'focusable'
});

// No interval needed - core observes DOM changes
```

**Benefits:**
- 45% code reduction (40 → 22 lines)
- No manual intervals/timeouts
- No visibility checks (core handles)
- More reliable (automatic observation)

---

## 3. Advanced Patterns

### 3.1 Conditional Registration

**Use Case:** Only apply operation if certain conditions are met.

```javascript
// Register only if element meets criteria
TizenPortal.elements.register({
  selector: '.dynamic-content',
  operation: 'focusable',
  condition: function(element) {
    // Only if not already focusable
    return !element.hasAttribute('tabindex');
  }
});

// Register based on element state
TizenPortal.elements.register({
  selector: '.card',
  operation: 'class',
  classes: ['highlight'],
  condition: function(element) {
    return element.getAttribute('data-featured') === 'true';
  }
});

// Register based on viewport
TizenPortal.elements.register({
  selector: '.responsive-element',
  operation: 'show',
  condition: function(element) {
    var rect = element.getBoundingClientRect();
    return rect.width >= 1920;  // Only show on TV resolution
  }
});
```

### 3.2 Chained Operations

**Use Case:** Apply multiple operations to the same element.

```javascript
// Multiple registrations for same selector
TizenPortal.elements.register({
  selector: '.interactive-card',
  operation: 'focusable',
  nav: 'horizontal'
});

TizenPortal.elements.register({
  selector: '.interactive-card',
  operation: 'class',
  classes: ['tp-card', 'tp-spacing']
});

TizenPortal.elements.register({
  selector: '.interactive-card',
  operation: 'attribute',
  attributes: {
    'role': 'button',
    'aria-label': 'Interactive card'
  }
});

// Or use compound operation (if implemented)
TizenPortal.elements.register({
  selector: '.interactive-card',
  operations: [
    { type: 'focusable', nav: 'horizontal' },
    { type: 'class', classes: ['tp-card', 'tp-spacing'] },
    { type: 'attribute', attributes: { role: 'button' } }
  ]
});
```

### 3.3 Dynamic Selectors

**Use Case:** Select elements based on runtime conditions.

```javascript
// Use function to generate selector
TizenPortal.elements.register({
  selector: function() {
    // Return selector based on current page
    var path = window.location.pathname;
    if (path.includes('/library')) {
      return '.library-card';
    } else if (path.includes('/home')) {
      return '.home-card';
    }
    return '.generic-card';
  },
  operation: 'focusable'
});

// Select based on configuration
var bundleConfig = TizenPortal.bundles.getActive().manifest;
TizenPortal.elements.register({
  selector: bundleConfig.cardSelector || '.default-card',
  operation: 'focusable'
});
```

### 3.4 Scoped Registration

**Use Case:** Limit operations to specific containers for performance.

```javascript
// Scope to specific container
TizenPortal.elements.register({
  selector: 'button',
  operation: 'focusable',
  container: '#main-content'  // Only buttons inside #main-content
});

// Multiple containers
TizenPortal.elements.register({
  selector: '.card',
  operation: 'class',
  classes: ['tp-card'],
  containers: ['#library', '#search-results']  // Multiple scopes
});

// Nested scoping
TizenPortal.elements.register({
  selector: 'a',
  operation: 'focusable',
  container: '.navigation',
  containerScope: 'closest'  // Find closest .navigation ancestor
});
```

### 3.5 Batch Registration

**Use Case:** Register multiple similar elements at once.

```javascript
// Array of configs
var focusableSelectors = [
  '#sidebar a',
  '#header button',
  '#footer nav a',
  '.toolbar button'
];

focusableSelectors.forEach(function(selector) {
  TizenPortal.elements.register({
    selector: selector,
    operation: 'focusable'
  });
});

// Or use batch API (if implemented)
TizenPortal.elements.registerBatch([
  { selector: '#sidebar a', operation: 'focusable' },
  { selector: '#header button', operation: 'focusable' },
  { selector: '#footer nav a', operation: 'focusable' },
  { selector: '.toolbar button', operation: 'focusable' }
]);
```

---

## 4. Edge Cases and Error Handling

### 4.1 Invalid Configurations

```javascript
// Missing required field
TizenPortal.elements.register({
  operation: 'focusable'  // ERROR: selector required
});
// Console: "TizenPortal Elements: Registration failed - selector is required"

// Invalid operation
TizenPortal.elements.register({
  selector: '.card',
  operation: 'invalid-op'  // ERROR: unknown operation
});
// Console: "TizenPortal Elements: Unknown operation 'invalid-op'"

// Invalid selector
TizenPortal.elements.register({
  selector: ':::invalid:::',  // ERROR: invalid CSS selector
  operation: 'focusable'
});
// Console: "TizenPortal Elements: Invalid selector ':::invalid:::'"
```

### 4.2 No Matching Elements

```javascript
// Selector matches nothing (not an error)
TizenPortal.elements.register({
  selector: '.non-existent-class',
  operation: 'focusable'
});
// Silently succeeds, will apply if elements appear later

// Verify registration
var registrations = TizenPortal.elements.getRegistrations();
console.log('Processed elements:', registrations[0].processed);  // 0
```

### 4.3 Safety Checks

```javascript
// Can't remove critical elements
TizenPortal.elements.register({
  selector: 'body',
  operation: 'remove'
});
// Console: "TizenPortal Elements: Cannot remove critical element 'body'"

// Protected elements: html, body, head
var PROTECTED_TAGS = ['HTML', 'HEAD', 'BODY'];

// Can't break spatial navigation
TizenPortal.elements.register({
  selector: '[data-focus-group]',
  operation: 'attribute',
  attributes: { 'data-focus-group': null }  // Removing attribute
});
// Warns: "TizenPortal Elements: Removing navigation attribute may break focus"
```

### 4.4 Performance Safeguards

```javascript
// Too many elements warning
TizenPortal.elements.register({
  selector: 'div',  // Matches 1000+ elements
  operation: 'focusable'
});
// Console: "TizenPortal Elements: Selector 'div' matches 1284 elements, consider being more specific"

// Debouncing automatic
TizenPortal.elements.register({
  selector: '.dynamic',
  operation: 'focusable',
  debounce: 500  // Wait 500ms after last mutation before reprocessing
});
```

---

## 5. Performance Optimization

### 5.1 Efficient Selectors

```javascript
// ✅ Good: Specific selector
TizenPortal.elements.register({
  selector: '#sidebar .navigation-link',
  operation: 'focusable'
});

// ❌ Bad: Too broad
TizenPortal.elements.register({
  selector: 'a',  // Matches ALL links on page
  operation: 'focusable'
});

// ✅ Better: Scope to container
TizenPortal.elements.register({
  selector: 'a',
  operation: 'focusable',
  container: '#main-navigation'
});
```

### 5.2 Batch Processing

```javascript
// ✅ Good: Register once, matches many
TizenPortal.elements.register({
  selector: '.card',
  operation: 'focusable'
});

// ❌ Bad: Register many times
var cards = document.querySelectorAll('.card');
cards.forEach(function(card) {
  // Don't do this - let core handle it
  TizenPortal.elements.register({
    selector: '#' + card.id,
    operation: 'focusable'
  });
});
```

### 5.3 Conditional Processing

```javascript
// Only process if needed
TizenPortal.elements.register({
  selector: '.conditional',
  operation: 'focusable',
  condition: function(element) {
    // Skip if already processed
    if (element.hasAttribute('data-tp-processed')) {
      return false;
    }
    return true;
  }
});

// Process immediately vs deferred
TizenPortal.elements.register({
  selector: '.critical',
  operation: 'focusable',
  immediate: true  // Process now, don't wait for debounce
});

TizenPortal.elements.register({
  selector: '.non-critical',
  operation: 'class',
  classes: ['styled'],
  immediate: false,  // Wait for debounce window
  debounce: 500
});
```

---

## 6. Testing Examples

### 6.1 Unit Test Structure

> **Note:** The following test examples are pseudocode illustrations. TizenPortal currently has no automated test runner - all testing is done manually on Tizen hardware. These examples show what a test structure *could* look like if automated testing were implemented.

```javascript
// Test registration API
describe('TizenPortal.elements.register', function() {
  it('should accept valid configuration', function() {
    var result = TizenPortal.elements.register({
      selector: '.test',
      operation: 'focusable'
    });
    expect(result).toBe(true);
  });
  
  it('should reject missing selector', function() {
    var result = TizenPortal.elements.register({
      operation: 'focusable'
    });
    expect(result).toBe(false);
  });
  
  it('should store registration', function() {
    TizenPortal.elements.register({
      selector: '.test',
      operation: 'focusable'
    });
    var regs = TizenPortal.elements.getRegistrations();
    expect(regs.length).toBeGreaterThan(0);
  });
});

// Test operations
describe('focusable operation', function() {
  beforeEach(function() {
    document.body.innerHTML = '<div class="test"></div>';
  });
  
  it('should add tabindex', function() {
    TizenPortal.elements.register({
      selector: '.test',
      operation: 'focusable'
    });
    TizenPortal.elements.process();
    
    var element = document.querySelector('.test');
    expect(element.getAttribute('tabindex')).toBe('0');
  });
  
  it('should add navigation attribute', function() {
    TizenPortal.elements.register({
      selector: '.test',
      operation: 'focusable',
      nav: 'vertical'
    });
    TizenPortal.elements.process();
    
    var element = document.querySelector('.test');
    expect(element.getAttribute('data-tp-nav')).toBe('vertical');
  });
});
```

### 6.2 Integration Test on Tizen

```javascript
// Manual test script for Tizen hardware
function testElementRegistration() {
  console.log('=== Element Registration Test Suite ===');
  
  // Test 1: Basic focusable
  console.log('Test 1: Basic focusable...');
  TizenPortal.elements.register({
    selector: '.test-card',
    operation: 'focusable'
  });
  setTimeout(function() {
    var cards = document.querySelectorAll('.test-card');
    var allFocusable = true;
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute('tabindex') !== '0') {
        allFocusable = false;
      }
    }
    console.log('Result:', allFocusable ? 'PASS' : 'FAIL');
  }, 1000);
  
  // Test 2: Style application
  console.log('Test 2: Style application...');
  TizenPortal.elements.register({
    selector: '#test-toolbar',
    operation: 'style',
    styles: { position: 'fixed', top: '0' },
    important: true
  });
  setTimeout(function() {
    var toolbar = document.getElementById('test-toolbar');
    var hasStyles = toolbar.style.position === 'fixed' && toolbar.style.top === '0px';
    console.log('Result:', hasStyles ? 'PASS' : 'FAIL');
  }, 1000);
  
  // Test 3: Dynamic content
  console.log('Test 3: Dynamic content observation...');
  TizenPortal.elements.register({
    selector: '.dynamic-card',
    operation: 'focusable'
  });
  setTimeout(function() {
    var newCard = document.createElement('div');
    newCard.className = 'dynamic-card';
    document.body.appendChild(newCard);
    
    setTimeout(function() {
      var isFocusable = newCard.getAttribute('tabindex') === '0';
      console.log('Result:', isFocusable ? 'PASS' : 'FAIL');
    }, 2000);
  }, 1000);
  
  console.log('=== Tests complete ===');
}

// Run on Tizen
testElementRegistration();
```

### 6.3 Performance Benchmark

```javascript
// Benchmark element registration performance
function benchmarkElementRegistration() {
  console.log('=== Performance Benchmark ===');
  
  // Setup test DOM
  var container = document.createElement('div');
  for (var i = 0; i < 100; i++) {
    var card = document.createElement('div');
    card.className = 'bench-card';
    card.id = 'card-' + i;
    container.appendChild(card);
  }
  document.body.appendChild(container);
  
  // Benchmark registration
  var start = performance.now();
  TizenPortal.elements.register({
    selector: '.bench-card',
    operation: 'focusable'
  });
  var regTime = performance.now() - start;
  console.log('Registration time:', regTime.toFixed(2), 'ms');
  
  // Benchmark processing
  start = performance.now();
  TizenPortal.elements.process();
  var processTime = performance.now() - start;
  console.log('Processing 100 elements:', processTime.toFixed(2), 'ms');
  
  // Benchmark mutation observation
  start = performance.now();
  var newCard = document.createElement('div');
  newCard.className = 'bench-card';
  container.appendChild(newCard);
  setTimeout(function() {
    var mutationTime = performance.now() - start;
    console.log('Mutation detection + processing:', mutationTime.toFixed(2), 'ms');
    
    // Cleanup
    document.body.removeChild(container);
    TizenPortal.elements.clear();
  }, 200);
  
  console.log('=== Benchmark complete ===');
}

// Run benchmark
benchmarkElementRegistration();
```

---

## Conclusion

These examples demonstrate how the proposed element registration API would work in practice. The declarative approach:

1. **Reduces code complexity** by 40-60%
2. **Eliminates common bugs** (timing, race conditions)
3. **Makes intent clearer** through configuration
4. **Improves maintainability** via centralized processing
5. **Handles edge cases** automatically

The API is designed to be:
- **Intuitive** for bundle authors
- **Powerful** enough for complex use cases
- **Safe** with built-in validation and guards
- **Performant** through batching and debouncing

---

**Next Steps:**
1. Review examples with stakeholders
2. Refine API based on feedback
3. Implement MVP operations
4. Test on real Tizen hardware
5. Migrate Audiobookshelf bundle as proof-of-concept
