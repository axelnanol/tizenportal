# Bundle Navigation Guide

This guide explains how to implement navigation in TizenPortal bundles using standard methods.

## Table of Contents

1. [Overview](#overview)
2. [Standard Navigation Helpers](#standard-navigation-helpers)
3. [Best Practices](#best-practices)
4. [Common Patterns](#common-patterns)
5. [Migration from Manual Focus](#migration-from-manual-focus)
6. [Backward Compatibility](#backward-compatibility)

---

## Overview

TizenPortal provides standard navigation helpers in `navigation/helpers.js` that:
- ✅ Work with the existing spatial-navigation polyfill
- ✅ Support the new spatial-navigation library
- ✅ Provide error handling and success feedback
- ✅ Reduce code duplication across bundles

**Always use these helpers instead of:**
- Manual `.focus()` calls
- Custom navigation logic
- Direct keyboard event dispatch

---

## Standard Navigation Helpers

### Import Navigation Helpers

```javascript
import {
  navigate,
  focusElement,
  focusFirst,
  focusLast,
  getFocusableElements,
  focusRelative,
  focusNext,
  focusPrevious,
  getCurrentFocus,
  scrollIntoViewIfNeeded,
} from '../../navigation/helpers.js';
```

### Core Functions

#### `navigate(direction)`

Programmatically navigate in a direction. Uses spatial navigation automatically.

```javascript
// Navigate right (triggers spatial navigation)
navigate('right');  // 'left', 'up', 'right', 'down'
```

**Returns:** `boolean` - True if navigation succeeded

**Use when:**
- Implementing custom keyboard handlers
- Programmatically moving focus between regions
- Wrapping spatial navigation behavior

**Don't use when:**
- You can let spatial navigation handle it automatically
- Moving focus within a constrained list (use `focusRelative` instead)

---

#### `focusElement(element)`

Safely focus an element with error handling.

```javascript
var button = document.querySelector('.my-button');
if (focusElement(button)) {
  console.log('Focus succeeded');
}
```

**Returns:** `boolean` - True if element is now focused

**Use when:**
- You need to explicitly focus a specific element
- Jumping between UI regions
- Implementing custom focus logic

**Replaces:**
```javascript
// ❌ Old way
element.focus();

// ✅ New way
focusElement(element);
```

---

#### `focusFirst(container)` / `focusLast(container)`

Focus the first or last focusable element in a container.

```javascript
var menu = document.querySelector('#menu');
focusFirst(menu);  // Focus first button/link
focusLast(menu);   // Focus last button/link
```

**Returns:** `boolean` - True if an element was focused

**Use when:**
- Entering a new UI region
- Initializing focus on page load
- Implementing "jump to start/end" behavior

---

#### `getFocusableElements(container)`

Get all focusable elements in a container.

```javascript
var menu = document.querySelector('#menu');
var elements = getFocusableElements(menu);
console.log('Found ' + elements.length + ' focusable elements');
```

**Returns:** `Array<Element>` - Array of focusable elements

**Use when:**
- Implementing custom navigation within a container
- Need to know what's focusable
- Building a list for `focusRelative`

---

#### `focusRelative(elements, current, offset)`

Navigate to the next or previous element in a list.

```javascript
var links = getFocusableElements(siderail);
var current = document.activeElement;

// Move down (+1) or up (-1)
focusRelative(links, current, 1);   // Next
focusRelative(links, current, -1);  // Previous
```

**Returns:** `boolean` - True if focus changed

**Use when:**
- Implementing vertical/horizontal navigation in constrained containers
- Need explicit control over list navigation
- Spatial navigation would navigate outside the container

**Example:** Siderail vertical navigation
```javascript
if (keyCode === KEYS.UP || keyCode === KEYS.DOWN) {
  var siderail = document.querySelector('#siderail');
  var links = getFocusableElements(siderail);
  var offset = keyCode === KEYS.UP ? -1 : 1;
  
  if (focusRelative(links, active, offset)) {
    return true; // Consumed
  }
}
```

---

#### `focusNext(container, current)` / `focusPrevious(container, current)`

Convenience wrappers for `focusRelative`.

```javascript
var menu = document.querySelector('#menu');
var current = document.activeElement;

focusNext(menu, current);      // Move to next element
focusPrevious(menu, current);  // Move to previous element
```

---

## Best Practices

### ✅ DO

**1. Use navigation helpers instead of manual focus:**

```javascript
// ✅ Good
focusElement(firstCard);

// ❌ Bad
firstCard.focus();
```

**2. Use focusRelative for constrained navigation:**

```javascript
// ✅ Good - Clean and maintainable
var links = getFocusableElements(siderail);
focusRelative(links, active, offset);

// ❌ Bad - Manual index tracking
var links = document.querySelectorAll('a');
var currentIndex = -1;
for (var i = 0; i < links.length; i++) {
  if (links[i] === active) currentIndex = i;
}
var nextIndex = Math.max(0, currentIndex + offset);
links[nextIndex].focus();
```

**3. Let spatial navigation work when possible:**

```javascript
// ✅ Good - Let spatial nav handle it
// (No custom code needed for standard grid navigation)

// ❌ Bad - Reimplementing spatial navigation
if (keyCode === KEYS.RIGHT) {
  var cards = document.querySelectorAll('.card');
  // ... manual distance calculation ...
}
```

**4. Check return values:**

```javascript
// ✅ Good
if (focusElement(nextElement)) {
  return true; // Consumed
}
// Fall through to default handling

// ❌ Bad
focusElement(nextElement);
return true; // Always consume, even if focus failed
```

---

### ❌ DON'T

**1. Don't reimplement spatial navigation:**

```javascript
// ❌ Bad - Custom spatial nav
function findRightElement(current) {
  var candidates = document.querySelectorAll('.card');
  // ... manual geometry calculations ...
}

// ✅ Good - Use navigate() or let spatial nav handle it
// (Nothing needed - spatial nav already does this)
```

**2. Don't use raw .focus() in bundles:**

```javascript
// ❌ Bad
element.focus();

// ✅ Good
focusElement(element);
```

**3. Don't forget error handling:**

```javascript
// ❌ Bad
var element = document.querySelector('.may-not-exist');
element.focus(); // Crashes if null

// ✅ Good
var element = document.querySelector('.may-not-exist');
focusElement(element); // Returns false if null
```

---

## Common Patterns

### Pattern 1: Constrained Vertical Navigation

**Use case:** Vertical list where you don't want to exit the container

```javascript
onKeyDown: function(event) {
  var active = document.activeElement;
  var keyCode = event.keyCode;
  
  // Check if we're in the siderail
  if (this.isInSiderail(active)) {
    if (keyCode === KEYS.UP || keyCode === KEYS.DOWN) {
      var siderail = document.querySelector(SELECTORS.siderail);
      var links = getFocusableElements(siderail);
      var offset = keyCode === KEYS.UP ? -1 : 1;
      
      if (focusRelative(links, active, offset)) {
        return true; // Consumed
      }
    }
  }
  
  return false; // Let default handling proceed
}
```

### Pattern 2: Region Transitions

**Use case:** Jump between UI regions (siderail ↔ content)

```javascript
onKeyDown: function(event) {
  var active = document.activeElement;
  var keyCode = event.keyCode;
  
  // LEFT from content → siderail
  if (this.isInContent(active) && keyCode === KEYS.LEFT) {
    if (this.isAtLeftEdge(active)) {
      var siderail = document.querySelector(SELECTORS.siderail);
      if (focusFirst(siderail)) {
        return true; // Consumed
      }
    }
  }
  
  // RIGHT from siderail → content
  if (this.isInSiderail(active) && keyCode === KEYS.RIGHT) {
    var firstCard = document.querySelector(SELECTORS.firstCard);
    if (focusElement(firstCard)) {
      return true; // Consumed
    }
  }
  
  return false;
}
```

### Pattern 3: Modal Focus Trapping

**Use case:** Keep focus inside a modal dialog

```javascript
onKeyDown: function(event) {
  var modal = document.querySelector('.modal.active');
  if (!modal) return false;
  
  var active = document.activeElement;
  var keyCode = event.keyCode;
  
  // Don't let focus escape modal
  if (!modal.contains(active)) {
    focusFirst(modal);
    return true;
  }
  
  // Wrap focus at edges
  var focusables = getFocusableElements(modal);
  if (focusables.length === 0) return false;
  
  var first = focusables[0];
  var last = focusables[focusables.length - 1];
  
  // At first element, going up → wrap to last
  if (active === first && keyCode === KEYS.UP) {
    focusElement(last);
    return true;
  }
  
  // At last element, going down → wrap to first
  if (active === last && keyCode === KEYS.DOWN) {
    focusElement(first);
    return true;
  }
  
  return false;
}
```

### Pattern 4: Initial Focus

**Use case:** Set focus when page loads or content changes

```javascript
onAfterLoad: function(win, card) {
  // Wait for Vue/React to render
  setTimeout(function() {
    var container = document.querySelector('#main-content');
    if (container) {
      focusFirst(container);
    }
  }, 100);
}
```

---

## Migration from Manual Focus

### Before (Manual Focus Management)

```javascript
// ❌ Old audiobookshelf code
if (keyCode === KEYS.UP || keyCode === KEYS.DOWN) {
  var links = document.querySelectorAll(SELECTORS.siderailNav);
  if (links.length > 0) {
    var currentIndex = -1;
    for (var i = 0; i < links.length; i++) {
      if (links[i] === active) {
        currentIndex = i;
        break;
      }
    }
    
    if (currentIndex !== -1) {
      var nextIndex;
      if (keyCode === KEYS.UP) {
        nextIndex = Math.max(0, currentIndex - 1);
      } else {
        nextIndex = Math.min(links.length - 1, currentIndex + 1);
      }
      
      if (nextIndex !== currentIndex) {
        links[nextIndex].focus();
      }
      return true;
    }
  }
}
```

### After (Standard Helpers)

```javascript
// ✅ New audiobookshelf code
if (keyCode === KEYS.UP || keyCode === KEYS.DOWN) {
  var siderail = document.querySelector(SELECTORS.siderail);
  if (siderail) {
    var links = getFocusableElements(siderail);
    var offset = keyCode === KEYS.UP ? -1 : 1;
    
    if (focusRelative(links, active, offset)) {
      return true; // Consumed
    }
  }
}
```

**Benefits:**
- 17 lines → 7 lines (59% reduction)
- No manual index tracking
- Automatic bounds checking
- Works with any focusable elements (not just links)
- Returns boolean for proper event handling

---

## Backward Compatibility

The `navigate()` helper provides three-tier fallback:

```javascript
export function navigate(direction) {
  // 1. Try spatial-navigation polyfill (current system)
  if (window.navigate && typeof window.navigate === 'function') {
    window.navigate(direction);
    return true;
  }
  
  // 2. Try new spatial-navigation library (future)
  if (window.SpatialNavigation && typeof window.SpatialNavigation.navigate === 'function') {
    return window.SpatialNavigation.navigate(direction);
  }
  
  // 3. Fallback to keyboard events
  var keyCode = /* ... */;
  var event = new KeyboardEvent('keydown', { keyCode: keyCode, bubbles: true });
  document.activeElement.dispatchEvent(event);
  return true;
}
```

This means:
- ✅ Works with current spatial-navigation polyfill
- ✅ Works with new spatial-navigation library
- ✅ Works with no spatial navigation at all (fallback)
- ✅ Bundles don't need to change when we upgrade

---

## Testing Your Bundle

### Manual Testing Checklist

- [ ] All focusable elements can be reached
- [ ] Navigation feels natural and predictable
- [ ] No focus traps (can always exit regions)
- [ ] Keyboard shortcuts work as expected
- [ ] Modal dialogs trap focus correctly
- [ ] Focus is visible at all times

### Debug Logging

```javascript
// Add debug logging to verify navigation
onKeyDown: function(event) {
  console.log('Key pressed:', event.keyCode);
  console.log('Current focus:', document.activeElement);
  
  // ... your navigation logic ...
  
  var success = focusElement(nextElement);
  console.log('Focus changed:', success);
  console.log('New focus:', document.activeElement);
}
```

---

## Summary

**Key Takeaways:**

1. ✅ **Always use navigation helpers** from `navigation/helpers.js`
2. ✅ **Use `focusRelative` for constrained lists** (siderails, menus)
3. ✅ **Let spatial navigation handle grids** (don't reimplement)
4. ✅ **Check return values** to handle focus failures
5. ✅ **Avoid manual `.focus()` calls** in bundles

**Quick Reference:**

| Task | Function |
|------|----------|
| Navigate spatially | `navigate('right')` |
| Focus specific element | `focusElement(el)` |
| Focus first in container | `focusFirst(container)` |
| Navigate in list | `focusRelative(list, current, ±1)` |
| Get focusable elements | `getFocusableElements(container)` |

---

For more examples, see:
- `bundles/audiobookshelf/main.js` - Complete bundle using standard navigation
- `navigation/helpers.js` - Source code and JSDoc comments
- `docs/Api-Reference.md` - Full TizenPortal API documentation
