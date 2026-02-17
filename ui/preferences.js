/**
 * TizenPortal Preferences UI
 *
 * Full-screen preferences modal with D-pad navigation.
 * Mirrors the site editor's keyboard interaction model.
 */

import { isValidHexColor, isValidHttpUrl, escapeHtml } from '../core/utils.js';
import Userscripts from '../features/userscripts.js';
import featureLoader from '../features/index.js';
import Registry from '../features/registry.js';

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
  { value: 'portal', label: 'Portal (Blue & Orange)' },
  { value: 'backdrop', label: 'Custom Backdrop' },
  { value: 'custom', label: 'Custom Colours' },
];

var PORTAL_FILTER_OPTIONS = [
  { value: 'glow', label: 'Glow' },
  { value: 'crisp', label: 'Crisp' },
  { value: 'flat', label: 'Flat' },
  { value: 'vignette', label: 'Vignette' },
];

var PORTAL_ACCENT_OPTIONS = [
  { value: 'corners', label: 'Corners' },
  { value: 'opposite', label: 'Opposite Corners' },
  { value: 'top', label: 'Top Arc' },
  { value: 'bottom', label: 'Bottom Arc' },
  { value: 'sides', label: 'Sides' },
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

var HINT_POSITION_OPTIONS = [
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
 * Focus transition mode options
 */
var FOCUS_TRANSITION_MODE_OPTIONS = [
  { value: 'slide', label: 'Slide (Directional)' },
  { value: 'scale', label: 'Scale (Grow)' },
  { value: 'glow', label: 'Glow (Pulse)' },
  { value: 'off', label: 'Off' },
];

/**
 * Focus transition speed options
 */
var FOCUS_TRANSITION_SPEED_OPTIONS = [
  { value: 'fast', label: 'Fast (150ms)' },
  { value: 'medium', label: 'Medium (250ms)' },
  { value: 'slow', label: 'Slow (400ms)' },
];

/**
 * Text scale options
 */
var TEXT_SCALE_OPTIONS = [
  { value: 'extra-small', label: 'Extra Small (75%)' },
  { value: 'small', label: 'Small (90%)' },
  { value: 'off', label: 'Normal (100%)' },
  { value: 'medium', label: 'Medium (115%)' },
  { value: 'large', label: 'Large (135%)' },
  { value: 'extra-large', label: 'Extra Large (160%)' },
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
 * Navigation mode options
 * Note: Directional is preferred for most use cases
 */
var NAVIGATION_MODE_OPTIONS = [
  { value: 'directional', label: 'Smart Navigation (Directional) - Preferred' },
  { value: 'geometric', label: 'Grid Navigation (Geometric)' },
  { value: 'polyfill', label: 'Legacy Polyfill (Compatibility Only)' },
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

function normalizePortalFilter(value) {
  if (typeof value === 'number') {
    var idx = value % PORTAL_FILTER_OPTIONS.length;
    return PORTAL_FILTER_OPTIONS[idx].value;
  }

  if (typeof value === 'string') {
    for (var i = 0; i < PORTAL_FILTER_OPTIONS.length; i++) {
      if (PORTAL_FILTER_OPTIONS[i].value === value) {
        return value;
      }
    }
  }

  return 'glow';
}

function normalizePortalAccent(value) {
  if (typeof value === 'number') {
    var idx = value % PORTAL_ACCENT_OPTIONS.length;
    return PORTAL_ACCENT_OPTIONS[idx].value;
  }

  if (typeof value === 'string') {
    for (var i = 0; i < PORTAL_ACCENT_OPTIONS.length; i++) {
      if (PORTAL_ACCENT_OPTIONS[i].value === value) {
        return value;
      }
    }
  }

  return 'corners';
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

function normalizeHintsPosition(value) {
  if (typeof value === 'number') {
    var idx = value % HINT_POSITION_OPTIONS.length;
    return HINT_POSITION_OPTIONS[idx].value;
  }

  if (typeof value === 'string') {
    for (var i = 0; i < HINT_POSITION_OPTIONS.length; i++) {
      if (HINT_POSITION_OPTIONS[i].value === value) {
        return value;
      }
    }
  }

  return 'bottom-left';
}

/**
 * Preference rows definition
 * Note: customColor1/customColor2 are conditional rows shown only when theme='custom'
 */
var PREFERENCE_ROWS = [
  { id: 'theme', label: 'Theme Mode', type: 'select', options: THEME_OPTIONS, key: 'theme', config: 'portal', section: 'portal', category: 'appearance' },
  { id: 'portalFilter', label: 'Portal Filter', type: 'select', options: PORTAL_FILTER_OPTIONS, key: 'portalFilter', config: 'portal', section: 'portal', category: 'appearance' },
  { id: 'portalAccentPosition', label: 'Portal Accent Positions', type: 'select', options: PORTAL_ACCENT_OPTIONS, key: 'portalAccentPosition', config: 'portal', section: 'portal', category: 'appearance' },
  { id: 'customColor1', label: 'Gradient Color 1', type: 'color', key: 'customColor1', config: 'portal', showIf: 'custom', section: 'portal', category: 'appearance' },
  { id: 'customColor2', label: 'Gradient Color 2', type: 'color', key: 'customColor2', config: 'portal', showIf: 'custom', section: 'portal', category: 'appearance' },
  { id: 'backgroundImage', label: 'Backdrop Image URL', type: 'text', key: 'backgroundImage', config: 'portal', showIf: 'backdrop', section: 'portal', category: 'appearance' },
  { id: 'hudPosition', label: 'Debug HUD', type: 'select', options: HUD_OPTIONS, key: 'hudPosition', config: 'portal', section: 'portal', category: 'hints' },
  { id: 'hintsPosition', label: 'Color Hints', type: 'select', options: HINT_POSITION_OPTIONS, key: 'hintsPosition', config: 'portal', section: 'portal', category: 'hints' },
  { id: 'textScale', label: 'Text Scale', type: 'select', options: TEXT_SCALE_OPTIONS, key: 'textScale', config: 'features', section: 'global', category: 'appearance',
    description: 'Scale all text for improved TV legibility while maintaining relative sizing' },
  { id: 'focusOutlineMode', label: 'Focus Outline', type: 'select', options: FOCUS_OUTLINE_OPTIONS, key: 'focusOutlineMode', config: 'features', section: 'global', category: 'navigation' },
  { id: 'focusTransitionMode', label: 'Focus Transition Style', type: 'select', options: FOCUS_TRANSITION_MODE_OPTIONS, key: 'focusTransitionMode', config: 'features', section: 'global', category: 'navigation' },
  { id: 'focusTransitionSpeed', label: 'Focus Transition Speed', type: 'select', options: FOCUS_TRANSITION_SPEED_OPTIONS, key: 'focusTransitionSpeed', config: 'features', section: 'global', category: 'navigation' },
  { id: 'safeArea', label: 'TV Safe Area (5% inset)', type: 'toggle', key: 'safeArea', config: 'features', section: 'global', category: 'layout',
    description: 'Inset content 5% from edges to account for TV screen overscan (applies globally including portal)' },
  { id: 'cssReset', label: 'CSS Normalization', type: 'toggle', key: 'cssReset', config: 'features', section: 'global', category: 'layout',
    description: 'Apply baseline CSS resets for consistent display across Tizen browsers (applies globally)' },
  { id: 'hideScrollbars', label: 'Hide Scrollbars', type: 'toggle', key: 'hideScrollbars', config: 'features', section: 'global', category: 'layout',
    description: 'Hide native scrollbars for a cleaner TV interface (applies globally including portal)' },
  { id: 'gpuHints', label: 'GPU Acceleration', type: 'toggle', key: 'gpuHints', config: 'features', section: 'global', category: 'performance',
    description: 'Apply GPU hints to improve animation performance on constrained hardware (applies globally)' },
  { id: 'navigationMode', label: 'Navigation Mode', type: 'select', options: NAVIGATION_MODE_OPTIONS, key: 'navigationMode', config: 'features', section: 'site', category: 'navigation' },
  { id: 'viewportMode', label: 'Viewport Lock Mode', type: 'select', options: VIEWPORT_OPTIONS, key: 'viewportMode', config: 'features', section: 'site', category: 'navigation' },
  { id: 'uaMode', label: 'User Agent Mode', type: 'select', options: UA_MODE_OPTIONS, key: 'uaMode', config: 'features', section: 'site', category: 'compatibility' },
  { id: 'tabindexInjection', label: 'Auto-focusable Elements', type: 'toggle', key: 'tabindexInjection', config: 'features', section: 'site', category: 'input',
    description: 'Automatically inject tabindex on interactive elements for remote control navigation' },
  { id: 'scrollIntoView', label: 'Scroll into View on Focus', type: 'toggle', key: 'scrollIntoView', config: 'features', section: 'site', category: 'input',
    description: 'Scroll container when focused element comes into viewport' },
  { id: 'wrapTextInputs', label: 'Protect Text Inputs', type: 'toggle', key: 'wrapTextInputs', config: 'features', section: 'site', category: 'input',
    description: 'Protect text input fields from accidental remote button presses during editing' },
];

var SECTION_DEFS = [
  { id: 'global', label: '⚙️ Global Preferences', defaultCollapsed: true },
  { id: 'portal', label: '🖼️ Portal Preferences', defaultCollapsed: true },
  { id: 'site', label: '🖥️ Site Preferences', defaultCollapsed: true },
  { id: 'userscripts', label: '📜 User Scripts', defaultCollapsed: true },
];

var CATEGORY_LABELS = {
  appearance: '🎨 Appearance',
  navigation: '🧭 Navigation',
  input: '⌨️ Input',
  layout: '📐 Layout',
  performance: '⚡ Performance',
  compatibility: '🔧 Compatibility',
  hints: '💡 HUD & Hints',
};

var SECTION_CATEGORY_ORDER = {
  global: ['appearance', 'navigation', 'layout', 'performance'],
  portal: ['appearance', 'hints'],
  site: ['navigation', 'compatibility', 'input'],
};

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
    featuresConfig: featureLoader.getConfig ? featureLoader.getConfig() : (TizenPortal.config.get('tp_features') || getDefaultFeaturesConfig()),
  };

  // Normalize theme value if needed
  if (prefsState.settings.portalConfig) {
    var normalized = normalizeThemeValue(prefsState.settings.portalConfig.theme);
    if (prefsState.settings.portalConfig.theme !== normalized) {
      prefsState.settings.portalConfig.theme = normalized;
      TizenPortal.config.set('tp_portal', prefsState.settings.portalConfig);
    }
    var portalFilter = normalizePortalFilter(prefsState.settings.portalConfig.portalFilter);
    if (prefsState.settings.portalConfig.portalFilter !== portalFilter) {
      prefsState.settings.portalConfig.portalFilter = portalFilter;
      TizenPortal.config.set('tp_portal', prefsState.settings.portalConfig);
    }
    var portalAccent = normalizePortalAccent(prefsState.settings.portalConfig.portalAccentPosition);
    if (prefsState.settings.portalConfig.portalAccentPosition !== portalAccent) {
      prefsState.settings.portalConfig.portalAccentPosition = portalAccent;
      TizenPortal.config.set('tp_portal', prefsState.settings.portalConfig);
    }
    var hudNormalized = normalizeHudPosition(prefsState.settings.portalConfig.hudPosition);
    if (prefsState.settings.portalConfig.hudPosition !== hudNormalized) {
      prefsState.settings.portalConfig.hudPosition = hudNormalized;
      TizenPortal.config.set('tp_portal', prefsState.settings.portalConfig);
    }
    if (!prefsState.settings.portalConfig.hintsPosition && prefsState.settings.portalConfig.showHints === false) {
      prefsState.settings.portalConfig.hintsPosition = 'off';
    }
    var hintsNormalized = normalizeHintsPosition(prefsState.settings.portalConfig.hintsPosition);
    if (prefsState.settings.portalConfig.hintsPosition !== hintsNormalized) {
      prefsState.settings.portalConfig.hintsPosition = hintsNormalized;
      TizenPortal.config.set('tp_portal', prefsState.settings.portalConfig);
    }
  }

  prefsState.currentRow = 0;
  prefsState.active = true;

  prefsState.sectionCollapsed = getSectionDefaults();
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
    portalFilter: 'glow',
    portalAccentPosition: 'corners',
    hudPosition: 'off',
    hintsPosition: 'bottom-left',
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
    focusTransitions: true,
    focusTransitionMode: 'slide',
    focusTransitionSpeed: 'medium',
    tabindexInjection: true,
    scrollIntoView: true,
    safeArea: false,
    gpuHints: true,
    cssReset: true,
    hideScrollbars: false,
    wrapTextInputs: true,
    viewportMode: 'locked',
    uaMode: 'tizen',
    navigationFix: true,
    textScale: 'medium',
  };
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
  var rows = getVisibleRows();
  var grouped = {};

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var section = row.section || 'global';
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
    if (def.id === 'userscripts') {
      for (var k = 0; k < sectionRows.length; k++) {
        ordered.push(sectionRows[k]);
      }
    } else {
      var withCategories = buildSectionRows(def.id, sectionRows);
      for (var m = 0; m < withCategories.length; m++) {
        ordered.push(withCategories[m]);
      }
    }
  }

  return ordered;
}

function buildSectionRows(sectionId, sectionRows) {
  var categoryOrder = SECTION_CATEGORY_ORDER[sectionId] || [];
  var categories = {};
  for (var i = 0; i < sectionRows.length; i++) {
    var row = sectionRows[i];
    var category = row.category || 'appearance';
    if (!categories[category]) categories[category] = [];
    categories[category].push(row);
  }

  var ordered = [];
  var order = categoryOrder.length ? categoryOrder : Object.keys(categories);
  for (var j = 0; j < order.length; j++) {
    var key = order[j];
    var rows = categories[key];
    if (!rows || !rows.length) continue;
    ordered.push({ type: 'category', label: getPreferenceCategoryLabel(key), category: key, section: sectionId });
    for (var k = 0; k < rows.length; k++) {
      ordered.push(rows[k]);
    }
  }

  return ordered;
}

function buildUserscriptRows() {
  var rows = [];
  var categories = Registry.CATEGORIES;
  
  // Group scripts by category - use unified query API
  for (var cat in categories) {
    var categoryScripts = Registry.query({
      type: Registry.ITEM_TYPES.USERSCRIPT,
      category: categories[cat]
    });
    
    if (categoryScripts.length > 0) {
      // Add category label row
      rows.push({ type: 'userscript-category', category: categories[cat], label: getCategoryLabel(categories[cat]) });
      
      // Add script toggle rows
      for (var i = 0; i < categoryScripts.length; i++) {
        rows.push({ 
          type: 'userscript-toggle', 
          scriptId: categoryScripts[i].id,
          scriptName: categoryScripts[i].name,
          scriptDesc: categoryScripts[i].description,
          label: categoryScripts[i].name
        });
      }
    }
  }
  
  return rows;
}

function getCategoryLabel(category) {
  var labels = {
    'accessibility': '♿ Accessibility',
    'reading': '📖 Reading',
    'video': '🎬 Video',
    'navigation': '🧭 Navigation',
    'privacy': '🔒 Privacy',
    'experimental': '🧪 Experimental',
  };
  return labels[category] || category;
}

function getPreferenceCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

function isUserscriptEnabled(scriptId) {
  var cfg = Userscripts.getUserscriptsConfig();
  return cfg.enabled[scriptId] === true;
}

function setUserscriptEnabled(scriptId, enabled) {
  Userscripts.setGlobalUserscriptEnabled(scriptId, enabled);
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
    } else if (row.type === 'category') {
      html += '' +
        '<div class="tp-prefs-row tp-prefs-category" data-index="' + i + '" data-type="category" tabindex="-1">' +
          '<div class="tp-prefs-label" style="font-weight: bold; color: #8ab4f8;">' + escapeHtml(row.label) + '</div>' +
          '<div class="tp-prefs-value"></div>' +
        '</div>';
    } else if (row.type === 'userscript-category') {
      html += '' +
        '<div class="tp-prefs-row tp-prefs-userscript-category" data-index="' + i + '" data-type="userscript-category" tabindex="-1">' +
          '<div class="tp-prefs-label" style="font-weight: bold; color: #8ab4f8;">' + row.label + '</div>' +
          '<div class="tp-prefs-value"></div>' +
        '</div>';
    } else if (row.type === 'userscript-toggle') {
      var enabled = isUserscriptEnabled(row.scriptId);
      var displayValue = enabled ? '✓ Enabled' : '○ Disabled';
      html += '' +
        '<div class="tp-prefs-row" data-index="' + i + '" data-type="userscript-toggle" data-script-id="' + escapeHtml(row.scriptId) + '" tabindex="0">' +
          '<div class="tp-prefs-label">' + escapeHtml(row.label) + '</div>' +
          '<div class="tp-prefs-value">' + displayValue + '</div>' +
        '</div>';
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
  if (sectionId === 'userscripts') {
    // Use unified query API
    var scripts = Registry.query({ type: Registry.ITEM_TYPES.USERSCRIPT });
    if (!scripts.length) return 'No scripts registered';
    var enabledNames = [];
    for (var s = 0; s < scripts.length; s++) {
      var script = scripts[s];
      var enabled = isUserscriptEnabled(script.id);
      if (enabled) {
        enabledNames.push(script.name);
      }
    }
    return enabledNames.length > 0 ? enabledNames.join(', ') : 'None enabled';
  }

  var rows = getVisibleRows();
  var summaryParts = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (row.section !== sectionId) continue;
    var value = getValue(row);
    var display = formatSummaryValue(row, value);
    summaryParts.push(row.label + ': ' + display);
  }

  return summaryParts.join(' • ');
}

