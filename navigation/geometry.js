/**
 * TizenPortal Geometry Utilities
 * 
 * CSS-first spacing enforcement for spatial navigation.
 * Ensures minimum gaps between focusable elements for reliable directional navigation.
 * 
 * Design Principles:
 * - CSS classes provide the minimum gap (4px default)
 * - JavaScript validates and warns about violations
 * - Bounding box normalization for consistent hit testing
 */

/**
 * Minimum gap between focusable elements in pixels
 * This ensures spatial navigation can reliably distinguish between adjacent elements
 */
export var MIN_GAP = 4;

/**
 * CSS class that enforces minimum spacing
 * Apply this class to containers with focusable children
 */
export var SPACING_CLASS = 'tp-spatial-gap';

/**
 * CSS variable name for gap size
 */
export var GAP_VAR = '--tp-spatial-gap';

/**
 * Inject spacing CSS rules
 * Call this once during initialization
 */
export function injectSpacingCSS() {
  if (document.getElementById('tp-geometry-css')) return;
  
  var style = document.createElement('style');
  style.id = 'tp-geometry-css';
  style.textContent = [
    '/* TizenPortal Geometry Spacing - CSS-first approach */',
    '',
    ':root {',
    '  ' + GAP_VAR + ': ' + MIN_GAP + 'px;',
    '}',
    '',
    '/* Apply to containers to enforce gaps between focusable children */',
    '.' + SPACING_CLASS + ' {',
    '  gap: var(' + GAP_VAR + ', ' + MIN_GAP + 'px);',
    '}',
    '',
    '/* Flex containers with spacing */',
    '.' + SPACING_CLASS + '.flex,',
    '.' + SPACING_CLASS + '[style*="display: flex"],',
    '.' + SPACING_CLASS + '[style*="display:flex"] {',
    '  gap: var(' + GAP_VAR + ', ' + MIN_GAP + 'px);',
    '}',
    '',
    '/* Grid containers with spacing */',
    '.' + SPACING_CLASS + '.grid,',
    '.' + SPACING_CLASS + '[style*="display: grid"],',
    '.' + SPACING_CLASS + '[style*="display:grid"] {',
    '  gap: var(' + GAP_VAR + ', ' + MIN_GAP + 'px);',
    '}',
    '',
    '/* Fallback: margin on direct children for non-flex/grid layouts */',
    '.' + SPACING_CLASS + ' > [tabindex]:not([tabindex="-1"]),',
    '.' + SPACING_CLASS + ' > a,',
    '.' + SPACING_CLASS + ' > button {',
    '  margin: calc(var(' + GAP_VAR + ', ' + MIN_GAP + 'px) / 2);',
    '}',
    '',
    '/* Entered card state - visual indicator */',
    '.tp-card-entered {',
    '  outline: 2px dashed rgba(26, 214, 145, 0.5) !important;',
    '  outline-offset: 2px;',
    '}',
    '',
    '/* Card inner focus when entered */',
    '.tp-card-entered :focus {',
    '  outline: 3px solid #1ad691 !important;',
    '  outline-offset: 1px;',
    '}',
  ].join('\n');
  
  var head = document.head || document.documentElement;
  head.insertBefore(style, head.firstChild);
  console.log('TizenPortal [Geometry]: Spacing CSS injected');
}

/**
 * Get the bounding rect with consistent normalization
 * Handles scroll offsets and edge cases
 * @param {HTMLElement} el - Element to measure
 * @returns {DOMRect|Object}
 */
export function getNormalizedRect(el) {
  if (!el || !el.getBoundingClientRect) {
    return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 };
  }
  
  try {
    var rect = el.getBoundingClientRect();
    
    // Normalize to fixed precision to avoid floating point issues
    return {
      top: Math.round(rect.top * 100) / 100,
      right: Math.round(rect.right * 100) / 100,
      bottom: Math.round(rect.bottom * 100) / 100,
      left: Math.round(rect.left * 100) / 100,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100,
    };
  } catch (e) {
    return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 };
  }
}

