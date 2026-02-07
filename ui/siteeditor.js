/**
 * TizenPortal Site Editor
 * 
 * Full-screen TV-friendly site creation and editing.
 * Replaces the old modal-based card forms.
 */

import { addCard, updateCard, deleteCard, getCards } from './cards.js';
import { getFeatureBundles, getBundle } from '../bundles/registry.js';
import { refreshPortal } from './modal.js';
import { escapeHtml, sanitizeUrl } from '../core/utils.js';

/**
 * Editor state
 */
var state = {
  active: false,
  card: null,
  currentField: 0,
  onComplete: null,
};

/**
 * Editor mode - stored on DOM element to prevent state loss
 * Mode can be: 'add' or 'edit'
 * For edit mode, cardId is stored on editor.dataset.cardId
 */
function getEditorMode() {
  var editor = document.getElementById('tp-site-editor');
  return editor ? editor.dataset.mode : 'add';
}

function getEditorCardId() {
  var editor = document.getElementById('tp-site-editor');
  return editor ? editor.dataset.cardId : '';
}

function setEditorMode(mode, cardId) {
  var editor = document.getElementById('tp-site-editor');
  if (editor) {
    editor.dataset.mode = mode;
    editor.dataset.cardId = cardId || '';
    console.log('TizenPortal: setEditorMode mode=' + mode + ' cardId=' + cardId);
  }
}

/**
 * Field definitions for the editor
 */
var VIEWPORT_MODE_OPTIONS = [
  { value: null, label: 'Global (default)' },
  { value: 'auto', label: 'Auto' },
  { value: 'locked', label: 'Locked (1920)' },
  { value: 'unlocked', label: 'Unlocked' },
];

var FOCUS_OUTLINE_OPTIONS = [
  { value: null, label: 'Global (default)' },
  { value: 'on', label: 'On (Blue)' },
  { value: 'high', label: 'High Contrast (Yellow)' },
  { value: 'off', label: 'Off' },
];

var UA_MODE_OPTIONS = [
  { value: null, label: 'Global (default)' },
  { value: 'tizen', label: 'Tizen TV' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' },
];

var FEATURE_TOGGLE_OPTIONS = [
  { value: null, label: 'Global (default)' },
  { value: true, label: 'On' },
  { value: false, label: 'Off' },
];

var SECTION_DEFS = [
  { id: 'details', label: 'Site Details', defaultCollapsed: false },
  { id: 'options', label: 'Site Options', defaultCollapsed: true },
  { id: 'bundleOptions', label: 'Bundle Options', defaultCollapsed: true },
];

var sectionCollapsed = {
  details: false,
  options: true,
};

var FIELDS = [
  { name: 'name', label: 'Site Name', type: 'text', placeholder: 'My Site', required: true, section: 'details' },
  { name: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com', required: true, section: 'details' },
  { name: 'icon', label: 'Icon URL', type: 'text', placeholder: 'https://... (optional)', required: false, section: 'details' },
  { name: 'featureBundle', label: 'Site-specific Bundle', type: 'bundle', required: false },
  { name: '__section_options', label: 'Site Options', type: 'section', sectionId: 'options' },
  { name: 'viewportMode', label: 'Viewport Lock Mode', type: 'select', options: VIEWPORT_MODE_OPTIONS, section: 'options' },
  { name: 'focusOutlineMode', label: 'Focus Outline', type: 'select', options: FOCUS_OUTLINE_OPTIONS, section: 'options' },
  { name: 'userAgent', label: 'User Agent Mode', type: 'select', options: UA_MODE_OPTIONS, section: 'options' },
  { name: 'tabindexInjection', label: 'Auto-focusable Elements', type: 'select', options: FEATURE_TOGGLE_OPTIONS, section: 'options' },
  { name: 'scrollIntoView', label: 'Scroll-into-view on Focus', type: 'select', options: FEATURE_TOGGLE_OPTIONS, section: 'options' },
  { name: 'safeArea', label: 'TV Safe Area (5% inset)', type: 'select', options: FEATURE_TOGGLE_OPTIONS, section: 'options' },
  { name: 'gpuHints', label: 'GPU Acceleration Hints', type: 'select', options: FEATURE_TOGGLE_OPTIONS, section: 'options' },
  { name: 'cssReset', label: 'CSS Normalization', type: 'select', options: FEATURE_TOGGLE_OPTIONS, section: 'options' },
  { name: 'hideScrollbars', label: 'Hide Scrollbars', type: 'select', options: FEATURE_TOGGLE_OPTIONS, section: 'options' },
  { name: 'wrapTextInputs', label: 'Protect Text Inputs (TV Keyboard)', type: 'select', options: FEATURE_TOGGLE_OPTIONS, section: 'options' },
];

/**
 * Ensure bundle options are initialized from bundle metadata
 */
function ensureBundleOptionsInitialized() {
  if (!state.card) return;

  var bundleName = state.card.featureBundle;
  if (!bundleName) return;

  var bundle = getBundle(bundleName);
  if (!bundle || !bundle.options || !bundle.options.length) return;

  if (!state.card.bundleOptions || typeof state.card.bundleOptions !== 'object') {
    state.card.bundleOptions = {};
  }
  if (!state.card.bundleOptionData || typeof state.card.bundleOptionData !== 'object') {
    state.card.bundleOptionData = {};
  }

  var options = bundle.options;
  for (var i = 0; i < options.length; i++) {
    var opt = options[i];
    if (!opt || !opt.key) continue;
    if (!state.card.bundleOptions.hasOwnProperty(opt.key)) {
      state.card.bundleOptions[opt.key] = opt.hasOwnProperty('default') ? opt.default : null;
    }
  }
}

/**
 * Reset bundle options when changing bundle
 */
function resetBundleOptionsForBundle(bundleName) {
  if (!state.card) return;
  state.card.bundleOptions = {};
  state.card.bundleOptionData = {};

  if (!bundleName) return;

  var bundle = getBundle(bundleName);
  if (!bundle || !bundle.options || !bundle.options.length) return;

  for (var i = 0; i < bundle.options.length; i++) {
    var opt = bundle.options[i];
    if (!opt || !opt.key) continue;
    state.card.bundleOptions[opt.key] = opt.hasOwnProperty('default') ? opt.default : null;
  }
}

/**
 * Initialize the site editor
 */
export function initSiteEditor() {
  // Create editor container
  var editor = document.createElement('div');
  editor.id = 'tp-site-editor';
  editor.className = 'tp-site-editor';
  editor.innerHTML = createEditorHTML();
  var shell = document.getElementById('tp-shell');
  if (shell) {
    shell.appendChild(editor);
  } else {
    document.body.appendChild(editor);
  }

  // Set up event listeners
  setupEventListeners(editor);

  console.log('TizenPortal: Site editor initialized');
}

/**
 * Create the editor HTML
 */
function createEditorHTML() {
  return '' +
    '<div class="tp-editor-backdrop"></div>' +
    '<div class="tp-editor-panel">' +
      '<div class="tp-editor-header">' +
        '<h2 id="tp-editor-title">Add Site</h2>' +
        '<div class="tp-editor-hint">Navigate with D-pad | Changes auto-save</div>' +
      '</div>' +
      '<div class="tp-editor-body">' +
        '<div class="tp-editor-fields" id="tp-editor-fields"></div>' +
        '<div class="tp-editor-preview" id="tp-editor-preview">' +
          '<div class="tp-editor-preview-card">' +
            '<div class="tp-preview-icon" id="tp-preview-icon">?</div>' +
            '<div class="tp-preview-name" id="tp-preview-name">Site Name</div>' +
            '<div class="tp-preview-url" id="tp-preview-url">https://...</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="tp-editor-footer">' +
        '<button type="button" class="tp-editor-btn tp-editor-btn-delete" id="tp-editor-delete" tabindex="0">' +
          '<span class="tp-btn-icon">🗑</span> Delete' +
        '</button>' +
        '<div class="tp-editor-footer-right">' +
          '<button type="button" class="tp-editor-btn tp-editor-btn-cancel" id="tp-editor-cancel" tabindex="0">' +
            'Close' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

/**
 * Set up event listeners
 */
function setupEventListeners(editor) {
  // Cancel button - click AND keydown for Enter
  var cancelBtn = editor.querySelector('#tp-editor-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      closeSiteEditor();
    });
    cancelBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) { // Enter
        e.preventDefault();
        e.stopPropagation();
        closeSiteEditor();
      }
    });
  }

  // Delete button - click AND keydown for Enter
  var deleteBtn = editor.querySelector('#tp-editor-delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      deleteAndClose();
    });
    deleteBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) { // Enter
        e.preventDefault();
        e.stopPropagation();
        deleteAndClose();
      }
    });
  }

  // Backdrop click
  var backdrop = editor.querySelector('.tp-editor-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', function() {
      closeSiteEditor();
    });
  }

  // Keyboard handler for the editor as a whole (backup)
  editor.addEventListener('keydown', handleEditorKeyDown);
}

