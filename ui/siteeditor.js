/**
 * TizenPortal Site Editor
 * 
 * Full-screen TV-friendly site creation and editing.
 * Replaces the old modal-based card forms.
 */

import { addCard, updateCard, deleteCard } from './cards.js';
import { getBundleNames, getBundle } from '../bundles/registry.js';

/**
 * Editor state
 */
var state = {
  active: false,
  isEdit: false,
  card: null,
  currentField: 0,
  onComplete: null,
};

/**
 * Field definitions for the editor
 */
var FIELDS = [
  { name: 'name', label: 'Site Name', type: 'text', placeholder: 'My Site', required: true },
  { name: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com', required: true },
  { name: 'bundle', label: 'Bundle', type: 'bundle', required: false },
  { name: 'userAgent', label: 'User Agent', type: 'select', options: [
    { value: 'tizen', label: 'Tizen TV (Default)' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'desktop', label: 'Desktop' },
  ]},
  { name: 'icon', label: 'Icon URL', type: 'text', placeholder: 'https://... (optional)', required: false },
];

/**
 * Initialize the site editor
 */
export function initSiteEditor() {
  // Create editor container
  var editor = document.createElement('div');
  editor.id = 'tp-site-editor';
  editor.className = 'tp-site-editor';
  editor.innerHTML = createEditorHTML();
  document.body.appendChild(editor);

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
        '<div class="tp-editor-hint">Navigate with D-pad | ENTER to edit/select</div>' +
      '</div>' +
      '<div class="tp-editor-body">' +
        '<div class="tp-editor-fields" id="tp-editor-fields"></div>' +
      '</div>' +
      '<div class="tp-editor-footer">' +
        '<button type="button" class="tp-editor-btn tp-editor-btn-save" id="tp-editor-save" tabindex="0">' +
          '<span class="tp-btn-icon">✓</span> Save' +
        '</button>' +
        '<button type="button" class="tp-editor-btn tp-editor-btn-cancel" id="tp-editor-cancel" tabindex="0">' +
          'Cancel' +
        '</button>' +
        '<button type="button" class="tp-editor-btn tp-editor-btn-delete" id="tp-editor-delete" tabindex="0">' +
          '<span class="tp-btn-icon">🗑</span> Delete' +
        '</button>' +
      '</div>' +
    '</div>';
}

/**
 * Set up event listeners
 */
function setupEventListeners(editor) {
  // Cancel button
  var cancelBtn = editor.querySelector('#tp-editor-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      closeSiteEditor();
    });
  }

  // Save button
  var saveBtn = editor.querySelector('#tp-editor-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      saveAndClose();
    });
  }

  // Delete button
  var deleteBtn = editor.querySelector('#tp-editor-delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      deleteAndClose();
    });
  }

  // Backdrop click
  var backdrop = editor.querySelector('.tp-editor-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', function() {
      closeSiteEditor();
    });
  }

  // Keyboard handler
  editor.addEventListener('keydown', handleEditorKeyDown);
}

/**
 * Handle keyboard events in the editor
 */
function handleEditorKeyDown(event) {
  var keyCode = event.keyCode;

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
    
    // If on a field row, open input mode
    if (active && active.classList.contains('tp-field-row')) {
      event.preventDefault();
      event.stopPropagation();
      activateFieldInput(active);
      return;
    }

    // If on a bundle option, select it
    if (active && active.classList.contains('tp-bundle-option')) {
      event.preventDefault();
      event.stopPropagation();
      selectBundleOption(active);
      return;
    }
  }
}

/**
 * Show the site editor for adding a new site
 * @param {Function} onComplete - Callback when complete
 */
