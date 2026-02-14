/**
 * TizenPortal Element Registration System
 * 
 * Provides a centralized API for bundles to register declarative element manipulations.
 * Bundles declare selectors and operations, and the core handles:
 * - Querying and processing elements
 * - Observing DOM for dynamically added elements
 * - Tracking processed elements to avoid duplicates
 * - Cleaning up on bundle unload
 * 
 * This extends the proven card registration pattern to general element manipulation.
 * 
 * Supported operations:
 * - focusable: Make elements keyboard/remote navigable
 * - class: Add/remove CSS classes
 * - attribute: Set HTML attributes
 * - style: Apply inline CSS styles
 * - hide/show: Toggle element visibility
 * - remove: Remove elements from DOM (use carefully)
 * 
 * Usage in bundles:
 *   TizenPortal.elements.register({
 *     selector: '.my-element',
 *     operation: 'focusable',
 *     nav: 'vertical'
 *   });
 */

/**
 * Registered element manipulation definitions
 * @type {Array<Object>}
 */
var registrations = [];

/**
 * MutationObserver for watching DOM changes
 */
var observer = null;

/**
 * Debounce timer for processing
 */
var processTimer = null;

/**
 * Interval timer for periodic rescans
 */
var rescanInterval = null;

/**
 * Counter for generating unique registration IDs
 */
var registrationIdCounter = 0;

/**
 * Validation: Operation types that are allowed
 */
var VALID_OPERATIONS = ['focusable', 'class', 'attribute', 'style', 'hide', 'show', 'remove'];

/**
 * Validation: Elements that cannot be removed
 */
var PROTECTED_ELEMENTS = ['HTML', 'HEAD', 'BODY'];

/**
 * Register an element manipulation
 * @param {Object} config - Element registration config
 * @param {string} config.selector - CSS selector for target elements
 * @param {string} config.operation - Operation type: focusable, class, attribute, style, hide, show, remove
 * @param {string} [config.container] - Optional container selector to scope the search
 * @param {string} [config.nav] - For focusable: navigation direction (vertical, horizontal)
 * @param {Array<string>} [config.classes] - For class operation: classes to add/remove
 * @param {boolean} [config.remove] - For class operation: remove instead of add
 * @param {Object} [config.attributes] - For attribute operation: key-value pairs
 * @param {Object} [config.styles] - For style operation: CSS property-value pairs
 * @param {boolean} [config.important] - For style operation: apply with !important
 * @param {Function} [config.condition] - Optional condition function(element) => boolean
 * @param {boolean} [config.immediate] - Process immediately without debounce
 * @param {number} [config.debounce] - Custom debounce time in ms (default 100)
 * @returns {boolean} True if registration successful
 */
export function registerElements(config) {
  // Validate required fields
  if (!config || !config.selector) {
    console.warn('TizenPortal [Elements]: Invalid registration - selector required');
    return false;
  }
  
  if (!config.operation) {
    console.warn('TizenPortal [Elements]: Invalid registration - operation required');
    return false;
  }
  
  // Validate operation type
  if (VALID_OPERATIONS.indexOf(config.operation) === -1) {
    console.warn('TizenPortal [Elements]: Invalid operation "' + config.operation + '". Valid operations: ' + VALID_OPERATIONS.join(', '));
    return false;
  }
  
  // Validate selector syntax
  try {
    document.querySelector(config.selector);
  } catch (err) {
    console.warn('TizenPortal [Elements]: Invalid selector "' + config.selector + '": ' + err.message);
    return false;
  }
  
  // Generate unique ID
  var id = 'reg-' + (++registrationIdCounter);
  
  // Store registration
  var registration = {
    id: id,
    selector: config.selector,
    operation: config.operation,
    container: config.container || null,
    config: extractOperationConfig(config),
    condition: config.condition || null,
    immediate: config.immediate || false,
    debounce: config.debounce || 100,
    processed: 0,
    lastProcessed: null
  };
  
  registrations.push(registration);
  
  console.log('TizenPortal [Elements]: Registered', config.operation, 'for', config.selector);
  
  // Start observer if this is the first registration
  if (registrations.length === 1 && !observer) {
    startObserver();
  }
  
  // Process immediately or with debounce
  if (config.immediate) {
    processElements();
  } else {
    scheduleProcessing(config.debounce || 100);
  }
  
  return true;
}

/**
 * Extract operation-specific configuration
 * @param {Object} config - Full registration config
 * @returns {Object} Operation-specific config
 */
