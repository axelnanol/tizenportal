/**
 * TizenPortal Input Handler
 * 
 * Unified key event handling for remote, IME, and color buttons.
 * Includes card interaction model (single/multi-action cards).
 */

import { KEYS, COLOR_ACTIONS, isColorButton, getKeyName, INPUT_CONSTANTS } from './keys.js';
import { configRead, configWrite } from '../core/config.js';
import { toggleDiagnosticsPanel, clearDiagnosticsLogs, isDiagnosticsPanelVisible, scrollDiagnosticsLogs, cycleDiagnosticsLogFilter } from '../ui/diagnostics.js';
import { toggleAddressBar, isAddressBarVisible } from '../ui/addressbar.js';
import { showAddSiteEditor, showEditSiteEditor, isSiteEditorOpen, closeSiteEditor } from '../ui/siteeditor.js';
import { showPreferences, isPreferencesOpen } from '../ui/preferences.js';
import { getFocusedCard } from '../ui/portal.js';
import { isPointerActive, handlePointerKeyDown, handlePointerKeyUp, togglePointer } from './pointer.js';
import { isIMEActive, setIMEActive, getImeDismissedAt, deactivateInput } from './text-input.js';
import {
  isSingleActionCard,
  isMultiActionCard,
  getPrimaryAction,
  getFocusableChildren,
  enterCard,
  exitCard,
  isInsideCard,
  handleOK,
  handleBack,
  findCardShell
} from '../navigation/card-interaction.js';

/**
 * Simulate a full click event sequence (mousedown -> mouseup -> click)
 * This is needed for Vue components that use @mousedown.prevent @mouseup.prevent @click.stop
 * A simple .click() won't work because Vue intercepts at mousedown/mouseup level
 * @param {HTMLElement} element 
 */
function simulateFullClick(element) {
  if (!element) return;
  
  var rect = element.getBoundingClientRect();
  var centerX = rect.left + rect.width / 2;
  var centerY = rect.top + rect.height / 2;
  
  var eventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: centerX,
    clientY: centerY,
    screenX: centerX,
    screenY: centerY,
    button: 0,
    buttons: 1
  };
  
  // Dispatch full mouse event sequence
  element.dispatchEvent(new MouseEvent('mousedown', eventInit));
  element.dispatchEvent(new MouseEvent('mouseup', eventInit));
  element.dispatchEvent(new MouseEvent('click', eventInit));
}

/**
 * Long press detection threshold (milliseconds)
 */
var LONG_PRESS_MS = 500;

/**
 * Track key down times for long press detection
 */
var keyDownTimes = {};

// Track recent IME cancel/done events to suppress accidental EXIT
var imeCancelAt = 0;
// Extended to 5 seconds to cover Tizen modal dismissal delay
// The Tizen system modal can remain visible after input blur,
// and clicking Cancel sends EXIT key which should be suppressed
var EXIT_SUPPRESS_MS = 5000;

function shouldSuppressExit() {
  var now = Date.now();
  if (isIMEActive()) return true;
  if (imeCancelAt && now - imeCancelAt < EXIT_SUPPRESS_MS) return true;
  var dismissedAt = getImeDismissedAt();
  if (dismissedAt && now - dismissedAt < EXIT_SUPPRESS_MS) return true;
  return false;
}


/**
 * Custom key handlers registered by bundles
 */
var customHandlers = [];

/**
 * Initialize the input handler
 */
export function initInputHandler() {
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('keyup', handleKeyUp, true);

  console.log('TizenPortal: Input handler initialized');
}

/**
 * Handle keydown events
 * @param {KeyboardEvent} event
 */
