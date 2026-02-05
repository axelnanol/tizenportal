/**
 * TizenPortal Preferences UI
 * 
 * Settings modal for portal appearance and global site features.
 */

/**
 * Show preferences modal
 */
export function showPreferences() {
  if (!window.TizenPortal) {
    console.error('TizenPortal not initialized');
    return;
  }
  
  // Get current configuration
  var portalConfig = TizenPortal.config.get('tp_portal') || getDefaultPortalConfig();
  var featuresConfig = TizenPortal.config.get('tp_features') || getDefaultFeaturesConfig();
  
  // Create modal content
  var modalContent = createPreferencesForm(portalConfig, featuresConfig);
  
  // Show modal (reusing existing modal system)
  if (window.TizenPortal.modal && window.TizenPortal.modal.show) {
    TizenPortal.modal.show('Preferences', modalContent, function(form) {
      return handleSavePreferences(form);
    });
  } else {
    // Fallback if modal system not available
    showPreferencesStandalone(modalContent);
  }
}

/**
 * Get default portal configuration
 * @returns {Object}
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
 * @returns {Object}
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
 * Create preferences form
 * @param {Object} portalConfig
 * @param {Object} featuresConfig
 * @returns {HTMLElement}
 */
function createPreferencesForm(portalConfig, featuresConfig) {
  var form = document.createElement('form');
  form.className = 'tp-preferences-form';
  form.setAttribute('data-focus-group', 'preferences-form');
  
  // Portal Appearance Section
  var portalSection = document.createElement('div');
  portalSection.className = 'tp-prefs-section';
  
  var portalHeading = document.createElement('h3');
  portalHeading.className = 'tp-prefs-heading';
  portalHeading.textContent = 'Portal Appearance';
  portalSection.appendChild(portalHeading);
  
  // Theme
  var themeField = createSelectField('theme', 'Theme', [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
  ], portalConfig.theme);
  portalSection.appendChild(themeField);
  
  // Background Color
  var bgColorField = createTextField('backgroundColor', 'Background Color', portalConfig.backgroundColor);
  portalSection.appendChild(bgColorField);
  
  // Background Image
  var bgImageField = createTextField('backgroundImage', 'Background Image URL', portalConfig.backgroundImage);
  portalSection.appendChild(bgImageField);
  
  form.appendChild(portalSection);
  
  // Global Site Settings Section
  var featuresSection = document.createElement('div');
  featuresSection.className = 'tp-prefs-section';
  
  var featuresHeading = document.createElement('h3');
  featuresHeading.className = 'tp-prefs-heading';
  featuresHeading.textContent = 'Global Site Settings';
  featuresSection.appendChild(featuresHeading);
  
  var featuresDesc = document.createElement('p');
  featuresDesc.className = 'tp-prefs-description';
  featuresDesc.textContent = 'These settings apply to all sites';
  featuresSection.appendChild(featuresDesc);
  
  // Feature checkboxes
  var features = [
    { key: 'focusStyling', label: 'Focus styling (blue outline)' },
    { key: 'tabindexInjection', label: 'Auto-focusable elements' },
    { key: 'scrollIntoView', label: 'Scroll-into-view on focus' },
    { key: 'safeArea', label: 'TV safe area (5% inset)' },
    { key: 'gpuHints', label: 'GPU acceleration hints' },
    { key: 'cssReset', label: 'CSS normalization' },
  ];
  
  features.forEach(function(feature) {
    var checkboxField = createCheckboxField(
      feature.key,
      feature.label,
      featuresConfig[feature.key]
    );
    featuresSection.appendChild(checkboxField);
  });
  
  form.appendChild(featuresSection);
  
  return form;
}

/**
 * Create a text input field
 * @param {string} name
 * @param {string} label
 * @param {string} value
 * @returns {HTMLElement}
 */
function createTextField(name, label, value) {
  var field = document.createElement('div');
  field.className = 'tp-prefs-field';
  
  var labelEl = document.createElement('label');
  labelEl.className = 'tp-prefs-label';
  labelEl.textContent = label;
  labelEl.htmlFor = 'tp-pref-' + name;
  field.appendChild(labelEl);
  
  var input = document.createElement('input');
  input.type = 'text';
  input.id = 'tp-pref-' + name;
  input.name = name;
  input.className = 'tp-prefs-input';
  input.value = value || '';
  input.setAttribute('tabindex', '0');
  field.appendChild(input);
  
  return field;
}

/**
 * Create a select field
 * @param {string} name
 * @param {string} label
 * @param {Array} options
 * @param {string} value
 * @returns {HTMLElement}
 */