function formatSummaryValue(row, value) {
  if (row.type === 'toggle') {
    return value ? 'On' : 'Off';
  }
  if (row.type === 'select' && row.options) {
    var label = getOptionLabel(row.options, value);
    return label || (value || '(not set)');
  }
  if (row.type === 'color') {
    return value || '(not set)';
  }
  if (row.type === 'text') {
    if (row.id === 'backgroundImage') {
      return shortenUrl(value || '');
    }
    return value || '(not set)';
  }
  return value || '(not set)';
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

/**
 * Get current value for a preference row
 */
function getValue(row) {
  var config = row.config === 'portal' ? prefsState.settings.portalConfig : prefsState.settings.featuresConfig;
  var value = config[row.key];
  
  // DIAGNOSTIC: Log textScale reads specifically
  if (row.key === 'textScale') {
    console.log('getValue(textScale): value=' + value + ', full config:', config);
  }
  
  return value;
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

  if (row.type === 'userscript-toggle') {
    // Toggle userscript enabled state
    var scriptId = rowEl.dataset.scriptId;
    if (scriptId) {
      var currentEnabled = isUserscriptEnabled(scriptId);
      setUserscriptEnabled(scriptId, !currentEnabled);
      renderPreferencesUI();
      focusPreferencesRow(index);
      savePreferencesAuto('userscript-toggle:' + scriptId);
    }
    return;
  }

  if (row.type === 'userscript-category') {
    // Category headers are not interactive
    return;
  }

  if (row.type === 'category') {
    // Section category headers are not interactive
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
  // Old function - no longer needed with registry system
  // Kept as stub for compatibility
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
  var nextIndex = 0;
  if (currentIndex !== -1) {
    nextIndex = (currentIndex + 1) % options.length;
  }
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

  if (prefsState.settings.portalConfig) {
    prefsState.settings.portalConfig.theme = normalizeThemeValue(prefsState.settings.portalConfig.theme || 'dark');
    prefsState.settings.portalConfig.portalFilter = normalizePortalFilter(prefsState.settings.portalConfig.portalFilter || 'glow');
    prefsState.settings.portalConfig.portalAccentPosition = normalizePortalAccent(prefsState.settings.portalConfig.portalAccentPosition || 'corners');
    prefsState.settings.portalConfig.hudPosition = normalizeHudPosition(prefsState.settings.portalConfig.hudPosition || 'off');
    var hintPos = normalizeHintsPosition(prefsState.settings.portalConfig.hintsPosition || 'bottom-left');
    prefsState.settings.portalConfig.hintsPosition = hintPos;
    prefsState.settings.portalConfig.showHints = hintPos !== 'off';
  }

  // Save portal config
  TizenPortal.config.set('tp_portal', prefsState.settings.portalConfig);

  // DIAGNOSTIC: Log what we're saving for features
  console.log('Saving features config:', {
    textScale: prefsState.settings.featuresConfig.textScale,
    focusOutlineMode: prefsState.settings.featuresConfig.focusOutlineMode,
    full: prefsState.settings.featuresConfig
  });

  // Save features config
  TizenPortal.config.set('tp_features', prefsState.settings.featuresConfig);

  // Save userscripts config
  TizenPortal.config.set('tp_userscripts', prefsState.settings.userscriptsConfig);

  // Apply portal preferences immediately
  applyPortalPreferences(prefsState.settings.portalConfig);

  // Apply feature changes immediately (text scale, focus styling, etc.)
  featureLoader.applyFeatures(document, prefsState.settings.featuresConfig);

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

  if (!config.hintsPosition && config.showHints === false) {
    config.hintsPosition = 'off';
  }

  var theme = normalizeThemeValue(config.theme || 'dark');
  var portalFilter = normalizePortalFilter(config.portalFilter || 'glow');
  var portalAccent = normalizePortalAccent(config.portalAccentPosition || 'corners');

  // Handle automatic theme (sunset-based)
  if (theme === 'auto') {
    theme = isNightTime() ? 'dark' : 'light';
  }

  var allowSiteTheme = config.siteTheme === true;
  if (allowSiteTheme) {
    applySiteTheme(theme);
  } else {
    applySiteTheme('off');
  }

  var shell = document.getElementById('tp-shell');
  if (shell) {
    // Apply theme attribute for CSS
    shell.setAttribute('data-theme', theme);

    // Clear existing background styles
    shell.style.backgroundColor = '';
    shell.style.backgroundImage = '';
    shell.style.background = '';

    // Apply theme-specific styles
    if (theme === 'backdrop') {
      // Custom backdrop image — validate URL before injecting into CSS
      if (config.backgroundImage && isValidHttpUrl(config.backgroundImage)) {
        shell.style.backgroundImage = 'url(' + encodeURI(config.backgroundImage) + ')';
        shell.style.backgroundSize = 'cover';
        shell.style.backgroundPosition = 'center';
        shell.style.backgroundColor = '#0d1117'; // Fallback
      }
    } else {
      var baseGradient = '';
      if (theme === 'custom') {
        var color1 = isValidHexColor(config.customColor1) ? config.customColor1 : '#0d1117';
        var color2 = isValidHexColor(config.customColor2) ? config.customColor2 : '#161b22';
        baseGradient = 'linear-gradient(135deg, ' + color1 + ' 0%, ' + color2 + ' 100%)';
      } else if (theme === 'portal') {
        baseGradient = 'linear-gradient(135deg, #0d1117 0%, #1a2332 50%, #0d1117 100%)';
      } else if (theme === 'light') {
        baseGradient = 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)';
      } else {
        baseGradient = 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)';
      }
      shell.style.background = buildPortalBackground(portalFilter, portalAccent, baseGradient, true, theme === 'light');
    }
  }

  // Apply color hints position
  if (window.TizenPortal && window.TizenPortal.setPortalHintsPosition) {
    var hintsPosition = normalizeHintsPosition(config.hintsPosition || 'bottom-left');
    window.TizenPortal.setPortalHintsPosition(hintsPosition);
  } else if (window.TizenPortal && window.TizenPortal.setPortalHintsVisible) {
    window.TizenPortal.setPortalHintsVisible(true);
  }

  // Apply HUD position
  applyHudPosition(normalizeHudPosition(config.hudPosition || 'off'));
}