/**
 * Calculate the gap between two elements
 * @param {HTMLElement} el1 - First element
 * @param {HTMLElement} el2 - Second element
 * @param {string} direction - 'horizontal' or 'vertical'
 * @returns {number} Gap in pixels (can be negative if overlapping)
 */
export function getGap(el1, el2, direction) {
  var r1 = getNormalizedRect(el1);
  var r2 = getNormalizedRect(el2);
  
  if (direction === 'horizontal') {
    // Gap between left/right edges
    if (r1.right <= r2.left) {
      return r2.left - r1.right;
    } else if (r2.right <= r1.left) {
      return r1.left - r2.right;
    }
    // Overlapping horizontally
    return -Math.min(r1.right - r2.left, r2.right - r1.left);
  } else {
    // Gap between top/bottom edges
    if (r1.bottom <= r2.top) {
      return r2.top - r1.bottom;
    } else if (r2.bottom <= r1.top) {
      return r1.top - r2.bottom;
    }
    // Overlapping vertically
    return -Math.min(r1.bottom - r2.top, r2.bottom - r1.top);
  }
}

/**
 * Check if spacing between focusable elements meets minimum requirements
 * @param {HTMLElement} container - Container to check
 * @returns {Object} { valid: boolean, violations: Array }
 */
export function validateSpacing(container) {
  if (!container) return { valid: true, violations: [] };
  
  var focusables = container.querySelectorAll('[tabindex]:not([tabindex="-1"]), a[href], button:not([disabled])');
  var violations = [];
  var elements = Array.prototype.slice.call(focusables);
  
  // Check each pair
  for (var i = 0; i < elements.length; i++) {
    for (var j = i + 1; j < elements.length; j++) {
      var el1 = elements[i];
      var el2 = elements[j];
      
      // Skip if one contains the other
      if (el1.contains(el2) || el2.contains(el1)) continue;
      
      var hGap = getGap(el1, el2, 'horizontal');
      var vGap = getGap(el1, el2, 'vertical');
      
      // Elements are adjacent if one gap is small and the other is negative (overlapping in that axis)
      var areAdjacent = (hGap < MIN_GAP && vGap < 0) || (vGap < MIN_GAP && hGap < 0);
      
      if (areAdjacent) {
        var minGap = Math.min(
          hGap < 0 ? Infinity : hGap,
          vGap < 0 ? Infinity : vGap
        );
        if (minGap < MIN_GAP && minGap !== Infinity) {
          violations.push({
            el1: el1,
            el2: el2,
            gap: minGap,
            required: MIN_GAP,
          });
        }
      }
    }
  }
  
  return {
    valid: violations.length === 0,
    violations: violations,
  };
}

/**
 * Log spacing violations for debugging
 * @param {Object} validation - Result from validateSpacing
 */
export function logViolations(validation) {
  if (validation.valid) {
    console.log('TizenPortal [Geometry]: All spacing valid');
    return;
  }
  
  console.warn('TizenPortal [Geometry]: Found', validation.violations.length, 'spacing violations');
  for (var i = 0; i < validation.violations.length; i++) {
    var v = validation.violations[i];
    console.warn('  Gap:', v.gap.toFixed(1) + 'px (need ' + v.required + 'px)', 
      'between', v.el1, 'and', v.el2);
  }
}

/**
 * Check if an element is visible (not hidden, has size)
 * @param {HTMLElement} el - Element to check
 * @returns {boolean}
 */
export function isElementVisible(el) {
  if (!el) return false;
  
  // Check display/visibility
  var style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  
  // Check dimensions
  var rect = getNormalizedRect(el);
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }
  
  return true;
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} el - Element to check
 * @param {number} margin - Optional margin around viewport
 * @returns {boolean}
 */
export function isInViewport(el, margin) {
  margin = margin || 0;
  var rect = getNormalizedRect(el);
  var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  
  return (
    rect.top < viewportHeight + margin &&
    rect.bottom > -margin &&
    rect.left < viewportWidth + margin &&
    rect.right > -margin
  );
}
