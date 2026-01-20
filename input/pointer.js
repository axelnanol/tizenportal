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
var EDGE_THRESHOLD = 50;

/**
 * Pointer element
 */
var pointerElement = null;

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
  pointerElement.innerHTML = '' +
    '<div class="tp-pointer-cursor"></div>' +
    '<div class="tp-pointer-ring"></div>';
  
  document.body.appendChild(pointerElement);
  
  updatePointerPosition();
}

/**
 * Update pointer element position
 */
function updatePointerPosition() {
  if (!pointerElement) return;
  
  pointerElement.style.left = posX + 'px';
  pointerElement.style.top = posY + 'px';
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
  var needsScroll = false;
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
      if (posY <= EDGE_THRESHOLD) {
        // At top edge - scroll up instead
        needsScroll = true;
        scrollDirection = -SCROLL_AMOUNT;
      } else {
        posY = Math.max(0, posY - speed);
      }
      handled = true;
      break;
      
    case KEYS.DOWN:
      if (posY >= screen.height - EDGE_THRESHOLD) {
        // At bottom edge - scroll down instead
        needsScroll = true;
        scrollDirection = SCROLL_AMOUNT;
      } else {
        posY = Math.min(screen.height - 1, posY + speed);
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
    if (needsScroll) {
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