function buildPortalBackground(filter, accent, baseGradient, forShell, isLight) {
  var positions = getPortalAccentPositions(accent, forShell, isLight);

  if (filter === 'flat') {
    return baseGradient;
  }

  var glow = '';
  var glow2 = '';
  var vignette = '';

  if (filter === 'crisp') {
    glow = 'radial-gradient(' + positions.size + ' at ' + positions.first + ', rgba(' + positions.blue + ', ' + positions.crispAlpha + ') 0%, rgba(' + positions.blue + ', ' + positions.crispAlpha + ') ' + positions.crispStop + '%, transparent ' + positions.crispEnd + '%)';
    glow2 = 'radial-gradient(' + positions.size + ' at ' + positions.second + ', rgba(' + positions.orange + ', ' + positions.crispAlpha2 + ') 0%, rgba(' + positions.orange + ', ' + positions.crispAlpha2 + ') ' + positions.crispStop + '%, transparent ' + positions.crispEnd + '%)';
  } else if (filter === 'vignette') {
    glow = 'radial-gradient(' + positions.large + ' at ' + positions.first + ', rgba(' + positions.blue + ', ' + positions.glowAlpha + ') 0%, transparent ' + positions.glowEnd + '%)';
    glow2 = 'radial-gradient(' + positions.large + ' at ' + positions.second + ', rgba(' + positions.orange + ', ' + positions.glowAlpha2 + ') 0%, transparent ' + positions.glowEnd + '%)';
    vignette = 'radial-gradient(140% 140% at 50% 50%, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.45) 100%)';
  } else {
    glow = 'radial-gradient(' + positions.large + ' at ' + positions.first + ', rgba(' + positions.blue + ', ' + positions.glowAlpha + ') 0%, transparent ' + positions.glowEnd + '%)';
    glow2 = 'radial-gradient(' + positions.large + ' at ' + positions.second + ', rgba(' + positions.orange + ', ' + positions.glowAlpha2 + ') 0%, transparent ' + positions.glowEnd + '%)';
  }

  if (vignette) {
    return glow + ', ' + glow2 + ', ' + vignette + ', ' + baseGradient;
  }
  return glow + ', ' + glow2 + ', ' + baseGradient;
}

