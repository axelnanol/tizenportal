/**
 * Spatial Navigation Library
 * 
 * A deterministic, geometry-based spatial navigation library for TV UIs,
 * set-top boxes, and keyboard/remote interfaces.
 * 
 * Supports two global navigation modes:
 * 1. "geometric"   - Strict axis-aligned filtering with Euclidean scoring
 * 2. "directional" - Cone-based, human-expectation-aligned navigation
 * 
 * @version 1.0.0
 * @license MIT
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root.SpatialNavigation = factory();
  }
}(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {}, function() {
  'use strict';

  // ========================================================================
  // GLOBAL CONFIGURATION
  // ========================================================================

  /**
   * Default configuration for the spatial navigation system
   */
  var defaultConfig = {
    // Navigation mode: "geometric" or "directional"
    mode: 'geometric',
    
    // Directional mode specific options
    coneAngle: 30,              // Cone angle in degrees (±30° default)
    primaryWeight: 1,           // Weight for primary axis distance
    secondaryWeight: 0.5,       // Weight for secondary axis offset
    overlapBonus: true,         // Apply bonus for perpendicular axis overlap
    overlapWeight: 5,           // Weight for overlap bonus
    rowColumnBias: true,        // Prefer staying aligned in rows/columns
    alignmentWeight: 5,         // Weight for row/column alignment
    scrollBehavior: 'focus',    // 'scrollFirst' | 'focus'
    fallback: 'none',           // 'none' | 'nearest' | 'wrap'
    
    // Geometric mode specific options
    orthogonalWeightLR: 30,     // Orthogonal weight for left/right
    orthogonalWeightUD: 2,      // Orthogonal weight for up/down
  };

  /**
   * Current active configuration
   */
  var config = Object.assign({}, defaultConfig);

  /**
   * Configure the spatial navigation system
   * @param {Object} options - Configuration options
   * @returns {Object} Current configuration
   */
  function configure(options) {
    if (!options || typeof options !== 'object') {
      throw new TypeError('Configuration options must be an object');
    }
    
    // Validate mode
    if (options.mode && options.mode !== 'geometric' && options.mode !== 'directional') {
      throw new Error('Invalid mode: must be "geometric" or "directional"');
    }
    
    // Validate numeric options
    var numericOptions = ['coneAngle', 'primaryWeight', 'secondaryWeight', 
                          'overlapWeight', 'alignmentWeight', 
                          'orthogonalWeightLR', 'orthogonalWeightUD'];
    for (var i = 0; i < numericOptions.length; i++) {
      var key = numericOptions[i];
      if (options[key] !== undefined && typeof options[key] !== 'number') {
        throw new TypeError(key + ' must be a number');
      }
    }
    
    // Validate scrollBehavior
    if (options.scrollBehavior && 
        options.scrollBehavior !== 'scrollFirst' && 
        options.scrollBehavior !== 'focus') {
      throw new Error('Invalid scrollBehavior: must be "scrollFirst" or "focus"');
    }
    
    // Validate fallback
    if (options.fallback && 
        options.fallback !== 'none' && 
        options.fallback !== 'nearest' && 
        options.fallback !== 'wrap') {
      throw new Error('Invalid fallback: must be "none", "nearest", or "wrap"');
    }
    
    // Merge configuration
    Object.assign(config, options);
    
    return config;
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration (copy)
   */
  function getConfig() {
    return Object.assign({}, config);
  }

  /**
   * Reset configuration to defaults
   */
  function resetConfig() {
    config = Object.assign({}, defaultConfig);
  }

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  /**
   * Get normalized bounding rectangle for an element
   * @param {Element} element - DOM element
   * @returns {Object} Normalized rect with top, right, bottom, left, width, height
   */
  function getRect(element) {
    if (!element || !element.getBoundingClientRect) {
      return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 };
    }
    
    var rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      // Center point
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2
    };
  }

  /**
   * Check if an element is visible
   * @param {Element} element - DOM element
   * @returns {boolean}
   */
  function isVisible(element) {
    if (!element) return false;
    
    var style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    
    var rect = getRect(element);
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Check if an element is focusable
   * @param {Element} element - DOM element
   * @returns {boolean}
   */
  function isFocusable(element) {
    if (!element || !isVisible(element)) return false;
    
    var tabindex = element.getAttribute('tabindex');
    if (tabindex && tabindex !== '-1') return true;
    
    var tagName = element.tagName.toLowerCase();
    if (tagName === 'a' && element.hasAttribute('href')) return true;
    if (tagName === 'button' && !element.disabled) return true;
    if (tagName === 'input' && !element.disabled) return true;
    if (tagName === 'select' && !element.disabled) return true;
    if (tagName === 'textarea' && !element.disabled) return true;
    
    return false;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees
   * @returns {number}
   */
  function toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  // ========================================================================
  // GEOMETRIC MODE - DIRECTIONAL FILTERING
  // ========================================================================

  /**
   * Filter candidates using geometric (axis-aligned) filtering
   * 
   * In geometric mode, candidates must lie in the strict half-plane
   * perpendicular to the direction of navigation.
   * 
   * ASCII Diagram:
   * For direction "right":
   *     │
   *     │  Candidates must be
   *     │  strictly to the right
   *   [A]│  of element A's center
   *     │
   *     │
   * 
   * @param {Element} origin - Origin element
   * @param {Array<Element>} candidates - Candidate elements
   * @param {string} direction - 'left', 'right', 'up', 'down'
   * @returns {Array<Element>} Filtered candidates
   */
  function filterByDirectionGeometric(origin, candidates, direction) {
    var originRect = getRect(origin);
    var filtered = [];
    
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      if (candidate === origin) continue;
      
      var candidateRect = getRect(candidate);
      var inDirection = false;
      
      switch (direction) {
        case 'left':
          // Candidate center must be left of origin center
          inDirection = candidateRect.centerX < originRect.centerX;
          break;
        case 'right':
          // Candidate center must be right of origin center
          inDirection = candidateRect.centerX > originRect.centerX;
          break;
        case 'up':
          // Candidate center must be above origin center
          inDirection = candidateRect.centerY < originRect.centerY;
          break;
        case 'down':
          // Candidate center must be below origin center
          inDirection = candidateRect.centerY > originRect.centerY;
          break;
      }
      
      if (inDirection) {
        filtered.push(candidate);
      }
    }
    
    return filtered;
  }

  // ========================================================================
  // DIRECTIONAL MODE - CONE-BASED FILTERING
  // ========================================================================

  /**
   * Filter candidates using cone-based filtering
   * 
   * In directional mode, candidates must lie within a cone originating
   * from the origin element's edge in the direction of navigation.
   * 
   * ASCII Diagram:
   * For direction "right" with ±30° cone:
   *            .
   *          .   .
   *        .       .  30°
   *      . Cone      .
   *    [A]─────────────>
   *      . Area      .
   *        .       . -30°
   *          .   .
   *            .
   * 
   * @param {Element} origin - Origin element
   * @param {Array<Element>} candidates - Candidate elements
   * @param {string} direction - 'left', 'right', 'up', 'down'
   * @returns {Array<Element>} Filtered candidates
   */
  function filterByDirectionCone(origin, candidates, direction) {
    var originRect = getRect(origin);
    var coneAngle = config.coneAngle;
    var coneRad = toRadians(coneAngle);
    var filtered = [];
    
    // Define the cone origin point (edge of origin element)
    var coneOriginX, coneOriginY;
    var primaryAxis, secondaryAxis;
    
    switch (direction) {
      case 'left':
        coneOriginX = originRect.left;
        coneOriginY = originRect.centerY;
        primaryAxis = 'x';
        break;
      case 'right':
        coneOriginX = originRect.right;
        coneOriginY = originRect.centerY;
        primaryAxis = 'x';
        break;
      case 'up':
        coneOriginX = originRect.centerX;
        coneOriginY = originRect.top;
        primaryAxis = 'y';
        break;
      case 'down':
        coneOriginX = originRect.centerX;
        coneOriginY = originRect.bottom;
        primaryAxis = 'y';
        break;
    }
    
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      if (candidate === origin) continue;
      
      var candidateRect = getRect(candidate);
      
      // Vector from cone origin to candidate center
      var dx = candidateRect.centerX - coneOriginX;
      var dy = candidateRect.centerY - coneOriginY;
      
      // Check if candidate is in the general direction
      var inGeneralDirection = false;
      switch (direction) {
        case 'left':
          inGeneralDirection = dx < 0;
          break;
        case 'right':
          inGeneralDirection = dx > 0;
          break;
        case 'up':
          inGeneralDirection = dy < 0;
          break;
        case 'down':
          inGeneralDirection = dy > 0;
          break;
      }
      
      if (!inGeneralDirection) continue;
      
      // Calculate angle from primary axis
      var angle;
      if (primaryAxis === 'x') {
        angle = Math.abs(Math.atan2(dy, Math.abs(dx)));
      } else {
        angle = Math.abs(Math.atan2(dx, Math.abs(dy)));
      }
      
      // Check if within cone
      if (angle <= coneRad) {
        filtered.push(candidate);
      }
    }
    
    return filtered;
  }

  // ========================================================================
  // GEOMETRIC MODE - DISTANCE SCORING
  // ========================================================================

  /**
   * Calculate geometric distance score
   * 
   * Uses Euclidean distance with orthogonal bias and alignment bonus.
   * This is the "mathematically correct" mode.
   * 
   * Formula:
   *   Score = A + B - C
   *   Where:
   *   A = Euclidean distance between closest points
   *   B = Orthogonal offset * orthogonal weight
   *   C = Alignment bonus (if elements overlap on perpendicular axis)
   * 
   * @param {Element} origin - Origin element
   * @param {Element} candidate - Candidate element
   * @param {string} direction - 'left', 'right', 'up', 'down'
   * @returns {number} Distance score (lower is better)
   */
  function scoreGeometric(origin, candidate, direction) {
    var originRect = getRect(origin);
    var candidateRect = getRect(candidate);
    
    // Get entry and exit points (closest points on each rect)
    var points = getEntryExitPoints(originRect, candidateRect, direction);
    var dx = Math.abs(points.entry.x - points.exit.x);
    var dy = Math.abs(points.entry.y - points.exit.y);
    
    // A: Euclidean distance
    var euclidean = Math.sqrt(dx * dx + dy * dy);
    
    // B: Orthogonal offset with directional weight
    var orthogonalOffset = 0;
    var orthogonalWeight = 0;
    
    if (direction === 'left' || direction === 'right') {
      orthogonalOffset = dy;
      orthogonalWeight = config.orthogonalWeightLR;
    } else {
      orthogonalOffset = dx;
      orthogonalWeight = config.orthogonalWeightUD;
    }
    
    var orthogonalBias = orthogonalOffset * orthogonalWeight;
    
    // C: Alignment bonus (overlap on perpendicular axis)
    var alignmentBonus = 0;
    if (direction === 'left' || direction === 'right') {
      // Check vertical overlap
      var overlapTop = Math.max(originRect.top, candidateRect.top);
      var overlapBottom = Math.min(originRect.bottom, candidateRect.bottom);
      if (overlapBottom > overlapTop) {
        var overlapHeight = overlapBottom - overlapTop;
        alignmentBonus = overlapHeight / originRect.height;
      }
    } else {
      // Check horizontal overlap
      var overlapLeft = Math.max(originRect.left, candidateRect.left);
      var overlapRight = Math.min(originRect.right, candidateRect.right);
      if (overlapRight > overlapLeft) {
        var overlapWidth = overlapRight - overlapLeft;
        alignmentBonus = overlapWidth / originRect.width;
      }
    }
    
    return euclidean + orthogonalBias - alignmentBonus;
  }

  /**
   * Get entry and exit points between two rectangles
   * @param {Object} rect1 - Origin rectangle
   * @param {Object} rect2 - Candidate rectangle
   * @param {string} direction - Navigation direction
   * @returns {Object} { exit: {x, y}, entry: {x, y} }
   */
  function getEntryExitPoints(rect1, rect2, direction) {
    var exit = { x: 0, y: 0 };
    var entry = { x: 0, y: 0 };
    
    switch (direction) {
      case 'left':
        exit.x = rect1.left;
        entry.x = rect2.right;
        break;
      case 'right':
        exit.x = rect1.right;
        entry.x = rect2.left;
        break;
      case 'up':
        exit.y = rect1.top;
        entry.y = rect2.bottom;
        break;
      case 'down':
        exit.y = rect1.bottom;
        entry.y = rect2.top;
        break;
    }
    
    // Find closest y-coordinates for horizontal movement
    if (direction === 'left' || direction === 'right') {
      if (rect1.bottom <= rect2.top) {
        exit.y = rect1.bottom;
        entry.y = rect2.top;
      } else if (rect1.top >= rect2.bottom) {
        exit.y = rect1.top;
        entry.y = rect2.bottom;
      } else {
        // Overlapping vertically - use centers
        exit.y = rect1.centerY;
        entry.y = rect2.centerY;
      }
    }
    
    // Find closest x-coordinates for vertical movement
    if (direction === 'up' || direction === 'down') {
      if (rect1.right <= rect2.left) {
        exit.x = rect1.right;
        entry.x = rect2.left;
      } else if (rect1.left >= rect2.right) {
        exit.x = rect1.left;
        entry.x = rect2.right;
      } else {
        // Overlapping horizontally - use centers
        exit.x = rect1.centerX;
        entry.x = rect2.centerX;
      }
    }
    
    return { exit: exit, entry: entry };
  }

  // ========================================================================
  // DIRECTIONAL MODE - DISTANCE SCORING
  // ========================================================================

  /**
   * Calculate directional distance score
   * 
   * Uses weighted primary/secondary axis distances with overlap bonus
   * and row/column alignment bias.
   * 
   * Formula:
   *   Score = (primaryDist * primaryWeight) + (secondaryDist * secondaryWeight)
   *           - (overlapBonus * overlapWeight)
   *           - (alignmentBonus * alignmentWeight)
   * 
   * @param {Element} origin - Origin element
   * @param {Element} candidate - Candidate element
   * @param {string} direction - 'left', 'right', 'up', 'down'
   * @returns {number} Distance score (lower is better)
   */
  function scoreDirectional(origin, candidate, direction) {
    var originRect = getRect(origin);
    var candidateRect = getRect(candidate);
    
    var primaryDist = 0;
    var secondaryDist = 0;
    var overlapBonus = 0;
    var alignmentBonus = 0;
    
    if (direction === 'left' || direction === 'right') {
      // Primary axis: horizontal distance
      if (direction === 'right') {
        primaryDist = candidateRect.left - originRect.right;
      } else {
        primaryDist = originRect.left - candidateRect.right;
      }
      primaryDist = Math.max(0, primaryDist);
      
      // Secondary axis: vertical offset
      secondaryDist = Math.abs(candidateRect.centerY - originRect.centerY);
      
      // Overlap bonus: perpendicular axis overlap
      if (config.overlapBonus) {
        var overlapTop = Math.max(originRect.top, candidateRect.top);
        var overlapBottom = Math.min(originRect.bottom, candidateRect.bottom);
        if (overlapBottom > overlapTop) {
          var overlapHeight = overlapBottom - overlapTop;
          overlapBonus = (overlapHeight / originRect.height) * config.overlapWeight;
        }
      }
      
      // Row alignment bonus
      if (config.rowColumnBias) {
        var centerDiff = Math.abs(candidateRect.centerY - originRect.centerY);
        if (centerDiff < originRect.height / 2) {
          alignmentBonus = config.alignmentWeight * (1 - centerDiff / (originRect.height / 2));
        }
      }
    } else {
      // Primary axis: vertical distance
      if (direction === 'down') {
        primaryDist = candidateRect.top - originRect.bottom;
      } else {
        primaryDist = originRect.top - candidateRect.bottom;
      }
      primaryDist = Math.max(0, primaryDist);
      
      // Secondary axis: horizontal offset
      secondaryDist = Math.abs(candidateRect.centerX - originRect.centerX);
      
      // Overlap bonus: perpendicular axis overlap
      if (config.overlapBonus) {
        var overlapLeft = Math.max(originRect.left, candidateRect.left);
        var overlapRight = Math.min(originRect.right, candidateRect.right);
        if (overlapRight > overlapLeft) {
          var overlapWidth = overlapRight - overlapLeft;
          overlapBonus = (overlapWidth / originRect.width) * config.overlapWeight;
        }
      }
      
      // Column alignment bonus
      if (config.rowColumnBias) {
        var centerDiff = Math.abs(candidateRect.centerX - originRect.centerX);
        if (centerDiff < originRect.width / 2) {
          alignmentBonus = config.alignmentWeight * (1 - centerDiff / (originRect.width / 2));
        }
      }
    }
    
    var score = (primaryDist * config.primaryWeight) + 
                (secondaryDist * config.secondaryWeight) -
                overlapBonus - alignmentBonus;
    
    return Math.max(0, score);
  }

  // ========================================================================
  // FALLBACK STRATEGIES
  // ========================================================================

  /**
   * Apply fallback strategy when no candidates found in direction
   * @param {Element} origin - Origin element
   * @param {Array<Element>} allCandidates - All available candidates
   * @param {string} direction - Navigation direction
   * @returns {Element|null} Best fallback candidate or null
   */
  function applyFallback(origin, allCandidates, direction) {
    if (config.fallback === 'none') {
      return null;
    }
    
    if (config.fallback === 'nearest') {
      return findNearestCandidate(origin, allCandidates);
    }
    
    if (config.fallback === 'wrap') {
      return findWrapCandidate(origin, allCandidates, direction);
    }
    
    return null;
  }

  /**
   * Find nearest candidate (ignoring direction)
   * @param {Element} origin - Origin element
   * @param {Array<Element>} candidates - Candidate elements
   * @returns {Element|null} Nearest candidate
   */
  function findNearestCandidate(origin, candidates) {
    if (candidates.length === 0) return null;
    
    var originRect = getRect(origin);
    var minDistance = Infinity;
    var nearest = null;
    
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      if (candidate === origin) continue;
      
      var candidateRect = getRect(candidate);
      var dx = candidateRect.centerX - originRect.centerX;
      var dy = candidateRect.centerY - originRect.centerY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = candidate;
      }
    }
    
    return nearest;
  }

  /**
   * Find wrap candidate (opposite edge of container)
   * @param {Element} origin - Origin element
   * @param {Array<Element>} candidates - Candidate elements
   * @param {string} direction - Navigation direction
   * @returns {Element|null} Wrap candidate
   */
  function findWrapCandidate(origin, candidates, direction) {
    if (candidates.length === 0) return null;
    
    var originRect = getRect(origin);
    var best = null;
    var bestScore = Infinity;
    
    // Find candidates on opposite edge
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      if (candidate === origin) continue;
      
      var candidateRect = getRect(candidate);
      var isOppositeEdge = false;
      var score = 0;
      
      switch (direction) {
        case 'left':
          // Wrap to rightmost candidates
          isOppositeEdge = candidateRect.left > originRect.left;
          score = -candidateRect.left + Math.abs(candidateRect.centerY - originRect.centerY);
          break;
        case 'right':
          // Wrap to leftmost candidates
          isOppositeEdge = candidateRect.right < originRect.right;
          score = candidateRect.left + Math.abs(candidateRect.centerY - originRect.centerY);
          break;
        case 'up':
          // Wrap to bottom candidates
          isOppositeEdge = candidateRect.top > originRect.top;
          score = -candidateRect.top + Math.abs(candidateRect.centerX - originRect.centerX);
          break;
        case 'down':
          // Wrap to top candidates
          isOppositeEdge = candidateRect.bottom < originRect.bottom;
          score = candidateRect.top + Math.abs(candidateRect.centerX - originRect.centerX);
          break;
      }
      
      if (isOppositeEdge && score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    
    return best;
  }

  // ========================================================================
  // SCROLL BEHAVIOR
  // ========================================================================

  /**
   * Apply scroll behavior (placeholder for future implementation)
   * @param {Element} origin - Origin element
   * @param {Element} candidate - Candidate element
   * @param {string} direction - Navigation direction
   * @returns {boolean} True if scrolled, false otherwise
   */
  function applyScrollBehavior(origin, candidate, direction) {
    // TODO: Implement scroll-first behavior
    // For now, always return false (focus-first)
    return false;
  }

  // ========================================================================
  // MAIN NAVIGATION ALGORITHM
  // ========================================================================

  /**
   * Find the next focusable element in the given direction
   * @param {Element} origin - Origin element (currently focused)
   * @param {string} direction - Navigation direction ('left', 'right', 'up', 'down')
   * @param {Object} options - Optional parameters
   * @param {Element} options.container - Container element (default: document.body)
   * @param {Array<Element>} options.candidates - Candidate elements (default: auto-detect)
   * @returns {Element|null} Next element to focus, or null if none found
   */
  function findNextFocusable(origin, direction, options) {
    options = options || {};
    
    // Validate inputs
    if (!origin || !direction) {
      throw new Error('Origin element and direction are required');
    }
    
    if (['left', 'right', 'up', 'down'].indexOf(direction) === -1) {
      throw new Error('Invalid direction: must be left, right, up, or down');
    }
    
    // Get container
    var container = options.container || document.body;
    
    // Get candidates
    var candidates = options.candidates;
    if (!candidates) {
      // Auto-detect focusable elements in container
      var selector = 'a[href], button:not([disabled]), input:not([disabled]), ' +
                     'select:not([disabled]), textarea:not([disabled]), ' +
                     '[tabindex]:not([tabindex="-1"])';
      var elements = container.querySelectorAll(selector);
      candidates = Array.prototype.filter.call(elements, function(el) {
        return isFocusable(el) && el !== origin;
      });
    }
    
    if (candidates.length === 0) {
      return null;
    }
    
    // Choose filtering strategy based on mode
    var filtered;
    if (config.mode === 'geometric') {
      filtered = filterByDirectionGeometric(origin, candidates, direction);
    } else {
      filtered = filterByDirectionCone(origin, candidates, direction);
    }
    
    // If no candidates found, apply fallback
    if (filtered.length === 0) {
      if (config.mode === 'directional') {
        return applyFallback(origin, candidates, direction);
      }
      return null;
    }
    
    // Choose scoring strategy based on mode
    var scoreFunction = config.mode === 'geometric' ? scoreGeometric : scoreDirectional;
    
    // Find best candidate
    var best = null;
    var bestScore = Infinity;
    
    for (var i = 0; i < filtered.length; i++) {
      var candidate = filtered[i];
      var score = scoreFunction(origin, candidate, direction);
      
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    
    // Apply scroll behavior if configured
    if (config.mode === 'directional' && config.scrollBehavior === 'scrollFirst' && best) {
      applyScrollBehavior(origin, best, direction);
    }
    
    return best;
  }

  /**
   * Navigate from current focused element in the given direction
   * @param {string} direction - Navigation direction ('left', 'right', 'up', 'down')
   * @param {Object} options - Optional parameters
   * @returns {boolean} True if navigation succeeded, false otherwise
   */
  function navigate(direction, options) {
    var origin = document.activeElement;
    if (!origin || origin === document.body) {
      // No element focused, try to focus first focusable element
      var firstFocusable = findFirstFocusable();
      if (firstFocusable) {
        firstFocusable.focus();
        return true;
      }
      return false;
    }
    
    var next = findNextFocusable(origin, direction, options);
    if (next) {
      next.focus();
      return true;
    }
    
    return false;
  }

  /**
   * Find first focusable element in container
   * @param {Element} container - Container element (default: document.body)
   * @returns {Element|null}
   */
  function findFirstFocusable(container) {
    container = container || document.body;
    var selector = 'a[href], button:not([disabled]), input:not([disabled]), ' +
                   'select:not([disabled]), textarea:not([disabled]), ' +
                   '[tabindex]:not([tabindex="-1"])';
    var elements = container.querySelectorAll(selector);
    
    for (var i = 0; i < elements.length; i++) {
      if (isFocusable(elements[i])) {
        return elements[i];
      }
    }
    
    return null;
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  return {
    // Configuration
    configure: configure,
    getConfig: getConfig,
    resetConfig: resetConfig,
    
    // Navigation
    navigate: navigate,
    findNextFocusable: findNextFocusable,
    findFirstFocusable: findFirstFocusable,
    
    // Utility functions (exposed for testing and extension)
    utils: {
      getRect: getRect,
      isVisible: isVisible,
      isFocusable: isFocusable,
      filterByDirectionGeometric: filterByDirectionGeometric,
      filterByDirectionCone: filterByDirectionCone,
      scoreGeometric: scoreGeometric,
      scoreDirectional: scoreDirectional,
      applyFallback: applyFallback
    }
  };
}));