/**
 * Handle keyboard events in the editor
 */
function handleEditorKeyDown(event) {
  var keyCode = event.keyCode;
  console.log('TizenPortal: Editor keydown received, keyCode =', keyCode);

  // Escape/Back - close
  if (keyCode === 27 || keyCode === 10009) {
    event.preventDefault();
    event.stopPropagation();
    closeSiteEditor();
    return;
  }

  // Enter on focusable
  if (keyCode === 13) {
    var active = document.activeElement;
    console.log('TizenPortal: Enter in editor, activeElement:', active);
    console.log('TizenPortal: - id:', active ? active.id : 'null');
    console.log('TizenPortal: - className:', active ? active.className : 'null');
    console.log('TizenPortal: - tagName:', active ? active.tagName : 'null');
    
    // If on the cancel button, close
    if (active && active.id === 'tp-editor-cancel') {
      console.log('TizenPortal: Enter on cancel button');
      event.preventDefault();
      event.stopPropagation();
      closeSiteEditor();
      return;
    }
    
    // If on the delete button, delete
    if (active && active.id === 'tp-editor-delete') {
      console.log('TizenPortal: Enter on delete button');
      event.preventDefault();
      event.stopPropagation();
      deleteAndClose();
      return;
    }
    
    // If on a field row, open input mode
    if (active && active.classList && active.classList.contains('tp-bundle-option-row')) {
      console.log('TizenPortal: Enter on bundle option row');
      event.preventDefault();
      event.stopPropagation();
      activateBundleOptionInput(active);
      return;
    }

    // If on a field row, open input mode
    if (active && active.classList && active.classList.contains('tp-field-row')) {
      console.log('TizenPortal: Enter on field row');
      event.preventDefault();
      event.stopPropagation();
      activateFieldInput(active);
      return;
    }

    // If on a bundle option, select it
    if (active && active.classList && active.classList.contains('tp-bundle-option')) {
      console.log('TizenPortal: Enter on bundle option');
      event.preventDefault();
      event.stopPropagation();
      selectBundleOption(active);
      return;
    }
    
    // If on fetch favicon button
    if (active && active.id === 'tp-editor-fetch-icon') {
      console.log('TizenPortal: Enter on fetch icon button');
      event.preventDefault();
      event.stopPropagation();
      handleFetchFavicon();
      return;
    }
    
    console.log('TizenPortal: Enter not handled - no matching element');
  }
}

