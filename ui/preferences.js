/**
 * TizenPortal Preferences UI
 * 
 * Full-screen preferences modal with D-pad navigation.
 * Mirrors the site editor's keyboard interaction model.
 */

import { isValidHexColor, isValidHttpUrl, escapeHtml } from '../core/utils.js';

/**
 * Preferences state
 */
var prefsState = {
  active: false,
  currentRow: 0,
  settings: {},
  sectionCollapsed: {},
};

/**
 * Theme mode options
 */
var THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'auto', label: 'Automatic (Sunset)' },
  { value: 'backdrop', label: 'Custom Backdrop' },
  { value: 'custom', label: 'Custom Colours' },
];

/**
 * HUD position options
 */
var HUD_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
];

/**
 * Viewport mode options
 */
var VIEWPORT_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'locked', label: 'Locked (1920)' },
  { value: 'unlocked', label: 'Unlocked' },
];

/**
 * Focus outline options
 */
var FOCUS_OUTLINE_OPTIONS = [
  { value: 'on', label: 'On (Blue)' },
  { value: 'high', label: 'High Contrast (Yellow)' },
  { value: 'off', label: 'Off' },
];

/**
 * User Agent mode options
 */
var UA_MODE_OPTIONS = [
  { value: 'tizen', label: 'Tizen TV' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
];

/**
 * Normalize stored theme value to valid option
 * @param {*} value
 * @returns {string}
 */
function normalizeThemeValue(value) {
  // If numeric index, map to option
  if (typeof value === 'number') {
    var idx = value % THEME_OPTIONS.length;
    return THEME_OPTIONS[idx].value;
  }

  // If string but not valid, fall back to dark
  if (typeof value === 'string') {
    for (var i = 0; i < THEME_OPTIONS.length; i++) {
      if (THEME_OPTIONS[i].value === value) {
        return value;
      }
    }
  }

  return 'dark';
}

/**
 * Normalize stored HUD position value to valid option
 * @param {*} value
 * @returns {string}
 */
function normalizeHudPosition(value) {
  // If numeric index, map to option
  if (typeof value === 'number') {
    var idx = value % HUD_OPTIONS.length;
    return HUD_OPTIONS[idx].value;
  }

  if (typeof value === 'string') {
    for (var i = 0; i < HUD_OPTIONS.length; i++) {
      if (HUD_OPTIONS[i].value === value) {
        return value;
      }
    }
  }

  return 'off';
}

/**
 * Preference rows definition
 * Note: customColor1/customColor2 are conditional rows shown only when theme='custom'
 */
var PREFERENCE_ROWS = [
  { id: 'theme', label: 'Theme Mode', type: 'select', options: THEME_OPTIONS, key: 'theme', config: 'portal', section: 'appearance' },
  { id: 'customColor1', label: 'Gradient Color 1', type: 'color', key: 'customColor1', config: 'portal', showIf: 'custom', section: 'appearance' },
  { id: 'customColor2', label: 'Gradient Color 2', type: 'color', key: 'customColor2', config: 'portal', showIf: 'custom', section: 'appearance' },
  { id: 'backgroundImage', label: 'Backdrop Image URL', type: 'text', key: 'backgroundImage', config: 'portal', showIf: 'backdrop', section: 'appearance' },
  { id: 'hudPosition', label: 'Debug HUD', type: 'select', options: HUD_OPTIONS, key: 'hudPosition', config: 'portal', section: 'portal' },
  { id: 'showHints', label: 'Color Hints', type: 'toggle', key: 'showHints', config: 'portal', section: 'portal' },
  { id: 'viewportMode', label: 'Viewport Lock Mode', type: 'select', options: VIEWPORT_OPTIONS, key: 'viewportMode', config: 'features', section: 'features' },
  { id: 'focusOutlineMode', label: 'Focus Outline', type: 'select', options: FOCUS_OUTLINE_OPTIONS, key: 'focusOutlineMode', config: 'features', section: 'features' },
  { id: 'uaMode', label: 'User Agent Mode', type: 'select', options: UA_MODE_OPTIONS, key: 'uaMode', config: 'features', section: 'features' },
  { id: 'tabindexInjection', label: 'Auto-focusable Elements', type: 'toggle', key: 'tabindexInjection', config: 'features', section: 'features' },
  { id: 'scrollIntoView', label: 'Scroll-into-view on Focus', type: 'toggle', key: 'scrollIntoView', config: 'features', section: 'features' },
  { id: 'safeArea', label: 'TV Safe Area (5% inset)', type: 'toggle', key: 'safeArea', config: 'features', section: 'features' },
  { id: 'gpuHints', label: 'GPU Acceleration Hints', type: 'toggle', key: 'gpuHints', config: 'features', section: 'features' },
  { id: 'cssReset', label: 'CSS Normalization', type: 'toggle', key: 'cssReset', config: 'features', section: 'features' },
  { id: 'hideScrollbars', label: 'Hide Scrollbars', type: 'toggle', key: 'hideScrollbars', config: 'features', section: 'features' },
  { id: 'wrapTextInputs', label: 'Protect Text Inputs (TV Keyboard)', type: 'toggle', key: 'wrapTextInputs', config: 'features', section: 'features' },
];

var SECTION_DEFS = [
  { id: 'appearance', label: 'Appearance', defaultCollapsed: false },
  { id: 'portal', label: 'Portal', defaultCollapsed: false },
  { id: 'features', label: 'Site Features', defaultCollapsed: true },
  { id: 'userscripts', label: 'User Scripts', defaultCollapsed: true },
];

/**
 * Initialize preferences UI
 */
export function initPreferences() {
  // Create preferences container
  var prefs = document.createElement('div');
  prefs.id = 'tp-preferences';
  prefs.className = 'tp-preferences';
  prefs.innerHTML = createPreferencesHTML();
  var shell = document.getElementById('tp-shell');
  if (shell) {
    shell.appendChild(prefs);
  } else {
    document.body.appendChild(prefs);
  }
  
  // Set up event listeners
  setupPreferencesListeners(prefs);
  
  console.log('TizenPortal: Preferences initialized');
}

/**
 * Create preferences HTML
 */
function createPreferencesHTML() {
  return '' +
    '<div class="tp-prefs-backdrop"></div>' +
    '<div class="tp-prefs-panel">' +
      '<div class="tp-prefs-header">' +
        '<h2 id="tp-prefs-title">Preferences</h2>' +
        '<div class="tp-prefs-hint">Navigate with D-pad | Changes auto-save</div>' +
      '</div>' +
      '<div class="tp-prefs-body">' +
        '<div class="tp-prefs-rows" id="tp-prefs-rows"></div>' +
      '</div>' +
      '<div class="tp-prefs-footer">' +
        '<button type="button" class="tp-prefs-btn tp-prefs-btn-cancel" id="tp-prefs-cancel" tabindex="0">' +
          'Close' +
        '</button>' +
      '</div>' +
    '</div>';
}

/**
 * Set up event listeners
 */
function setupPreferencesListeners(prefs) {
  // Cancel button
  var cancelBtn = prefs.querySelector('#tp-prefs-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      closePreferences();
    });
    cancelBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        closePreferences();
      }
    });
  }

  // Backdrop click
  var backdrop = prefs.querySelector('.tp-prefs-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', function() {
      closePreferences();
    });
  }

  // Keyboard handler
  prefs.addEventListener('keydown', handlePreferencesKeyDown);
}

