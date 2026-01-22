/**
 * TizenPortal Input Handler
 * 
 * Unified key event handling for remote, IME, and color buttons.
 */

import { KEYS, COLOR_ACTIONS, isColorButton, getKeyName } from './keys.js';
import { configRead, configWrite } from '../core/config.js';
import { toggleDiagnosticsPanel, clearDiagnosticsLogs, isDiagnosticsPanelVisible, scrollDiagnosticsLogs } from '../ui/diagnostics.js';
import { toggleAddressBar, isAddressBarVisible } from '../ui/addressbar.js';
import { toggleBundleMenu, isBundleMenuVisible, cycleBundle } from '../ui/bundlemenu.js';
import { showAddSiteEditor, showEditSiteEditor, isSiteEditorOpen } from '../ui/siteeditor.js';
import { isPointerActive, handlePointerKeyDown, handlePointerKeyUp, togglePointer } from './pointer.js';

/**
 * Long press detection threshold (milliseconds)
 */
var LONG_PRESS_MS = 500;

/**
 * Track key down times for long press detection
 */
var keyDownTimes = {};

/**
 * Track if we're in IME (text input) mode
 */
var imeActive = false;

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

  // Log key for diagnostics
  var keyName = getKeyName(keyCode);
  if (keyName) {
    console.log('TizenPortal: Key down - ' + keyName + ' (' + keyCode + ')');
  }

  // Check IME keys
  if (keyCode === KEYS.IME_DONE || keyCode === KEYS.IME_CANCEL) {
    imeActive = false;
    return;
  }

  // If IME is active, let text input handle most keys
  if (imeActive && !isColorButton(keyCode)) {
    return;
  }

  // Diagnostics panel: up/down scrolls the log history, block left/right
  // Address bar and bundle menu: let arrow keys through for native focus navigation
  var isArrowKey = keyCode === KEYS.LEFT || keyCode === KEYS.RIGHT || 
                   keyCode === KEYS.UP || keyCode === KEYS.DOWN;
  if (isArrowKey && isDiagnosticsPanelVisible()) {
    event.preventDefault();
    event.stopPropagation();
    if (keyCode === KEYS.UP) {
      scrollDiagnosticsLogs(-100); // Scroll up
    } else if (keyCode === KEYS.DOWN) {
      scrollDiagnosticsLogs(100);  // Scroll down
    }
    // Left/Right do nothing for now
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
  if (isPointerActive()) {
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

  // Handle Enter key
  if (keyCode === KEYS.ENTER) {
    // Let natural focus/click behavior occur
    return;
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
      var currentHighlight = configRead('focusHighlight');
      if (currentHighlight === undefined) currentHighlight = true;
      configWrite('focusHighlight', !currentHighlight);
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Focus highlight: ' + (!currentHighlight ? 'ON' : 'OFF'));
      }
      break;

    case 'bundleMenu':
      // Portal only - bundle menu doesn't exist on target sites
      if (!isOnPortal) {
        // On target sites, Yellow returns to portal
        if (window.TizenPortal && window.TizenPortal.returnToPortal) {
          window.TizenPortal.returnToPortal();
        }
        break;
      }
      // If diagnostics panel is open, clear logs instead
      if (isDiagnosticsPanelVisible()) {
        clearDiagnosticsLogs();
        if (window.TizenPortal) {
          window.TizenPortal.showToast('Logs cleared');
        }
      } else {
        // Toggle bundle menu (legacy)
        toggleBundleMenu();
      }
      break;

    case 'editSite':
      // Portal only
      if (!isOnPortal) {
        // On target site, Yellow returns to portal
        if (window.TizenPortal && window.TizenPortal.returnToPortal) {
          window.TizenPortal.returnToPortal();
        }
        break;
      }
      // If site editor is open, Yellow = Save
      if (isSiteEditorOpen()) {
        var saveBtn = document.getElementById('tp-editor-save');
        if (saveBtn) {
          saveBtn.click();
        }
        return;
      }
      // Edit current site (opens site editor)
      if (window.TizenPortal && window.TizenPortal.getCurrentCard) {
        var currentCard = window.TizenPortal.getCurrentCard();
        if (currentCard) {
          showEditSiteEditor(currentCard, function() {
            if (window.TizenPortal && window.TizenPortal._refreshPortal) {
              window.TizenPortal._refreshPortal();
            }
          });
        } else {
          // No current card, show add instead
          showAddSiteEditor(function() {
            if (window.TizenPortal && window.TizenPortal._refreshPortal) {
              window.TizenPortal._refreshPortal();
            }
          });
        }
      }
      break;

    case 'addSite':
      // Portal only
      if (!isOnPortal) break;
      // Quick add new site
      if (isSiteEditorOpen()) {
        return;
      }
      showAddSiteEditor(function() {
        if (window.TizenPortal && window.TizenPortal._refreshPortal) {
          window.TizenPortal._refreshPortal();
        }
      });
      break;

    case 'cycleBundle':
      // Cycle through bundles
      cycleBundle();
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

/**
 * Set IME active state
 * @param {boolean} active
 */
export function setIMEActive(active) {
  imeActive = active;
}

/**
 * Check if IME is active
 * @returns {boolean}
 */
export function isIMEActive() {
  return imeActive;
}
