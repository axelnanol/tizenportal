/**
 * TizenPortal Polyfill System
 * 
 * Feature-detection-based polyfill loading.
 * Polyfills are loaded dynamically based on what the browser needs,
 * NOT bundled statically based on target version.
 */

import { polyfillCSSCompatibility } from './css-compatibility.js';

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
 * AbortController polyfill (minimal)
 */
function polyfillAbortController() {
  if (typeof window.AbortController === 'function') {
    return false; // Already exists
  }

  function AbortSignal() {
    this.aborted = false;
    this.onabort = null;
    this._listeners = [];
  }

  AbortSignal.prototype.addEventListener = function(type, listener) {
    if (type !== 'abort' || typeof listener !== 'function') return;
    this._listeners.push(listener);
  };

  AbortSignal.prototype.removeEventListener = function(type, listener) {
    if (type !== 'abort') return;
    var idx = this._listeners.indexOf(listener);
    if (idx !== -1) this._listeners.splice(idx, 1);
  };

  AbortSignal.prototype._dispatch = function() {
    if (typeof this.onabort === 'function') {
      try { this.onabort(); } catch (err) {}
    }
    for (var i = 0; i < this._listeners.length; i++) {
      try { this._listeners[i](); } catch (err) {}
    }
  };

  window.AbortController = function AbortController() {
    this.signal = new AbortSignal();
  };

  window.AbortController.prototype.abort = function() {
    if (this.signal.aborted) return;
    this.signal.aborted = true;
    this.signal._dispatch();
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
 * String.prototype.repeat polyfill
 */
function polyfillStringRepeat() {
  if (String.prototype.repeat) {
    return false; // Already exists
  }

  String.prototype.repeat = function(count) {
    if (this == null) {
      throw new TypeError('can\'t convert ' + this + ' to object');
    }
    var str = '' + this;
    count = +count;
    if (count != count) {
      count = 0;
    }
    if (count < 0) {
      throw new RangeError('repeat count must be non-negative');
    }
    if (count == Infinity) {
      throw new RangeError('repeat count must be less than infinity');
    }
    count = Math.floor(count);
    if (str.length == 0 || count == 0) {
      return '';
    }
    if (str.length * count >= 1 << 28) {
      throw new RangeError('repeat count must not overflow maximum string size');
    }
    var result = '';
    while (count > 0) {
      if (count & 1) {
        result += str;
      }
      count >>>= 1;
      str += str;
    }
    return result;
  };

  return true;
}

/**
 * String.prototype.padStart polyfill
 */
function polyfillStringPadStart() {
  if (String.prototype.padStart) {
    return false; // Already exists
  }

  String.prototype.padStart = function(targetLength, padString) {
    targetLength = targetLength >> 0;
    padString = String(typeof padString !== 'undefined' ? padString : ' ');
    if (this.length >= targetLength) {
      return String(this);
    }
    targetLength = targetLength - this.length;
    if (targetLength > padString.length) {
      padString += padString.repeat(Math.ceil(targetLength / padString.length));
    }
    return padString.slice(0, targetLength) + String(this);
  };

  return true;
}

/**
 * String.prototype.padEnd polyfill
 */
function polyfillStringPadEnd() {
  if (String.prototype.padEnd) {
    return false; // Already exists
  }

  String.prototype.padEnd = function(targetLength, padString) {
    targetLength = targetLength >> 0;
    padString = String(typeof padString !== 'undefined' ? padString : ' ');
    if (this.length >= targetLength) {
      return String(this);
    }
    targetLength = targetLength - this.length;
    if (targetLength > padString.length) {
      padString += padString.repeat(Math.ceil(targetLength / padString.length));
    }
    return String(this) + padString.slice(0, targetLength);
  };

  return true;
}

/**
 * Array.from polyfill
 */
function polyfillArrayFrom() {
  if (Array.from) {
    return false; // Already exists
  }

  Array.from = function(arrayLike, mapFn, thisArg) {
    var C = this;
    var items = Object(arrayLike);
    if (arrayLike == null) {
      throw new TypeError('Array.from requires an array-like object - not null or undefined');
    }
    var len = items.length >>> 0;
    var A = typeof C === 'function' ? Object(new C(len)) : new Array(len);
    var k = 0;
    var kValue;
    while (k < len) {
      kValue = items[k];
      if (mapFn) {
        A[k] = typeof thisArg === 'undefined' ? mapFn(kValue, k) : mapFn.call(thisArg, kValue, k);
      } else {
        A[k] = kValue;
      }
      k += 1;
    }
    A.length = len;
    return A;
  };

  return true;
}

/**
 * Array.of polyfill
 */
function polyfillArrayOf() {
  if (Array.of) {
    return false; // Already exists
  }

  Array.of = function() {
    return Array.prototype.slice.call(arguments);
  };

  return true;
}

/**
 * Array.prototype.find polyfill
 */
function polyfillArrayFind() {
  if (Array.prototype.find) {
    return false; // Already exists
  }

  Array.prototype.find = function(predicate, thisArg) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var value;
    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };

  return true;
}

/**
 * Array.prototype.findIndex polyfill
 */
function polyfillArrayFindIndex() {
  if (Array.prototype.findIndex) {
    return false; // Already exists
  }

  Array.prototype.findIndex = function(predicate, thisArg) {
    if (this == null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var value;
    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };

  return true;
}

/**
 * Object.assign polyfill
 */
function polyfillObjectAssign() {
  if (Object.assign) {
    return false; // Already exists
  }

  Object.assign = function(target) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    var to = Object(target);
    for (var i = 1; i < arguments.length; i++) {
      var nextSource = arguments[i];
      if (nextSource != null) {
        for (var key in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, key)) {
            to[key] = nextSource[key];
          }
        }
      }
    }
    return to;
  };

  return true;
}

