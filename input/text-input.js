/**
 * TizenPortal Text Input Handling
 * 
 * TV-friendly text input handling. On TV, we don't want the keyboard to pop up
 * immediately when navigating to an input field. Instead, show a display value
 * and only activate the keyboard when user presses Enter.
 * 
 * Usage:
 *   import { wrapTextInputs, unwrapTextInputs } from '../input/text-input.js';
 *   
 *   // Wrap all inputs matching selector
 *   wrapTextInputs('input[type="text"], input[type="search"]');
 *   
 *   // Or wrap with custom options
 *   wrapTextInputs('input', {
 *     onActivate: function(input) { ... },
 *     onDeactivate: function(input) { ... },
 *   });
 */

import { KEYS, INPUT_CONSTANTS } from './keys.js';

/**
 * Track wrapped inputs to avoid re-wrapping
 */
var wrappedInputs = new WeakMap();

/**
 * Track IME active state
 */
var imeActive = false;
var imeDismissedAt = 0;

/**
 * Default options
 */
var defaultOptions = {
  wrapperClass: 'tp-input-wrapper',
  displayClass: 'tp-input-display',
  activeClass: 'editing',
  hasValueClass: 'has-value',
  defaultPlaceholder: 'Enter text...',
  onActivate: null,
  onDeactivate: null,
};

/**
 * Wrap text inputs for TV-friendly keyboard handling
 * @param {string} selector - CSS selector for inputs to wrap
 * @param {Object} options - Configuration options
 * @returns {number} Number of inputs wrapped
 */
export function wrapTextInputs(selector, options) {
  var opts = Object.assign({}, defaultOptions, options || {});
  var inputs = document.querySelectorAll(selector);
  var count = 0;
  
  for (var i = 0; i < inputs.length; i++) {
    var input = inputs[i];
    
    // Skip if already wrapped
    if (wrappedInputs.has(input) || input.classList.contains(INPUT_CONSTANTS.WRAPPED_INPUT_CLASS)) {
      continue;
    }

    // Skip non-textual inputs or TP UI inputs
    if (!isTextualInput(input) || isTizenPortalInput(input)) {
      continue;
    }
    
    // Skip hidden inputs
    if (input.type === 'hidden' || input.closest('[style*="display: none"]')) {
      continue;
    }
    
    wrapSingleInput(input, opts);
    count++;
  }
  
  if (count > 0) {
    if (window.TizenPortal && window.TizenPortal.log) {
      TizenPortal.log('TextInput: Wrapped ' + count + ' inputs');
    } else {
      console.log('TizenPortal [TextInput]: Wrapped', count, 'inputs');
    }
  }
  
  return count;
}

/**
 * Check if input is a text-like field
 * @param {Element} el
 * @returns {boolean}
 */
function isTextualInput(el) {
  if (!el || !el.tagName) return false;
  var tag = el.tagName.toUpperCase();
  if (tag === 'TEXTAREA') return true;
  if (tag !== 'INPUT') return false;

  var type = (el.getAttribute('type') || '').toLowerCase();
  if (!type) return true;
  return type === 'text' || type === 'search' || type === 'email' || type === 'url' || type === 'password' || type === 'tel' || type === 'number';
}

/**
 * Skip TizenPortal UI inputs
 * @param {Element} el
 * @returns {boolean}
 */
function isTizenPortalInput(el) {
  try {
    if (!el) return false;
    var id = el.id || '';
    var className = el.className || '';
    if (id.indexOf('tp-') === 0 || className.indexOf('tp-') !== -1) return true;
    if (el.closest && (el.closest('#tp-addressbar') || el.closest('#tp-site-editor') || el.closest('#tp-preferences') || el.closest('#tp-modal-container'))) {
      return true;
    }
  } catch (err) {
    // Ignore
  }
  return false;
}

/**
 * Wrap a single text input
 * @param {HTMLInputElement} input
 * @param {Object} opts
 */