/**
 * Handle keyboard events in preferences
 */
function handlePreferencesKeyDown(event) {
  var keyCode = event.keyCode;
  
  // Escape/Back - close
  if (keyCode === 27 || keyCode === 10009) {
    event.preventDefault();
    event.stopPropagation();
    closePreferences();
    return;
  }

  // Arrow Up/Down - navigate rows
  if (keyCode === 38 || keyCode === 40) { // Up or Down
    event.preventDefault();
    event.stopPropagation();
    var direction = keyCode === 38 ? -1 : 1;
    navigatePreferences(direction);
    return;
  }

  // Enter on focused element
  if (keyCode === 13) {
    var active = document.activeElement;
    if (active && active.id === 'tp-prefs-cancel') {
      event.preventDefault();
      closePreferences();
      return;
    }
    if (active && active.classList && active.classList.contains('tp-prefs-row')) {
      event.preventDefault();
      activatePreferenceRow(active);
      return;
    }
  }
}

/**
 * Show preferences modal
 */
export function showPreferences() {
  console.log('TizenPortal: showPreferences called');
  if (!window.TizenPortal) {
    console.error('TizenPortal not initialized');
    return;
  }
  
  var prefs = document.getElementById('tp-preferences');
  if (!prefs) {
    console.error('TizenPortal: preferences element not found');
    return;
  }
  
  // Load current settings
  prefsState.settings = {
    portalConfig: TizenPortal.config.get('tp_portal') || getDefaultPortalConfig(),
    featuresConfig: TizenPortal.config.get('tp_features') || getDefaultFeaturesConfig(),
    userscriptsConfig: TizenPortal.config.get('tp_userscripts') || getDefaultUserscriptsConfig(),
  };

  // Normalize theme value if needed
  if (prefsState.settings.portalConfig) {
    var normalized = normalizeThemeValue(prefsState.settings.portalConfig.theme);
    if (prefsState.settings.portalConfig.theme !== normalized) {
      prefsState.settings.portalConfig.theme = normalized;
      TizenPortal.config.set('tp_portal', prefsState.settings.portalConfig);
    }
    var hudNormalized = normalizeHudPosition(prefsState.settings.portalConfig.hudPosition);
    if (prefsState.settings.portalConfig.hudPosition !== hudNormalized) {
      prefsState.settings.portalConfig.hudPosition = hudNormalized;
      TizenPortal.config.set('tp_portal', prefsState.settings.portalConfig);
    }
  }
  
  prefsState.currentRow = 0;
  prefsState.active = true;

  prefsState.sectionCollapsed = getSectionDefaults();
  ensureUserscriptsConfig();
  if (window.TizenPortal && window.TizenPortal.updatePortalHints) {
    window.TizenPortal.updatePortalHints();
  }
  
  // Render preferences UI
  renderPreferencesUI();
  
  // Show preferences
  prefs.classList.add('visible');
  
  // Focus first row
  setTimeout(function() {
    focusPreferencesRow(0);
  }, 50);
}


/**
 * Get default portal configuration
 */
