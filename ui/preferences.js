/**
 * TizenPortal Preferences UI
 * 
 * Full-screen preferences modal with D-pad navigation.
 * Mirrors the site editor's keyboard interaction model.
 */

/**
 * Preferences state
 */
var prefsState = {
  active: false,
  currentRow: 0,
  settings: {},
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
  { id: 'theme', label: 'Theme Mode', type: 'select', options: THEME_OPTIONS, key: 'theme', config: 'portal' },
  { id: 'hudPosition', label: 'Debug HUD', type: 'select', options: HUD_OPTIONS, key: 'hudPosition', config: 'portal' },
  { id: 'showHints', label: 'Color Hints', type: 'toggle', key: 'showHints', config: 'portal' },
  { id: 'customColor1', label: 'Gradient Color 1', type: 'color', key: 'customColor1', config: 'portal', showIf: 'custom' },
  { id: 'customColor2', label: 'Gradient Color 2', type: 'color', key: 'customColor2', config: 'portal', showIf: 'custom' },
  { id: 'backgroundImage', label: 'Backdrop Image URL', type: 'text', key: 'backgroundImage', config: 'portal', showIf: 'backdrop' },
  { id: 'focusStyling', label: 'Focus Styling (blue outline)', type: 'toggle', key: 'focusStyling', config: 'features' },
  { id: 'tabindexInjection', label: 'Auto-focusable Elements', type: 'toggle', key: 'tabindexInjection', config: 'features' },
  { id: 'scrollIntoView', label: 'Scroll-into-view on Focus', type: 'toggle', key: 'scrollIntoView', config: 'features' },
  { id: 'safeArea', label: 'TV Safe Area (5% inset)', type: 'toggle', key: 'safeArea', config: 'features' },
  { id: 'gpuHints', label: 'GPU Acceleration Hints', type: 'toggle', key: 'gpuHints', config: 'features' },
  { id: 'cssReset', label: 'CSS Normalization', type: 'toggle', key: 'cssReset', config: 'features' },
  { id: 'wrapTextInputs', label: 'Protect Text Inputs (TV Keyboard)', type: 'toggle', key: 'wrapTextInputs', config: 'features' },
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
  document.body.appendChild(prefs);
  
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

/**
 * Get default features configuration
 */
function getDefaultFeaturesConfig() {
  return {
    focusStyling: true,
    tabindexInjection: true,
    scrollIntoView: true,
    safeArea: false,
    gpuHints: true,
    cssReset: true,
    wrapTextInputs: true,
  };
}

/**
 * Get visible preference rows based on current theme setting
 */
function getVisibleRows() {
  var currentTheme = normalizeThemeValue(prefsState.settings.portalConfig.theme || 'dark');
  var visible = [];
  
  for (var i = 0; i < PREFERENCE_ROWS.length; i++) {
    var row = PREFERENCE_ROWS[i];
    // Show row if no condition, or condition matches current theme
    if (!row.showIf || row.showIf === currentTheme) {
      visible.push(row);
    }
  }
  
  return visible;
}

/**
 * Render preferences rows
 */
function renderPreferencesUI() {
  var container = document.getElementById('tp-prefs-rows');
  if (!container) return;

  var visibleRows = getVisibleRows();
  var html = '';

  for (var i = 0; i < visibleRows.length; i++) {
    var row = visibleRows[i];
    var value = getValue(row);
    var displayValue = formatDisplayValue(row, value);

    html += '' +
      '<div class="tp-prefs-row" data-index="' + i + '" data-id="' + row.id + '" tabindex="0">' +
        '<div class="tp-prefs-label">' + row.label + '</div>' +
        '<div class="tp-prefs-value">' + displayValue + '</div>' +
      '</div>';
  }

  container.innerHTML = html;

  // Set up row listeners
  var rows = container.querySelectorAll('.tp-prefs-row');
  for (var j = 0; j < rows.length; j++) {
    rows[j].addEventListener('click', function() {
      activatePreferenceRow(this);
    });
  }
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

/**
 * Navigate preferences (Up/Down)
 * Now includes Close button as final navigation target
 */
function navigatePreferences(direction) {
  var visibleRows = getVisibleRows();
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
  var visibleRows = getVisibleRows();
  
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
  var visibleRows = getVisibleRows();
  var row = visibleRows[index];

  if (!row) return;

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

/**
 * Close preferences
 */
export function closePreferences() {
  var prefs = document.getElementById('tp-preferences');
  if (prefs) {
    prefs.classList.remove('visible');
  }
  prefsState.active = false;
  
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
  
  var shell = document.getElementById('tp-shell');
  if (!shell) return;
  
  var theme = normalizeThemeValue(config.theme || 'dark');
  
  // Handle automatic theme (sunset-based)
  if (theme === 'auto') {
    theme = isNightTime() ? 'dark' : 'light';
  }
  
  // Apply theme attribute for CSS
  shell.setAttribute('data-theme', theme);
  
  // Clear existing background styles
  shell.style.backgroundColor = '';
  shell.style.backgroundImage = '';
  shell.style.background = '';
  
  // Apply theme-specific styles
  if (theme === 'custom') {
    // Custom gradient colors
    var color1 = config.customColor1 || '#0d1117';
    var color2 = config.customColor2 || '#161b22';
    shell.style.background = 'linear-gradient(135deg, ' + color1 + ' 0%, ' + color2 + ' 100%)';
  } else if (theme === 'backdrop') {
    // Custom backdrop image
    if (config.backgroundImage) {
      shell.style.backgroundImage = 'url(' + config.backgroundImage + ')';
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

  // Apply color hints visibility
  if (window.TizenPortal && window.TizenPortal.setPortalHintsVisible) {
    window.TizenPortal.setPortalHintsVisible(true);
  }

  // Apply HUD position
  applyHudPosition(normalizeHudPosition(config.hudPosition || 'off'));
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
