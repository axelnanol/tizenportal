/**
 * TizenPortal Diagnostics - Console Capture
 * 
 * Captures console output for the diagnostics panel.
 */

/**
 * Maximum number of log entries to keep
 */
var MAX_LOG_ENTRIES = 500;

/**
 * Captured log entries
 */
var logEntries = [];

/**
 * Original console methods
 */
var originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

/**
 * Log entry change listeners
 */
var logListeners = [];

/**
 * Initialize diagnostics (console capture)
 */
export function initDiagnostics() {
  // Wrap console methods
  console.log = function() {
    captureLog('log', arguments);
    originalConsole.log.apply(console, arguments);
  };

  console.warn = function() {
    captureLog('warn', arguments);
    originalConsole.warn.apply(console, arguments);
  };

  console.error = function() {
    captureLog('error', arguments);
    originalConsole.error.apply(console, arguments);
  };

  console.info = function() {
    captureLog('info', arguments);
    originalConsole.info.apply(console, arguments);
  };

  // Capture uncaught errors
  window.onerror = function(message, source, lineno, colno, error) {
    captureLog('error', ['Uncaught: ' + message, 'at', source + ':' + lineno + ':' + colno]);
  };

  // Capture unhandled promise rejections
  window.onunhandledrejection = function(event) {
    captureLog('error', ['Unhandled Promise Rejection:', event.reason]);
  };
}

/**
 * Capture a log entry
 * @param {string} level - Log level (log, warn, error, info)
 * @param {IArguments} args - Console arguments
 */
function captureLog(level, args) {
  var message = formatArgs(args);

  var entry = {
    timestamp: Date.now(),
    level: level,
    message: message,
  };

  logEntries.push(entry);

  // Trim if exceeds max
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries = logEntries.slice(-MAX_LOG_ENTRIES);
  }

  // Notify listeners
  for (var i = 0; i < logListeners.length; i++) {
    try {
      logListeners[i](entry);
    } catch (err) {
      // Don't recurse
      originalConsole.error('Log listener error:', err);
    }
  }
}

/**
 * Format console arguments to a string
 * @param {IArguments} args
 * @returns {string}
 */
function formatArgs(args) {
  var parts = [];

  for (var i = 0; i < args.length; i++) {
    var arg = args[i];

    if (arg === null) {
      parts.push('null');
    } else if (arg === undefined) {
      parts.push('undefined');
    } else if (arg instanceof Error) {
      // Special handling for Error objects
      parts.push('[' + (arg.name || 'Error') + ': ' + (arg.message || '(no message)') + ']');
    } else if (typeof arg === 'object') {
      // Check if it's an Error-like object (has name and message)
      if (arg.name && arg.message !== undefined) {
        parts.push('[' + arg.name + ': ' + arg.message + ']');
      } else {
        try {
          parts.push(JSON.stringify(arg));
        } catch (err) {
          parts.push('[Object]');
        }
      }
    } else {
      parts.push(String(arg));
    }
  }

  return parts.join(' ');
}

/**
 * Log a message (TizenPortal prefixed)
 * @param {...*} args
 */
export function log() {
  var args = ['TizenPortal:'];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  console.log.apply(console, args);
}

/**
 * Log a warning (TizenPortal prefixed)
 * @param {...*} args
 */
export function warn() {
  var args = ['TizenPortal:'];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  console.warn.apply(console, args);
}

/**
 * Log an error (TizenPortal prefixed)
 * @param {...*} args
 */
export function error() {
  var args = ['TizenPortal:'];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  console.error.apply(console, args);
}

/**
 * Get all log entries
 * @returns {Array}
 */
export function getLogEntries() {
  return logEntries.slice();
}

/**
 * Clear log entries
 */
export function clearLogEntries() {
  logEntries = [];
}

/**
 * Subscribe to new log entries
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function onLogEntry(callback) {
  if (typeof callback !== 'function') return function() {};

  logListeners.push(callback);

  return function() {
    var index = logListeners.indexOf(callback);
    if (index !== -1) {
      logListeners.splice(index, 1);
    }
  };
}

/**
 * Format timestamp for display
 * @param {number} timestamp
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  var date = new Date(timestamp);
  var h = String(date.getHours()).padStart ? String(date.getHours()).padStart(2, '0') : ('0' + date.getHours()).slice(-2);
  var m = String(date.getMinutes()).padStart ? String(date.getMinutes()).padStart(2, '0') : ('0' + date.getMinutes()).slice(-2);
  var s = String(date.getSeconds()).padStart ? String(date.getSeconds()).padStart(2, '0') : ('0' + date.getSeconds()).slice(-2);
  var ms = String(date.getMilliseconds()).padStart ? String(date.getMilliseconds()).padStart(3, '0') : ('00' + date.getMilliseconds()).slice(-3);
  return h + ':' + m + ':' + s + '.' + ms;
}
