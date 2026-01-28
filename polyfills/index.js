/**
 * TizenPortal Polyfill System
 * 
 * Feature-detection-based polyfill loading.
 * Polyfills are loaded dynamically based on what the browser needs,
 * NOT bundled statically based on target version.
 */

/**
 * List of loaded polyfills
 */
var loaded = [];

/**
 * DOMRect polyfill for Chrome 47
 * Needed for spatial navigation calculations
 */
function polyfillDOMRect() {
  if (typeof window.DOMRect === 'function') {
    return false; // Already exists
  }

  // Basic DOMRect implementation
  window.DOMRect = function DOMRect(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
    this.top = this.y;
    this.left = this.x;
    this.bottom = this.y + this.height;
    this.right = this.x + this.width;
  };

  window.DOMRect.prototype.toJSON = function() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      top: this.top,
      left: this.left,
      bottom: this.bottom,
      right: this.right,
    };
  };

  window.DOMRect.fromRect = function(rect) {
    rect = rect || {};
    return new window.DOMRect(rect.x, rect.y, rect.width, rect.height);
  };

  return true;
}

/**
 * DOMRectReadOnly polyfill
 */
function polyfillDOMRectReadOnly() {
  if (typeof window.DOMRectReadOnly === 'function') {
    return false; // Already exists
  }

  window.DOMRectReadOnly = function DOMRectReadOnly(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
    this.top = this.y;
    this.left = this.x;
    this.bottom = this.y + this.height;
    this.right = this.x + this.width;
  };

  window.DOMRectReadOnly.prototype.toJSON = function() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      top: this.top,
      left: this.left,
      bottom: this.bottom,
      right: this.right,
    };
  };

  window.DOMRectReadOnly.fromRect = function(rect) {
    rect = rect || {};
    return new window.DOMRectReadOnly(rect.x, rect.y, rect.width, rect.height);
  };

  return true;
}

/**
 * Element.closest polyfill for Chrome 47
 */
function polyfillElementClosest() {
  if (Element.prototype.closest) {
    return false; // Already exists
  }

  Element.prototype.closest = function(selector) {
    var el = this;
    while (el && el.nodeType === 1) {
      if (el.matches(selector)) {
        return el;
      }
      el = el.parentElement || el.parentNode;
    }
    return null;
  };

  return true;
}

/**
 * Element.matches polyfill (needed for closest)
 */
function polyfillElementMatches() {
  if (Element.prototype.matches) {
    return false; // Already exists
  }

  Element.prototype.matches =
    Element.prototype.matchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.oMatchesSelector ||
    Element.prototype.webkitMatchesSelector ||
    function(selector) {
      var matches = (this.document || this.ownerDocument).querySelectorAll(selector);
      var i = matches.length;
      while (--i >= 0 && matches.item(i) !== this) {}
      return i > -1;
    };

  return true;
}

/**
 * Array.prototype.includes polyfill
 */
function polyfillArrayIncludes() {
  if (Array.prototype.includes) {
    return false; // Already exists
  }

  Array.prototype.includes = function(searchElement, fromIndex) {
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }
    var o = Object(this);
    var len = o.length >>> 0;
    if (len === 0) return false;
    var n = fromIndex | 0;
    var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    while (k < len) {
      if (o[k] === searchElement) return true;
      k++;
    }
    return false;
  };

  return true;
}

/**
 * Object.entries polyfill
 */
function polyfillObjectEntries() {
  if (Object.entries) {
    return false; // Already exists
  }

  Object.entries = function(obj) {
    var ownProps = Object.keys(obj);
    var i = ownProps.length;
    var resArray = new Array(i);
    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resArray;
  };

  return true;
}

/**
 * Object.values polyfill
 */
function polyfillObjectValues() {
  if (Object.values) {
    return false; // Already exists
  }

  Object.values = function(obj) {
    var vals = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        vals.push(obj[key]);
      }
    }
    return vals;
  };

  return true;
}

/**
 * String.prototype.startsWith polyfill
 */
function polyfillStringStartsWith() {
  if (String.prototype.startsWith) {
    return false; // Already exists
  }

  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };

  return true;
}

/**
 * String.prototype.endsWith polyfill
 */
function polyfillStringEndsWith() {
  if (String.prototype.endsWith) {
    return false; // Already exists
  }

  String.prototype.endsWith = function(searchString, length) {
    if (length === undefined || length > this.length) {
      length = this.length;
    }
    return this.substring(length - searchString.length, length) === searchString;
  };

  return true;
}

/**
 * ResizeObserver polyfill for Chrome < 64
 * Provides a minimal implementation that ABS and other SPAs need
 */