/**
 * Number.isInteger polyfill
 */
function polyfillNumberIsInteger() {
  if (Number.isInteger) {
    return false; // Already exists
  }

  Number.isInteger = function(value) {
    return typeof value === 'number' && 
           isFinite(value) && 
           Math.floor(value) === value;
  };

  return true;
}

/**
 * Number.isNaN polyfill
 */
function polyfillNumberIsNaN() {
  if (Number.isNaN) {
    return false; // Already exists
  }

  Number.isNaN = function(value) {
    return typeof value === 'number' && value !== value;
  };

  return true;
}

/**
 * Number.isFinite polyfill
 */
function polyfillNumberIsFinite() {
  if (Number.isFinite) {
    return false; // Already exists
  }

  Number.isFinite = function(value) {
    return typeof value === 'number' && isFinite(value);
  };

  return true;
}

/**
 * NodeList.prototype.forEach polyfill
 */
function polyfillNodeListForEach() {
  if (NodeList.prototype.forEach) {
    return false; // Already exists
  }

  NodeList.prototype.forEach = Array.prototype.forEach;

  return true;
}

/**
 * CustomEvent polyfill for Chrome 47
 */
function polyfillCustomEvent() {
  if (typeof window.CustomEvent === 'function') {
    return false; // Already exists
  }

  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;

  return true;
}

/**
 * Promise.prototype.finally polyfill
 */
function polyfillPromiseFinally() {
  if (Promise.prototype.finally) {
    return false; // Already exists
  }

  Promise.prototype.finally = function(callback) {
    var constructor = this.constructor;
    return this.then(
      function(value) {
        return constructor.resolve(callback()).then(function() {
          return value;
        });
      },
      function(reason) {
        return constructor.resolve(callback()).then(function() {
          throw reason;
        });
      }
    );
  };

  return true;
}

/**
 * Element.prototype.remove polyfill
 */
function polyfillElementRemove() {
  if (Element.prototype.remove) {
    return false; // Already exists
  }

  Element.prototype.remove = function() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
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

  // CSS Compatibility (Chrome 47 clamp() polyfill + TV readability baseline)
  if (polyfillCSSCompatibility()) loaded.push('CSS-Compatibility');

  // DOM APIs
  if (polyfillDOMRect()) loaded.push('DOMRect');
  if (polyfillDOMRectReadOnly()) loaded.push('DOMRectReadOnly');
  if (polyfillElementMatches()) loaded.push('Element.matches');
  if (polyfillElementClosest()) loaded.push('Element.closest');
  if (polyfillElementRemove()) loaded.push('Element.remove');
  if (polyfillResizeObserver()) loaded.push('ResizeObserver');
  if (polyfillCustomEvent()) loaded.push('CustomEvent');
  if (polyfillNodeListForEach()) loaded.push('NodeList.forEach');

  // Array methods
  if (polyfillArrayIncludes()) loaded.push('Array.includes');
  if (polyfillArrayFrom()) loaded.push('Array.from');
  if (polyfillArrayOf()) loaded.push('Array.of');
  if (polyfillArrayFind()) loaded.push('Array.find');
  if (polyfillArrayFindIndex()) loaded.push('Array.findIndex');

  // Object methods
  if (polyfillObjectEntries()) loaded.push('Object.entries');
  if (polyfillObjectValues()) loaded.push('Object.values');
  if (polyfillObjectAssign()) loaded.push('Object.assign');

  // String methods
  if (polyfillStringStartsWith()) loaded.push('String.startsWith');
  if (polyfillStringEndsWith()) loaded.push('String.endsWith');
  if (polyfillStringRepeat()) loaded.push('String.repeat');
  if (polyfillStringPadStart()) loaded.push('String.padStart');
  if (polyfillStringPadEnd()) loaded.push('String.padEnd');

  // Number methods
  if (polyfillNumberIsInteger()) loaded.push('Number.isInteger');
  if (polyfillNumberIsNaN()) loaded.push('Number.isNaN');
  if (polyfillNumberIsFinite()) loaded.push('Number.isFinite');

  // Promise enhancements
  if (polyfillPromiseFinally()) loaded.push('Promise.finally');

  // AbortController
  if (polyfillAbortController()) loaded.push('AbortController');

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