function getDefaultPortalConfig() {
  return {
    theme: 'dark',
    customColor1: '#0d1117',
    customColor2: '#161b22',
    backgroundImage: '',
    hudPosition: 'off',
    showHints: true,
  };
}

function getSectionDefaults() {
  var defaults = {};
  for (var i = 0; i < SECTION_DEFS.length; i++) {
    defaults[SECTION_DEFS[i].id] = SECTION_DEFS[i].defaultCollapsed;
  }
  return defaults;
}
function ensureSectionState() {
  if (!prefsState.sectionCollapsed) {
    prefsState.sectionCollapsed = {};
  }
  for (var i = 0; i < SECTION_DEFS.length; i++) {
    var id = SECTION_DEFS[i].id;
    if (!prefsState.sectionCollapsed.hasOwnProperty(id)) {
      prefsState.sectionCollapsed[id] = SECTION_DEFS[i].defaultCollapsed;
    }
  }
}

/**
 * Get default features configuration
 */
function getDefaultFeaturesConfig() {
  return {
    focusStyling: true,
    focusOutlineMode: 'on',
    tabindexInjection: true,
    scrollIntoView: true,
    safeArea: false,
    gpuHints: true,
    cssReset: true,
    hideScrollbars: false,
    wrapTextInputs: true,
    viewportMode: 'locked',
    uaMode: 'tizen',
  };
}

function createDefaultUserscript(index) {
  return {
    id: 'us-' + Date.now() + '-' + Math.floor(Math.random() * 100000),
    name: 'Custom Script ' + index,
    enabled: false,
    source: 'inline',
    url: '',
    inline: '',
    cached: '',
    lastFetched: 0,
  };
}

function normalizeUserscripts(list) {
  var scripts = Array.isArray(list) ? list : [];
  var normalized = [];

  for (var i = 0; i < scripts.length; i++) {
    var entry = scripts[i] || {};
    normalized.push({
      id: entry.id || ('us-' + Date.now() + '-' + Math.floor(Math.random() * 100000)),
      name: entry.name || 'Custom Script ' + (i + 1),
      enabled: entry.enabled !== false,
      source: entry.source === 'url' ? 'url' : 'inline',
      url: typeof entry.url === 'string' ? entry.url : '',
      inline: typeof entry.inline === 'string' ? entry.inline : '',
      cached: typeof entry.cached === 'string' ? entry.cached : '',
      lastFetched: typeof entry.lastFetched === 'number' ? entry.lastFetched : 0,
    });
  }

  if (!normalized.length) {
    normalized.push(createDefaultUserscript(1));
  }

  return normalized;
}

function getDefaultUserscriptsConfig() {
  return {
    scripts: [createDefaultUserscript(1)],
  };
}

function ensureUserscriptsConfig() {
  if (!prefsState.settings.userscriptsConfig || typeof prefsState.settings.userscriptsConfig !== 'object') {
    prefsState.settings.userscriptsConfig = getDefaultUserscriptsConfig();
  }

  if (!Array.isArray(prefsState.settings.userscriptsConfig.scripts)) {
    prefsState.settings.userscriptsConfig.scripts = [];
  }

  prefsState.settings.userscriptsConfig.scripts = normalizeUserscripts(prefsState.settings.userscriptsConfig.scripts);
}

/**
 * Get visible preference rows based on current theme setting
 */
function getVisibleRows() {
  var currentTheme = normalizeThemeValue(prefsState.settings.portalConfig.theme || 'dark');
  var visible = [];
  var deferred = [];
  
  for (var i = 0; i < PREFERENCE_ROWS.length; i++) {
    var row = PREFERENCE_ROWS[i];
    if (row.showIf && row.showIf !== currentTheme) {
      continue;
    }

    if (row.showIf) {
      deferred.push(row);
    } else {
      visible.push(row);
    }
  }

  if (deferred.length) {
    var insertAt = 1;
    for (var j = 0; j < visible.length; j++) {
      if (visible[j].id === 'theme') {
        insertAt = j + 1;
        break;
      }
    }
    visible.splice.apply(visible, [insertAt, 0].concat(deferred));
  }
  
  return visible;
}

function getVisibleRowsWithSections() {
  ensureSectionState();
  ensureUserscriptsConfig();
  var rows = getVisibleRows();
  var grouped = {};

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var section = row.section || 'features';
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(row);
  }

  grouped.userscripts = buildUserscriptRows();

  var ordered = [];
  for (var j = 0; j < SECTION_DEFS.length; j++) {
    var def = SECTION_DEFS[j];
    ordered.push({ type: 'section', id: def.id, label: def.label });

    if (prefsState.sectionCollapsed[def.id]) {
      continue;
    }

    var sectionRows = grouped[def.id] || [];
    for (var k = 0; k < sectionRows.length; k++) {
      ordered.push(sectionRows[k]);
    }
  }

  return ordered;
}

function buildUserscriptRows() {
  ensureUserscriptsConfig();
  var rows = [];
  var scripts = prefsState.settings.userscriptsConfig.scripts || [];

  for (var i = 0; i < scripts.length; i++) {
    rows.push({ type: 'userscript', scriptIndex: i, label: 'Script ' + (i + 1) });
  }

  rows.push({ type: 'userscript-add', label: 'Add Script' });
  return rows;
}

