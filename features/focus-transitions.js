/**
 * Focus Transitions Feature
 * 
 * Provides smooth focus transition effects inspired by Samsung's Tizen Browser.
 * Implements lightweight transitions that evoke the direction of movement.
 */

/**
 * Previous focused element for direction calculation
 */
var previousElement = null;

/**
 * Current transition mode
 */
var currentMode = 'slide';

/**
 * Current transition speed
 */
var currentSpeed = 'medium';

/**
 * Transition speed mappings (in milliseconds)
 */
var SPEED_MAP = {
  fast: 150,
  medium: 250,
  slow: 400,
};

/**
 * Max number of focusable elements before disabling transitions
 * Large DOMs can cause heavy style recalculation.
 */
var MAX_FOCUSABLES = 250;

function countFocusableElements(doc) {
  if (!doc || !doc.querySelectorAll) return 0;
  try {
    var selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return doc.querySelectorAll(selector).length;
  } catch (err) {
    return 0;
  }
}

export default {
  name: 'focusTransitions',
  displayName: 'Focus Transitions',
  
  /**
   * Generate CSS for focus transitions
   * @param {string} mode - Transition style ('slide', 'scale', 'glow', 'off')
   * @param {string} speed - Transition speed ('fast', 'medium', 'slow')
   * @returns {string} CSS text
   */
  getCSS: function(mode, speed) {
    mode = mode || 'slide';
    speed = speed || 'medium';
    
    if (mode === 'off') {
      return '';
    }
    
    var duration = SPEED_MAP[speed] || SPEED_MAP.medium;
    var durationMs = duration + 'ms';
    
    var css = [
      '/* TizenPortal Focus Transitions */',
      '',
      '/* Base transition for all focusable elements */',
      ':focus {',
      '  transition: outline 0ms, outline-offset 0ms, transform ' + durationMs + ' ease-out, opacity ' + durationMs + ' ease-out, box-shadow ' + durationMs + ' ease-out !important;',
      '}',
      '',
    ];
    
    if (mode === 'slide') {
      // Slide effect - subtle directional movement
      css.push(
        '/* Slide transition - direction-aware */',
        '[data-tp-focus-from="left"]:focus {',
        '  animation: tp-slide-from-left ' + durationMs + ' ease-out;',
        '}',
        '',
        '[data-tp-focus-from="right"]:focus {',
        '  animation: tp-slide-from-right ' + durationMs + ' ease-out;',
        '}',
        '',
        '[data-tp-focus-from="top"]:focus {',
        '  animation: tp-slide-from-top ' + durationMs + ' ease-out;',
        '}',
        '',
        '[data-tp-focus-from="bottom"]:focus {',
        '  animation: tp-slide-from-bottom ' + durationMs + ' ease-out;',
        '}',
        '',
        '@keyframes tp-slide-from-left {',
        '  from {',
        '    transform: translateX(-8px);',
        '    opacity: 0.6;',
        '  }',
        '  to {',
        '    transform: translateX(0);',
        '    opacity: 1;',
        '  }',
        '}',
        '',
        '@keyframes tp-slide-from-right {',
        '  from {',
        '    transform: translateX(8px);',
        '    opacity: 0.6;',
        '  }',
        '  to {',
        '    transform: translateX(0);',
        '    opacity: 1;',
        '  }',
        '}',
        '',
        '@keyframes tp-slide-from-top {',
        '  from {',
        '    transform: translateY(-8px);',
        '    opacity: 0.6;',
        '  }',
        '  to {',
        '    transform: translateY(0);',
        '    opacity: 1;',
        '  }',
        '}',
        '',
        '@keyframes tp-slide-from-bottom {',
        '  from {',
        '    transform: translateY(8px);',
        '    opacity: 0.6;',
        '  }',
        '  to {',
        '    transform: translateY(0);',
        '    opacity: 1;',
        '  }',
        '}'
      );
    } else if (mode === 'scale') {
      // Scale effect - element grows into focus
      css.push(
        '/* Scale transition */',
        ':focus {',
        '  animation: tp-scale-in ' + durationMs + ' ease-out;',
        '}',
        '',
        '@keyframes tp-scale-in {',
        '  from {',
        '    transform: scale(0.95);',
        '    opacity: 0.7;',
        '  }',
        '  to {',
        '    transform: scale(1);',
        '    opacity: 1;',
        '  }',
        '}'
      );
    } else if (mode === 'glow') {
      // Glow effect - pulsing shadow
      css.push(
        '/* Glow transition */',
        ':focus {',
        '  animation: tp-glow-pulse ' + durationMs + ' ease-out;',
        '}',
        '',
        '@keyframes tp-glow-pulse {',
        '  0% {',
        '    box-shadow: 0 0 0 rgba(0, 168, 255, 0);',
        '  }',
        '  50% {',
        '    box-shadow: 0 0 20px rgba(0, 168, 255, 0.6);',
        '  }',
        '  100% {',
        '    box-shadow: 0 0 0 rgba(0, 168, 255, 0);',
        '  }',
        '}'
      );
    }
    
    return css.join('\n');
  },
  
  /**
   * Calculate direction from previous element to current element
   * @param {Element} prevEl - Previous focused element
   * @param {Element} currEl - Current focused element
   * @returns {string|null} Direction ('left', 'right', 'top', 'bottom', or null)
   */
  calculateDirection: function(prevEl, currEl) {
    if (!prevEl || !currEl) return null;
    if (!prevEl.getBoundingClientRect || !currEl.getBoundingClientRect) return null;
    
    try {
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
      
      // Determine primary direction based on larger delta
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal movement
        return deltaX > 0 ? 'right' : 'left';
      } else if (Math.abs(deltaY) > 5) {
        // Vertical movement (with threshold to ignore small changes)
        return deltaY > 0 ? 'bottom' : 'top';
      }
      
      return null;
    } catch (err) {
      return null;
    }
  },
  
  /**
   * Apply feature to document
   * @param {Document} doc - Target document
   * @param {string} mode - Transition mode
   * @param {string} speed - Transition speed
   */
  apply: function(doc, mode, speed) {
    if (!doc) return;
    
    mode = mode || 'slide';
    speed = speed || 'medium';
    
    currentMode = mode;
    currentSpeed = speed;
    
    this.remove(doc);

    if (mode !== 'off') {
      var focusableCount = countFocusableElements(doc);
      if (focusableCount > MAX_FOCUSABLES) {
        mode = 'off';
        if (window.TizenPortal && window.TizenPortal.log) {
          window.TizenPortal.log('Focus transitions disabled (too many focusables: ' + focusableCount + ')');
        } else {
          console.log('TizenPortal [FocusTransitions]: Disabled, focusable count=' + focusableCount);
        }
      }
    }
    
    if (mode === 'off') {
      return;
    }
    
    // Inject CSS
    var style = doc.createElement('style');
    style.id = 'tp-focus-transitions';
    style.textContent = this.getCSS(mode, speed);
    
    var head = doc.head || doc.documentElement;
    if (head) {
      head.appendChild(style);
    }
    
    // Set up focus listener for direction tracking
    var self = this;
    var focusHandler = function(event) {
      var currEl = event.target;
      
      // Remove old direction attribute from previous element
      if (previousElement && previousElement !== currEl) {
        try {
          previousElement.removeAttribute('data-tp-focus-from');
        } catch (err) {
          // Ignore if element no longer exists
        }
      }
      
      // Calculate and apply direction to current element
      if (mode === 'slide' && previousElement && currEl) {
        var direction = self.calculateDirection(previousElement, currEl);
        if (direction) {
          currEl.setAttribute('data-tp-focus-from', direction);
        }
      }
      
      previousElement = currEl;
    };
    
    // Store handler reference for cleanup
    if (!doc._tpFocusTransitionHandler) {
      doc._tpFocusTransitionHandler = focusHandler;
      doc.addEventListener('focusin', focusHandler, true);
    }
  },
  
  /**
   * Remove feature from document
   * @param {Document} doc - Target document
   */
  remove: function(doc) {
    if (!doc) return;
    
    // Remove injected CSS
    var style = doc.getElementById('tp-focus-transitions');
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
    
    // Remove focus listener
    if (doc._tpFocusTransitionHandler) {
      doc.removeEventListener('focusin', doc._tpFocusTransitionHandler, true);
      doc._tpFocusTransitionHandler = null;
    }
    
    // Clear previous element reference
    previousElement = null;
  },
  
  /**
   * Update transition settings
   * @param {Document} doc - Target document
   * @param {string} mode - Transition mode
   * @param {string} speed - Transition speed
   */
  update: function(doc, mode, speed) {
    this.apply(doc, mode, speed);
  },
};
