/**
 * TizenPortal Pointer Mode
 * 
 * On-screen mouse cursor controlled by D-pad.
 * Provides fallback navigation when spatial nav doesn't work.
 */

import { KEYS } from './keys.js';
import { configRead, configWrite } from '../core/config.js';

/**
 * Get current screen dimensions
 * @returns {{width: number, height: number}}
 */
function getScreenDimensions() {
  return {
    width: window.innerWidth || document.documentElement.clientWidth || 1920,
    height: window.innerHeight || document.documentElement.clientHeight || 1080
  };
}

/**
 * Pointer movement speeds (pixels per key press)
 * Progressive acceleration based on hold duration
 */
var MOVE_SPEED_BASE = 15;    // Initial speed (< ACCEL_THRESHOLD_MEDIUM)
var MOVE_SPEED_MEDIUM = 30;  // After ACCEL_THRESHOLD_MEDIUM
var MOVE_SPEED_FAST = 60;    // After ACCEL_THRESHOLD_FAST

/**
 * Acceleration thresholds (milliseconds)
 */
var ACCEL_THRESHOLD_MEDIUM = 300;
var ACCEL_THRESHOLD_FAST = 600;

/**
 * Scroll amount when pointer reaches edge
 */
var SCROLL_AMOUNT = 100;

/**
 * Pointer element
 */
var pointerElement = null;

/**
 * Currently hovered element
 */
var hoveredElement = null;

/**
 * Current pointer position (centered on init)
 */
var posX = 960;
var posY = 540;

/**
 * Is pointer mode active
 */
var isActive = false;

/**
 * Key repeat tracking for acceleration
 */
var keyHoldStart = {};

/**
 * Initialize the pointer system
 */
export function initPointer() {
  createPointerElement();
  
  // Check if pointer mode was previously enabled
  if (configRead('pointerMode')) {
    enablePointer();
  }
}

/**
 * Create the pointer DOM element
 */
function createPointerElement() {
  if (pointerElement) return;
  
  pointerElement = document.createElement('div');
  pointerElement.id = 'tp-pointer';
  pointerElement.className = 'tp-pointer';
  pointerElement.innerHTML = '<div class="tp-pointer-cursor"></div>';
  
  document.body.appendChild(pointerElement);
  
  // Set up mouse move tracking for hover highlights
  document.addEventListener('mousemove', handleMouseMove, true);
  
  updatePointerPosition();
}

/**
 * Update pointer element position
 */
function updatePointerPosition() {
  if (!pointerElement) {
    console.error('TizenPortal [Pointer]: updatePointerPosition called but pointerElement is null');
    return;
  }
  
  pointerElement.style.left = posX + 'px';
  pointerElement.style.top = posY + 'px';
  
  // Update hover highlight
  updateHoverHighlight(posX, posY);
}

/**
 * Enable pointer mode
 */
export function enablePointer() {
  if (isActive) return;
  
  isActive = true;
  configWrite('pointerMode', true);
  
  if (pointerElement) {
    pointerElement.classList.add('visible');
  }
  
  // Center pointer on screen
  var screen = getScreenDimensions();
  posX = screen.width / 2;
  posY = screen.height / 2;
  updatePointerPosition();
  
  console.log('TizenPortal: Pointer mode enabled');
}

/**
 * Disable pointer mode
 */
export function disablePointer() {
  if (!isActive) return;
  
  isActive = false;
  configWrite('pointerMode', false);
  
  if (pointerElement) {
    pointerElement.classList.remove('visible');
  }
  
  // Clear hover highlight
  if (hoveredElement) {
    hoveredElement.classList.remove('tp-pointer-hover');
    hoveredElement = null;
  }
  
  // Clear key holds
  keyHoldStart = {};
  
  console.log('TizenPortal: Pointer mode disabled');
}

/**
 * Toggle pointer mode
 */
export function togglePointer() {
  if (isActive) {
    disablePointer();
  } else {
    enablePointer();
  }
  return isActive;
}

/**
 * Check if pointer mode is active
 * @returns {boolean}
 */
export function isPointerActive() {
  // Check both the isActive flag and the actual element state
  // This provides redundancy in case of initialization issues
  if (isActive) return true;
  
  // Fallback: check if pointer element exists and is visible
  if (pointerElement && pointerElement.classList.contains('visible')) {
    // Element is visible but isActive is false - resync state
    console.warn('TizenPortal [Pointer]: State mismatch detected, resyncing isActive');
    isActive = true;
    return true;
  }
  
  return false;
}

/**
 * Get current pointer position
 * @returns {{x: number, y: number}}
 */