/**
 * Render preferences rows
 */
function renderPreferencesUI() {
  var container = document.getElementById('tp-prefs-rows');
  if (!container) return;

  var scrollTop = container.scrollTop;

  ensureSectionState();
  var visibleRows = getVisibleRowsWithSections();
  var html = '';

  for (var i = 0; i < visibleRows.length; i++) {
    var row = visibleRows[i];
    if (row.type === 'section') {
      var collapsed = !!prefsState.sectionCollapsed[row.id];
      var indicator = collapsed ? '▶' : '▼';
      var summary = getPreferencesSectionSummary(row.id);
      html += '' +
        '<div class="tp-prefs-row tp-prefs-section-row" data-index="' + i + '" data-id="' + row.id + '" data-type="section" tabindex="0">' +
          '<div class="tp-prefs-label">' + row.label + '</div>' +
          '<div class="tp-prefs-value">' +
            '<span class="tp-prefs-section-summary">' + escapeHtml(summary) + '</span>' +
            '<span class="tp-prefs-section-indicator">' + indicator + '</span>' +
          '</div>' +
        '</div>';
    } else if (row.type && row.type === 'userscript') {
      html += renderUserscriptRow(row, i);
    } else {
      var value = getValue(row);
      var displayValue = formatDisplayValue(row, value);
      html += '' +
        '<div class="tp-prefs-row" data-index="' + i + '" data-id="' + row.id + '" tabindex="0">' +
          '<div class="tp-prefs-label">' + row.label + '</div>' +
          '<div class="tp-prefs-value">' + displayValue + '</div>' +
        '</div>';
    }
  }

  container.innerHTML = html;

  // Set up row listeners
  var rows = container.querySelectorAll('.tp-prefs-row');
  for (var j = 0; j < rows.length; j++) {
    rows[j].addEventListener('click', function() {
      activatePreferenceRow(this);
    });
  }

  var userscriptButtons = container.querySelectorAll('.tp-userscript-btn');
  for (var k = 0; k < userscriptButtons.length; k++) {
    userscriptButtons[k].addEventListener('click', function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      handleUserscriptButtonAction(this);
    });
    userscriptButtons[k].addEventListener('keydown', function(e) {
      if (handleUserscriptPrefsButtonKeyDown(e, this)) {
        return;
      }
      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        handleUserscriptButtonAction(this);
      }
    });
  }

  container.scrollTop = scrollTop;
}

function getPreferencesSectionSummary(sectionId) {
  ensureUserscriptsConfig();
  if (sectionId === 'appearance') {
    var theme = normalizeThemeValue(prefsState.settings.portalConfig.theme || 'dark');
    var themeLabel = getOptionLabel(THEME_OPTIONS, theme) || theme;
    if (theme === 'custom') {
      var c1 = prefsState.settings.portalConfig.customColor1 || '#0d1117';
      var c2 = prefsState.settings.portalConfig.customColor2 || '#161b22';
      return themeLabel + ' • ' + c1 + ' → ' + c2;
    }
    if (theme === 'backdrop') {
      var bg = prefsState.settings.portalConfig.backgroundImage || 'none';
      return themeLabel + ' • ' + shortenUrl(bg);
    }
    return themeLabel;
  }

  if (sectionId === 'portal') {
    var hud = normalizeHudPosition(prefsState.settings.portalConfig.hudPosition || 'off');
    var hudLabel = getOptionLabel(HUD_OPTIONS, hud) || hud;
    var hints = prefsState.settings.portalConfig.showHints ? 'Hints: On' : 'Hints: Off';
    return hudLabel + ' • ' + hints;
  }

  if (sectionId === 'features') {
    var enabled = 0;
    var total = 0;
    for (var i = 0; i < PREFERENCE_ROWS.length; i++) {
      var row = PREFERENCE_ROWS[i];
      if (row.section !== 'features') continue;
      total++;
      var value = getValue(row);
      if (row.type === 'toggle') {
        if (value) enabled++;
      }
    }
    return 'Toggles: ' + enabled + '/' + total;
  }

  if (sectionId === 'userscripts') {
    var scripts = prefsState.settings.userscriptsConfig.scripts || [];
    var filled = 0;
    for (var j = 0; j < scripts.length; j++) {
      var s = scripts[j] || {};
      if (s.source === 'url' ? !!s.cached : !!s.inline) {
        filled++;
      }
    }
    return 'Scripts: ' + scripts.length + ' • Saved: ' + filled;
  }

  return '';
}

function getOptionLabel(options, value) {
  for (var i = 0; i < options.length; i++) {
    if (options[i].value === value) {
      return options[i].label;
    }
  }
  return '';
}

