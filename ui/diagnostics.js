/**
 * TizenPortal Diagnostics Panel UI
 * 
 * Displays captured console logs in an overlay panel.
 */

import { getLogEntries, clearLogEntries, onLogEntry, formatTimestamp } from '../diagnostics/console.js';
import { configGet } from '../core/config.js';

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
 * Filter label element
 */
var filterElement = null;

/**
 * Whether panel is visible
 */
var isVisible = false;

/**
 * Panel display state: 'hidden' | 'compact' | 'fullscreen'
 */
var displayState = 'hidden';

/**
 * Unsubscribe function for log listener
 */
var unsubscribe = null;

/**
 * Current log filter
 */
var logFilter = 'all';

/**
 * Log filter order
 */
var LOG_FILTERS = ['all', 'log', 'info', 'warn', 'error'];

/**
 * Initialize diagnostics panel
 */
export function initDiagnosticsPanel() {
  // Create panel if it doesn't exist (for target sites)
  if (!document.getElementById('tp-diagnostics')) {
    createDiagnosticsPanel();
  }
  
  panelElement = document.getElementById('tp-diagnostics');
  logsElement = document.getElementById('tp-diagnostics-logs');
  infoElement = document.getElementById('tp-diagnostics-info');
  filterElement = document.getElementById('tp-diagnostics-filter');

  if (!panelElement || !logsElement) {
    console.error('TizenPortal: Diagnostics panel elements not found');
    return;
  }

  // Subscribe to new log entries when panel is visible
  unsubscribe = onLogEntry(function(entry) {
    if (isVisible) {
      if (isEntryVisible(entry)) {
        appendLogEntry(entry);
        scrollToBottom();
      }
    }
  });

  // Initialize filter label
  updateFilterLabel();
}

/**
 * Create the diagnostics panel DOM elements
 */
function createDiagnosticsPanel() {
  var panel = document.createElement('div');
  panel.id = 'tp-diagnostics';
  panel.innerHTML = [
    '<div id="tp-diagnostics-header">',
    '  <h2>Console <span id="tp-diagnostics-filter"></span></h2>',
    '  <div id="tp-diagnostics-info"></div>',
    '</div>',
    '<div id="tp-diagnostics-logs"></div>',
    '<div id="tp-diagnostics-footer">Press BLUE to expand/close | YELLOW to clear | Arrows: Up/Down scroll, Left/Right filter</div>',
  ].join('');
  document.body.appendChild(panel);
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

  // Update filter label
  updateFilterLabel();

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
  displayState = 'hidden';
  panelElement.classList.remove('visible', 'compact', 'fullscreen');
}

/**
 * Toggle the diagnostics panel through 3 states: hidden -> compact -> fullscreen -> hidden
 */
export function toggleDiagnosticsPanel() {
  if (displayState === 'hidden') {
    // Show compact
    displayState = 'compact';
    showDiagnosticsPanel();
    setCompactMode();
  } else if (displayState === 'compact') {
    // Go fullscreen
    displayState = 'fullscreen';
    setFullscreenMode();
  } else {
    // Hide
    displayState = 'hidden';
    hideDiagnosticsPanel();
  }
}

/**
 * Set compact mode (bottom panel)
 */
function setCompactMode() {
  if (!panelElement) return;
  panelElement.classList.remove('fullscreen');
  panelElement.classList.add('compact');
}

/**
 * Set fullscreen mode
 */
function setFullscreenMode() {
  if (!panelElement) return;
  panelElement.classList.remove('compact');
  panelElement.classList.add('fullscreen');
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

  // Preferences snapshot
  try {
    var portal = configGet('tp_portal') || {};
    var features = configGet('tp_features') || {};
    var prefs = [];
    prefs.push('Theme=' + (portal.theme || 'dark'));
    prefs.push('HUD=' + (portal.hudPosition || 'off'));
    prefs.push('Wrap=' + (features.wrapTextInputs === false ? 'off' : 'on'));
    prefs.push('Scroll=' + (features.scrollIntoView === false ? 'off' : 'on'));
    prefs.push('Safe=' + (features.safeArea ? 'on' : 'off'));
    prefs.push('Focus=' + (features.focusStyling === false ? 'off' : 'on'));
    prefs.push('Tab=' + (features.tabindexInjection === false ? 'off' : 'on'));
    prefs.push('CSS=' + (features.cssReset === false ? 'off' : 'on'));
    prefs.push('GPU=' + (features.gpuHints === false ? 'off' : 'on'));
    prefs.push('Hints=' + (portal.showHints === false ? 'off' : 'on'));
    info.push('Prefs: ' + prefs.join(','));
  } catch (err) {
    // Ignore
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

  if (!isEntryVisible(entry)) {
    return;
  }

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

/**
 * Scroll the diagnostics logs by a given amount
 * @param {number} amount - Positive for down, negative for up
 */
export function scrollDiagnosticsLogs(amount) {
  if (!logsElement) return;
  logsElement.scrollTop += amount;
}

/**
 * Cycle the diagnostics log filter
 * @param {number} direction - 1 for next, -1 for previous
 */
export function cycleDiagnosticsLogFilter(direction) {
  var currentIndex = LOG_FILTERS.indexOf(logFilter);
  if (currentIndex === -1) currentIndex = 0;

  if (direction > 0) {
    currentIndex = (currentIndex + 1) % LOG_FILTERS.length;
  } else if (direction < 0) {
    currentIndex = (currentIndex - 1 + LOG_FILTERS.length) % LOG_FILTERS.length;
  }

  logFilter = LOG_FILTERS[currentIndex];
  updateFilterLabel();
  renderAllLogs();
  scrollToBottom();
}

/**
 * Update filter label text
 */
function updateFilterLabel() {
  if (!filterElement) return;
  filterElement.textContent = logFilter.toUpperCase();
}

/**
 * Check if an entry should be visible for current filter
 * @param {Object} entry
 * @returns {boolean}
 */
function isEntryVisible(entry) {
  if (!entry) return false;
  if (logFilter === 'all') return true;
  return entry.level === logFilter;
}