/**
 * Show the site editor for adding a new site
 * @param {Function} onComplete - Callback when complete
 */
export function showAddSiteEditor(onComplete) {
  console.log('TizenPortal: showAddSiteEditor called');
  
  // Set mode on DOM element - this is the source of truth
  setEditorMode('add', '');
  
  state.card = {
    name: '',
    url: '',
    featureBundle: null,
    viewportMode: null,
    focusOutlineMode: null,
    userAgent: null,
    tabindexInjection: null,
    scrollIntoView: null,
    safeArea: null,
    gpuHints: null,
    cssReset: null,
    hideScrollbars: null,
    wrapTextInputs: null,
    icon: '',
    bundleOptions: {},
    bundleOptionData: {},
  };
  state.onComplete = onComplete;
  
  openEditor();
}

/**
 * Show the site editor for editing an existing site
 * @param {Object} card - Card to edit
 * @param {Function} onComplete - Callback when complete
 */
export function showEditSiteEditor(card, onComplete) {
  console.log('TizenPortal: showEditSiteEditor called with card:', card ? card.name : 'null', 'id:', card ? card.id : 'null');
  if (!card || !card.id) {
    console.error('TizenPortal: showEditSiteEditor called with invalid card!');
    return;
  }
  
  // Set mode on DOM element - this is the source of truth
  setEditorMode('edit', card.id);
  
  state.card = {
    id: card.id,
    name: card.name || '',
    url: card.url || '',
    featureBundle: card.featureBundle || null,
    viewportMode: card.hasOwnProperty('viewportMode') ? card.viewportMode : null,
    focusOutlineMode: card.hasOwnProperty('focusOutlineMode') ? card.focusOutlineMode : null,
    userAgent: card.hasOwnProperty('userAgent') ? card.userAgent : null,
    tabindexInjection: card.hasOwnProperty('tabindexInjection') ? card.tabindexInjection : null,
    scrollIntoView: card.hasOwnProperty('scrollIntoView') ? card.scrollIntoView : null,
    safeArea: card.hasOwnProperty('safeArea') ? card.safeArea : null,
    gpuHints: card.hasOwnProperty('gpuHints') ? card.gpuHints : null,
    cssReset: card.hasOwnProperty('cssReset') ? card.cssReset : null,
    hideScrollbars: card.hasOwnProperty('hideScrollbars') ? card.hideScrollbars : null,
    wrapTextInputs: card.hasOwnProperty('wrapTextInputs') ? card.wrapTextInputs : null,
    icon: card.icon || '',
    bundleOptions: card.bundleOptions || {},
    bundleOptionData: card.bundleOptionData || {},
  };
  state.onComplete = onComplete;
  
  openEditor();
}

/**
 * Open the editor
 */
function openEditor() {
  var mode = getEditorMode();
  var cardId = getEditorCardId();
  console.log('TizenPortal: openEditor mode=' + mode + ' cardId=' + cardId);
  
  var editor = document.getElementById('tp-site-editor');
  if (!editor) {
    console.error('TizenPortal: editor element not found!');
    return;
  }

  var isEdit = mode === 'edit';

  // Set title
  var title = editor.querySelector('#tp-editor-title');
  if (title) {
    title.textContent = isEdit ? 'Edit Site' : 'Add Site';
  }

  // Show/hide delete button
  var deleteBtn = editor.querySelector('#tp-editor-delete');
  if (deleteBtn) {
    deleteBtn.style.display = isEdit ? 'flex' : 'none';
  }

  // Ensure bundle options are initialized
  ensureBundleOptionsInitialized();

  // Render fields
  renderFields();

  // Update preview
  updatePreview();

  // Show editor
  state.active = true;
  editor.classList.add('visible');

  if (window.TizenPortal && window.TizenPortal.updatePortalHints) {
    window.TizenPortal.updatePortalHints();
  }

  // Focus first field
  setTimeout(function() {
    var firstField = editor.querySelector('.tp-field-row');
    if (firstField) {
      firstField.focus();
    }
  }, 100);
}

/**
 * Close the site editor
 */
export function closeSiteEditor() {
  var editor = document.getElementById('tp-site-editor');
  if (editor) {
    editor.classList.remove('visible');
  }
  state.active = false;

  if (window.TizenPortal && window.TizenPortal.updatePortalHints) {
    window.TizenPortal.updatePortalHints();
  }
  
  // Restore focus to the portal grid
  restoreFocusToPortal();
}

/**
 * Restore focus to a sensible element in the portal
 */
function restoreFocusToPortal() {
  // Try to focus the last focused card, or the first card, or the add button
  var targets = [
    '.tp-card:focus',
    '.tp-card[data-focused="true"]',
    '.tp-card',
    '.tp-add-card',
    '#tp-portal-grid',
  ];
  
  for (var i = 0; i < targets.length; i++) {
    var el = document.querySelector(targets[i]);
    if (el && el.offsetParent !== null) {
      try {
        el.focus();
        console.log('TizenPortal: Focus restored to:', targets[i]);
        return;
      } catch (err) {
        // Try next
      }
    }
  }
  
  console.log('TizenPortal: Could not restore focus after closing editor');
}