function polyfillResizeObserver() {
  if (typeof window.ResizeObserver === 'function') {
    return false; // Already exists
  }

  // Throttle interval (ms) - balance between responsiveness and performance
  var POLL_INTERVAL = 100;

  /**
   * Minimal ResizeObserver implementation
   * Uses throttled polling since MutationObserver doesn't detect size changes
   */
  window.ResizeObserver = function ResizeObserver(callback) {
    this._callback = callback;
    this._observedElements = [];
    this._timeoutId = null;
    this._boundCheck = this._check.bind(this);
  };

  window.ResizeObserver.prototype.observe = function(target) {
    if (!target || !(target instanceof Element)) return;
    
    // Check if already observing
    for (var i = 0; i < this._observedElements.length; i++) {
      if (this._observedElements[i].target === target) return;
    }
    
    var rect = target.getBoundingClientRect();
    this._observedElements.push({
      target: target,
      width: rect.width,
      height: rect.height,
    });
    
    // CRITICAL: Fire initial callback after delays to let CSS settle
    // Virtual scrollers and layout calculators depend on accurate initial dimensions
    // We fire twice - once early for quick layouts, once later for complex ones
    var self = this;
    
    var fireCallback = function(delay) {
      setTimeout(function() {
        if (!document.body || !document.body.contains(target)) return;
        try {
          var measuredRect = target.getBoundingClientRect();
          
          // DEBUG: Log dimensions being reported
          if (typeof console !== 'undefined' && console.log) {
            var tagInfo = target.tagName + (target.id ? '#' + target.id : '') + (target.className ? '.' + String(target.className).split(' ')[0] : '');
            console.log('[ResizeObserver] ' + tagInfo + ' @ ' + delay + 'ms: ' + Math.round(measuredRect.width) + 'x' + Math.round(measuredRect.height) + ' (window: ' + window.innerWidth + 'x' + window.innerHeight + ')');
            
            // Extra debug for bookshelf container
            var bookshelf = document.getElementById('bookshelf');
            if (bookshelf) {
              console.log('[ResizeObserver] #bookshelf clientWidth=' + bookshelf.clientWidth + ' offsetWidth=' + bookshelf.offsetWidth);
            }
          }
          
          // Update stored dimensions
          for (var i = 0; i < self._observedElements.length; i++) {
            if (self._observedElements[i].target === target) {
              self._observedElements[i].width = measuredRect.width;
              self._observedElements[i].height = measuredRect.height;
              break;
            }
          }
          var entry = {
            target: target,
            contentRect: {
              x: 0,
              y: 0,
              width: measuredRect.width,
              height: measuredRect.height,
              top: 0,
              right: measuredRect.width,
              bottom: measuredRect.height,
              left: 0,
            },
            borderBoxSize: [{
              blockSize: measuredRect.height,
              inlineSize: measuredRect.width,
            }],
            contentBoxSize: [{
              blockSize: measuredRect.height,
              inlineSize: measuredRect.width,
            }],
          };
          self._callback([entry], self);
        } catch (err) {
          // Ignore errors from callback
        }
      }, delay);
    };
    
    // Fire at multiple delays to catch different layout stages
    fireCallback(50);   // Quick initial
    fireCallback(200);  // After Vue renders
    fireCallback(500);  // After images/lazy content
    
    // Start polling if not already
    if (!this._timeoutId) {
      this._scheduleCheck();
    }
  };

  window.ResizeObserver.prototype.unobserve = function(target) {
    for (var i = 0; i < this._observedElements.length; i++) {
      if (this._observedElements[i].target === target) {
        this._observedElements.splice(i, 1);
        break;
      }
    }
    
    // Stop polling if nothing to observe
    if (this._observedElements.length === 0 && this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  };

  window.ResizeObserver.prototype.disconnect = function() {
    this._observedElements = [];
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  };

  window.ResizeObserver.prototype._scheduleCheck = function() {
    this._timeoutId = setTimeout(this._boundCheck, POLL_INTERVAL);
  };

  window.ResizeObserver.prototype._check = function() {
    var entries = [];
    
    // Filter out elements that are no longer in the document
    var validElements = [];
    for (var i = 0; i < this._observedElements.length; i++) {
      var obs = this._observedElements[i];
      if (obs.target && document.body && document.body.contains(obs.target)) {
        validElements.push(obs);
      }
    }
    this._observedElements = validElements;
    
    for (var j = 0; j < this._observedElements.length; j++) {
      var obs = this._observedElements[j];
      try {
        var rect = obs.target.getBoundingClientRect();
        
        if (rect.width !== obs.width || rect.height !== obs.height) {
          obs.width = rect.width;
          obs.height = rect.height;
          
          // Create a ResizeObserverEntry-like object
          entries.push({
            target: obs.target,
            contentRect: {
              x: 0,
              y: 0,
              width: rect.width,
              height: rect.height,
              top: 0,
              right: rect.width,
              bottom: rect.height,
              left: 0,
            },
            borderBoxSize: [{
              blockSize: rect.height,
              inlineSize: rect.width,
            }],
            contentBoxSize: [{
              blockSize: rect.height,
              inlineSize: rect.width,
            }],
          });
        }
      } catch (err) {
        // Element may have been removed, skip it
      }
    }
    
    if (entries.length > 0) {
      try {
        this._callback(entries, this);
      } catch (err) {
        // Don't let callback errors stop the observer
      }
    }
    
    // Continue polling
    if (this._observedElements.length > 0) {
      this._scheduleCheck();
    }
  };

  return true;
}

/**
 * Initialize all polyfills based on feature detection
 * @returns {string[]} List of loaded polyfill names
 */
export function initPolyfills() {
  loaded = [];

  // DOM APIs
  if (polyfillDOMRect()) loaded.push('DOMRect');
  if (polyfillDOMRectReadOnly()) loaded.push('DOMRectReadOnly');
  if (polyfillElementMatches()) loaded.push('Element.matches');
  if (polyfillElementClosest()) loaded.push('Element.closest');
  if (polyfillResizeObserver()) loaded.push('ResizeObserver');

  // Array methods
  if (polyfillArrayIncludes()) loaded.push('Array.includes');

  // Object methods
  if (polyfillObjectEntries()) loaded.push('Object.entries');
  if (polyfillObjectValues()) loaded.push('Object.values');

  // String methods
  if (polyfillStringStartsWith()) loaded.push('String.startsWith');
  if (polyfillStringEndsWith()) loaded.push('String.endsWith');

  return loaded;
}

/**
 * Check if a polyfill was loaded
 * @param {string} name - Polyfill name
 * @returns {boolean}
 */
export function hasPolyfill(name) {
  return loaded.indexOf(name) !== -1;
}

/**
 * Get list of all loaded polyfills
 * @returns {string[]}
 */
export function getLoadedPolyfills() {
  return loaded.slice();
}