function shortenUrl(url) {
  if (!url) return '';
  var cleaned = url.replace(/^https?:\/\//i, '');
  if (cleaned.length > 40) {
    cleaned = cleaned.substring(0, 37) + '...';
  }
  return cleaned;
}

function renderUserscriptRow(row, index) {
  ensureUserscriptsConfig();
  var scripts = prefsState.settings.userscriptsConfig.scripts || [];
  var script = scripts[row.scriptIndex] || {};
  var nameValue = script.name || ('Custom Script ' + (row.scriptIndex + 1));
  var sourceLabel = script.source === 'url' ? 'URL' : 'Inline';
  var hasData = script.source === 'url' ? !!script.cached : !!script.inline;
  var status = sourceLabel + (hasData ? ' (saved)' : ' (empty)');
  var canRemove = scripts.length > 1;
  var refreshDisabled = script.source !== 'url' ? ' disabled' : '';

  return '' +
    '<div class="tp-prefs-row tp-prefs-userscript-row" data-index="' + index + '" data-type="userscript" data-script-index="' + row.scriptIndex + '" tabindex="0">' +
      '<div class="tp-prefs-label">' + row.label + '</div>' +
      '<div class="tp-prefs-value tp-userscript-inline">' +
        '<span class="tp-userscript-status">' + escapeHtml(nameValue) + ' • ' + status + '</span>' +
        '<span class="tp-userscript-actions">' +
          '<button type="button" class="tp-userscript-btn" data-userscript-action="rename" data-script-index="' + row.scriptIndex + '" tabindex="0">Rename</button>' +
          '<button type="button" class="tp-userscript-btn" data-userscript-action="source" data-script-index="' + row.scriptIndex + '" tabindex="0">Source: ' + sourceLabel + '</button>' +
          '<button type="button" class="tp-userscript-btn" data-userscript-action="edit" data-script-index="' + row.scriptIndex + '" tabindex="0">Edit</button>' +
          '<button type="button" class="tp-userscript-btn" data-userscript-action="refresh" data-script-index="' + row.scriptIndex + '" tabindex="0"' + refreshDisabled + '>Refresh</button>' +
          (canRemove ? '<button type="button" class="tp-userscript-btn" data-userscript-action="remove" data-script-index="' + row.scriptIndex + '" tabindex="0">Remove</button>' : '') +
        '</span>' +
      '</div>' +
    '</div>';
}

/**
 * Get current value for a preference row
 */
function getValue(row) {
  var config = row.config === 'portal' ? prefsState.settings.portalConfig : prefsState.settings.featuresConfig;
  return config[row.key];
}

/**
 * Set value for a preference row
 */
function setValue(row, value) {
  var config = row.config === 'portal' ? prefsState.settings.portalConfig : prefsState.settings.featuresConfig;
  config[row.key] = value;
}

/**
 * Format value for display
 */
function formatDisplayValue(row, value) {
  if (row.type === 'toggle') {
    return value ? '✓ On' : '○ Off';
  }
  if (row.type === 'select' && row.options) {
    // Find label for current value
    for (var i = 0; i < row.options.length; i++) {
      if (row.options[i].value === value) {
        return row.options[i].label;
      }
    }
    return row.options.length ? row.options[0].label : (value || '(not set)');
  }
  if (row.type === 'color') {
    // Show color swatch indicator
    return value ? '■ ' + value : '(not set)';
  }
  // Text field
  return value || '(not set)';
}

function getUserscriptRowDisplay(row) {
  ensureUserscriptsConfig();
  var scripts = prefsState.settings.userscriptsConfig.scripts || [];
  var idx = row.scriptIndex || 0;
  var script = scripts[idx] || {};

  if (row.type === 'userscript-name') {
    return script.name || ('Custom Script ' + (idx + 1));
  }
  if (row.type === 'userscript-enabled') {
    return script.enabled ? '✓ On' : '○ Off';
  }
  if (row.type === 'userscript-url') {
    var url = script.url || '';
    var suffix = script.cached ? ' (saved)' : '';
    return (url || '(not set)') + suffix;
  }
  if (row.type === 'userscript-inline') {
    return script.inline ? 'Inline Script (saved)' : '(not set)';
  }
  if (row.type === 'userscript') {
    var source = script.source === 'url' ? 'URL' : 'Inline';
    var hasData = script.source === 'url' ? !!script.cached : !!script.inline;
    var status = source + (hasData ? ' (saved)' : ' (empty)');
    return (script.name || ('Custom Script ' + (idx + 1))) + ' • ' + status;
  }
  if (row.type === 'userscript-refresh') return '↻';
  if (row.type === 'userscript-remove') return '🗑';
  if (row.type === 'userscript-add') return '＋';

  return '';
}

/**
 * Navigate preferences (Up/Down)
 * Now includes Close button as final navigation target
 */
function navigatePreferences(direction) {
  var visibleRows = getVisibleRowsWithSections();
  var totalItems = visibleRows.length + 1; // +1 for Close button
  var newIndex = prefsState.currentRow + direction;
  
  // Clamp to valid range (0 to totalItems-1)
  if (newIndex < 0) newIndex = 0;
  if (newIndex >= totalItems) newIndex = totalItems - 1;
  
  if (newIndex !== prefsState.currentRow) {
    prefsState.currentRow = newIndex;
    focusPreferencesRow(newIndex);
  }
}

/**
 * Focus a preferences row or the Close button
 */
function focusPreferencesRow(index) {
  var visibleRows = getVisibleRowsWithSections();
  
  // If index is beyond visible rows, focus Close button
  if (index >= visibleRows.length) {
    var closeBtn = document.getElementById('tp-prefs-cancel');
    if (closeBtn) {
      closeBtn.focus();
    }
    return;
  }
  
  var container = document.getElementById('tp-prefs-rows');
  if (!container) return;

  var rows = container.querySelectorAll('.tp-prefs-row');
  if (rows[index]) {
    rows[index].focus();
  }
}

/**
 * Activate a preference row (edit/toggle)
 */
function activatePreferenceRow(rowEl) {
  var index = parseInt(rowEl.dataset.index, 10);
  var visibleRows = getVisibleRowsWithSections();
  var row = visibleRows[index];

  if (!row) return;

  if (row.type === 'section') {
    prefsState.sectionCollapsed[row.id] = !prefsState.sectionCollapsed[row.id];
    renderPreferencesUI();
    focusPreferencesRow(index);
    return;
  }

  if (row.type && row.type.indexOf('userscript-') === 0) {
    handleUserscriptPreferenceRow(row, index);
    return;
  }

  console.log('TizenPortal: Activate preference row:', row.id, 'type:', row.type);

  if (row.type === 'toggle') {
    // Toggle boolean value
    var currentValue = getValue(row);
    setValue(row, !currentValue);
    renderPreferencesUI();
    focusPreferencesRow(index);
    savePreferencesAuto('toggle:' + row.id);
  } else if (row.type === 'select') {
    // Cycle through select options
    cycleSelectOption(row, index);
  } else if (row.type === 'text') {
    // Show text input prompt
    showTextInputPrompt(row, index);
  } else if (row.type === 'color') {
    // Show color input prompt
    showColorInputPrompt(row, index);
  }
}

function handleUserscriptPreferenceRow(row, index) {
  ensureUserscriptsConfig();
  var scripts = prefsState.settings.userscriptsConfig.scripts || [];
  var scriptIndex = row.scriptIndex || 0;
  var script = scripts[scriptIndex];

  if (row.type === 'userscript-add') {
    scripts.push(createDefaultUserscript(scripts.length + 1));
    renderPreferencesUI();
    focusPreferencesRow(index);
    savePreferencesAuto('userscript:add');
    return;
  }

  if (!script) return;

  if (row.type === 'userscript') {
    var rowEl = document.querySelector('.tp-prefs-row[data-index="' + index + '"]');
    if (rowEl) {
      var firstBtn = rowEl.querySelector('.tp-userscript-btn');
      if (firstBtn) {
        firstBtn.focus();
        return;
      }
    }
  }
}

/**
 * Cycle through select options
 */
function cycleSelectOption(row, index) {
  var currentValue = getValue(row);
  var options = row.options;
  
  // Find current index (options are now objects with value/label)
  var currentIndex = -1;
  for (var i = 0; i < options.length; i++) {
    if (options[i].value === currentValue) {
      currentIndex = i;
      break;
    }
  }
  if (currentIndex === -1) currentIndex = 0;
  
  // Move to next option
  var nextIndex = (currentIndex + 1) % options.length;
  var nextValue = options[nextIndex].value;
  
  setValue(row, nextValue);
  renderPreferencesUI();
  focusPreferencesRow(index);
  savePreferencesAuto('select:' + row.id);
}

/**
 * Show color input prompt
 */
function showColorInputPrompt(row, index) {
  var currentValue = getValue(row) || '#1a1a2e';
  var newValue = prompt(row.label + ' (hex color, e.g. #ff0000):', currentValue);
  
  if (newValue !== null) {
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue) || /^#[0-9A-Fa-f]{3}$/.test(newValue)) {
      setValue(row, newValue);
      renderPreferencesUI();
      focusPreferencesRow(index);
      savePreferencesAuto('color:' + row.id);
    } else {
      alert('Invalid color format. Use hex format like #ff0000');
    }
  }
}

