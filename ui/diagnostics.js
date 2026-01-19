/**
 * TizenPortal Diagnostics Panel UI
 * 
 * Displays captured console logs in an overlay panel.
 */

import { getLogEntries, clearLogEntries, onLogEntry, formatTimestamp } from '../diagnostics/console.js';

/**
 * Panel element
 */
var panelElement = null;

/**
 * Logs container element
 */
var logsElement = null;

/**
 * Info element
 */
var infoElement = null;

/**
 * Whether panel is visible
 */
var isVisible = false;

/**
 * Unsubscribe function for log listener
 */
var unsubscribe = null;

/**
 * Initialize diagnostics panel
 */
export function initDiagnosticsPanel() {
  panelElement = document.getElementById('tp-diagnostics');
  logsElement = document.getElementById('tp-diagnostics-logs');
  infoElement = document.getElementById('tp-diagnostics-info');

  if (!panelElement || !logsElement) {
    console.error('TizenPortal: Diagnostics panel elements not found');
    return;
  }

  // Subscribe to new log entries when panel is visible
  unsubscribe = onLogEntry(function(entry) {
    if (isVisible) {
      appendLogEntry(entry);
      scrollToBottom();
    }
  });
}

/**
 * Show the diagnostics panel
 */
export function showDiagnosticsPanel() {
  if (!panelElement) return;

  isVisible = true;
  panelElement.classList.add('visible');

  // Update info
  updateInfo();

  // Render all existing logs
  renderAllLogs();

  // Scroll to bottom
  scrollToBottom();
}

/**
 * Hide the diagnostics panel
 */
export function hideDiagnosticsPanel() {
  if (!panelElement) return;

  isVisible = false;
  panelElement.classList.remove('visible');
}

/**
 * Toggle the diagnostics panel
 */
export function toggleDiagnosticsPanel() {
  if (isVisible) {
    hideDiagnosticsPanel();
  } else {
    showDiagnosticsPanel();
  }
}

/**
 * Check if panel is visible
 * @returns {boolean}
 */
export function isDiagnosticsPanelVisible() {
  return isVisible;
}

/**
 * Clear logs from the panel
 */
export function clearDiagnosticsLogs() {
  clearLogEntries();
  if (logsElement) {
    logsElement.innerHTML = '';
  }
  console.log('TizenPortal: Logs cleared');
}

/**
 * Update the info display
 */
function updateInfo() {
  if (!infoElement) return;

  var info = [];

  // Spatial navigation status
  if (typeof window.navigate === 'function') {
    info.push('SpatNav: OK');
  } else {
    info.push('SpatNav: MISSING');
  }

  // Key mode
  if (window.__spatialNavigation__) {
    info.push('KeyMode: ' + window.__spatialNavigation__.keyMode);
  }

  // Memory (if available)
  if (window.performance && window.performance.memory) {
    var used = Math.round(window.performance.memory.usedJSHeapSize / 1048576);
    var total = Math.round(window.performance.memory.jsHeapSizeLimit / 1048576);
    info.push('Memory: ' + used + '/' + total + 'MB');
  }

  infoElement.textContent = info.join(' | ');
}

/**
 * Render all existing log entries
 */
function renderAllLogs() {
  if (!logsElement) return;

  logsElement.innerHTML = '';

  var entries = getLogEntries();
  for (var i = 0; i < entries.length; i++) {
    appendLogEntry(entries[i]);
  }
}

/**
 * Append a single log entry to the panel
 * @param {Object} entry - Log entry object
 */
function appendLogEntry(entry) {
  if (!logsElement) return;

  var el = document.createElement('div');
  el.className = 'tp-log-entry';

  // Time
  var timeEl = document.createElement('span');
  timeEl.className = 'tp-log-time';
  timeEl.textContent = formatTimestamp(entry.timestamp);
  el.appendChild(timeEl);

  // Level
  var levelEl = document.createElement('span');
  levelEl.className = 'tp-log-level ' + entry.level;
  levelEl.textContent = entry.level.toUpperCase();
  el.appendChild(levelEl);

  // Message
  var msgEl = document.createElement('span');
  msgEl.className = 'tp-log-message';
  msgEl.textContent = entry.message;
  el.appendChild(msgEl);

  logsElement.appendChild(el);
}

/**
 * Scroll logs container to bottom
 */
function scrollToBottom() {
  if (!logsElement) return;

  // Use setTimeout to ensure DOM has updated
  setTimeout(function() {
    logsElement.scrollTop = logsElement.scrollHeight;
  }, 0);
}