function getPortalAccentPositions(accent, forShell, isLight) {
  var blue = forShell ? '0, 170, 255' : '74, 144, 226';
  var orange = forShell ? '255, 140, 0' : '255, 149, 0';
  var large = forShell ? '820px 560px' : '900px 600px';
  var size = forShell ? '160px 160px' : '180px 180px';
  var glowAlpha = forShell ? 0.28 : 0.22;
  var glowAlpha2 = forShell ? 0.26 : 0.22;
  var glowEnd = forShell ? 62 : 50;
  var crispAlpha = forShell ? 0.5 : 0.55;
  var crispAlpha2 = forShell ? 0.5 : 0.55;
  var crispStop = forShell ? 36 : 38;
  var crispEnd = forShell ? 38 : 40;

  if (isLight) {
    glowAlpha *= 0.7;
    glowAlpha2 *= 0.7;
    crispAlpha *= 0.65;
    crispAlpha2 *= 0.65;
  }

  var first = forShell ? '18% 22%' : '12% 18%';
  var second = forShell ? '82% 78%' : '88% 82%';

  if (accent === 'opposite') {
    first = forShell ? '82% 22%' : '88% 18%';
    second = forShell ? '18% 78%' : '12% 82%';
  } else if (accent === 'top') {
    first = forShell ? '25% 18%' : '25% 12%';
    second = forShell ? '75% 18%' : '75% 12%';
  } else if (accent === 'bottom') {
    first = forShell ? '25% 82%' : '25% 88%';
    second = forShell ? '75% 82%' : '75% 88%';
  } else if (accent === 'sides') {
    first = forShell ? '12% 50%' : '12% 50%';
    second = forShell ? '88% 50%' : '88% 50%';
  }

  return {
    blue: blue,
    orange: orange,
    large: large,
    size: size,
    glowAlpha: glowAlpha.toFixed(2),
    glowAlpha2: glowAlpha2.toFixed(2),
    glowEnd: glowEnd,
    crispAlpha: crispAlpha.toFixed(2),
    crispAlpha2: crispAlpha2.toFixed(2),
    crispStop: crispStop,
    crispEnd: crispEnd,
    first: first,
    second: second,
  };
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