function extractOperationConfig(config) {
  var operationConfig = {};
  
  switch (config.operation) {
    case 'focusable':
      if (config.nav) operationConfig.nav = config.nav;
      if (config.classes) operationConfig.classes = config.classes;
      break;
      
    case 'class':
      operationConfig.classes = config.classes || [];
      operationConfig.remove = config.remove || false;
      break;
      
    case 'attribute':
      operationConfig.attributes = config.attributes || {};
      break;
      
    case 'style':
      operationConfig.styles = config.styles || {};
      operationConfig.important = config.important || false;
      break;
      
    case 'hide':
    case 'show':
      // No additional config needed
      break;
      
    case 'remove':
      // No additional config needed
      break;
  }
  
  return operationConfig;
}

/**
 * Unregister element manipulations by selector and optionally operation
 * @param {string} selector - The selector to unregister
 * @param {string} [operation] - Optional operation type to filter
 */
export function unregisterElements(selector, operation) {
  var removedCount = 0;
  
  for (var i = registrations.length - 1; i >= 0; i--) {
    var reg = registrations[i];
    
    if (reg.selector === selector && (!operation || reg.operation === operation)) {
      registrations.splice(i, 1);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log('TizenPortal [Elements]: Unregistered', removedCount, 'registration(s) for', selector);
  }
}

/**
 * Clear all element registrations
 */
export function clearRegistrations() {
  var count = registrations.length;
  registrations = [];
  console.log('TizenPortal [Elements]: Cleared', count, 'registration(s)');
}

/**
 * Get all registrations (for debugging)
 * @returns {Array} Copy of registrations array
 */
export function getRegistrations() {
  return registrations.slice();
}

/**
 * Process all registered element manipulations
 * Applies operations to matching elements that haven't been processed yet
 * @returns {number} Number of elements processed
 */
export function processElements() {
  var totalProcessed = 0;
  
  for (var i = 0; i < registrations.length; i++) {
    var reg = registrations[i];
    var count = processRegistration(reg);
    totalProcessed += count;
  }
  
  if (totalProcessed > 0) {
    console.log('TizenPortal [Elements]: Processed', totalProcessed, 'element(s)');
  }
  
  return totalProcessed;
}

/**
 * Process a single registration
 * @param {Object} registration - The registration to process
 * @returns {number} Number of elements processed
 */
function processRegistration(registration) {
  var count = 0;
  var container = registration.container ? document.querySelector(registration.container) : document;
  
  if (!container) return 0;
  
  try {
    var elements = container.querySelectorAll(registration.selector);
    
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      
      // Check if already processed for this registration
      var processedKey = 'data-tp-processed-' + registration.id;
      if (element.getAttribute(processedKey) === 'true') {
        continue;
      }
      
      // Check condition if provided
      if (registration.condition && !registration.condition(element)) {
        continue;
      }
      
      // Apply the operation
      var success = applyOperation(element, registration);
      
      if (success) {
        // Mark as processed
        element.setAttribute(processedKey, 'true');
        count++;
      }
    }
    
    // Update registration stats
    registration.processed += count;
    registration.lastProcessed = new Date();
    
  } catch (err) {
    console.warn('TizenPortal [Elements]: Error processing', registration.selector, err.message);
  }
  
  return count;
}

/**
 * Apply an operation to an element
 * @param {Element} element - The target element
 * @param {Object} registration - The registration containing operation details
 * @returns {boolean} True if operation was applied successfully
 */
function applyOperation(element, registration) {
  try {
    switch (registration.operation) {
      case 'focusable':
        return applyFocusable(element, registration.config);
        
      case 'class':
        return applyClass(element, registration.config);
        
      case 'attribute':
        return applyAttribute(element, registration.config);
        
      case 'style':
        return applyStyle(element, registration.config);
        
      case 'hide':
        return applyHide(element);
        
      case 'show':
        return applyShow(element);
        
      case 'remove':
        return applyRemove(element);
        
      default:
        console.warn('TizenPortal [Elements]: Unknown operation', registration.operation);
        return false;
    }
  } catch (err) {
    console.warn('TizenPortal [Elements]: Error applying', registration.operation, 'to element:', err.message);
    return false;
  }
}

/**
 * Apply focusable operation
 * Makes element keyboard/remote navigable
 */
function applyFocusable(element, config) {
  // Set tabindex if not already set
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }
  
  // Set navigation direction
  if (config.nav) {
    element.setAttribute('data-tp-nav', config.nav);
  }
  
  // Add classes
  if (config.classes && config.classes.length > 0) {
    for (var i = 0; i < config.classes.length; i++) {
      if (!element.classList.contains(config.classes[i])) {
        element.classList.add(config.classes[i]);
      }
    }
  }
  
  // Add accessibility role if not a native interactive element
  var tagName = element.tagName.toUpperCase();
  if (tagName !== 'A' && tagName !== 'BUTTON' && tagName !== 'INPUT' && 
      tagName !== 'SELECT' && tagName !== 'TEXTAREA' && !element.hasAttribute('role')) {
    element.setAttribute('role', 'button');
  }
  
  return true;
}