/**
 * Update the yellow hint text
 * @param {string} text
 */
function updateYellowHintText(text) {
  var hintText = document.getElementById('tp-hint-yellow-text');
  if (hintText) {
    hintText.textContent = text;
  }
}

/**
 * Get active card - just returns state.card
 */
function getActiveCardForAction() {
  return state.card;
}

/**
 * Auto-save on changes (no Save button)
 * Uses DOM-based mode to determine add vs edit - cannot get confused
 */
function autoSaveCard(reason) {
  var mode = getEditorMode();
  var cardId = getEditorCardId();
  
  console.log('TizenPortal: autoSaveCard mode=' + mode + ' cardId=' + cardId + ' reason=' + reason);
  
  if (!state.card) {
    console.log('TizenPortal: Auto-save skipped - no card');
    return;
  }

  var cardName = (state.card.name || '').trim();
  var cardUrl = (state.card.url || '').trim();

  if (cardUrl) {
    cardUrl = sanitizeUrl(cardUrl);
    if (!cardUrl) {
      console.log('TizenPortal: Auto-save skipped - invalid URL scheme');
      return;
    }
    state.card.url = cardUrl;
  }

  if (!cardName || !cardUrl) {
    console.log('TizenPortal: Auto-save skipped - missing name/url');
    return;
  }

  var payload = {
    name: cardName,
    url: cardUrl,
    featureBundle: state.card.featureBundle || null,
    viewportMode: state.card.hasOwnProperty('viewportMode') ? state.card.viewportMode : null,
    focusOutlineMode: state.card.hasOwnProperty('focusOutlineMode') ? state.card.focusOutlineMode : null,
    userAgent: state.card.hasOwnProperty('userAgent') ? state.card.userAgent : null,
    tabindexInjection: state.card.hasOwnProperty('tabindexInjection') ? state.card.tabindexInjection : null,
    scrollIntoView: state.card.hasOwnProperty('scrollIntoView') ? state.card.scrollIntoView : null,
    safeArea: state.card.hasOwnProperty('safeArea') ? state.card.safeArea : null,
    gpuHints: state.card.hasOwnProperty('gpuHints') ? state.card.gpuHints : null,
    cssReset: state.card.hasOwnProperty('cssReset') ? state.card.cssReset : null,
    hideScrollbars: state.card.hasOwnProperty('hideScrollbars') ? state.card.hideScrollbars : null,
    wrapTextInputs: state.card.hasOwnProperty('wrapTextInputs') ? state.card.wrapTextInputs : null,
    icon: state.card.icon || null,
    bundleOptions: state.card.bundleOptions || {},
    bundleOptionData: state.card.bundleOptionData || {},
  };

  // Use DOM mode - this is bulletproof
  if (mode === 'edit' && cardId) {
    console.log('TizenPortal: EDIT MODE - Updating card ID:', cardId);
    updateCard(cardId, payload);
    showEditorToast('Saved');
  } else {
    console.log('TizenPortal: ADD MODE - Creating new card');
    var created = addCard(payload);
    
    // Switch to edit mode now that we have an ID
    setEditorMode('edit', created.id);
    state.card = created;

    var deleteBtn = document.getElementById('tp-editor-delete');
    if (deleteBtn) {
      deleteBtn.style.display = 'flex';
    }
    
    var title = document.querySelector('#tp-editor-title');
    if (title) {
      title.textContent = 'Edit Site';
    }

    showEditorToast('Added');
  }

  if (state.onComplete) {
    state.onComplete();
  }
}

/**
 * Delete and close
 */
function deleteAndClose() {
  var mode = getEditorMode();
  var cardId = getEditorCardId();
  
  console.log('TizenPortal: deleteAndClose mode=' + mode + ' cardId=' + cardId);

  if (mode !== 'edit' || !cardId) {
    console.log('TizenPortal: Cannot delete - not in edit mode or no card ID');
    return;
  }

  var cardName = state.card ? state.card.name : 'Site';

  // Simple confirmation via toast + second press
  var deleteBtn = document.getElementById('tp-editor-delete');
  if (deleteBtn && deleteBtn.dataset.confirmDelete === 'true') {
    deleteCard(cardId);
    showEditorToast('Deleted: ' + cardName);
    closeSiteEditor();
    refreshPortal();

    if (state.onComplete) {
      state.onComplete();
    }
  } else {
    if (deleteBtn) {
      deleteBtn.dataset.confirmDelete = 'true';
      deleteBtn.querySelector('.tp-btn-icon').textContent = '⚠';
      deleteBtn.childNodes[1].textContent = ' Press again to confirm';
      
      // Reset after 3 seconds
      setTimeout(function() {
        if (deleteBtn) {
          deleteBtn.dataset.confirmDelete = '';
          deleteBtn.querySelector('.tp-btn-icon').textContent = '🗑';
          deleteBtn.childNodes[1].textContent = ' Delete';
        }
      }, 3000);
    }
    showEditorToast('Press Delete again to confirm');
  }
}

/**
 * Render the fields
 */
