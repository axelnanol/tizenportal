# Focus Transitions Guide

TizenPortal includes smooth focus transition effects inspired by Samsung's Tizen Browser. This feature provides polished, TV-style animations that evoke the direction of movement and enhance the user experience.

## Overview

Focus transitions add subtle animations when navigating between UI elements, making the interface feel more responsive and providing visual feedback about the direction of movement.

### Key Features

- **Three Transition Styles**: slide, scale, glow
- **Directional Awareness**: Slide mode detects and animates movement direction
- **Configurable Speed**: Fast (150ms), medium (250ms), or slow (400ms)
- **Lightweight**: Pure CSS animations with minimal JavaScript
- **Compatible**: Works with all navigation modes (directional, geometric, polyfill)
- **User Controllable**: Fully configurable via preferences UI

## Transition Modes

### Slide (Directional) - Preferred

The **slide** mode is the most sophisticated transition, providing directional feedback that matches the user's navigation.

**How it works:**
1. System tracks the previous focused element
2. When focus changes, calculates the direction of movement
3. Applies a directional animation (left, right, up, or down)
4. Element slides into focus from the direction it came from

**Visual effect:**
- Moving right: New element slides in from the left (-8px → 0px)
- Moving left: New element slides in from the right (+8px → 0px)
- Moving down: New element slides in from above (-8px → 0px)
- Moving up: New element slides in from below (+8px → 0px)
- Opacity fades in (0.6 → 1.0) during the slide

**Best for:**
- Grid layouts
- List navigation
- Card-based interfaces
- Any scenario with clear directional movement

**Example:**
```
[Card 1]  →  [Card 2]  →  [Card 3]
   ↑
 focused

User presses RIGHT
   ↓

[Card 1]     [Card 2]  →  [Card 3]
             ←─────────↑
          slides from left
             (focused)
```

### Scale (Grow)

The **scale** mode provides a simple growing effect that draws attention to the newly focused element.

**Visual effect:**
- Element scales from 95% to 100% size
- Opacity fades in (0.7 → 1.0)
- No directional component

**Best for:**
- Simple interfaces
- When directional feedback isn't important
- Lower-powered devices (simpler animation)

### Glow (Pulse)

The **glow** mode creates a pulsing shadow effect around the focused element.

**Visual effect:**
- Blue shadow radiates outward from the element
- Shadow intensity: 0 → 0.6 → 0 (pulse effect)
- 20px blur radius at peak

**Best for:**
- High-contrast interfaces
- When you want stronger visual feedback
- Accessibility (more noticeable transitions)

## Speed Options

### Fast (150ms)
- Quick, snappy transitions
- Minimal animation time
- Best for responsive interfaces
- May feel abrupt on complex layouts

### Medium (250ms) - Default
- Balanced transition speed
- Smooth without feeling slow
- Works well for most interfaces
- Recommended default

### Slow (400ms)
- Leisurely, relaxed transitions
- More dramatic effect
- Best for content-focused interfaces
- May feel sluggish for rapid navigation

## Configuration

### Global Preferences

Focus transitions can be configured globally via the Preferences UI:

1. Open Preferences (Yellow button on portal)
2. Navigate to **Site Features** section
3. Find **Focus Transition Style** dropdown
   - Options: Slide (Directional), Scale (Grow), Glow (Pulse), Off
4. Find **Focus Transition Speed** dropdown
   - Options: Fast (150ms), Medium (250ms), Slow (400ms)
5. Changes auto-save and apply immediately

### Programmatic Configuration

```javascript
// Via TizenPortal.config API
TizenPortal.config.set('tp_features', {
  focusTransitions: true,           // Enable/disable
  focusTransitionMode: 'slide',     // 'slide', 'scale', 'glow', or 'off'
  focusTransitionSpeed: 'medium',   // 'fast', 'medium', or 'slow'
});
```

### Bundle-Level Override

Bundles can apply custom transition settings:

```javascript
export default {
  name: 'my-bundle',
  
  onActivate: function(win, card) {
    // Apply custom transition settings for this bundle
    if (win.TizenPortal && win.TizenPortal.features) {
      var doc = win.document;
      var focusTransitions = win.TizenPortal.features.focusTransitions;
      
      if (focusTransitions) {
        // Apply custom mode and speed
        focusTransitions.apply(doc, 'scale', 'fast');
      }
    }
  },
};
```

