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
 * Pointer movement speed (pixels per key press)
 */
var MOVE_SPEED = 20;

/**
 * Fast movement speed (when holding key)
 */
var FAST_SPEED = 40;

/**
 * Scroll amount when pointer reaches edge
 */
var SCROLL_AMOUNT = 100;

/**
 * Edge threshold for triggering scroll
 */
// EDGE_THRESHOLD removed - now scroll triggers when pointer hits actual screen edge

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
var HOLD_THRESHOLD = 300; // ms before fast speed kicks in

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
  if (!pointerElement) return;
  
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
  return isActive;
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
  if (!isActive) return false;
  
  var keyCode = event.keyCode;
  
  // Track key hold start time for acceleration
  if (!event.repeat && !keyHoldStart[keyCode]) {
    keyHoldStart[keyCode] = Date.now();
  }
  
  // Calculate speed based on hold duration
  var holdDuration = Date.now() - (keyHoldStart[keyCode] || Date.now());
  var speed = holdDuration > HOLD_THRESHOLD ? FAST_SPEED : MOVE_SPEED;
  
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
 * Scroll the page (iframe content or portal)
 * @param {number} amount - Positive for down, negative for up
 */
function scrollPage(amount) {
  var iframe = document.getElementById('tp-iframe');
  
  if (iframe) {
    // Try to scroll iframe content
    try {
      var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      var scrollTarget = iframeDoc.scrollingElement || iframeDoc.documentElement || iframeDoc.body;
      scrollTarget.scrollTop += amount;
    } catch (err) {
      // Cross-origin - try postMessage approach
      try {
        iframe.contentWindow.postMessage({
          type: 'tp-scroll',
          amount: amount
        }, '*');
      } catch (e) {
        console.log('TizenPortal: Cannot scroll iframe (cross-origin)');
      }
    }
  } else {
    // Scroll main document (portal)
    var scrollTarget = document.scrollingElement || document.documentElement || document.body;
    scrollTarget.scrollTop += amount;
  }
}

/**
 * Click at current pointer position
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
  
  var targetElement = null;
  var iframe = document.getElementById('tp-iframe');
  
  if (iframe) {
    // Try to click inside iframe
    try {
      var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      var iframeRect = iframe.getBoundingClientRect();
      
      // Adjust coordinates for iframe position
      var iframeX = posX - iframeRect.left;
      var iframeY = posY - iframeRect.top;
      
      targetElement = iframeDoc.elementFromPoint(iframeX, iframeY);
      
      if (targetElement) {
        simulateClick(targetElement, iframeX, iframeY);
      }
    } catch (err) {
      console.log('TizenPortal: Cannot click in iframe (cross-origin)');
      // For cross-origin, we can't do much
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Cannot click (cross-origin)');
      }
    }
  } else {
    // Click in main document
    targetElement = document.elementFromPoint(posX, posY);
    
    if (targetElement) {
      simulateClick(targetElement, posX, posY);
    }
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
  var element = findClickableElement(x, y);
  
  // Remove highlight from previous element
  if (hoveredElement && hoveredElement !== element) {
    hoveredElement.classList.remove('tp-pointer-hover');
  }
  
  // Add highlight to new element
  if (element && element !== hoveredElement) {
    element.classList.add('tp-pointer-hover');
  }
  
  hoveredElement = element;
}

/**
 * Find clickable element at position
 * @param {number} x
 * @param {number} y
 * @returns {Element|null}
 */
function findClickableElement(x, y) {
  var targetElement = null;
  var iframe = document.getElementById('tp-iframe');
  
  if (iframe) {
    // Try inside iframe
    try {
      var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      var iframeRect = iframe.getBoundingClientRect();
      var iframeX = x - iframeRect.left;
      var iframeY = y - iframeRect.top;
      targetElement = iframeDoc.elementFromPoint(iframeX, iframeY);
    } catch (err) {
      // Cross-origin
      return null;
    }
  } else {
    targetElement = document.elementFromPoint(x, y);
  }
  
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
    var style = window.getComputedStyle(element);
    if (style.cursor === 'pointer') {
      return true;
    }
  } catch (err) {
    // Ignore
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
    hoveredElement.classList.remove('tp-pointer-hover');
    hoveredElement = null;
  }
}