function createSelectField(name, label, options, value) {
  var field = document.createElement('div');
  field.className = 'tp-prefs-field';
  
  var labelEl = document.createElement('label');
  labelEl.className = 'tp-prefs-label';
  labelEl.textContent = label;
  labelEl.htmlFor = 'tp-pref-' + name;
  field.appendChild(labelEl);
  
  var select = document.createElement('select');
  select.id = 'tp-pref-' + name;
  select.name = name;
  select.className = 'tp-prefs-select';
  select.setAttribute('tabindex', '0');
  
  options.forEach(function(option) {
    var opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    if (option.value === value) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
  
  field.appendChild(select);
  
  return field;
}

/**
 * Create a checkbox field
 * @param {string} name
 * @param {string} label
 * @param {boolean} checked
 * @returns {HTMLElement}
 */
function createCheckboxField(name, label, checked) {
  var field = document.createElement('div');
  field.className = 'tp-prefs-field tp-prefs-checkbox-field';
  
  var wrapper = document.createElement('label');
  wrapper.className = 'tp-prefs-checkbox-wrapper';
  wrapper.setAttribute('tabindex', '0');
  wrapper.setAttribute('role', 'checkbox');
  wrapper.setAttribute('aria-checked', checked ? 'true' : 'false');
  
  var checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'tp-pref-' + name;
  checkbox.name = name;
  checkbox.className = 'tp-prefs-checkbox';
  checkbox.checked = checked;
  checkbox.setAttribute('tabindex', '-1'); // Wrapper handles focus
  
  var labelEl = document.createElement('span');
  labelEl.className = 'tp-prefs-checkbox-label';
  labelEl.textContent = label;
  
  // Toggle checkbox on Enter/Space
  wrapper.addEventListener('keydown', function(e) {
    if (e.keyCode === 13 || e.keyCode === 32) { // Enter or Space
      e.preventDefault();
      checkbox.checked = !checkbox.checked;
      wrapper.setAttribute('aria-checked', checkbox.checked ? 'true' : 'false');
      wrapper.classList.toggle('checked', checkbox.checked);
    }
  });
  
  // Update visual state on change
  checkbox.addEventListener('change', function() {
    wrapper.setAttribute('aria-checked', checkbox.checked ? 'true' : 'false');
    wrapper.classList.toggle('checked', checkbox.checked);
  });
  
  // Initial state
  if (checked) {
    wrapper.classList.add('checked');
  }
  
  wrapper.appendChild(checkbox);
  wrapper.appendChild(labelEl);
  field.appendChild(wrapper);
  
  return field;
}

/**
 * Handle save preferences
 * @param {HTMLFormElement} form
 * @returns {boolean} Success
 */
function handleSavePreferences(form) {
  // Extract portal config
  var portalConfig = {
    theme: form.theme.value,
    backgroundColor: form.backgroundColor.value.trim() || '#1a1a2e',
    backgroundImage: form.backgroundImage.value.trim() || '',
  };
  
  // Extract features config
  var featuresConfig = {
    focusStyling: form.focusStyling.checked,
    tabindexInjection: form.tabindexInjection.checked,
    scrollIntoView: form.scrollIntoView.checked,
    safeArea: form.safeArea.checked,
    gpuHints: form.gpuHints.checked,
    cssReset: form.cssReset.checked,
  };
  
  // Save to config
  TizenPortal.config.set('tp_portal', portalConfig);
  TizenPortal.config.set('tp_features', featuresConfig);
  
  // Apply portal preferences immediately
  applyPortalPreferences(portalConfig);
  
  // Show toast about reloading sites
  if (window.TizenPortal.showToast) {
    TizenPortal.showToast('Preferences saved. Site feature changes will apply when you reload sites.');
  }
  
  TizenPortal.log('Preferences saved:', portalConfig, featuresConfig);
  
  return true; // Close modal
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
 * Standalone preferences modal (fallback if modal system not integrated)
 * @param {HTMLElement} content
 */
function showPreferencesStandalone(content) {
  // Create simple modal overlay
  var overlay = document.createElement('div');
  overlay.className = 'tp-prefs-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
  
  var modal = document.createElement('div');
  modal.className = 'tp-prefs-modal';
  modal.style.cssText = 'background:#2a2a4e;padding:40px;border-radius:8px;max-width:800px;max-height:80%;overflow-y:auto;';
  
  var title = document.createElement('h2');
  title.textContent = 'Preferences';
  title.style.cssText = 'margin-top:0;color:#fff;';
  modal.appendChild(title);
  
  modal.appendChild(content);
  
  var buttons = document.createElement('div');
  buttons.style.cssText = 'margin-top:30px;display:flex;gap:20px;justify-content:flex-end;';
  
  var saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.setAttribute('tabindex', '0');
  saveBtn.style.cssText = 'padding:10px 30px;background:#0066cc;color:#fff;border:none;border-radius:4px;cursor:pointer;';
  saveBtn.onclick = function() {
    if (handleSavePreferences(content)) {
      document.body.removeChild(overlay);
    }
  };
  buttons.appendChild(saveBtn);
  
  var cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.setAttribute('tabindex', '0');
  cancelBtn.style.cssText = 'padding:10px 30px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;';
  cancelBtn.onclick = function() {
    document.body.removeChild(overlay);
  };
  buttons.appendChild(cancelBtn);
  
  modal.appendChild(buttons);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Focus first field
  setTimeout(function() {
    var firstInput = content.querySelector('select, input, [tabindex="0"]');
    if (firstInput) firstInput.focus();
  }, 100);
}

export default {
  showPreferences: showPreferences,
  applyPortalPreferences: applyPortalPreferences,
  getDefaultPortalConfig: getDefaultPortalConfig,
  getDefaultFeaturesConfig: getDefaultFeaturesConfig,
};