function renderFields() {
  var container = document.getElementById('tp-editor-fields');
  if (!container) return;
  if (!state.card) {
    console.error('TizenPortal: state.card is null in renderFields');
    return;
  }

  ensureSectionState();

  var html = '';

  for (var i = 0; i < FIELDS.length; i++) {
    var field = FIELDS[i];
    if (field.type === 'section') {
      html += renderSectionRow(field);
      continue;
    }

    if (field.section && sectionCollapsed[field.section]) {
      continue;
    }

    var rawValue = state.card.hasOwnProperty(field.name) ? state.card[field.name] : null;
    var value = (rawValue === null || rawValue === undefined) ? '' : rawValue;
    
    if (field.type === 'bundle') {
      html += renderBundleField(field, value);
    } else if (field.type === 'select') {
      html += renderSelectField(field, rawValue);
    } else {
      html += renderTextField(field, value);
    }
  }

  container.innerHTML = html;

  // Set up field event listeners
  setupFieldListeners(container);
}

function ensureSectionState() {
  for (var i = 0; i < SECTION_DEFS.length; i++) {
    var def = SECTION_DEFS[i];
    if (!sectionCollapsed.hasOwnProperty(def.id)) {
      sectionCollapsed[def.id] = def.defaultCollapsed;
    }
  }
}

function renderSectionRow(field) {
  var sectionId = field.sectionId;
  var collapsed = !!sectionCollapsed[sectionId];
  var indicator = collapsed ? '▶' : '▼';
  return '' +
    '<div class="tp-field-row tp-field-section-row" data-type="section" data-section="' + sectionId + '" tabindex="0">' +
      '<div class="tp-field-label">' + field.label + '</div>' +
      '<div class="tp-field-value">' + indicator + '</div>' +
    '</div>';
}

/**
 * Render a text field
 */
function renderTextField(field, value) {
  var displayValue = value || field.placeholder || '';
  var isEmpty = !value;
  
  // Special case for icon field - add fetch favicon button
  if (field.name === 'icon') {
    return '' +
      '<div class="tp-field-row-group">' +
        '<div class="tp-field-row" data-field="' + field.name + '" tabindex="0">' +
          '<div class="tp-field-label">' + field.label + (field.required ? ' *' : '') + '</div>' +
          '<div class="tp-field-value' + (isEmpty ? ' empty' : '') + '">' + escapeHtml(displayValue) + '</div>' +
        '</div>' +
        '<button type="button" class="tp-editor-btn tp-editor-btn-fetch" id="tp-editor-fetch-icon" tabindex="0">' +
          'Fetch Favicon' +
        '</button>' +
      '</div>';
  }
  
  return '' +
    '<div class="tp-field-row" data-field="' + field.name + '" tabindex="0">' +
      '<div class="tp-field-label">' + field.label + (field.required ? ' *' : '') + '</div>' +
      '<div class="tp-field-value' + (isEmpty ? ' empty' : '') + '">' + escapeHtml(displayValue) + '</div>' +
    '</div>';
}

/**
 * Render a select field
 */
function renderSelectField(field, value) {
  var displayValue = value;
  
  // Find label for current value
  for (var i = 0; i < field.options.length; i++) {
    if (field.options[i].value === value) {
      displayValue = field.options[i].label;
      break;
    }
  }
  
  return '' +
    '<div class="tp-field-row" data-field="' + field.name + '" data-type="select" tabindex="0">' +
      '<div class="tp-field-label">' + field.label + '</div>' +
      '<div class="tp-field-value">' + escapeHtml(displayValue) + '</div>' +
    '</div>';
}

/**
 * Render the bundle field with visual options
 */
function renderBundleField(field, value) {
  var bundles = getFeatureBundles(); // Returns array of {name, displayName, description}
  
  var html = '<div class="tp-field-section">';
  html += '<div class="tp-field-section-label">' + field.label + '</div>';
  html += '<div class="tp-bundle-list">';
  
  // Add "None" option
  var isNoneSelected = !value || value === null;
  html += '' +
    '<div class="tp-bundle-option' + (isNoneSelected ? ' selected' : '') + '" data-bundle="none" tabindex="0">' +
      '<div class="tp-bundle-check">' + (isNoneSelected ? '●' : '○') + '</div>' +
      '<div class="tp-bundle-info">' +
        '<div class="tp-bundle-name">None</div>' +
        '<div class="tp-bundle-desc">Use only global site settings</div>' +
      '</div>' +
    '</div>';
  
  // Add feature bundles
  for (var i = 0; i < bundles.length; i++) {
    var bundle = bundles[i];
    var bundleName = bundle.name;
    var isSelected = bundleName === value;
    var displayName = bundle.displayName || bundleName;
    var description = bundle.description || 'No description';
    
    html += '' +
      '<div class="tp-bundle-option' + (isSelected ? ' selected' : '') + '" data-bundle="' + bundleName + '" tabindex="0">' +
        '<div class="tp-bundle-check">' + (isSelected ? '●' : '○') + '</div>' +
        '<div class="tp-bundle-info">' +
          '<div class="tp-bundle-name">' + escapeHtml(displayName) + '</div>' +
          '<div class="tp-bundle-desc">' + escapeHtml(description) + '</div>' +
        '</div>' +
      '</div>';
  }
  
  html += '</div>';

  // Render bundle options if available
  if (value) {
    html += renderBundleOptions(value);
  }

  html += '</div>';
  
  return html;
}

/**
 * Render bundle options section based on bundle metadata
 */