## Technical Implementation

### Architecture

The focus transitions feature is implemented as a standard TizenPortal feature in `features/focus-transitions.js`.

**Components:**
1. **CSS Generator**: Creates transition CSS based on mode and speed
2. **Direction Calculator**: Determines movement direction between elements
3. **Focus Listener**: Tracks focus changes and applies direction attributes
4. **Feature Interface**: Standard apply/remove/update methods

### CSS Structure

For **slide** mode, the system:
1. Injects keyframe animations for all four directions
2. Listens for `focusin` events
3. Calculates direction from previous element
4. Sets `data-tp-focus-from` attribute on the focused element
5. CSS animations automatically trigger based on the attribute

```css
/* Base transition */
:focus {
  transition: outline 0ms, transform 250ms ease-out, 
              opacity 250ms ease-out !important;
}

/* Directional animations */
[data-tp-focus-from="left"]:focus {
  animation: tp-slide-from-left 250ms ease-out;
}

@keyframes tp-slide-from-left {
  from {
    transform: translateX(-8px);
    opacity: 0.6;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Direction Detection Algorithm

```javascript
calculateDirection: function(prevEl, currEl) {
  // Get bounding rectangles
  var prevRect = prevEl.getBoundingClientRect();
  var currRect = currEl.getBoundingClientRect();
  
  // Calculate center points
  var prevX = prevRect.left + prevRect.width / 2;
  var prevY = prevRect.top + prevRect.height / 2;
  var currX = currRect.left + currRect.width / 2;
  var currY = currRect.top + currRect.height / 2;
  
  // Calculate deltas
  var deltaX = currX - prevX;
  var deltaY = currY - prevY;
  
  // Primary direction based on larger delta
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? 'right' : 'left';  // Horizontal
  } else {
    return deltaY > 0 ? 'bottom' : 'top';  // Vertical
  }
}
```

### Performance Considerations

**Why CSS animations?**
- Hardware accelerated on modern browsers
- Minimal JavaScript overhead
- Smooth 60fps animations
- No layout thrashing
- Works on older Tizen devices (Chrome 47+)

**Memory usage:**
- One event listener per document
- One previousElement reference
- CSS injected once per document
- Minimal overhead (~8KB CSS)

**CPU usage:**
- Direction calculation: ~0.1ms per focus change
- CSS animations: GPU accelerated
- No impact on navigation performance

## Best Practices

### When to Use Each Mode

**Slide (Directional)**
- ✅ Grid layouts (cards, thumbnails)
- ✅ List navigation (vertical/horizontal)
- ✅ Menu systems
- ✅ Any regular layout with clear directions
- ❌ Irregular layouts (may look odd)
- ❌ Overlapping elements

**Scale (Grow)**
- ✅ Simple layouts
- ✅ Sparse interfaces
- ✅ Buttons and controls
- ✅ When direction doesn't matter
- ❌ Dense layouts (animation may overlap)

**Glow (Pulse)**
- ✅ High contrast interfaces
- ✅ Accessibility needs
- ✅ Drawing attention to focus
- ❌ Subtle interfaces (too dramatic)

### Speed Selection

**Fast (150ms)**
- For experienced users
- Responsive applications
- Rapid navigation scenarios

**Medium (250ms)** - Default
- Balanced for all users
- Works well universally
- Recommended starting point

**Slow (400ms)**
- Content-heavy sites
- Leisurely browsing
- Dramatic effect desired

### Disabling Transitions

Users can disable transitions by:
1. Setting **Focus Transition Style** to **Off** in preferences
2. Or setting `focusTransitionMode: 'off'` programmatically

This may be desirable for:
- Maximum performance on older devices
- Users who prefer instant feedback
- Testing and debugging
- Accessibility (some users prefer no motion)

## Troubleshooting

### Transitions Not Appearing

**Check configuration:**
```javascript
var config = TizenPortal.config.get('tp_features');
console.log('Transitions enabled:', config.focusTransitions);
console.log('Mode:', config.focusTransitionMode);
console.log('Speed:', config.focusTransitionSpeed);
```

**Verify feature is applied:**
- Open browser DevTools
- Check for `<style id="tp-focus-transitions">` in document head
- Verify CSS is present

**Check for conflicts:**
- Other CSS may override transitions
- `!important` rules may interfere
- Bundle styles may conflict

### Wrong Direction Detection

Direction detection relies on element positions. Issues may occur with:
- Elements moving during animations
- Absolutely positioned elements
- Overlapping elements
- Viewport scrolling

**Solution:** Consider using scale or glow mode for irregular layouts.

### Performance Issues

If transitions cause performance problems:
1. Switch to **Fast** speed (150ms)
2. Use **Scale** mode (simpler animation)
3. Disable transitions (set mode to **Off**)

### Browser Compatibility

Focus transitions work on:
- ✅ Tizen TVs (Chrome 47+)
- ✅ All modern browsers
- ✅ Mobile devices
- ✅ Desktop browsers

CSS animations are widely supported. Graceful degradation occurs on very old browsers (no transition, instant focus change).

## Examples

### Example 1: Grid of Cards

For a grid of content cards (Netflix-style):

**Recommended:**
- Mode: **Slide (Directional)**
- Speed: **Medium (250ms)**
- Why: Clear directional movement, balanced speed

### Example 2: Settings Menu

For a vertical list of settings:

**Recommended:**
- Mode: **Slide (Directional)**
- Speed: **Fast (150ms)**
- Why: Quick navigation, clear up/down movement

### Example 3: Media Player Controls

For playback controls (play, pause, next, etc.):

**Recommended:**
- Mode: **Scale (Grow)**
- Speed: **Fast (150ms)**
- Why: Simple controls, no directional context needed

### Example 4: Accessibility Mode

For users with visual impairments:

**Recommended:**
- Mode: **Glow (Pulse)**
- Speed: **Slow (400ms)**
- Why: Highly visible, dramatic effect, easy to track

## API Reference

### Feature Object

The `focusTransitions` feature object is available via:

```javascript
window.TizenPortal.features.focusTransitions
```

**Methods:**

#### `getCSS(mode, speed)`
Generate CSS for the specified mode and speed.

- **Parameters:**
  - `mode` (string): 'slide', 'scale', 'glow', or 'off'
  - `speed` (string): 'fast', 'medium', or 'slow'
- **Returns:** (string) CSS text

#### `calculateDirection(prevEl, currEl)`
Calculate movement direction between two elements.

- **Parameters:**
  - `prevEl` (Element): Previous focused element
  - `currEl` (Element): Current focused element
- **Returns:** (string|null) 'left', 'right', 'top', 'bottom', or null

#### `apply(doc, mode, speed)`
Apply transitions to a document.

- **Parameters:**
  - `doc` (Document): Target document
  - `mode` (string): Transition mode
  - `speed` (string): Transition speed

#### `remove(doc)`
Remove transitions from a document.

- **Parameters:**
  - `doc` (Document): Target document

#### `update(doc, mode, speed)`
Update transition settings (convenience method, calls apply).

- **Parameters:**
  - `doc` (Document): Target document
  - `mode` (string): New mode
  - `speed` (string): New speed

## Future Enhancements

Possible future improvements:

1. **Additional Modes**
   - Fade mode (opacity only)
   - Bounce mode (elastic effect)
   - Rotate mode (subtle rotation)

2. **Advanced Direction Detection**
   - Account for scrolling
   - Better handling of overlapping elements
   - Grid-aware direction (row/column context)

3. **Custom Timing Functions**
   - User-defined easing curves
   - Per-element timing overrides

4. **Accessibility**
   - Respect `prefers-reduced-motion` media query
   - High contrast mode integration
   - Screen reader announcements

## Conclusion

Focus transitions provide a polished, professional feel to TizenPortal interfaces. The **slide** mode's directional awareness creates intuitive visual feedback, while alternative modes offer flexibility for different use cases.

The feature is:
- ✅ Lightweight (pure CSS)
- ✅ Fast (GPU accelerated)
- ✅ Configurable (3 modes, 3 speeds)
- ✅ Compatible (all browsers)
- ✅ User controllable (preferences UI)

Experiment with different modes and speeds to find what works best for your content!