/**
 * Apply class operation
 * Adds or removes CSS classes
 */
function applyClass(element, config) {
  var classes = config.classes || [];
  var shouldRemove = config.remove || false;
  
  for (var i = 0; i < classes.length; i++) {
    var className = classes[i];
    
    if (shouldRemove) {
      if (element.classList.contains(className)) {
        element.classList.remove(className);
      }
    } else {
      if (!element.classList.contains(className)) {
        element.classList.add(className);
      }
    }
  }
  
  return true;
}

/**
 * Apply attribute operation
 * Sets HTML attributes
 */
function applyAttribute(element, config) {
  var attributes = config.attributes || {};
  
  for (var key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      var value = attributes[key];
      
      // Handle function values (dynamic attributes)
      if (typeof value === 'function') {
        value = value(element);
      }
      
      // Handle null (remove attribute)
      if (value === null) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, String(value));
      }
    }
  }
  
  return true;
}

/**
 * Apply style operation
 * Sets inline CSS styles
 */
function applyStyle(element, config) {
  var styles = config.styles || {};
  var important = config.important || false;
  
  for (var key in styles) {
    if (styles.hasOwnProperty(key)) {
      var value = styles[key];
      
      // Convert camelCase to kebab-case
      var cssProperty = key.replace(/([A-Z])/g, function(match) {
        return '-' + match.toLowerCase();
      });
      
      // Apply style
      if (important) {
        element.style.setProperty(cssProperty, value, 'important');
      } else {
        element.style[key] = value;
      }
    }
  }
  
  return true;
}

/**
 * Apply hide operation
 * Hides element by setting display: none
 */
function applyHide(element) {
  // Store original display value for potential show operation
  if (!element.hasAttribute('data-tp-original-display')) {
    var currentDisplay = window.getComputedStyle(element).display;
    element.setAttribute('data-tp-original-display', currentDisplay);
  }
  
  element.style.display = 'none';
  return true;
}

/**
 * Apply show operation
 * Shows element by restoring original display value
 */
function applyShow(element) {
  var originalDisplay = element.getAttribute('data-tp-original-display');
  
  if (originalDisplay && originalDisplay !== 'none') {
    element.style.display = originalDisplay;
  } else {
    element.style.display = '';
  }
  
  return true;
}

/**
 * Apply remove operation
 * Removes element from DOM with safety checks
 */
function applyRemove(element) {
  // Safety check: cannot remove protected elements
  var tagName = element.tagName.toUpperCase();
  if (PROTECTED_ELEMENTS.indexOf(tagName) !== -1) {
    console.warn('TizenPortal [Elements]: Cannot remove protected element', tagName);
    return false;
  }
  
  // Remove from DOM
  if (element.parentNode) {
    element.parentNode.removeChild(element);
    return true;
  }
  
  return false;
}

/**
 * Schedule processing with debounce
 * @param {number} delay - Delay in milliseconds
 */
function scheduleProcessing(delay) {
  if (processTimer) {
    clearTimeout(processTimer);
  }
  
  processTimer = setTimeout(function() {
    processElements();
    processTimer = null;
  }, delay);
}

/**
 * Start observing DOM for changes
 */
export function startObserver() {
  if (observer) return;
  
  if (typeof MutationObserver === 'undefined') {
    console.warn('TizenPortal [Elements]: MutationObserver not available, using interval only');
    startRescanInterval();
    return;
  }
  
  observer = new MutationObserver(function(mutations) {
    // Debounce processing
    scheduleProcessing(100);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('TizenPortal [Elements]: Observer started');
  
  // Also start periodic rescan for edge cases
  startRescanInterval();
}

/**
 * Stop observing DOM
 */
export function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (processTimer) {
    clearTimeout(processTimer);
    processTimer = null;
  }
  stopRescanInterval();
  console.log('TizenPortal [Elements]: Observer stopped');
}

/**
 * Start periodic rescan interval
 * Catches elements that may be missed by MutationObserver
 */
function startRescanInterval() {
  if (rescanInterval) return;
  
  rescanInterval = setInterval(function() {
    processElements();
  }, 2000);
}

/**
 * Stop periodic rescan
 */
function stopRescanInterval() {
  if (rescanInterval) {
    clearInterval(rescanInterval);
    rescanInterval = null;
  }
}

/**
 * Initialize the element registration system
 * Called automatically when core is initialized
 */
export function initElements() {
  console.log('TizenPortal [Elements]: System initialized');
  // Observer will be started when first registration is added
}

/**
 * Shutdown the element registration system
 * Called when bundle is unloaded or portal is exited
 */
export function shutdownElements() {
  stopObserver();
  clearRegistrations();
  console.log('TizenPortal [Elements]: System shutdown');
}