function renderBundleOptions(bundleName) {
  var bundle = getBundle(bundleName);
  if (!bundle || !bundle.options || !bundle.options.length) {
    return '';
  }

  if (!state.card.bundleOptions || typeof state.card.bundleOptions !== 'object') {
    state.card.bundleOptions = {};
  }
  if (!state.card.bundleOptionData || typeof state.card.bundleOptionData !== 'object') {
    state.card.bundleOptionData = {};
  }

  var html = '<div class="tp-field-section">';
  html += renderBundleOptionsHeader();

  if (sectionCollapsed.bundleOptions) {
    html += '</div>';
    return html;
  }

  for (var i = 0; i < bundle.options.length; i++) {
    var opt = bundle.options[i];
    if (!opt || !opt.key) continue;
    var value = state.card.bundleOptions.hasOwnProperty(opt.key) ? state.card.bundleOptions[opt.key] : opt.default;
    var dataValue = state.card.bundleOptionData[opt.key] || '';
    html += renderBundleOptionRow(opt, value, dataValue);
  }

  html += '</div>';
  return html;
}

function renderBundleOptionsHeader() {
  var collapsed = !!sectionCollapsed.bundleOptions;
  var indicator = collapsed ? '▶' : '▼';
  return '' +
    '<div class="tp-field-row tp-field-section-row" data-type="section" data-section="bundleOptions" tabindex="0">' +
      '<div class="tp-field-label">Bundle Options</div>' +
      '<div class="tp-field-value">' + indicator + '</div>' +
    '</div>';
}

/**
 * Render a single bundle option row
 */
function renderBundleOptionRow(option, value, dataValue) {
  var label = option.label || option.key;
  var type = option.type || 'text';
  var displayValue = '';
  var isEmpty = value === null || value === undefined || value === '';

  if (type === 'toggle') {
    displayValue = value ? '✓ On' : '○ Off';
  } else if (type === 'select' && option.options) {
    displayValue = value;
    for (var i = 0; i < option.options.length; i++) {
      if (option.options[i].value === value) {
        displayValue = option.options[i].label;
        break;
      }
    }
  } else if (type === 'url') {
    displayValue = value || option.placeholder || '(not set)';
    if (dataValue) {
      displayValue = displayValue + ' (saved)';
    }
  } else {
    displayValue = value || option.placeholder || '(not set)';
  }

  return '' +
    '<div class="tp-field-row tp-bundle-option-row" data-option-key="' + option.key + '" data-option-type="' + type + '" tabindex="0">' +
      '<div class="tp-field-label">' + label + '</div>' +
      '<div class="tp-field-value' + (isEmpty ? ' empty' : '') + '">' + escapeHtml(displayValue) + '</div>' +
    '</div>';
}

/**
 * Set up field event listeners
 */
function setupFieldListeners(container) {
  // Text/select field rows
  var rows = container.querySelectorAll('.tp-field-row:not(.tp-bundle-option-row)');
  for (var i = 0; i < rows.length; i++) {
    rows[i].addEventListener('click', function() {
      activateFieldInput(this);
    });
    rows[i].addEventListener('keydown', function(e) {
      if (e.keyCode === 13) { // Enter
        e.preventDefault();
        e.stopPropagation();
        activateFieldInput(this);
      }
    });
  }

  // Bundle option rows (handled separately)
  var optionRows = container.querySelectorAll('.tp-bundle-option-row');
  for (var k = 0; k < optionRows.length; k++) {
    optionRows[k].addEventListener('click', function() {
      activateBundleOptionInput(this);
    });
    optionRows[k].addEventListener('keydown', function(e) {
      if (e.keyCode === 13) { // Enter
        e.preventDefault();
        e.stopPropagation();
        activateBundleOptionInput(this);
      }
    });
  }

  // Bundle options - click AND keydown for Enter
  var bundleOptions = container.querySelectorAll('.tp-bundle-option');
  for (var j = 0; j < bundleOptions.length; j++) {
    bundleOptions[j].addEventListener('click', function() {
      selectBundleOption(this);
    });
    bundleOptions[j].addEventListener('keydown', function(e) {
      if (e.keyCode === 13) { // Enter
        e.preventDefault();
        e.stopPropagation();
        console.log('TizenPortal: Bundle option keydown Enter');
        selectBundleOption(this);
      }
    });
  }
  
  // Fetch favicon button
  var fetchBtn = container.querySelector('#tp-editor-fetch-icon');
  if (fetchBtn) {
    fetchBtn.addEventListener('click', handleFetchFavicon);
    fetchBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        handleFetchFavicon();
      }
    });
  }
}

/**
 * Activate input mode for a field
 */
function activateFieldInput(row) {
  var fieldName = row.dataset.field;
  var fieldType = row.dataset.type || 'text';
  var field = getFieldDef(fieldName);

  if (fieldType === 'section') {
    toggleSection(row.dataset.section);
    return;
  }
  
  if (!field) return;

  if (fieldType === 'select') {
    // Cycle through options
    cycleSelectOption(fieldName, field);
  } else {
    // Show text input prompt
    showTextInputPrompt(fieldName, field);
  }
}

function toggleSection(sectionId) {
  if (!sectionId) return;
  sectionCollapsed[sectionId] = !sectionCollapsed[sectionId];
  renderFields();
  focusSection(sectionId);
}

function focusSection(sectionId) {
  var row = document.querySelector('.tp-field-section-row[data-section="' + sectionId + '"]');
  if (row) {
    row.focus();
  }
}

/**
 * Activate input mode for a bundle option row
 */
function activateBundleOptionInput(row) {
  var optionKey = row.dataset.optionKey;
  var optionType = row.dataset.optionType || 'text';
  var option = getBundleOptionDef(optionKey);

  if (!option) return;

  if (optionType === 'toggle') {
    var current = getBundleOptionValue(optionKey, option);
    setBundleOptionValue(optionKey, !current);
    renderFields();
    autoSaveCard('option:' + optionKey);
    focusBundleOption(optionKey);
  } else if (optionType === 'select') {
    cycleBundleOptionSelect(optionKey, option);
  } else if (optionType === 'url') {
    showBundleOptionUrlPrompt(optionKey, option);
  } else {
    showBundleOptionTextPrompt(optionKey, option);
  }
}