/**
 * Show text input prompt
 */
function showTextInputPrompt(row, index) {
  var currentValue = getValue(row) || '';
  var newValue = prompt(row.label + ':', currentValue);
  
  if (newValue !== null) {
    setValue(row, newValue);
    renderPreferencesUI();
    focusPreferencesRow(index);
    savePreferencesAuto('text:' + row.id);
  }
}

function fetchUserscriptUrl(scriptIndex, focusIndex) {
  ensureUserscriptsConfig();
  var scripts = prefsState.settings.userscriptsConfig.scripts || [];
  var script = scripts[scriptIndex];
  if (!script) return;

  if (!script.url || !isValidHttpUrl(script.url)) {
    if (window.TizenPortal && window.TizenPortal.showToast) {
      TizenPortal.showToast('Invalid URL');
    }
    return;
  }

  try {
    if (window.TizenPortal && window.TizenPortal.showToast) {
      TizenPortal.showToast('Fetching script...');
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', script.url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          script.cached = xhr.responseText || '';
          script.lastFetched = Date.now();
          renderPreferencesUI();
          if (typeof focusIndex === 'number') {
            focusPreferencesRow(focusIndex);
          }
          savePreferencesAuto('userscript:cached');
        } else if (window.TizenPortal && window.TizenPortal.showToast) {
          TizenPortal.showToast('Failed to fetch script');
        }
      }
    };
    xhr.send();
  } catch (err) {
    if (window.TizenPortal && window.TizenPortal.showToast) {
      TizenPortal.showToast('Failed to fetch script');
    }
  }
}