export function showAddSiteEditor(onComplete) {
  state.isEdit = false;
  state.card = {
    name: '',
    url: '',
    bundle: 'default',
    userAgent: 'tizen',
    icon: '',
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
  state.isEdit = true;
  state.card = {
    id: card.id,
    name: card.name || '',
    url: card.url || '',
    bundle: card.bundle || 'default',
    userAgent: card.userAgent || 'tizen',
    icon: card.icon || '',
  };
  state.onComplete = onComplete;
  
  openEditor();
}

/**
 * Open the editor
 */
function openEditor() {
  var editor = document.getElementById('tp-site-editor');
  if (!editor) return;

  // Set title
  var title = editor.querySelector('#tp-editor-title');
  if (title) {
    title.textContent = state.isEdit ? 'Edit Site' : 'Add Site';
  }

  // Show/hide delete button
  var deleteBtn = editor.querySelector('#tp-editor-delete');
  if (deleteBtn) {
    deleteBtn.style.display = state.isEdit ? 'flex' : 'none';
  }

  // Render fields
  renderFields();

  // Update preview
  updatePreview();

  // Show editor
  state.active = true;
  editor.classList.add('visible');

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
}

/**
 * Save and close
 */
function saveAndClose() {
  // Validate
  if (!state.card.name.trim()) {
    showEditorToast('Please enter a site name');
    focusField('name');
    return;
  }

  if (!state.card.url.trim()) {
    showEditorToast('Please enter a URL');
    focusField('url');
    return;
  }

  // Ensure URL has protocol
  var url = state.card.url.trim();
  if (url.indexOf('://') === -1) {
    url = 'https://' + url;
    state.card.url = url;
  }

  // Save
  if (state.isEdit) {
    updateCard(state.card.id, {
      name: state.card.name.trim(),
      url: url,
      bundle: state.card.bundle,
      userAgent: state.card.userAgent,
      icon: state.card.icon || null,
    });
    showEditorToast('Updated: ' + state.card.name);
  } else {
    addCard({
      name: state.card.name.trim(),
      url: url,
      bundle: state.card.bundle,
      userAgent: state.card.userAgent,
      icon: state.card.icon || null,
    });
    showEditorToast('Added: ' + state.card.name);
  }

  closeSiteEditor();

  // Callback
  if (state.onComplete) {
    state.onComplete();
  }
}

/**
 * Delete and close
 */
function deleteAndClose() {
  if (!state.isEdit || !state.card.id) return;

  // Simple confirmation via toast + second press
  var deleteBtn = document.getElementById('tp-editor-delete');
  if (deleteBtn && deleteBtn.dataset.confirmDelete === 'true') {
    deleteCard(state.card.id);
    showEditorToast('Deleted: ' + state.card.name);
    closeSiteEditor();

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

  var html = '';

  for (var i = 0; i < FIELDS.length; i++) {
    var field = FIELDS[i];
    var value = state.card[field.name] || '';
    
    if (field.type === 'bundle') {
      html += renderBundleField(field, value);
    } else if (field.type === 'select') {
      html += renderSelectField(field, value);
    } else {
      html += renderTextField(field, value);
    }
  }

  container.innerHTML = html;

  // Set up field event listeners
  setupFieldListeners(container);
}

/**
 * Render a text field
 */
function renderTextField(field, value) {
  var displayValue = value || field.placeholder || '(empty)';
  var isEmpty = !value;
  
  return '' +
    '<div class="tp-field-row" data-field="' + field.name + '" tabindex="0">' +
      '<div class="tp-field-label">' + field.label + (field.required ? ' *' : '') + '</div>' +
      '<div class="tp-field-value' + (isEmpty ? ' empty' : '') + '">' + escapeHtml(displayValue) + '</div>' +
      '<div class="tp-field-edit">ENTER to edit</div>' +
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
      '<div class="tp-field-edit">ENTER to change</div>' +
    '</div>';
}

/**
 * Render the bundle field with visual options
 */
function renderBundleField(field, value) {
  var bundles = getBundleNames();
  
  var html = '<div class="tp-field-section">';
  html += '<div class="tp-field-section-label">' + field.label + '</div>';
  html += '<div class="tp-bundle-list">';
  
  for (var i = 0; i < bundles.length; i++) {
    var bundleName = bundles[i];
    var bundle = getBundle(bundleName);
    var isSelected = bundleName === value;
    var displayName = bundle && bundle.displayName ? bundle.displayName : bundleName;
    var description = bundle && bundle.description ? bundle.description : 'No description';
    
    html += '' +
      '<div class="tp-bundle-option' + (isSelected ? ' selected' : '') + '" data-bundle="' + bundleName + '" tabindex="0">' +
        '<div class="tp-bundle-check">' + (isSelected ? '●' : '○') + '</div>' +
        '<div class="tp-bundle-info">' +
          '<div class="tp-bundle-name">' + escapeHtml(displayName) + '</div>' +
          '<div class="tp-bundle-desc">' + escapeHtml(description) + '</div>' +
        '</div>' +
      '</div>';
  }
  
  html += '</div></div>';
  
  return html;
}

/**
 * Set up field event listeners
 */
function setupFieldListeners(container) {
  // Text/select field rows
  var rows = container.querySelectorAll('.tp-field-row');
  for (var i = 0; i < rows.length; i++) {
    rows[i].addEventListener('click', function() {
      activateFieldInput(this);
    });
  }

  // Bundle options
  var bundleOptions = container.querySelectorAll('.tp-bundle-option');
  for (var j = 0; j < bundleOptions.length; j++) {
    bundleOptions[j].addEventListener('click', function() {
      selectBundleOption(this);
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
  
  if (!field) return;

  if (fieldType === 'select') {
    // Cycle through options
    cycleSelectOption(fieldName, field);
  } else {
    // Show text input prompt
    showTextInputPrompt(fieldName, field);
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
  state.card.bundle = bundleName;
  
  // Re-render fields
  renderFields();
  
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
      iconEl.innerHTML = '<img src="' + escapeHtml(state.card.icon) + '" alt="" onerror="this.parentNode.textContent=\'?\'">';
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
 * Check if editor is open
 */
export function isSiteEditorOpen() {
  return state.active;
}

/**
 * Escape HTML
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