/**
 * Get bundle option definition by key
 */
function getBundleOptionDef(key) {
  if (!state.card || !state.card.featureBundle) return null;
  var bundle = getBundle(state.card.featureBundle);
  if (!bundle || !bundle.options || !bundle.options.length) return null;

  for (var i = 0; i < bundle.options.length; i++) {
    if (bundle.options[i].key === key) {
      return bundle.options[i];
    }
  }
  return null;
}

/**
 * Get current bundle option value (with default fallback)
 */
function getBundleOptionValue(key, optionDef) {
  if (!state.card.bundleOptions || typeof state.card.bundleOptions !== 'object') {
    state.card.bundleOptions = {};
  }
  if (state.card.bundleOptions.hasOwnProperty(key)) {
    return state.card.bundleOptions[key];
  }
  return optionDef && optionDef.hasOwnProperty('default') ? optionDef.default : null;
}

/**
 * Set bundle option value
 */
function setBundleOptionValue(key, value) {
  if (!state.card.bundleOptions || typeof state.card.bundleOptions !== 'object') {
    state.card.bundleOptions = {};
  }
  state.card.bundleOptions[key] = value;
}

/**
 * Set bundle option data (e.g., fetched allowlist contents)
 */
function setBundleOptionData(key, value) {
  if (!state.card.bundleOptionData || typeof state.card.bundleOptionData !== 'object') {
    state.card.bundleOptionData = {};
  }
  state.card.bundleOptionData[key] = value;
}

/**
 * Cycle select options for bundle option
 */
function cycleBundleOptionSelect(optionKey, optionDef) {
  var options = optionDef.options || [];
  var currentValue = getBundleOptionValue(optionKey, optionDef);
  var currentIndex = 0;

  for (var i = 0; i < options.length; i++) {
    if (options[i].value === currentValue) {
      currentIndex = i;
      break;
    }
  }

  var nextIndex = (currentIndex + 1) % options.length;
  setBundleOptionValue(optionKey, options[nextIndex].value);
  renderFields();
  autoSaveCard('option:' + optionKey);
  focusBundleOption(optionKey);
}

/**
 * Prompt for bundle option text input
 */
function showBundleOptionTextPrompt(optionKey, optionDef) {
  var currentValue = getBundleOptionValue(optionKey, optionDef) || '';
  var newValue = prompt(optionDef.label + ':', currentValue);

  if (newValue !== null) {
    setBundleOptionValue(optionKey, newValue);
    renderFields();
    autoSaveCard('option:' + optionKey);
  }

  setTimeout(function() {
    focusBundleOption(optionKey);
  }, 100);
}

/**
 * Prompt for bundle option URL input and fetch contents
 */
function showBundleOptionUrlPrompt(optionKey, optionDef) {
  var currentValue = getBundleOptionValue(optionKey, optionDef) || '';
  var newValue = prompt(optionDef.label + ':', currentValue);

  if (newValue !== null) {
    setBundleOptionValue(optionKey, newValue);
    renderFields();
    autoSaveCard('option:' + optionKey);

    if (newValue) {
      fetchBundleOptionUrl(optionKey, newValue);
    } else {
      setBundleOptionData(optionKey, '');
      autoSaveCard('optionData:' + optionKey);
    }
  }

  setTimeout(function() {
    focusBundleOption(optionKey);
  }, 100);
}

/**
 * Fetch bundle option URL contents and save to bundleOptionData
 */
function fetchBundleOptionUrl(optionKey, url) {
  try {
    showEditorToast('Fetching ' + optionKey + '...');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          setBundleOptionData(optionKey, xhr.responseText || '');
          autoSaveCard('optionData:' + optionKey);
          renderFields();
          showEditorToast('Saved ' + optionKey + ' data');
        } else {
          showEditorToast('Failed to fetch ' + optionKey);
        }
      }
    };
    xhr.send();
  } catch (err) {
    showEditorToast('Failed to fetch ' + optionKey);
  }
}

/**
 * Focus a bundle option row by key
 */
function focusBundleOption(optionKey) {
  var row = document.querySelector('.tp-bundle-option-row[data-option-key="' + optionKey + '"]');
  if (row) {
    row.focus();
  }
}

/**
 * Get field definition by name
 */
function getFieldDef(name) {
  for (var i = 0; i < FIELDS.length; i++) {
    if (FIELDS[i].name === name) {
      return FIELDS[i];
    }
  }
  return null;
}

/**
 * Cycle through select options
 */
function cycleSelectOption(fieldName, field) {
  var currentValue = state.card[fieldName];
  var options = field.options;
  var currentIndex = 0;
  
  for (var i = 0; i < options.length; i++) {
    if (options[i].value === currentValue) {
      currentIndex = i;
      break;
    }
  }
  
  // Move to next option
  var nextIndex = (currentIndex + 1) % options.length;
  state.card[fieldName] = options[nextIndex].value;
  
  // Re-render fields
  renderFields();
  autoSaveCard('select:' + fieldName);
  
  // Re-focus the field
  focusField(fieldName);
}

/**
 * Show text input prompt (uses browser prompt for simplicity)
 * In a full implementation, this would be a custom on-screen keyboard
 */