function wrapSingleInput(input, opts) {
  // Capture the input's visual styles before wrapping so the wrapper looks like the original input
  var capturedStyles = null;
  try {
    var cs = window.getComputedStyle(input);
    if (cs) {
      capturedStyles = {
        // Borders are NOT copied to the wrapper: copying them would produce a
        // visible double-border when the real <input> is shown for editing
        // (wrapper border + input border). A default CSS border on the wrapper
        // handles display-mode visibility; it is cleared in the .editing state.
        borderRadius: cs.borderRadius,
        backgroundColor: cs.backgroundColor,
        // Padding is applied to the display span (not the wrapper) so it does
        // not add a second inset to the real input in the editing state.
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
      };
    }
  } catch (err) {
    // Ignore style capture errors
  }

  // Create wrapper
  var wrapper = document.createElement('div');
  wrapper.className = opts.wrapperClass;
  wrapper.setAttribute('tabindex', '0');

  // Apply captured visual styles (background, radius only) to wrapper
  try {
    if (capturedStyles) {
      if (capturedStyles.borderRadius && capturedStyles.borderRadius !== '0px') {
        wrapper.style.borderRadius = capturedStyles.borderRadius;
      }
      if (capturedStyles.backgroundColor && capturedStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && capturedStyles.backgroundColor !== 'transparent') {
        wrapper.style.backgroundColor = capturedStyles.backgroundColor;
      }
    }
  } catch (err) {
    // Ignore style application errors
  }
  
  // Create display element
  var display = document.createElement('span');
  display.className = opts.displayClass;
  var placeholder = input.getAttribute('placeholder') || opts.defaultPlaceholder;
  display.textContent = input.value || placeholder;
  if (input.value) {
    display.classList.add(opts.hasValueClass);
  }

  // Apply captured padding to the display span so text aligns with the original
  // input's inset, without affecting the real input's own padding in editing state.
  try {
    if (capturedStyles) {
      if (capturedStyles.paddingTop) display.style.paddingTop = capturedStyles.paddingTop;
      if (capturedStyles.paddingRight) display.style.paddingRight = capturedStyles.paddingRight;
      if (capturedStyles.paddingBottom) display.style.paddingBottom = capturedStyles.paddingBottom;
      if (capturedStyles.paddingLeft) display.style.paddingLeft = capturedStyles.paddingLeft;
    }
  } catch (err) {
    // Ignore style application errors
  }
  
  // Insert wrapper before input
  input.parentNode.insertBefore(wrapper, input);
  
  // Move input inside wrapper
  wrapper.appendChild(display);
  wrapper.appendChild(input);
  
  // Mark input as wrapped
  input.classList.add(INPUT_CONSTANTS.WRAPPED_INPUT_CLASS);
  input.setAttribute('tabindex', '-1');
  // Remove autofocus and hide input by default to prevent OSK popup
  if (input.hasAttribute('autofocus')) {
    input.removeAttribute('autofocus');
  }
  input.style.display = 'none';
  wrappedInputs.set(input, { wrapper: wrapper, display: display, opts: opts });

  // If input was focused, move focus to wrapper
  try {
    if (document.activeElement === input) {
      input.blur();
      setTimeout(function() {
        wrapper.focus();
      }, 0);
    }
  } catch (err) {
    // Ignore
  }
  
  // Handle wrapper activation (Enter key or click)
  wrapper.addEventListener('keydown', function(e) {
    if (e.keyCode === KEYS.ENTER) {
      e.preventDefault();
      e.stopPropagation();
      activateInput(input);
    }
  });
  
  wrapper.addEventListener('click', function() {
    activateInput(input);
  });
  
  // Handle input deactivation
  input.addEventListener('blur', function() {
    deactivateInput(input);
  });
  
  input.addEventListener('keydown', function(e) {
    // Escape or Back or IME cancel - deactivate and return to wrapper
    if (e.keyCode === 27 || e.keyCode === KEYS.BACK || e.keyCode === KEYS.IME_CANCEL) {
      e.preventDefault();
      deactivateInput(input);
      // Focus wrapper after a small delay to ensure IME is fully dismissed
      setTimeout(function() {
        try {
          wrapper.focus();
        } catch (err) {
          // Ignore focus errors
        }
      }, INPUT_CONSTANTS.IME_DISMISSAL_DELAY_MS);
    } else if (e.keyCode === KEYS.ENTER) {
      // Enter - submit and deactivate
      setTimeout(function() {
        deactivateInput(input);
      }, INPUT_CONSTANTS.IME_DISMISSAL_DELAY_MS);
    }
  });
  
  // Sync display when input changes
  input.addEventListener('input', function() {
    display.textContent = input.value || placeholder;
    if (input.value) {
      display.classList.add(opts.hasValueClass);
    } else {
      display.classList.remove(opts.hasValueClass);
    }
  });
}

/**
 * Activate an input for editing
 * @param {HTMLInputElement} input
 */