export function getPointerPosition() {
  return { x: posX, y: posY };
}

/**
 * Handle key down for pointer movement
 * @param {KeyboardEvent} event
 * @returns {boolean} True if handled
 */
export function handlePointerKeyDown(event) {
  if (!isActive) {
    console.log('TizenPortal [Pointer]: handlePointerKeyDown called but isActive is false');
    return false;
  }
  
  var keyCode = event.keyCode;
  console.log('TizenPortal [Pointer]: handlePointerKeyDown - keyCode:', keyCode, 'isActive:', isActive);
  
  // Track key hold start time for acceleration
  if (!event.repeat && !keyHoldStart[keyCode]) {
    keyHoldStart[keyCode] = Date.now();
  }
  
  // Calculate speed based on hold duration (progressive acceleration)
  var holdDuration = Date.now() - (keyHoldStart[keyCode] || Date.now());
  var speed = holdDuration > ACCEL_THRESHOLD_FAST ? MOVE_SPEED_FAST :
              holdDuration > ACCEL_THRESHOLD_MEDIUM ? MOVE_SPEED_MEDIUM :
              MOVE_SPEED_BASE;
  
  var handled = false;
  var scrollDirection = 0;
  
  // Get current screen bounds
  var screen = getScreenDimensions();
  
  switch (keyCode) {
    case KEYS.LEFT:
      posX = Math.max(0, posX - speed);
      handled = true;
      break;
      
    case KEYS.RIGHT:
      posX = Math.min(screen.width - 1, posX + speed);
      handled = true;
      break;
      
    case KEYS.UP:
      var newY = posY - speed;
      if (newY < 0) {
        // Hit top edge - scroll up and clamp pointer
        scrollDirection = -SCROLL_AMOUNT;
        posY = 0;
      } else {
        posY = newY;
      }
      handled = true;
      break;
      
    case KEYS.DOWN:
      var newYDown = posY + speed;
      if (newYDown >= screen.height) {
        // Hit bottom edge - scroll down and clamp pointer
        scrollDirection = SCROLL_AMOUNT;
        posY = screen.height - 1;
      } else {
        posY = newYDown;
      }
      handled = true;
      break;
      
    case KEYS.ENTER:
      // Click at pointer position
      clickAtPointer();
      handled = true;
      break;
  }
  
  if (handled) {
    updatePointerPosition();
    
    // Handle scrolling if needed
    if (scrollDirection !== 0) {
      scrollPage(scrollDirection);
    }
    
    // Add visual feedback for movement
    if (pointerElement && keyCode !== KEYS.ENTER) {
      pointerElement.classList.add('moving');
    }
  }
  
  return handled;
}

/**
 * Handle key up for pointer
 * @param {KeyboardEvent} event
 * @returns {boolean} True if handled
 */
export function handlePointerKeyUp(event) {
  if (!isActive) return false;
  
  var keyCode = event.keyCode;
  
  // Clear key hold tracking
  delete keyHoldStart[keyCode];
  
  // Remove moving class
  if (pointerElement) {
    pointerElement.classList.remove('moving');
  }
  
  // Check if it's a direction or enter key
  if (keyCode === KEYS.LEFT || keyCode === KEYS.RIGHT || 
      keyCode === KEYS.UP || keyCode === KEYS.DOWN || 
      keyCode === KEYS.ENTER) {
    return true;
  }
  
  return false;
}

/**
 * Scroll the page (no iframe support - direct document scrolling)
 * @param {number} amount - Positive for down, negative for up
 */
function scrollPage(amount) {
  var scrollTarget = document.scrollingElement || document.documentElement || document.body;
  scrollTarget.scrollTop += amount;
}

/**
 * Click at current pointer position (direct document access)
 */
function clickAtPointer() {
  console.log('TizenPortal: Click at', posX, posY);
  
  // Add click animation
  if (pointerElement) {
    pointerElement.classList.add('clicking');
    setTimeout(function() {
      if (pointerElement) {
        pointerElement.classList.remove('clicking');
      }
    }, 150);
  }
  
  // Get element at pointer position
  var targetElement = document.elementFromPoint(posX, posY);
  
  if (targetElement) {
    simulateClick(targetElement, posX, posY);
  }
}

/**
 * Simulate a click on an element
 * @param {Element} element
 * @param {number} x
 * @param {number} y
 */
