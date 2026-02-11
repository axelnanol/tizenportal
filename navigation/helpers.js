/**
 * TizenPortal Navigation Helpers
 * 
 * Standard utilities for spatial navigation in bundles.
 * Provides backward compatibility with the spatial-navigation-polyfill
 * while enabling migration to the new spatial-navigation library.
 * 
 * Best Practices for Bundles:
 * - Use navigate() for programmatic directional navigation
 * - Use focusFirst() / focusLast() for container focus
 * - Avoid manual .focus() calls where navigate() would work
 * - Use focusElement() wrapper for explicit focus changes
 */

/**
 * Navigation enabled state
 */
var navigationEnabled = true;

/**
 * Programmatically navigate in a direction
 * 
 * This function provides backward compatibility:
 * 1. Uses window.navigate() if available (spatial-navigation-polyfill)
 * 2. Uses SpatialNavigation.navigate() if available (new library)
 * 3. Falls back to dispatching keyboard events
 * 
 * @param {string} direction - 'left', 'up', 'right', 'down'
 * @returns {boolean} True if navigation succeeded
 */
export function navigate(direction) {
  if (!navigationEnabled) return false;

  // Option 1: Use the spatial navigation polyfill (backward compatibility)
  if (window.navigate && typeof window.navigate === 'function') {
    try {
      window.navigate(direction);
      return true;
    } catch (err) {
      console.warn('TizenPortal [Navigation]: Error using window.navigate:', err);
    }
  }

  // Option 2: Use the new spatial navigation library if configured
  if (window.SpatialNavigation && typeof window.SpatialNavigation.navigate === 'function') {
    try {
      return window.SpatialNavigation.navigate(direction);
    } catch (err) {
      console.warn('TizenPortal [Navigation]: Error using SpatialNavigation.navigate:', err);
    }
  }

  // Option 3: Fallback - dispatch keyboard event
  var keyCode;
  switch (direction) {
    case 'left': keyCode = 37; break;
    case 'up': keyCode = 38; break;
    case 'right': keyCode = 39; break;
    case 'down': keyCode = 40; break;
    default: return false;
  }

  try {
    var event = new KeyboardEvent('keydown', {
      keyCode: keyCode,
      bubbles: true,
    });

    var active = document.activeElement || document.body;
    active.dispatchEvent(event);
    return true;
  } catch (err) {
    console.warn('TizenPortal [Navigation]: Error dispatching keyboard event:', err);
    return false;
  }
}

/**
 * Safely focus an element with error handling
 * 
 * Use this instead of manual .focus() calls for consistency.
 * 
 * @param {Element} element - Element to focus
 * @returns {boolean} True if focus succeeded
 */
export function focusElement(element) {
  if (!element) return false;
  
  try {
    element.focus();
    return document.activeElement === element;
  } catch (err) {
    console.warn('TizenPortal [Navigation]: Error focusing element:', err);
    return false;
  }
}

/**
 * Focus the first focusable element in a container
 * 
 * @param {Element} container - Container element
 * @returns {boolean} True if an element was focused
 */
export function focusFirst(container) {
  if (!container) return false;

  var focusables = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  if (focusables.length > 0) {
    return focusElement(focusables[0]);
  }
  
  return false;
}

/**
 * Focus the last focusable element in a container
 * 
 * @param {Element} container - Container element
 * @returns {boolean} True if an element was focused
 */
export function focusLast(container) {
  if (!container) return false;

  var focusables = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  if (focusables.length > 0) {
    return focusElement(focusables[focusables.length - 1]);
  }
  
  return false;
}

/**
 * Find all focusable elements in a container
 * 
 * @param {Element} container - Container element
 * @returns {Array<Element>} Array of focusable elements
 */
export function getFocusableElements(container) {
  if (!container) return [];
  
  var selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var elements = container.querySelectorAll(selector);
  
  return Array.prototype.slice.call(elements);
}

/**
 * Focus the next element in a list
 * 
 * Useful for custom vertical/horizontal navigation within constrained containers.
 * 
 * @param {Array<Element>} elements - Array of elements
 * @param {Element} current - Currently focused element
 * @param {number} offset - Offset (+1 for next, -1 for previous)
 * @returns {boolean} True if an element was focused
 */
export function focusRelative(elements, current, offset) {
  if (!elements || elements.length === 0) return false;
  
  var currentIndex = elements.indexOf(current);
  if (currentIndex === -1) return false;
  
  var nextIndex = currentIndex + offset;
  
  // Clamp to valid range
  if (nextIndex < 0) nextIndex = 0;
  if (nextIndex >= elements.length) nextIndex = elements.length - 1;
  
  // Only focus if index actually changed
  if (nextIndex !== currentIndex) {
    return focusElement(elements[nextIndex]);
  }
  
  return false;
}

/**
 * Focus the next element in a container
 * 
 * @param {Element} container - Container element
 * @param {Element} current - Currently focused element
 * @returns {boolean} True if an element was focused
 */
export function focusNext(container, current) {
  var elements = getFocusableElements(container);
  return focusRelative(elements, current, 1);
}

/**
 * Focus the previous element in a container
 * 
 * @param {Element} container - Container element
 * @param {Element} current - Currently focused element
 * @returns {boolean} True if an element was focused
 */
export function focusPrevious(container, current) {
  var elements = getFocusableElements(container);
  return focusRelative(elements, current, -1);
}

/**
 * Get currently focused element
 * @returns {Element|null}
 */
export function getCurrentFocus() {
  return document.activeElement;
}

/**
 * Enable or disable navigation
 * @param {boolean} enabled
 */
export function setNavigationEnabled(enabled) {
  navigationEnabled = !!enabled;
}

/**
 * Check if navigation is enabled
 * @returns {boolean}
 */
export function isNavigationEnabled() {
  return navigationEnabled;
}

/**
 * Scroll element into view if needed
 * @param {Element} element
 * @param {Object} options
 */
export function scrollIntoViewIfNeeded(element, options) {
  if (!element) return;

  options = options || {};
  var behavior = options.behavior || 'smooth';
  var block = options.block || 'nearest';
  var inline = options.inline || 'nearest';

  // Check if element is in viewport
  var rect = element.getBoundingClientRect();
  var inViewport = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );

  if (!inViewport) {
    // Use scrollIntoView if available
    if (element.scrollIntoView) {
      try {
        element.scrollIntoView({
          behavior: behavior,
          block: block,
          inline: inline,
        });
      } catch (err) {
        // Fallback for older browsers
        element.scrollIntoView(block === 'start');
      }
    }
  }
}
