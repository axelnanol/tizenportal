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
 * Preference rows definition
 */
var PREFERENCE_ROWS = [
  { id: 'theme', label: 'Theme', type: 'select', options: ['Dark', 'Light'], key: 'theme', config: 'portal' },
  { id: 'backgroundColor', label: 'Background Color', type: 'text', key: 'backgroundColor', config: 'portal' },
  { id: 'backgroundImage', label: 'Background Image URL', type: 'text', key: 'backgroundImage', config: 'portal' },
  { id: 'focusStyling', label: 'Focus Styling (blue outline)', type: 'toggle', key: 'focusStyling', config: 'features' },
  { id: 'tabindexInjection', label: 'Auto-focusable Elements', type: 'toggle', key: 'tabindexInjection', config: 'features' },
  { id: 'scrollIntoView', label: 'Scroll-into-view on Focus', type: 'toggle', key: 'scrollIntoView', config: 'features' },
  { id: 'safeArea', label: 'TV Safe Area (5% inset)', type: 'toggle', key: 'safeArea', config: 'features' },
  { id: 'gpuHints', label: 'GPU Acceleration Hints', type: 'toggle', key: 'gpuHints', config: 'features' },
  { id: 'cssReset', label: 'CSS Normalization', type: 'toggle', key: 'cssReset', config: 'features' },
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
        '<div class="tp-prefs-hint">Navigate with D-pad | ENTER to edit/toggle</div>' +
      '</div>' +
      '<div class="tp-prefs-body">' +
        '<div class="tp-prefs-rows" id="tp-prefs-rows"></div>' +
      '</div>' +
      '<div class="tp-prefs-footer">' +
        '<button type="button" class="tp-prefs-btn tp-prefs-btn-cancel" id="tp-prefs-cancel" tabindex="0">' +
          'Cancel' +
        '</button>' +
        '<button type="button" class="tp-prefs-btn tp-prefs-btn-save" id="tp-prefs-save" tabindex="0">' +
          '<span class="tp-btn-icon">✓</span> Save' +
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

  // Save button
  var saveBtn = prefs.querySelector('#tp-prefs-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      saveAndClosePreferences();
    });
    saveBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        saveAndClosePreferences();
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
    if (active && active.id === 'tp-prefs-save') {
      event.preventDefault();
      saveAndClosePreferences();
      return;
    }
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
    backgroundColor: '#1a1a2e',
    backgroundImage: '',
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
  };
}

/**
 * Render preferences rows
 */
function renderPreferencesUI() {
  var container = document.getElementById('tp-prefs-rows');
  if (!container) return;

  var html = '';

  for (var i = 0; i < PREFERENCE_ROWS.length; i++) {
    var row = PREFERENCE_ROWS[i];
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
  if (row.type === 'select') {
    return value || 'dark';
  }
  // Text field
  return value || '(not set)';
}

/**
 * Navigate preferences (Up/Down)
 */
function navigatePreferences(direction) {
  var newIndex = prefsState.currentRow + direction;
  
  // Clamp to valid range
  if (newIndex < 0) newIndex = 0;
  if (newIndex >= PREFERENCE_ROWS.length) newIndex = PREFERENCE_ROWS.length - 1;
  
  if (newIndex !== prefsState.currentRow) {
    prefsState.currentRow = newIndex;
    focusPreferencesRow(newIndex);
  }
}

/**
 * Focus a preferences row
 */
function focusPreferencesRow(index) {
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
  var row = PREFERENCE_ROWS[index];

  if (!row) return;

  console.log('TizenPortal: Activate preference row:', row.id, 'type:', row.type);

  if (row.type === 'toggle') {
    // Toggle boolean value
    var currentValue = getValue(row);
    setValue(row, !currentValue);
    renderPreferencesUI();
    focusPreferencesRow(index);
  } else if (row.type === 'select') {
    // Cycle through select options
    cycleSelectOption(row, index);
  } else if (row.type === 'text') {
    // Show text input prompt
    showTextInputPrompt(row, index);
  }
}

/**
 * Cycle through select options
 */
function cycleSelectOption(row, index) {
  var currentValue = getValue(row);
  var options = row.options;
  
  // Find current index
  var currentIndex = options.indexOf(currentValue);
  if (currentIndex === -1) currentIndex = 0;
  
  // Move to next option
  var nextIndex = (currentIndex + 1) % options.length;
  var nextValue = options[nextIndex];
  
  setValue(row, nextValue.toLowerCase());
  renderPreferencesUI();
  focusPreferencesRow(index);
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
function saveAndClosePreferences() {
  console.log('TizenPortal: Saving preferences');
  
  // Save portal config
  TizenPortal.config.set('tp_portal', prefsState.settings.portalConfig);
  
  // Save features config
  TizenPortal.config.set('tp_features', prefsState.settings.featuresConfig);
  
  console.log('TizenPortal: Preferences saved:', prefsState.settings);
  
  // Apply portal preferences immediately
  applyPortalPreferences(prefsState.settings.portalConfig);
  
  // Show toast
  if (window.TizenPortal && window.TizenPortal.showToast) {
    TizenPortal.showToast('Preferences saved. Feature changes apply when sites reload.');
  }
  
  closePreferences();
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
  
  // Apply theme
  shell.setAttribute('data-theme', config.theme || 'dark');
  
  // Apply background color
  if (config.backgroundColor) {
    shell.style.backgroundColor = config.backgroundColor;
  }
  
  // Apply background image
  if (config.backgroundImage) {
    shell.style.backgroundImage = 'url(' + config.backgroundImage + ')';
    shell.style.backgroundSize = 'cover';
    shell.style.backgroundPosition = 'center';
  } else {
    shell.style.backgroundImage = '';
  }
}

/**
 * Check if preferences is open
 */
export function isPreferencesOpen() {
  return prefsState.active;
}