function simulateClick(element, x, y) {
  if (!element) return;
  
  console.log('TizenPortal: Clicking on', element.tagName, element.className);
  
  // Focus the element first
  if (element.focus) {
    try {
      element.focus();
    } catch (err) {
      // Ignore
    }
  }
  
  // Create and dispatch mouse events
  var eventOptions = {
    bubbles: true,
    cancelable: true,
    view: element.ownerDocument.defaultView,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    button: 0
  };
  
  try {
    // MouseEvent sequence: mousedown -> mouseup -> click
    var mousedown = new MouseEvent('mousedown', eventOptions);
    var mouseup = new MouseEvent('mouseup', eventOptions);
    var click = new MouseEvent('click', eventOptions);
    
    element.dispatchEvent(mousedown);
    element.dispatchEvent(mouseup);
    element.dispatchEvent(click);
  } catch (err) {
    // Fallback for older browsers
    try {
      element.click();
    } catch (e) {
      console.warn('TizenPortal: Click simulation failed');
    }
  }
  
  // Handle special elements
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    // Text input - this should trigger IME
    try {
      element.focus();
    } catch (err) {
      // Ignore
    }
  } else if (element.tagName === 'A' && element.href) {
    // Link - might need special handling
    console.log('TizenPortal: Clicked link:', element.href);
  }
}

/**
 * Set pointer position directly
 * @param {number} x
 * @param {number} y
 */
export function setPointerPosition(x, y) {
  var screen = getScreenDimensions();
  posX = Math.max(0, Math.min(screen.width - 1, x));
  posY = Math.max(0, Math.min(screen.height - 1, y));
  updatePointerPosition();
}

/**
 * Update hover highlight for element at position
 * @param {number} x
 * @param {number} y
 */
function updateHoverHighlight(x, y) {
  try {
    var element = findClickableElement(x, y);
    
    // Remove highlight from previous element
    if (hoveredElement && hoveredElement !== element) {
      try {
        hoveredElement.classList.remove('tp-pointer-hover');
      } catch (err) {
        // Element may be from cross-origin iframe
      }
    }
    
    // Add highlight to new element
    if (element && element !== hoveredElement) {
      try {
        element.classList.add('tp-pointer-hover');
      } catch (err) {
        // Element may be from cross-origin iframe
      }
    }
    
    hoveredElement = element;
  } catch (err) {
    // Ignore hover highlight errors
    hoveredElement = null;
  }
}

/**
 * Find clickable element at position (direct document access)
 * @param {number} x
 * @param {number} y
 * @returns {Element|null}
 */
function findClickableElement(x, y) {
  var targetElement = document.elementFromPoint(x, y);
  
  if (!targetElement) return null;
  
  // Walk up to find clickable ancestor
  return findClickableAncestor(targetElement);
}

/**
 * Find nearest clickable ancestor
 * @param {Element} element
 * @returns {Element|null}
 */
function findClickableAncestor(element) {
  var current = element;
  var maxDepth = 10;
  
  while (current && maxDepth > 0) {
    // Check if element is clickable
    if (isClickable(current)) {
      return current;
    }
    current = current.parentElement;
    maxDepth--;
  }
  
  return null;
}

/**
 * Check if element is clickable
 * @param {Element} element
 * @returns {boolean}
 */
function isClickable(element) {
  if (!element || !element.tagName) return false;
  
  var tag = element.tagName.toUpperCase();
  
  // Interactive elements
  if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || 
      tag === 'SELECT' || tag === 'TEXTAREA') {
    return true;
  }
  
  // Elements with click handlers or tabindex
  if (element.onclick || element.getAttribute('tabindex') !== null) {
    return true;
  }
  
  // Elements with role="button" or similar
  var role = element.getAttribute('role');
  if (role === 'button' || role === 'link' || role === 'menuitem' || 
      role === 'tab' || role === 'option') {
    return true;
  }
  
  // Elements with cursor pointer style
  try {
    // Use the element's owner document's defaultView for getComputedStyle
    var win = element.ownerDocument ? element.ownerDocument.defaultView : window;
    if (win) {
      var style = win.getComputedStyle(element);
      if (style && style.cursor === 'pointer') {
        return true;
      }
    }
  } catch (err) {
    // Cross-origin or other error - ignore
  }
  
  return false;
}

/**
 * Handle mouse move for hover highlights (real mouse)
 * @param {MouseEvent} event
 */
function handleMouseMove(event) {
  // Only highlight when pointer mode is NOT active (for real mouse)
  if (!isActive) {
    updateHoverHighlight(event.clientX, event.clientY);
  }
}

/**
 * Clear hover highlight
 */
export function clearHoverHighlight() {
  if (hoveredElement) {
    try {
      hoveredElement.classList.remove('tp-pointer-hover');
    } catch (err) {
      // Element may be from cross-origin iframe
    }
    hoveredElement = null;
  }
}