function showTextInputPrompt(fieldName, field) {
  var currentValue = state.card[fieldName] || '';
  var newValue = prompt(field.label + ':', currentValue);
  
  if (newValue !== null) {
    state.card[fieldName] = newValue;
    renderFields();
    updatePreview();
    autoSaveCard('text:' + fieldName);
  }
  
  // Re-focus the field
  setTimeout(function() {
    focusField(fieldName);
  }, 100);
}

/**
 * Select a bundle option
 */
function selectBundleOption(option) {
  var bundleName = option.dataset.bundle;
  // "none" means null for featureBundle
  state.card.featureBundle = bundleName === 'none' ? null : bundleName;

  // Reset bundle options when bundle changes
  resetBundleOptionsForBundle(state.card.featureBundle);
  
  // Re-render fields
  renderFields();
  autoSaveCard('bundle');
  
  // Re-focus the bundle option
  setTimeout(function() {
    var newOption = document.querySelector('.tp-bundle-option[data-bundle="' + bundleName + '"]');
    if (newOption) {
      newOption.focus();
    }
  }, 50);
}

/**
 * Focus a field by name
 */
function focusField(fieldName) {
  var row = document.querySelector('.tp-field-row[data-field="' + fieldName + '"]');
  if (row) {
    row.focus();
  }
}

/**
 * Update the preview card
 */
function updatePreview() {
  var nameEl = document.getElementById('tp-preview-name');
  var urlEl = document.getElementById('tp-preview-url');
  var iconEl = document.getElementById('tp-preview-icon');
  
  if (nameEl) {
    nameEl.textContent = state.card.name || 'Site Name';
  }
  
  if (urlEl) {
    urlEl.textContent = state.card.url || 'https://...';
  }
  
  if (iconEl) {
    if (state.card.icon) {
      iconEl.textContent = '';
      var iconImg = document.createElement('img');
      iconImg.src = state.card.icon;
      iconImg.alt = '';
      iconImg.addEventListener('error', function() { iconEl.textContent = '?'; });
      iconEl.appendChild(iconImg);
    } else if (state.card.name) {
      iconEl.textContent = state.card.name.charAt(0).toUpperCase();
    } else {
      iconEl.textContent = '?';
    }
  }
}

/**
 * Show a toast message in the editor
 */
function showEditorToast(message) {
  if (window.TizenPortal && window.TizenPortal.showToast) {
    window.TizenPortal.showToast(message);
  } else {
    console.log('TizenPortal:', message);
  }
}

/**
 * Common favicon paths to try (in order of preference)
 */
var FAVICON_PATHS = [
  '/favicon.ico',
  '/favicon.svg',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/static/favicon.ico',
  '/static/favicon.svg',
  '/static/favicon.png',
  '/assets/favicon.ico',
  '/assets/favicon.svg',
  '/assets/favicon.png',
  '/images/favicon.ico',
  '/images/favicon.png',
  '/img/favicon.ico',
  '/img/favicon.png',
];

/**
 * Handle fetch favicon button click
 */
function handleFetchFavicon() {
  var url = state.card.url;
  
  if (!url) {
    showEditorToast('Enter a URL first');
    return;
  }
  
  // Extract base URL (protocol + domain)
  var baseUrl = '';
  var domain = '';
  try {
    var match = url.match(/^(https?:\/\/[^\/]+)/i);
    if (match && match[1]) {
      baseUrl = match[1];
      domain = match[1].replace(/^https?:\/\//i, '');
    }
  } catch (err) {
    showEditorToast('Invalid URL');
    return;
  }
  
  if (!baseUrl) {
    showEditorToast('Could not extract domain');
    return;
  }
  
  showEditorToast('Searching for favicon...');
  
  // Try common favicon paths sequentially
  tryFaviconPaths(baseUrl, domain, 0);
}

/**
 * Try favicon paths one by one
 * @param {string} baseUrl - Base URL (protocol + domain)
 * @param {string} domain - Domain only
 * @param {number} index - Current path index
 */
function tryFaviconPaths(baseUrl, domain, index) {
  // If we've exhausted all paths, fall back to Google
  if (index >= FAVICON_PATHS.length) {
    showEditorToast('Trying Google favicon service...');
    var googleFaviconUrl = 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(domain) + '&sz=64';
    
    state.card.icon = googleFaviconUrl;
    renderFields();
    updatePreview();
    refocusFetchButton();
    autoSaveCard('favicon');
    showEditorToast('Using Google favicon');
    return;
  }
  
  var faviconUrl = baseUrl + FAVICON_PATHS[index];
  
  // Test if this favicon exists by loading it in an Image
  var img = new Image();
  img.onload = function() {
    // Found a working favicon!
    state.card.icon = faviconUrl;
    renderFields();
    updatePreview();
    refocusFetchButton();
    autoSaveCard('favicon');
    showEditorToast('Found: ' + FAVICON_PATHS[index]);
  };
  img.onerror = function() {
    // This path failed, try the next one
    tryFaviconPaths(baseUrl, domain, index + 1);
  };
  img.src = faviconUrl;
}

/**
 * Re-focus the fetch favicon button after update
 */
function refocusFetchButton() {
  setTimeout(function() {
    var fetchBtn = document.getElementById('tp-editor-fetch-icon');
    if (fetchBtn) {
      fetchBtn.focus();
    }
  }, 100);
}

/**
 * Check if editor is open
 */
export function isSiteEditorOpen() {
  return state.active;
}

// escapeHtml imported from core/utils.js