function handleUserscriptButtonAction(btn) {
  ensureUserscriptsConfig();
  var action = btn.dataset.userscriptAction || '';
  var scriptIndex = parseInt(btn.dataset.scriptIndex, 10);
  if (isNaN(scriptIndex)) return;

  var scripts = prefsState.settings.userscriptsConfig.scripts || [];
  var script = scripts[scriptIndex];
  if (!script) return;

  if (action === 'rename') {
    var newName = prompt('Script Name:', script.name || '');
    if (newName !== null) {
      script.name = newName;
      renderPreferencesUI();
      focusUserscriptPrefButton(scriptIndex, action);
      savePreferencesAuto('userscript:name');
    }
    return;
  }

  if (action === 'source') {
    script.source = script.source === 'url' ? 'inline' : 'url';
    renderPreferencesUI();
    focusUserscriptPrefButton(scriptIndex, action);
    savePreferencesAuto('userscript:source');
    return;
  }

  if (action === 'edit') {
    if (script.source === 'url') {
      var newUrl = prompt('Script URL:', script.url || '');
      if (newUrl !== null) {
        if (newUrl) {
          if (!isValidHttpUrl(newUrl)) {
            if (window.TizenPortal && window.TizenPortal.showToast) {
              TizenPortal.showToast('Invalid URL');
            }
            return;
          }
          script.url = newUrl;
          renderPreferencesUI();
          focusUserscriptPrefButton(scriptIndex, action);
          savePreferencesAuto('userscript:url');
          fetchUserscriptUrl(scriptIndex, null);
        } else {
          script.url = '';
          script.cached = '';
          script.lastFetched = 0;
          renderPreferencesUI();
          focusUserscriptPrefButton(scriptIndex, action);
          savePreferencesAuto('userscript:url');
        }
      }
    } else {
      var newInline = prompt('Inline Script:', script.inline || '');
      if (newInline !== null) {
        script.inline = newInline;
        renderPreferencesUI();
        focusUserscriptPrefButton(scriptIndex, action);
        savePreferencesAuto('userscript:inline');
      }
    }
    return;
  }

  if (action === 'refresh') {
    if (script.source === 'url') {
      fetchUserscriptUrl(scriptIndex, null);
    }
    return;
  }

  if (action === 'remove') {
    if (scripts.length <= 1) return;
    scripts.splice(scriptIndex, 1);
    renderPreferencesUI();
    savePreferencesAuto('userscript:remove');
  }
}

function focusUserscriptPrefButton(scriptIndex, action) {
  var selector = '.tp-userscript-btn[data-script-index="' + scriptIndex + '"]';
  if (action) {
    selector += '[data-userscript-action="' + action + '"]';
  }
  var btn = document.querySelector(selector);
  if (btn) {
    btn.focus();
  }
}

function handleUserscriptPrefsButtonKeyDown(e, btn) {
  if (!btn) return false;
  var key = e.keyCode;

  if (key === 37 || key === 39) {
    var row = btn.closest('.tp-prefs-row');
    if (!row) return false;
    var buttons = row.querySelectorAll('.tp-userscript-btn');
    var index = -1;
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i] === btn) {
        index = i;
        break;
      }
    }
    if (index === -1) return false;
    var nextIndex = key === 39 ? index + 1 : index - 1;
    if (nextIndex >= 0 && nextIndex < buttons.length) {
      e.preventDefault();
      e.stopPropagation();
      buttons[nextIndex].focus();
      return true;
    }
    if (nextIndex < 0 && row) {
      e.preventDefault();
      e.stopPropagation();
      row.focus();
      return true;
    }
    return false;
  }

  if (key === 38 || key === 40) {
    var parentRow = btn.closest('.tp-prefs-row');
    if (parentRow) {
      e.preventDefault();
      e.stopPropagation();
      parentRow.focus();
      return true;
    }
  }

  return false;
}

/**
 * Close preferences
 */
export function closePreferences() {
  var prefs = document.getElementById('tp-preferences');
  if (prefs) {
    prefs.classList.remove('visible');
  }
  prefsState.active = false;

  if (window.TizenPortal && window.TizenPortal.updatePortalHints) {
    window.TizenPortal.updatePortalHints();
  }
  
  // Restore focus to portal
  restoreFocusToPortal();
}

/**
 * Restore focus to portal
 */
function restoreFocusToPortal() {
  var card = document.querySelector('.tp-card:focus');
  if (card) {
    card.focus();
  } else {
    var firstCard = document.querySelector('.tp-card');
    if (firstCard) {
      firstCard.focus();
    }
  }
}

/**
 * Save and close preferences
 */
function savePreferencesAuto(reason) {
  console.log('TizenPortal: Auto-saving preferences', reason || '');

  // Save portal config
  TizenPortal.config.set('tp_portal', prefsState.settings.portalConfig);

  // Save features config
  TizenPortal.config.set('tp_features', prefsState.settings.featuresConfig);

  // Save userscripts config
  TizenPortal.config.set('tp_userscripts', prefsState.settings.userscriptsConfig);

  // Apply portal preferences immediately
  applyPortalPreferences(prefsState.settings.portalConfig);

  if (window.TizenPortal && window.TizenPortal.showToast) {
    TizenPortal.showToast('Saved');
  }
}

/**
 * Apply portal preferences to current page
 * @param {Object} [config] - Optional config, will load from storage if not provided
 */