function handleKeyDown(event) {
  var keyCode = event.keyCode;

  // Skip repeat events for timing
  if (!event.repeat) {
    keyDownTimes[keyCode] = Date.now();
  }

  // Check if diagnostics panel is open - handle scrolling BEFORE logging
  // to avoid log entries that would scroll the view back down
  var isArrowKey = keyCode === KEYS.LEFT || keyCode === KEYS.RIGHT || 
                   keyCode === KEYS.UP || keyCode === KEYS.DOWN;
  if (isArrowKey && isDiagnosticsPanelVisible()) {
    event.preventDefault();
    event.stopPropagation();
    // Don't log UP/DOWN when scrolling diagnostics - it would scroll back to bottom
    if (keyCode === KEYS.UP) {
      scrollDiagnosticsLogs(-100); // Scroll up
    } else if (keyCode === KEYS.DOWN) {
      scrollDiagnosticsLogs(100);  // Scroll down
    } else if (keyCode === KEYS.LEFT) {
      cycleDiagnosticsLogFilter(-1);
    } else if (keyCode === KEYS.RIGHT) {
      cycleDiagnosticsLogFilter(1);
    }
    return;
  }

  // Log key for diagnostics (after diagnostics scroll check)
  var keyName = getKeyName(keyCode);
  if (keyName) {
    console.log('TizenPortal: Key down - ' + keyName + ' (' + keyCode + ')');
  }

  // BACK key handling
  if (keyCode === KEYS.BACK) {
    // If diagnostics panel is open, close it
    if (isDiagnosticsPanelVisible()) {
      event.preventDefault();
      event.stopPropagation();
      toggleDiagnosticsPanel();
      return;
    }

    var isOnPortal = window.TizenPortal && window.TizenPortal.isPortalPage;
    if (!isOnPortal) {
      event.preventDefault();
      event.stopPropagation();
      try {
        history.back();
      } catch (err) {
        console.warn('TizenPortal: Back navigation failed:', err.message);
      }
      return;
    }
  }

  // Check IME keys - must prevent propagation to avoid system handling
  if (keyCode === KEYS.IME_DONE || keyCode === KEYS.IME_CANCEL) {
    event.preventDefault();
    event.stopPropagation();
    
    // Blur the active input to dismiss Tizen IME modal
    // This prevents the system modal with OK/Cancel from remaining open
    var activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      // If it's a wrapped input, use deactivateInput to properly clean up
      if (activeEl.classList.contains(INPUT_CONSTANTS.WRAPPED_INPUT_CLASS)) {
        deactivateInput(activeEl);
      } else {
        // For non-wrapped inputs, just blur
        try {
          activeEl.blur();
        } catch (err) {
          // Ignore
        }
      }
    }
    
    setIMEActive(false);
    imeCancelAt = Date.now();
    return;
  }

  // EXIT key (10182) - Tizen IME Cancel button sends this
  // The Tizen system modal with OK/Cancel can remain visible even after
  // the keyboard is dismissed and input is blurred. When user clicks Cancel,
  // EXIT is sent. We must suppress this to prevent app exit.
  if (keyCode === KEYS.EXIT) {
    if (shouldSuppressExit()) {
      event.preventDefault();
      event.stopPropagation();
      setIMEActive(false);
      console.log('TizenPortal: EXIT suppressed (IME modal cancel)');
      
      // Ensure any active input is properly blurred
      var activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        try {
          activeEl.blur();
        } catch (err) {
          // Ignore
        }
      }
      return;
    }
    // Check if we're in a text input or modal context
    var activeEl = document.activeElement;
    var isInputActive = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    );
    
    // Check if site editor is open
    var editorOpen = isSiteEditorOpen();
    
    // Check if any modal/overlay is visible
    var modalOpen = isDiagnosticsPanelVisible() || isAddressBarVisible();
    
    if (isInputActive || editorOpen || modalOpen) {
      // Don't exit - just close the current context
      event.preventDefault();
      event.stopPropagation();
      console.log('TizenPortal: EXIT suppressed (input/modal active)');
      
      // Close the site editor if open
      if (editorOpen) {
        closeSiteEditor();
      }
      // Close other panels if open
      if (isDiagnosticsPanelVisible()) {
        toggleDiagnosticsPanel();
      }
      if (isAddressBarVisible()) {
        toggleAddressBar();
      }
      return;
    }
    // Otherwise let EXIT propagate to system (will exit app)
    return;
  }

  // If IME is active, let text input handle most keys
  if (isIMEActive() && !isColorButton(keyCode)) {
    return;
  }

  // Give custom handlers a chance to consume the event
  for (var i = 0; i < customHandlers.length; i++) {
    try {
      if (customHandlers[i](event) === true) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    } catch (err) {
      console.error('TizenPortal: Custom key handler error:', err);
    }
  }

  // Handle pointer mode - intercepts arrow keys and enter
  // BUT NOT when site editor is open - editor needs Enter to work
  if (isPointerActive() && !isSiteEditorOpen()) {
    if (handlePointerKeyDown(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  }

  // Handle color buttons (short press handled on keyup for long press detection)
  if (isColorButton(keyCode)) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  // Handle Enter key - card interaction model (not on portal - portal has its own long-press handling)
  var isOnPortal = window.TizenPortal && window.TizenPortal.isPortalPage;
  if (keyCode === KEYS.ENTER && !isOnPortal) {
    // Check if we're on a card shell
    var activeEl = document.activeElement;
    var cardShell = findCardShell(activeEl);
    
    if (cardShell && !isInsideCard()) {
      // On a card shell, not inside - handle with card interaction model
      if (handleOK(cardShell)) {
        event.preventDefault();
        event.stopPropagation();
        console.log('TizenPortal: Card interaction - OK handled');
        return;
      }
    }
    
    // Not a card - click the focused element directly
    // This handles dropdown items, menu items, list items, etc.
    if (activeEl && activeEl !== document.body) {
      // Check if element naturally handles Enter (inputs, buttons, links)
      var tagName = activeEl.tagName.toUpperCase();
      
      // For INPUT and SELECT, let natural behavior occur
      if (tagName === 'INPUT' || tagName === 'SELECT') {
        return;
      }
      
      // For all interactive elements, dispatch proper MouseEvent sequence
      // Vue components with @mousedown.prevent @mouseup.prevent @click.stop
      // need proper events, not just .click()
      try {
        simulateFullClick(activeEl);
        event.preventDefault();
        event.stopPropagation();
        console.log('TizenPortal: Simulated click on', tagName);
      } catch (err) {
        console.warn('TizenPortal: Click simulation failed:', err.message);
        // Fallback to basic click
        try { activeEl.click(); } catch (e) {}
      }
    }
    return;
  }

  // Handle Escape key - card interaction model
  if (keyCode === 27) {
    if (handleBack()) {
      event.preventDefault();
      event.stopPropagation();
      console.log('TizenPortal: Card interaction - Back handled');
      return;
    }
  }

  // Handle navigation keys - let spatial navigation handle these
  // (Arrow keys will be processed by spatial-navigation-polyfill)
}

/**
 * Handle keyup events
 * @param {KeyboardEvent} event
 */
function handleKeyUp(event) {
  var keyCode = event.keyCode;
  var downTime = keyDownTimes[keyCode] || Date.now();
  var duration = Date.now() - downTime;
  var isLongPress = duration >= LONG_PRESS_MS;

  delete keyDownTimes[keyCode];

  // Suppress EXIT on keyup if IME was just dismissed
  // This catches both keydown and keyup to ensure the Tizen modal Cancel
  // button doesn't exit the app
  if (keyCode === KEYS.EXIT && shouldSuppressExit()) {
    event.preventDefault();
    event.stopPropagation();
    setIMEActive(false);
    console.log('TizenPortal: EXIT keyup suppressed (IME modal cancel)');
    return;
  }

  // Handle pointer mode keyup
  if (isPointerActive()) {
    if (handlePointerKeyUp(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  }

  // Handle color buttons
  if (isColorButton(keyCode)) {
    event.preventDefault();
    event.stopPropagation();
    handleColorButton(keyCode, isLongPress);
    return;
  }
}

/**
 * Handle color button press
 * @param {number} keyCode
 * @param {boolean} isLongPress
 */
function handleColorButton(keyCode, isLongPress) {
  // If diagnostics panel is open, Yellow clears logs (short or long)
  if (keyCode === KEYS.YELLOW && isDiagnosticsPanelVisible()) {
    clearDiagnosticsLogs();
    return;
  }

  var action = null;

  switch (keyCode) {
    case KEYS.RED:
      action = isLongPress ? COLOR_ACTIONS.RED.long : COLOR_ACTIONS.RED.short;
      break;
    case KEYS.GREEN:
      action = isLongPress ? COLOR_ACTIONS.GREEN.long : COLOR_ACTIONS.GREEN.short;
      break;
    case KEYS.YELLOW:
      action = isLongPress ? COLOR_ACTIONS.YELLOW.long : COLOR_ACTIONS.YELLOW.short;
      break;
    case KEYS.BLUE:
      action = isLongPress ? COLOR_ACTIONS.BLUE.long : COLOR_ACTIONS.BLUE.short;
      break;
  }

  if (action) {
    console.log('TizenPortal: Color button action - ' + action);
    executeColorAction(action);
  }
}

/**
 * Execute a color button action
 * @param {string} action
 */
export function executeColorAction(action) {
  var isOnPortal = window.TizenPortal && window.TizenPortal.isPortalPage;
  
  switch (action) {
    case 'addressbar':
      // On target sites, toggle the site address bar
      if (!isOnPortal) {
        if (window.TizenPortal && window.TizenPortal.toggleSiteAddressBar) {
          window.TizenPortal.toggleSiteAddressBar();
        }
        break;
      }
      // On portal page, toggle address bar
      toggleAddressBar();
      break;

    case 'reload':
      // Reload current page
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Reloading...');
      }
      window.location.reload();
      break;

    case 'pointerMode':
      // Toggle pointer/mouse mode
      var pointerEnabled = togglePointer();
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Mouse mode: ' + (pointerEnabled ? 'ON' : 'OFF'));
      }
      break;

    case 'focusHighlight':
      // Toggle focus highlight visibility
      if (window.TizenPortal && window.TizenPortal.config) {
        var features = window.TizenPortal.config.get('tp_features') || {};
        var currentHighlight = features.focusStyling;
        if (currentHighlight === undefined) currentHighlight = true;
        
        features.focusStyling = !currentHighlight;
        window.TizenPortal.config.set('tp_features', features);
        
        // Reapply features to current document
        if (window.TizenPortal._featureLoader && typeof window.TizenPortal._featureLoader.applyFeatures === 'function') {
          window.TizenPortal._featureLoader.applyFeatures(document);
        }
        
        window.TizenPortal.showToast('Focus highlight: ' + (!currentHighlight ? 'ON' : 'OFF'));
      }
      break;

    case 'preferences':
      // Portal only - show preferences modal
      if (!isOnPortal) {
        // On target site, Yellow returns to portal
        if (window.TizenPortal && window.TizenPortal.returnToPortal) {
          window.TizenPortal.returnToPortal();
        }
        break;
      }
      // Disable while editor or preferences is open
      if (isSiteEditorOpen() || isPreferencesOpen()) {
        break;
      }
      // Open preferences modal
      showPreferences();
      break;

    case 'addSite':
      // Portal only - add new site
      if (!isOnPortal) {
        // On target site, Yellow returns to portal
        if (window.TizenPortal && window.TizenPortal.returnToPortal) {
          window.TizenPortal.returnToPortal();
        }
        break;
      }
      if (isSiteEditorOpen() || isPreferencesOpen()) {
        break;
      }
      // Open add site editor
      showAddSiteEditor(function() {
        if (window.TizenPortal && window.TizenPortal._refreshPortal) {
          window.TizenPortal._refreshPortal();
        }
      });
      break;

    case 'cycleBundle':
      // Bundle menu removed
      break;

    case 'diagnostics':
      // Toggle diagnostics panel
      if (!isOnPortal) {
        // On target sites, use the site overlay diagnostics
        if (window.TizenPortal && window.TizenPortal.toggleSiteDiagnostics) {
          window.TizenPortal.toggleSiteDiagnostics();
        }
      } else {
        toggleDiagnosticsPanel();
      }
      break;

    case 'safeMode':
      // Enter safe mode
      configWrite('safeMode', true);
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Entering safe mode...');
      }
      setTimeout(function() {
        // On target site, return to portal in safe mode
        if (window.TizenPortal && !window.TizenPortal.isPortalPage) {
          window.TizenPortal.returnToPortal();
        } else {
          window.location.reload();
        }
      }, 500);
      break;

    default:
      console.warn('TizenPortal: Unknown color action:', action);
  }
}

/**
 * Register a custom key handler
 * @param {Function} handler - Handler function(event) that returns true to consume
 * @returns {Function} Unregister function
 */
export function registerKeyHandler(handler) {
  if (typeof handler !== 'function') {
    console.warn('TizenPortal: registerKeyHandler requires a function');
    return function() {};
  }

  customHandlers.push(handler);

  return function() {
    var index = customHandlers.indexOf(handler);
    if (index !== -1) {
      customHandlers.splice(index, 1);
    }
  };
}