export function activateInput(input) {
  var data = wrappedInputs.get(input);
  if (!data) return;
  
  var wrapper = data.wrapper;
  var display = data.display;
  var opts = data.opts;
  
  wrapper.classList.add(opts.activeClass);
  display.style.display = 'none';
  input.style.display = 'block';
  input.setAttribute('tabindex', '0');
  
  try {
    input.focus();
    input.select();
  } catch (err) {
    console.warn('TizenPortal [TextInput]: Focus error:', err.message);
  }

  setIMEActive(true);

  try {
    if (window.TizenPortal && window.TizenPortal.input && window.TizenPortal.input.setExitKeyCapture) {
      window.TizenPortal.input.setExitKeyCapture(true);
    }
  } catch (err) {
    // Ignore
  }
  
  // Call custom handler
  if (typeof opts.onActivate === 'function') {
    opts.onActivate(input);
  }
  
  console.log('TizenPortal [TextInput]: Input activated');
}

/**
 * Deactivate an input (return to display mode)
 * @param {HTMLInputElement} input
 */
export function deactivateInput(input) {
  var data = wrappedInputs.get(input);
  if (!data) return;
  
  var wrapper = data.wrapper;
  var display = data.display;
  var opts = data.opts;
  
  if (!wrapper.classList.contains(opts.activeClass)) return;
  
  // IMPORTANT: Blur the input first, then explicitly focus the wrapper
  // This dismisses the Tizen IME modal properly and prevents the OK/Cancel
  // dialog from remaining open. Based on Samsung's official IME sample:
  // https://github.com/SamsungDForum/SampleWebApps-IME
  // "Blur the text input field and return focus to document.body (or whatever
  // element you use for gathering keypress events for navigation). Otherwise
  // unexpected behaviour may be expected."
  try {
    if (document.activeElement === input) {
      input.blur();
      // Explicitly focus the wrapper to fully dismiss IME
      wrapper.focus();
    }
  } catch (err) {
    console.warn('TizenPortal [TextInput]: Blur/focus error:', err.message);
  }
  
  wrapper.classList.remove(opts.activeClass);
  var placeholder = input.getAttribute('placeholder') || opts.defaultPlaceholder;
  display.textContent = input.value || placeholder;
  display.style.display = 'block';
  input.style.display = 'none';
  input.setAttribute('tabindex', '-1');
  
  if (input.value) {
    display.classList.add(opts.hasValueClass);
  } else {
    display.classList.remove(opts.hasValueClass);
  }
  
  // Call custom handler
  if (typeof opts.onDeactivate === 'function') {
    opts.onDeactivate(input);
  }

  setIMEActive(false);

  try {
    if (window.TizenPortal && window.TizenPortal.input && window.TizenPortal.input.setExitKeyCapture) {
      window.TizenPortal.input.setExitKeyCapture(false);
    }
  } catch (err) {
    // Ignore
  }
  
  console.log('TizenPortal [TextInput]: Input deactivated');
}

/**
 * Unwrap a previously wrapped input
 * @param {HTMLInputElement} input
 */
export function unwrapInput(input) {
  var data = wrappedInputs.get(input);
  if (!data) return;
  
  var wrapper = data.wrapper;
  
  // Move input back out of wrapper
  wrapper.parentNode.insertBefore(input, wrapper);
  wrapper.parentNode.removeChild(wrapper);
  
  // Restore input state
  input.classList.remove(INPUT_CONSTANTS.WRAPPED_INPUT_CLASS);
  input.removeAttribute('tabindex');
  input.style.display = '';
  
  wrappedInputs.delete(input);
  setIMEActive(false);

  try {
    if (window.TizenPortal && window.TizenPortal.input && window.TizenPortal.input.setExitKeyCapture) {
      window.TizenPortal.input.setExitKeyCapture(false);
    }
  } catch (err) {
    // Ignore
  }
  console.log('TizenPortal [TextInput]: Input unwrapped');
}

/**
 * Check if IME/keyboard is active
 * @returns {boolean}
 */
export function isIMEActive() {
  return imeActive;
}

/**
 * Force IME active state
 * @param {boolean} value
 */
export function setIMEActive(value) {
  imeActive = !!value;
  if (!imeActive) {
    imeDismissedAt = Date.now();
  }
}

/**
 * Get the last IME dismissal timestamp
 * @returns {number}
 */
export function getImeDismissedAt() {
  return imeDismissedAt || 0;
}

/**
 * Unwrap all inputs matching selector
 * @param {string} selector
 */
export function unwrapTextInputs(selector) {
  var inputs = document.querySelectorAll(selector);
  
  for (var i = 0; i < inputs.length; i++) {
    unwrapInput(inputs[i]);
  }
}

/**
 * Check if an input is currently active (editing)
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
export function isInputActive(input) {
  var data = wrappedInputs.get(input);
  if (!data) return false;
  return data.wrapper.classList.contains(data.opts.activeClass);
}

/**
 * Check if an input is wrapped
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
export function isInputWrapped(input) {
  return wrappedInputs.has(input);
}