export function applyPortalPreferences(config) {
  // If no config provided, load from storage
  if (!config && window.TizenPortal && window.TizenPortal.config) {
    config = TizenPortal.config.get('tp_portal');
  }
  
  if (!config) {
    config = getDefaultPortalConfig();
  }
  
  var theme = normalizeThemeValue(config.theme || 'dark');
  
  // Handle automatic theme (sunset-based)
  if (theme === 'auto') {
    theme = isNightTime() ? 'dark' : 'light';
  }
  
  applySiteTheme(theme);

  var shell = document.getElementById('tp-shell');
  if (shell) {
    // Apply theme attribute for CSS
    shell.setAttribute('data-theme', theme);

    // Clear existing background styles
    shell.style.backgroundColor = '';
    shell.style.backgroundImage = '';
    shell.style.background = '';

    // Apply theme-specific styles
    if (theme === 'custom') {
      // Custom gradient colors — validate hex before injecting into CSS
      var color1 = isValidHexColor(config.customColor1) ? config.customColor1 : '#0d1117';
      var color2 = isValidHexColor(config.customColor2) ? config.customColor2 : '#161b22';
      shell.style.background = 'linear-gradient(135deg, ' + color1 + ' 0%, ' + color2 + ' 100%)';
    } else if (theme === 'backdrop') {
      // Custom backdrop image — validate URL before injecting into CSS
      if (config.backgroundImage && isValidHttpUrl(config.backgroundImage)) {
        shell.style.backgroundImage = 'url(' + encodeURI(config.backgroundImage) + ')';
        shell.style.backgroundSize = 'cover';
        shell.style.backgroundPosition = 'center';
        shell.style.backgroundColor = '#0d1117'; // Fallback
      }
    } else if (theme === 'light') {
      // Light theme gradient
      shell.style.background = 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)';
    } else {
      // Dark theme gradient (default)
      shell.style.background = 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)';
    }
  }

  // Apply color hints visibility
  if (window.TizenPortal && window.TizenPortal.setPortalHintsVisible) {
    window.TizenPortal.setPortalHintsVisible(true);
  }

  // Apply HUD position
  applyHudPosition(normalizeHudPosition(config.hudPosition || 'off'));
}

function applySiteTheme(theme) {
  var isPortal = !!document.getElementById('tp-shell');
  var htmlEl = document.documentElement;
  if (!htmlEl) return;

  if (isPortal) {
    htmlEl.classList.remove('tp-dark-mode');
    var portalStyle = document.getElementById('tp-site-theme');
    if (portalStyle && portalStyle.parentNode) {
      portalStyle.parentNode.removeChild(portalStyle);
    }
    return;
  }

  var enableDark = theme === 'dark';
  if (!enableDark) {
    htmlEl.classList.remove('tp-dark-mode');
  } else if (!htmlEl.classList.contains('tp-dark-mode')) {
    htmlEl.classList.add('tp-dark-mode');
  }

  var style = document.getElementById('tp-site-theme');
  if (!enableDark) {
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
    return;
  }

  if (!style) {
    style = document.createElement('style');
    style.id = 'tp-site-theme';
    (document.head || document.documentElement).appendChild(style);
  }

  style.textContent = [
    '/* TizenPortal Site Dark Mode */',
    'html.tp-dark-mode {',
    '  background: #111 !important;',
    '  filter: invert(1) hue-rotate(180deg);',
    '}',
    'html.tp-dark-mode body {',
    '  background: #111 !important;',
    '}',
    'html.tp-dark-mode img,',
    'html.tp-dark-mode video,',
    'html.tp-dark-mode canvas,',
    'html.tp-dark-mode iframe {',
    '  filter: invert(1) hue-rotate(180deg) !important;',
    '}',
    'html.tp-dark-mode .tp-site-hints,',
    'html.tp-dark-mode #tp-toast,',
    'html.tp-dark-mode .tp-addressbar,',
    'html.tp-dark-mode #tp-diagnostics,',
    'html.tp-dark-mode .tp-pointer {',
    '  filter: invert(1) hue-rotate(180deg) !important;',
    '}',
  ].join('\n');
}

/**
 * Apply debug HUD position or hide it
 * @param {string} position
 */
function applyHudPosition(position) {
  var hud = document.getElementById('tp-hud');
  if (!hud) return;

  var pos = position || 'off';
  if (pos === 'off') {
    hud.style.display = 'none';
    return;
  }

  hud.style.display = 'block';
  hud.style.top = '';
  hud.style.right = '';
  hud.style.bottom = '';
  hud.style.left = '';

  if (pos === 'top-left') {
    hud.style.top = '0';
    hud.style.left = '0';
  } else if (pos === 'bottom-right') {
    hud.style.bottom = '0';
    hud.style.right = '0';
  } else if (pos === 'bottom-left') {
    hud.style.bottom = '0';
    hud.style.left = '0';
  } else {
    // default top-right
    hud.style.top = '0';
    hud.style.right = '0';
  }
}

/**
 * Determine if it's night time based on sunset
 * Uses a simple approximation: night = 6pm to 6am
 * @returns {boolean} True if currently night time
 */
function isNightTime() {
  var hour = new Date().getHours();
  return hour < 6 || hour >= 18;
}

/**
 * Check if preferences is open
 */
export function isPreferencesOpen() {
  return prefsState.active;
}
