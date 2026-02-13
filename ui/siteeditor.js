/**
 * TizenPortal Site Editor
 * 
 * Full-screen TV-friendly site creation and editing.
 * Replaces the old modal-based card forms.
 */

import { addCard, updateCard, deleteCard, getCards } from './cards.js';
import { getFeatureBundles, getBundle } from '../bundles/registry.js';
import { refreshPortal } from './modal.js';
import { escapeHtml, sanitizeUrl, isValidHttpUrl } from '../core/utils.js';
import Userscripts from '../features/userscripts.js';

var UserscriptRegistry = Userscripts.UserscriptRegistry;

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

var FOCUS_TRANSITION_MODE_OPTIONS = [
  { value: null, label: 'Global (default)' },
  { value: 'slide', label: 'Slide (Directional)' },
  { value: 'scale', label: 'Scale (Grow)' },
  { value: 'glow', label: 'Glow (Pulse)' },
  { value: 'off', label: 'Off' },
];

var FOCUS_TRANSITION_SPEED_OPTIONS = [
  { value: null, label: 'Global (default)' },
  { value: 'fast', label: 'Fast (150ms)' },
  { value: 'medium', label: 'Medium (250ms)' },
  { value: 'slow', label: 'Slow (400ms)' },
];

var TEXT_SCALE_OPTIONS = [
  { value: null, label: 'Global (default)' },
  { value: 'extra-small', label: 'Extra Small (75%)' },
  { value: 'small', label: 'Small (90%)' },
  { value: 'off', label: 'Normal (100%)' },
  { value: 'medium', label: 'Medium (115%)' },
  { value: 'large', label: 'Large (135%)' },
  { value: 'extra-large', label: 'Extra Large (160%)' },
];

var UA_MODE_OPTIONS = [
  { value: null, label: 'Global (default)' },
  { value: 'tizen', label: 'Tizen TV' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' },
];

var NAVIGATION_MODE_OPTIONS = [
  { value: null, label: 'Global (default)' },
  { value: 'directional', label: 'Smart Navigation (Directional) - Preferred' },
  { value: 'geometric', label: 'Grid Navigation (Geometric)' },
  { value: 'polyfill', label: 'Legacy Polyfill (Compatibility Only)' },
];

var FEATURE_TOGGLE_OPTIONS = [
  { value: null, label: 'Global (default)' },
  { value: true, label: 'On' },
  { value: false, label: 'Off' },
];

var FEATURE_CATEGORIES = [
  { id: 'focus', label: '🎯 Focus & Navigation' },
  { id: 'display', label: '🎨 Display & Layout' },
  { id: 'input', label: '⌨️ Input Protection' },
  { id: 'performance', label: '⚡ Performance' },
];

var GLOBAL_OVERRIDE_CATEGORIES = [
  { id: 'appearance', label: '🎨 Appearance' },
  { id: 'navigation', label: '🧭 Navigation Style' },
];

var GLOBAL_OVERRIDE_DEFS = [
  // Appearance category
  { key: 'textScale', label: 'Text Scale', category: 'appearance', options: TEXT_SCALE_OPTIONS,
    description: 'Scale all text for improved TV legibility while maintaining relative sizing' },
  
  // Navigation Style category
  { key: 'focusOutlineMode', label: 'Focus Outline', category: 'navigation', options: FOCUS_OUTLINE_OPTIONS,
    description: 'Visual style of focus indicator outline' },
  { key: 'focusTransitionMode', label: 'Focus Transition Style', category: 'navigation', options: FOCUS_TRANSITION_MODE_OPTIONS,
    description: 'Animation style when focus moves between elements' },
  { key: 'focusTransitionSpeed', label: 'Focus Transition Speed', category: 'navigation', options: FOCUS_TRANSITION_SPEED_OPTIONS,
    description: 'Animation speed for focus transitions' },
];

var SITE_OVERRIDE_CATEGORIES = [
  { id: 'behavior', label: '🧭 Behavior' },
];

var SITE_OVERRIDE_DEFS = [
  // Behavior category
  { key: 'navigationMode', label: 'Navigation Mode', category: 'behavior', options: NAVIGATION_MODE_OPTIONS,
    description: 'Method used for directional navigation with the remote control' },
  { key: 'viewportMode', label: 'Viewport Lock Mode', category: 'behavior', options: VIEWPORT_MODE_OPTIONS,
    description: 'Control viewport scaling behavior for this site' },
  { key: 'userAgent', label: 'User Agent Mode', category: 'behavior', options: UA_MODE_OPTIONS,
    description: 'Override user agent string for compatibility' },
];

var FEATURE_OVERRIDE_DEFS = [
  // Focus & Navigation category
  { key: 'tabindexInjection', label: 'Auto-focusable Elements', category: 'focus', 
    description: 'Automatically inject tabindex on interactive elements for remote control navigation' },
  { key: 'scrollIntoView', label: 'Scroll into View on Focus', category: 'focus',
    description: 'Scroll container when focused element comes into viewport' },
  { key: 'navigationFix', label: 'Navigation Fixes', category: 'focus',
    description: 'Apply site-specific navigation workarounds for better D-pad control' },
  { key: 'focusTransitions', label: 'Focus Transition Animations', category: 'focus',
    description: 'Enable smooth animations when focus moves between elements (slide, scale, glow)' },
  
  // Display & Layout category
  { key: 'safeArea', label: 'TV Safe Area (5% inset)', category: 'display',
    description: 'Inset content 5% from edges to account for TV screen overscan' },
  { key: 'cssReset', label: 'CSS Normalization', category: 'display',
    description: 'Apply baseline CSS resets for consistent display across Tizen browsers' },
  { key: 'hideScrollbars', label: 'Hide Scrollbars', category: 'display',
    description: 'Hide native scrollbars for a cleaner TV interface' },
  
  // Input Protection category
  { key: 'wrapTextInputs', label: 'Protect Text Inputs', category: 'input',
    description: 'Protect text input fields from accidental remote button presses during editing' },
  
  // Performance category
  { key: 'gpuHints', label: 'GPU Acceleration', category: 'performance',
    description: 'Apply GPU hints to improve animation performance on constrained hardware' },
];

var SECTION_DEFS = [
  { id: 'bundle', label: '📦 Bundle', defaultCollapsed: true },
  { id: 'bundleOptions', label: '⚙️ Bundle Options', defaultCollapsed: true },
  { id: 'globalOverrides', label: '⚙️ Global Overrides', defaultCollapsed: true },
  { id: 'siteOverrides', label: '🖥️ Site Overrides', defaultCollapsed: true },
  { id: 'userscripts', label: '📜 User Scripts', defaultCollapsed: true },
];

var sectionCollapsed = {
  bundle: true,
  bundleOptions: true,
  globalOverrides: true,
  siteOverrides: true,
};

var FIELDS = [
  { name: '__details', label: 'Site Details', type: 'details' },
  { name: '__section_bundle', label: '📦 Bundle', type: 'section', sectionId: 'bundle' },
  { name: 'featureBundle', label: 'Site-specific Bundle', type: 'bundle', required: false, section: 'bundle' },
  { name: '__section_bundleOptions', label: '⚙️ Bundle Options', type: 'section', sectionId: 'bundleOptions' },
  { name: '__bundleOptions', label: 'Bundle Options', type: 'bundleOptions', section: 'bundleOptions' },
  { name: '__section_globalOverrides', label: '⚙️ Global Overrides', type: 'section', sectionId: 'globalOverrides' },
  { name: '__globalOverrides', label: 'Global Overrides', type: 'globalOverrides', section: 'globalOverrides' },
  { name: '__section_siteOverrides', label: '🖥️ Site Overrides', type: 'section', sectionId: 'siteOverrides' },
  { name: '__siteOverrides', label: 'Site Overrides', type: 'siteOverrides', section: 'siteOverrides' },
  { name: '__features', label: 'Feature Toggles', type: 'featureOverrides', section: 'siteOverrides' },
  { name: '__section_userscripts', label: '📜 User Scripts', type: 'section', sectionId: 'userscripts' },
  { name: '__userscripts', label: 'User Scripts', type: 'userscripts', section: 'userscripts' },
];

/**
 * Ensure bundle options are initialized from bundle metadata
 */
function ensureBundleOptionsInitialized() {
  if (!state.card) return;

  var bundleName = state.card.featureBundle;
  if (!bundleName) return;

  var bundle = getBundle(bundleName);
  var manifest = bundle && bundle.manifest;
  if (!manifest || !manifest.options || !manifest.options.length) return;

  if (!state.card.bundleOptions || typeof state.card.bundleOptions !== 'object') {
    state.card.bundleOptions = {};
  }
  if (!state.card.bundleOptionData || typeof state.card.bundleOptionData !== 'object') {
    state.card.bundleOptionData = {};
  }

  var options = manifest.options;
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
  var manifest = bundle && bundle.manifest;
  if (!manifest || !manifest.options || !manifest.options.length) return;

  for (var i = 0; i < manifest.options.length; i++) {
    var opt = manifest.options[i];
    if (!opt || !opt.key) continue;
    state.card.bundleOptions[opt.key] = opt.hasOwnProperty('default') ? opt.default : null;
  }
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
      enabled: entry.enabled === true,
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

function ensureSiteUserscriptToggles() {
  if (!state.card) return {};
  if (!state.card.userscriptToggles || typeof state.card.userscriptToggles !== 'object') {
    state.card.userscriptToggles = {};
  }
  return state.card.userscriptToggles;
}

function saveUserscriptsForBundle() {
  if (!state.card) return;
  state.card.userscripts = normalizeUserscripts(state.card.userscripts || []);
}

function loadUserscriptsForBundle() {
  if (!state.card) return;
  state.card.userscripts = normalizeUserscripts(state.card.userscripts || []);
}

function ensureUserscriptsInitialized() {
  ensureSiteUserscriptToggles();
  loadUserscriptsForBundle();
}

// Legacy userscript-sandbox functions removed - bundle no longer exists
// Userscripts are now managed globally via the registry system

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
            '<div class="tp-preview-meta" id="tp-preview-meta">' +
              '<div class="tp-preview-meta-row" id="tp-preview-bundle">Bundle: None</div>' +
              '<div class="tp-preview-meta-row" id="tp-preview-options">Options: Global</div>' +
              '<div class="tp-preview-meta-row" id="tp-preview-userscripts">Scripts: None</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="tp-editor-footer">' +
        '<div class="tp-editor-footer-left">' +
          '<button type="button" class="tp-editor-btn tp-editor-btn-delete" id="tp-editor-delete" tabindex="0">' +
            '<span class="tp-btn-icon">🗑</span> Delete' +
          '</button>' +
          '<button type="button" class="tp-editor-btn tp-editor-btn-purge" id="tp-editor-purge" tabindex="0">' +
            '<span class="tp-btn-icon">🧹</span> Purge Data' +
          '</button>' +
        '</div>' +
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

  // Purge button - click AND keydown for Enter
  var purgeBtn = editor.querySelector('#tp-editor-purge');
  if (purgeBtn) {
    purgeBtn.addEventListener('click', function() {
      purgeSiteData();
    });
    purgeBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) { // Enter
        e.preventDefault();
        e.stopPropagation();
        purgeSiteData();
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

    // If on the purge button, purge
    if (active && active.id === 'tp-editor-purge') {
      console.log('TizenPortal: Enter on purge button');
      event.preventDefault();
      event.stopPropagation();
      purgeSiteData();
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
    userscriptToggles: {},
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
    url: stripTrailingSlash(card.url || ''),
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
    userscriptToggles: card.userscriptToggles || {},
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
    resetDeleteButtonState(deleteBtn);
  }

  // Show/hide purge button
  var purgeBtn = editor.querySelector('#tp-editor-purge');
  if (purgeBtn) {
    purgeBtn.style.display = isEdit ? 'flex' : 'none';
    resetPurgeButtonState(purgeBtn);
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
    cardUrl = stripTrailingSlash(cardUrl);
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
    navigationMode: state.card.hasOwnProperty('navigationMode') ? state.card.navigationMode : null,
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
    userscriptToggles: state.card.userscriptToggles || {},
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

function resetDeleteButtonState(deleteBtn) {
  if (!deleteBtn) return;
  deleteBtn.dataset.confirmDelete = '';
  var icon = deleteBtn.querySelector('.tp-btn-icon');
  if (icon) icon.textContent = '🗑';
  if (deleteBtn.childNodes[1]) {
    deleteBtn.childNodes[1].textContent = ' Delete';
  }
}

function resetPurgeButtonState(purgeBtn) {
  if (!purgeBtn) return;
  purgeBtn.dataset.confirmPurge = '';
  var icon = purgeBtn.querySelector('.tp-btn-icon');
  if (icon) icon.textContent = '🧹';
  if (purgeBtn.childNodes[1]) {
    purgeBtn.childNodes[1].textContent = ' Purge Data';
  }
}

function normalizeUrlForMatch(url) {
  if (!url || typeof url !== 'string') return '';
  var normalized = url.toLowerCase();
  normalized = normalized.split('#')[0].split('?')[0];
  if (normalized.length > 1 && normalized.charAt(normalized.length - 1) === '/') {
    normalized = normalized.substring(0, normalized.length - 1);
  }
  return normalized;
}

function purgeSiteData() {
  var mode = getEditorMode();
  var cardId = getEditorCardId();

  console.log('TizenPortal: purgeSiteData mode=' + mode + ' cardId=' + cardId);

  if (mode !== 'edit' || !cardId) {
    console.log('TizenPortal: Cannot purge - not in edit mode or no card ID');
    return;
  }

  var purgeBtn = document.getElementById('tp-editor-purge');
  if (purgeBtn && purgeBtn.dataset.confirmPurge === 'true') {
    var cardName = state.card ? state.card.name : 'Site';
    var cardUrl = state.card ? state.card.url : '';
    var matchUrl = normalizeUrlForMatch(cardUrl);

    // Clear last-card cache for this site (portal origin only)
    try {
      var stored = sessionStorage.getItem('tp_last_card');
      if (stored) {
        var storedCard = JSON.parse(stored);
        var storedUrl = normalizeUrlForMatch(storedCard && storedCard.url ? storedCard.url : '');
        if (storedUrl && matchUrl && storedUrl === matchUrl) {
          sessionStorage.removeItem('tp_last_card');
        }
      }
    } catch (err) {
      // Ignore
    }

    // Clear window.name payload if it matches this site
    try {
      var name = window.name;
      if (name && typeof name === 'string' && name.indexOf('tp:') === 0) {
        var payload = JSON.parse(name.substring(3));
        var payloadUrl = normalizeUrlForMatch(payload && payload.url ? payload.url : '');
        if (payloadUrl && matchUrl && payloadUrl === matchUrl) {
          window.name = '';
        }
      }
    } catch (err2) {
      // Ignore
    }

    // Clear bundle runtime data stored on the card
    if (state.card) {
      state.card.bundleOptionData = {};
      updateCard(cardId, { bundleOptionData: {} });
    }

    resetPurgeButtonState(purgeBtn);
    showEditorToast('Purged portal data for: ' + cardName + ' (site cookies unchanged)');
  } else {
    if (purgeBtn) {
      purgeBtn.dataset.confirmPurge = 'true';
      purgeBtn.querySelector('.tp-btn-icon').textContent = '⚠';
      purgeBtn.childNodes[1].textContent = ' Press again to confirm';

      // Reset after 3 seconds
      setTimeout(function() {
        resetPurgeButtonState(purgeBtn);
      }, 3000);
    }
    showEditorToast('Press Purge again to confirm');
  }
}

/**
 * Check if bundle has any options to configure
 */
function bundleHasOptions() {
  var bundleName = state.card ? state.card.featureBundle : null;
  if (!bundleName) return false;
  var bundle = getBundle(bundleName);
  var manifest = bundle && bundle.manifest;
  return !!(manifest && manifest.options && manifest.options.length);
}

function renderFields() {
  var container = document.getElementById('tp-editor-fields');
  if (!container) return;
  if (!state.card) {
    console.error('TizenPortal: state.card is null in renderFields');
    return;
  }

  var scrollTop = container.scrollTop;
  ensureSectionState();
  ensureUserscriptsInitialized();

  var html = '';

  for (var i = 0; i < FIELDS.length; i++) {
    var field = FIELDS[i];
    
    // Skip bundleOptions section and its content if bundle has no options
    if ((field.type === 'section' && field.sectionId === 'bundleOptions' && !bundleHasOptions())) {
      continue;
    }
    if (field.section === 'bundleOptions' && !bundleHasOptions()) {
      continue;
    }
    
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
    } else if (field.type === 'globalOverrides') {
      html += renderGlobalOverridesField();
    } else if (field.type === 'siteOverrides') {
      html += renderSiteOverridesField();
    } else if (field.type === 'featureOverrides') {
      html += renderFeatureOverridesField();
    } else if (field.type === 'userscripts') {
      html += renderUserscriptsField();
    } else if (field.type === 'bundleOptions') {
      html += renderBundleOptionsField();
    } else if (field.type === 'details') {
      html += renderDetailsField();
    } else {
      html += renderTextField(field, value);
    }
  }

  container.innerHTML = html;

  // Set up field event listeners
  setupFieldListeners(container);

  container.scrollTop = scrollTop;
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
  var summary = getSectionSummary(sectionId);
  return '' +
    '<div class="tp-field-row tp-field-section-row" data-type="section" data-section="' + sectionId + '" tabindex="0">' +
      '<div class="tp-field-label">' + field.label + '</div>' +
      '<div class="tp-field-value">' +
        '<span class="tp-section-summary">' + escapeHtml(summary) + '</span>' +
        '<span class="tp-section-indicator">' + indicator + '</span>' +
      '</div>' +
    '</div>';
}

function getSectionSummary(sectionId) {
  if (!state.card) return '';

  if (sectionId === 'bundle') {
    var bundleName = state.card.featureBundle || null;
    if (!bundleName) return 'Bundle: None';
    var bundle = getBundle(bundleName);
    var manifest = bundle && bundle.manifest;
    var displayName = manifest && manifest.displayName ? manifest.displayName : bundleName;
    return 'Bundle: ' + displayName;
  }

  if (sectionId === 'bundleOptions') {
    var bundleOptionSummary = getBundleOptionsSummary();
    return bundleOptionSummary || 'None';
  }

  if (sectionId === 'globalOverrides') {
    var textScale = getOptionLabel(TEXT_SCALE_OPTIONS, state.card.textScale);
    var focus = getOptionLabel(FOCUS_OUTLINE_OPTIONS, state.card.focusOutlineMode);
    var transition = getOptionLabel(FOCUS_TRANSITION_MODE_OPTIONS, state.card.focusTransitionMode);
    var transitionSpeed = getOptionLabel(FOCUS_TRANSITION_SPEED_OPTIONS, state.card.focusTransitionSpeed);
    return 'Text: ' + textScale + ' • Focus: ' + focus + ' • Transition: ' + transition + ' • Speed: ' + transitionSpeed;
  }

  if (sectionId === 'siteOverrides') {
    var navMode = getOptionLabel(NAVIGATION_MODE_OPTIONS, state.card.navigationMode);
    var viewport = getOptionLabel(VIEWPORT_MODE_OPTIONS, state.card.viewportMode);
    var ua = getOptionLabel(UA_MODE_OPTIONS, state.card.userAgent);
    var featureSummary = getFeatureOverridesSummary();
    return 'Nav: ' + navMode + ' • Viewport: ' + viewport + ' • UA: ' + ua + (featureSummary ? ' • ' + featureSummary : '');
  }

  if (sectionId === 'userscripts') {
    return getUserscriptsSummary();
  }

  return '';
}

function stripTrailingSlash(url) {
  if (!url || typeof url !== 'string') return url;
  var trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.charAt(trimmed.length - 1) !== '/') return trimmed;
  var lower = trimmed.toLowerCase();
  var minLength = 1;
  if (lower.indexOf('https://') === 0) {
    minLength = 8;
  } else if (lower.indexOf('http://') === 0) {
    minLength = 7;
  }
  if (trimmed.length > minLength) {
    return trimmed.substring(0, trimmed.length - 1);
  }
  return trimmed;
}

function shortenUrl(url) {
  if (!url) return '';
  var cleaned = stripTrailingSlash(url).replace(/^https?:\/\//i, '');
  if (cleaned.length > 40) {
    cleaned = cleaned.substring(0, 37) + '...';
  }
  return cleaned;
}

function getOptionLabel(options, value) {
  for (var i = 0; i < options.length; i++) {
    if (options[i].value === value) {
      return options[i].label;
    }
  }
  return options.length ? options[0].label : '';
}

function countOptionOverrides() {
  var count = 0;
  for (var i = 0; i < FIELDS.length; i++) {
    var field = FIELDS[i];
    if (field.section !== 'options') continue;
    if (state.card.hasOwnProperty(field.name) && state.card[field.name] !== null && state.card[field.name] !== undefined) {
      count++;
    }
  }
  return count;
}

function getBundleOptionsSummary() {
  var bundleName = state.card.featureBundle || null;
  if (!bundleName) return '';
  var bundle = getBundle(bundleName);
  var manifest = bundle && bundle.manifest;
  if (!manifest || !manifest.options || !manifest.options.length) return '';

  var parts = [];
  for (var i = 0; i < manifest.options.length; i++) {
    var opt = manifest.options[i];
    if (!opt || !opt.key) continue;
    var current = getBundleOptionValue(opt.key, opt);
    var display = formatBundleOptionSummaryValue(opt, current);
    parts.push((opt.label || opt.key) + ': ' + display);
    if (parts.length >= 2) break;
  }

  return parts.join(' • ');
}

function formatBundleOptionSummaryValue(option, value) {
  var type = option.type || 'text';
  if (type === 'toggle') {
    return value ? 'On' : 'Off';
  }
  if (type === 'select' && option.options) {
    for (var i = 0; i < option.options.length; i++) {
      if (option.options[i].value === value) {
        return option.options[i].label;
      }
    }
  }
  return value === null || value === undefined || value === '' ? '(not set)' : String(value);
}

function getBundleUserscripts() {
  // Bundle-scoped userscripts were removed in favor of global registry.
  return [];
}

function ensureBundleUserscriptToggles() {
  return {};
}

function getBundleUserscriptId(bundleName, script, index) {
  var id = script && script.id ? script.id : index;
  return (bundleName || 'bundle') + ':' + id;
}

function getGlobalUserscripts() {
  return UserscriptRegistry.getAllUserscripts();
}

function getUserscriptsSummary() {
  var globalScripts = getGlobalUserscripts();
  var globalConfig = Userscripts.getUserscriptsConfig();
  var siteToggles = ensureSiteUserscriptToggles();
  var enabledNames = [];

  for (var j = 0; j < globalScripts.length; j++) {
    var s = globalScripts[j] || {};
    var sId = s.id || ('global-' + j);
    var enabled = globalConfig.enabled[sId] === true;
    if (siteToggles && siteToggles.hasOwnProperty(sId)) {
      enabled = siteToggles[sId] === true;
    }
    if (enabled) {
      enabledNames.push(s.name || sId);
    }
  }

  if (!globalScripts.length) return 'None';
  return enabledNames.length > 0 ? enabledNames.join(', ') : 'None enabled';
}

function getGlobalFeaturesConfig() {
  if (window.TizenPortal && window.TizenPortal.config) {
    return TizenPortal.config.get('tp_features') || {};
  }
  return {};
}

function getFeatureOverridesSummary() {
  if (!state.card) return 'None';
  
  var overrides = [];
  var globalFeatures = getGlobalFeaturesConfig();
  
  for (var i = 0; i < FEATURE_OVERRIDE_DEFS.length; i++) {
    var def = FEATURE_OVERRIDE_DEFS[i];
    if (state.card.hasOwnProperty(def.key) && state.card[def.key] !== null && state.card[def.key] !== undefined) {
      var status = state.card[def.key] === true ? '✓' : '○';
      overrides.push(status + ' ' + def.label);
    }
  }
  
  if (!overrides.length) return 'None';
  if (overrides.length <= 2) return overrides.join(' • ');
  
  // Show first 2 and count for others
  return overrides.slice(0, 2).join(' • ') + ' + ' + (overrides.length - 2) + ' more';
}

function renderGlobalOverridesField() {
  var html = '<div class="tp-field-section">';
  var globalFeatures = getGlobalFeaturesConfig();

  for (var c = 0; c < GLOBAL_OVERRIDE_CATEGORIES.length; c++) {
    var category = GLOBAL_OVERRIDE_CATEGORIES[c];
    html += '<div class="tp-field-section-label">' + category.label + '</div>';

    for (var i = 0; i < GLOBAL_OVERRIDE_DEFS.length; i++) {
      var def = GLOBAL_OVERRIDE_DEFS[i];
      if (def.category !== category.id) continue;

      var hasOverride = state.card && state.card.hasOwnProperty(def.key);
      var globalValue = globalFeatures[def.key];
      var effectiveValue = hasOverride ? state.card[def.key] : globalValue;

      // Find display label
      var displayLabel = 'Not set';
      for (var o = 0; o < def.options.length; o++) {
        if (def.options[o].value === effectiveValue) {
          displayLabel = def.options[o].label;
          break;
        }
      }

      var statusText = hasOverride ? displayLabel + ' (override)' : displayLabel + ' (global)';

      html += '' +
        '<div class="tp-userscript-line tp-global-override-row" data-global-key="' + def.key + '" tabindex="0">' +
          '<div class="tp-userscript-label">' +
            '<div style="font-weight: 500;">' + escapeHtml(def.label) + '</div>' +
            '<div style="font-size: 12px; color: #666; margin-top: 2px;">' + escapeHtml(def.description || '') + '</div>' +
          '</div>' +
          '<div class="tp-userscript-status">' + statusText + '</div>' +
          '<div class="tp-userscript-actions">' +
            '<button type="button" class="tp-userscript-btn tp-global-override-btn" data-global-action="cycle" data-global-key="' + def.key + '" tabindex="0">' +
              'Change' +
            '</button>' +
            (hasOverride ? 
              '<button type="button" class="tp-userscript-btn tp-global-override-btn" data-global-action="reset" data-global-key="' + def.key + '" tabindex="0">Reset</button>' 
              : '') +
          '</div>' +
        '</div>';
    }
  }

  html += '</div>';
  return html;
}

function renderSiteOverridesField() {
  var html = '<div class="tp-field-section">';
  var globalFeatures = getGlobalFeaturesConfig();

  for (var c = 0; c < SITE_OVERRIDE_CATEGORIES.length; c++) {
    var category = SITE_OVERRIDE_CATEGORIES[c];
    html += '<div class="tp-field-section-label">' + category.label + '</div>';

    for (var i = 0; i < SITE_OVERRIDE_DEFS.length; i++) {
      var def = SITE_OVERRIDE_DEFS[i];
      if (def.category !== category.id) continue;

      var hasOverride = state.card && state.card.hasOwnProperty(def.key);
      var globalValue = globalFeatures[def.key];
      var effectiveValue = hasOverride ? state.card[def.key] : globalValue;

      // Find display label
      var displayLabel = 'Not set';
      for (var o = 0; o < def.options.length; o++) {
        if (def.options[o].value === effectiveValue) {
          displayLabel = def.options[o].label;
          break;
        }
      }

      var statusText = hasOverride ? displayLabel + ' (override)' : displayLabel + ' (global)';

      html += '' +
        '<div class="tp-userscript-line tp-site-override-row" data-site-key="' + def.key + '" tabindex="0">' +
          '<div class="tp-userscript-label">' +
            '<div style="font-weight: 500;">' + escapeHtml(def.label) + '</div>' +
            '<div style="font-size: 12px; color: #666; margin-top: 2px;">' + escapeHtml(def.description || '') + '</div>' +
          '</div>' +
          '<div class="tp-userscript-status">' + statusText + '</div>' +
          '<div class="tp-userscript-actions">' +
            '<button type="button" class="tp-userscript-btn tp-site-override-btn" data-site-action="cycle" data-site-key="' + def.key + '" tabindex="0">' +
              'Change' +
            '</button>' +
            (hasOverride ? 
              '<button type="button" class="tp-userscript-btn tp-site-override-btn" data-site-action="reset" data-site-key="' + def.key + '" tabindex="0">Reset</button>' 
              : '') +
          '</div>' +
        '</div>';
    }
  }

  html += '</div>';
  return html;
}

function renderFeatureOverridesField() {
  var html = '<div class="tp-field-section">';
  var globalFeatures = getGlobalFeaturesConfig();

  for (var c = 0; c < FEATURE_CATEGORIES.length; c++) {
    var category = FEATURE_CATEGORIES[c];
    html += '<div class="tp-field-section-label">' + category.label + '</div>';

    for (var i = 0; i < FEATURE_OVERRIDE_DEFS.length; i++) {
      var def = FEATURE_OVERRIDE_DEFS[i];
      if (def.category !== category.id) continue;

      var hasOverride = state.card && state.card.hasOwnProperty(def.key);
      var globalEnabled = globalFeatures[def.key] !== false;
      var effectiveEnabled = hasOverride ? (state.card[def.key] === true) : globalEnabled;

      var statusText = '';
      if (hasOverride) {
        statusText = effectiveEnabled ? '✓ Enabled (override)' : '○ Disabled (override)';
      } else {
        statusText = globalEnabled ? '✓ Enabled (global)' : '○ Disabled (global)';
      }

      html += '' +
        '<div class="tp-userscript-line tp-feature-row" data-feature-key="' + def.key + '" tabindex="0">' +
          '<div class="tp-userscript-label">' +
            '<div style="font-weight: 500;">' + escapeHtml(def.label) + '</div>' +
            '<div style="font-size: 12px; color: #666; margin-top: 2px;">' + escapeHtml(def.description || '') + '</div>' +
          '</div>' +
          '<div class="tp-userscript-status">' + statusText + '</div>' +
          '<div class="tp-userscript-actions">' +
            '<button type="button" class="tp-userscript-btn tp-feature-btn" data-feature-action="toggle" data-feature-key="' + def.key + '" tabindex="0">' +
              (hasOverride ? 'Reset' : (globalEnabled ? 'Disable' : 'Enable')) +
            '</button>' +
          '</div>' +
        '</div>';
    }
  }

  html += '</div>';
  return html;
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

function renderDetailsField() {
  var name = state.card.name || 'Site Name';
  var url = state.card.url || 'https://...';
  var icon = state.card.icon ? 'Icon: set' : 'Icon: none';
  var summary = 'Name: ' + name + ' • URL: ' + shortenUrl(url) + ' • ' + icon;

  return '' +
    '<div class="tp-userscript-line tp-userscript-row tp-details-row" data-details-row="true" tabindex="0">' +
      '<div class="tp-userscript-label">' + escapeHtml(summary) + '</div>' +
      '<div class="tp-userscript-actions">' +
        '<button type="button" class="tp-userscript-btn tp-detail-btn" data-detail-action="edit-name" tabindex="0">Name</button>' +
        '<button type="button" class="tp-userscript-btn tp-detail-btn" data-detail-action="edit-url" tabindex="0">URL</button>' +
        '<button type="button" class="tp-userscript-btn tp-detail-btn" data-detail-action="edit-icon" tabindex="0">Icon</button>' +
        '<button type="button" class="tp-userscript-btn tp-detail-btn" data-detail-action="fetch-icon" tabindex="0">Fetch</button>' +
      '</div>' +
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
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  var kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  var mb = kb / 1024;
  return mb.toFixed(1) + ' MB';
}

function getBundleSizeLabel(bundle) {
  if (!bundle) return '';
  var parts = [];
  if (bundle.cssBytes && bundle.cssBytes > 0) {
    parts.push('CSS: ' + formatBytes(bundle.cssBytes));
  }
  if (bundle.jsBytes && bundle.jsBytes > 0) {
    parts.push('JS: ' + formatBytes(bundle.jsBytes));
  }
  return parts.join(' • ');
}

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
    var sizeLabel = getBundleSizeLabel(bundle);
    
    html += '' +
      '<div class="tp-bundle-option' + (isSelected ? ' selected' : '') + '" data-bundle="' + bundleName + '" tabindex="0">' +
        '<div class="tp-bundle-check">' + (isSelected ? '●' : '○') + '</div>' +
        '<div class="tp-bundle-info">' +
          '<div class="tp-bundle-name">' + escapeHtml(displayName) + '</div>' +
          '<div class="tp-bundle-desc">' + escapeHtml(description) + '</div>' +
          (sizeLabel ? '<div class="tp-bundle-size">' + escapeHtml(sizeLabel) + '</div>' : '') +
        '</div>' +
      '</div>';
  }
  
  html += '</div>';

  html += '</div>';
  
  return html;
}

function renderBundleOptionsField() {
  var bundleName = state.card ? state.card.featureBundle : null;
  var bundle = bundleName ? getBundle(bundleName) : null;
  var manifest = bundle && bundle.manifest;
  if (!bundleName || !manifest || !manifest.options || !manifest.options.length) {
    return '' +
      '<div class="tp-field-row" tabindex="-1">' +
        '<div class="tp-field-label">Bundle Options</div>' +
        '<div class="tp-field-value">Select a bundle to configure options</div>' +
      '</div>';
  }

  return renderBundleOptions(bundleName);
}

/**
 * Render bundle options section based on bundle metadata
 */
function renderBundleOptions(bundleName) {
  var bundle = getBundle(bundleName);
  var manifest = bundle && bundle.manifest;
  if (!manifest || !manifest.options || !manifest.options.length) {
    return '';
  }

  if (!state.card.bundleOptions || typeof state.card.bundleOptions !== 'object') {
    state.card.bundleOptions = {};
  }
  if (!state.card.bundleOptionData || typeof state.card.bundleOptionData !== 'object') {
    state.card.bundleOptionData = {};
  }

  var html = '<div class="tp-field-section">';

  for (var i = 0; i < manifest.options.length; i++) {
    var opt = manifest.options[i];
    if (!opt || !opt.key) continue;
    var value = state.card.bundleOptions.hasOwnProperty(opt.key) ? state.card.bundleOptions[opt.key] : opt.default;
    var dataValue = state.card.bundleOptionData[opt.key] || '';
    html += renderBundleOptionRow(opt, value, dataValue);
  }

  html += '</div>';
  return html;
}

function renderUserscriptsField() {
  var html = '<div class="tp-field-section">';
  
  // Get global userscript config and site toggles
  var globalConfig = Userscripts.getUserscriptsConfig();
  var siteToggles = state.card.userscriptToggles || {};
  
  // Get all userscripts from registry
  var allScripts = UserscriptRegistry.getAllUserscripts();
  var categories = UserscriptRegistry.getCategories();
  
  // Organize scripts by category
  for (var cat in categories) {
    var categoryScripts = UserscriptRegistry.getUserscriptsByCategory(categories[cat]);
    if (categoryScripts.length === 0) continue;
    
    // Category header
    html += '<div class="tp-field-section-label">' + getCategoryLabel(categories[cat]) + '</div>';
    
    // Script toggle rows
    for (var i = 0; i < categoryScripts.length; i++) {
      var script = categoryScripts[i];
      var scriptId = script.id;
      
      // Determine enabled state
      var globalEnabled = globalConfig.enabled[scriptId] === true;
      var hasSiteOverride = siteToggles.hasOwnProperty(scriptId);
      var siteEnabled = hasSiteOverride ? (siteToggles[scriptId] === true) : globalEnabled;
      
      // Status display
      var statusText = '';
      if (hasSiteOverride) {
        statusText = siteEnabled ? '✓ Enabled (site override)' : '○ Disabled (site override)';
      } else if (globalEnabled) {
        statusText = '✓ Enabled (global)';
      } else {
        statusText = '○ Disabled (global)';
      }
      
      html += '' +
        '<div class="tp-userscript-line tp-userscript-row" data-userscript-id="' + escapeHtml(scriptId) + '" tabindex="0">' +
          '<div class="tp-userscript-label">' + escapeHtml(script.name) + '</div>' +
          '<div class="tp-userscript-status">' + statusText + '</div>' +
          '<div class="tp-userscript-actions">' +
            '<button type="button" class="tp-userscript-btn" data-userscript-action="toggle" data-userscript-id="' + escapeHtml(scriptId) + '" tabindex="0">' +
              (hasSiteOverride ? 'Reset to Global' : (globalEnabled ? 'Disable for Site' : 'Enable for Site')) +
            '</button>' +
          '</div>' +
        '</div>';
    }
  }
  
  html += '<div class="tp-field-row" style="margin-top: 12px; color: #8ab4f8; font-size: 14px;" tabindex="-1">' +
    '<div class="tp-field-label">💡 Tip</div>' +
    '<div class="tp-field-value">Toggle scripts globally in Preferences. Here you can override per-site.</div>' +
  '</div>';
  
  html += '</div>';
  return html;
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

  // Userscript rows (handled separately)
  var userscriptActions = container.querySelectorAll('.tp-userscript-action, .tp-userscript-btn:not(.tp-detail-btn)');
  for (var ua = 0; ua < userscriptActions.length; ua++) {
    userscriptActions[ua].addEventListener('click', function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (this.classList.contains('tp-feature-btn')) {
        handleFeatureOverrideAction(this);
      } else if (this.classList.contains('tp-global-override-btn')) {
        handleGlobalOverrideAction(this);
      } else if (this.classList.contains('tp-site-override-btn')) {
        handleSiteOverrideAction(this);
      } else {
        handleUserscriptAction(this);
      }
    });
    userscriptActions[ua].addEventListener('keydown', function(e) {
      if (handleUserscriptButtonKeyDown(e, this)) {
        return;
      }
      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        if (this.classList.contains('tp-feature-btn')) {
          handleFeatureOverrideAction(this);
        } else if (this.classList.contains('tp-global-override-btn')) {
          handleGlobalOverrideAction(this);
        } else if (this.classList.contains('tp-site-override-btn')) {
          handleSiteOverrideAction(this);
        } else {
          handleUserscriptAction(this);
        }
      }
    });
  }

  var detailButtons = container.querySelectorAll('.tp-detail-btn');
  for (var db = 0; db < detailButtons.length; db++) {
    detailButtons[db].addEventListener('click', function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      handleDetailAction(this);
    });
    detailButtons[db].addEventListener('keydown', function(e) {
      if (handleInlineRowButtonKeyDown(e, this)) {
        return;
      }
      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        handleDetailAction(this);
      }
    });
  }

  var userscriptRows = container.querySelectorAll('.tp-userscript-row');
  for (var ur = 0; ur < userscriptRows.length; ur++) {
    userscriptRows[ur].addEventListener('keydown', function(e) {
      if (e.keyCode === 38 || e.keyCode === 40) {
        if (moveFocusByRow(this, e.keyCode === 40 ? 'down' : 'up')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.keyCode === 39) {
        e.preventDefault();
        e.stopPropagation();
        focusInlineRowButton(this);
        return;
      }
      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        focusInlineRowButton(this);
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

function focusUserscriptRowButton(rowEl) {
  if (!rowEl) return;
  var btn = rowEl.querySelector('.tp-userscript-btn');
  if (btn) {
    btn.focus();
  }
}

function focusInlineRowButton(rowEl) {
  focusUserscriptRowButton(rowEl);
}

function handleUserscriptButtonKeyDown(e, btn) {
  return handleInlineRowButtonKeyDown(e, btn);
}

function handleInlineRowButtonKeyDown(e, btn) {
  if (!btn) return false;
  var key = e.keyCode;

  if (key === 37 || key === 39) {
    var row = btn.closest('.tp-userscript-row');
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
    var parentRow = btn.closest('.tp-userscript-row');
    if (parentRow) {
      var moved = moveFocusByRow(parentRow, key === 40 ? 'down' : 'up');
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        return true;
      }
    }
  }

  return false;
}

function moveFocusByRow(fromEl, direction) {
  var container = document.getElementById('tp-editor-fields');
  if (!container) return false;

  var rows = container.querySelectorAll('.tp-field-row, .tp-userscript-row, .tp-bundle-option');
  if (!rows.length) return false;

  var currentRow = fromEl.classList && (fromEl.classList.contains('tp-field-row') || fromEl.classList.contains('tp-userscript-row') || fromEl.classList.contains('tp-bundle-option'))
    ? fromEl
    : fromEl.closest('.tp-field-row, .tp-userscript-row, .tp-bundle-option');

  if (!currentRow) return false;

  var index = -1;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i] === currentRow) {
      index = i;
      break;
    }
  }
  if (index === -1) return false;

  var step = direction === 'down' ? 1 : -1;
  for (var j = index + step; j >= 0 && j < rows.length; j += step) {
    var target = rows[j];
    if (target && target.offsetParent !== null) {
      try {
        target.focus();
        if (target.scrollIntoView) {
          target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      } catch (err) {
        // ignore
      }
      return true;
    }
  }

  if (direction === 'down') {
    var footerTargets = ['#tp-editor-delete', '#tp-editor-purge', '#tp-editor-cancel'];
    for (var k = 0; k < footerTargets.length; k++) {
      var footerEl = document.querySelector(footerTargets[k]);
      if (footerEl && footerEl.offsetParent !== null) {
        try {
          footerEl.focus();
        } catch (err2) {
          // ignore
        }
        return true;
      }
    }
  }

  return false;
}

/**
 * Activate input mode for a field
 */
function activateFieldInput(row) {
  var fieldName = row.dataset.field;
  var fieldType = row.dataset.type || 'text';
  var field = getFieldDef(fieldName);

  if (row.dataset.userscriptField) {
    activateUserscriptInput(row);
    return;
  }

  if (row.dataset.userscriptAction) {
    handleUserscriptAction(row);
    return;
  }

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

function getUserscriptById(scriptId) {
  ensureUserscriptsInitialized();
  var list = state.card.userscripts || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === scriptId) {
      return list[i];
    }
  }
  return null;
}

function activateUserscriptInput(row) {
  var scriptId = row.dataset.userscriptId;
  var field = row.dataset.userscriptField || '';
  var script = getUserscriptById(scriptId);
  if (!script) return;

  if (!field) return;

  if (field === 'enabled') {
    script.enabled = !script.enabled;
    saveUserscriptsForBundle(state.card.featureBundle);
    renderFields();
    autoSaveCard('userscript:enabled');
    return;
  }

  if (field === 'name') {
    var newName = prompt('Script Name:', script.name || '');
    if (newName !== null) {
      script.name = newName;
      saveUserscriptsForBundle(state.card.featureBundle);
      renderFields();
      autoSaveCard('userscript:name');
    }
    return;
  }

  if (field === 'url') {
    var newUrl = prompt('Script URL:', script.url || '');
    if (newUrl !== null) {
      if (newUrl) {
        newUrl = sanitizeUrl(newUrl);
        if (!newUrl || !isValidHttpUrl(newUrl)) {
          showEditorToast('Invalid URL');
          return;
        }
        script.url = newUrl;
        saveUserscriptsForBundle(state.card.featureBundle);
        renderFields();
        autoSaveCard('userscript:url');
        fetchUserscriptUrl(scriptId);
      } else {
        script.url = '';
        script.cached = '';
        script.lastFetched = 0;
        saveUserscriptsForBundle(state.card.featureBundle);
        renderFields();
        autoSaveCard('userscript:url');
      }
    }
    return;
  }

  if (field === 'inline') {
    var newInline = prompt('Inline Script:', script.inline || '');
    if (newInline !== null) {
      script.inline = newInline;
      saveUserscriptsForBundle(state.card.featureBundle);
      renderFields();
      autoSaveCard('userscript:inline');
    }
  }
}

function handleUserscriptAction(btn) {
  var action = btn.dataset.userscriptAction || '';
  var scriptId = btn.dataset.userscriptId || '';

  if (action === 'toggle' && scriptId) {
    // Get current state
    var globalConfig = Userscripts.getUserscriptsConfig();
    var siteToggles = state.card.userscriptToggles || {};
    var globalEnabled = globalConfig.enabled[scriptId] === true;
    var hasSiteOverride = siteToggles.hasOwnProperty(scriptId);
    
    if (hasSiteOverride) {
      // Has override - reset to global
      delete siteToggles[scriptId];
      showEditorToast('Reset to global setting');
    } else {
      // No override - create one with opposite of global
      siteToggles[scriptId] = !globalEnabled;
      showEditorToast(globalEnabled ? 'Disabled for this site' : 'Enabled for this site');
    }
    
    state.card.userscriptToggles = siteToggles;
    renderFields();
    autoSaveCard('userscript:toggle');
    
    // Refocus the button
    setTimeout(function() {
      var updatedBtn = document.querySelector('.tp-userscript-btn[data-userscript-id="' + scriptId + '"]');
      if (updatedBtn) {
        updatedBtn.focus();
      }
    }, 50);
  }
}

function handleFeatureOverrideAction(btn) {
  if (!btn || !state.card) return;
  var action = btn.dataset.featureAction || '';
  var key = btn.dataset.featureKey || '';
  if (!key) return;

  if (action === 'toggle') {
    var globalConfig = getGlobalFeaturesConfig();
    var globalEnabled = globalConfig[key] !== false;
    var hasOverride = state.card.hasOwnProperty(key);

    if (hasOverride) {
      delete state.card[key];
      showEditorToast('Reset to global setting');
    } else {
      state.card[key] = !globalEnabled;
      showEditorToast(globalEnabled ? 'Disabled for this site' : 'Enabled for this site');
    }

    renderFields();
    autoSaveCard('feature:toggle');

    setTimeout(function() {
      var updatedBtn = document.querySelector('.tp-feature-btn[data-feature-key="' + key + '"]');
      if (updatedBtn) {
        updatedBtn.focus();
      }
    }, 50);
  }
}

function handleGlobalOverrideAction(btn) {
  var action = btn.getAttribute('data-global-action');
  var key = btn.getAttribute('data-global-key');
  if (!key) return;

  // Find definition
  var def = null;
  for (var i = 0; i < GLOBAL_OVERRIDE_DEFS.length; i++) {
    if (GLOBAL_OVERRIDE_DEFS[i].key === key) {
      def = GLOBAL_OVERRIDE_DEFS[i];
      break;
    }
  }
  if (!def) return;

  if (action === 'reset') {
    // Remove override
    delete state.card[key];
    showEditorToast('Reset to global setting');
  } else if (action === 'cycle') {
    // Cycle through options
    var currentValue = state.card[key];
    var currentIdx = -1;
    for (var j = 0; j < def.options.length; j++) {
      if (def.options[j].value === currentValue) {
        currentIdx = j;
        break;
      }
    }
    var nextIdx = (currentIdx + 1) % def.options.length;
    state.card[key] = def.options[nextIdx].value;
  }

  renderFields();
  autoSaveCard('global:' + key);

  setTimeout(function() {
    var updatedBtn = document.querySelector('.tp-global-override-btn[data-global-key="' + key + '"]');
    if (updatedBtn) {
      updatedBtn.focus();
    }
  }, 50);
}

function handleSiteOverrideAction(btn) {
  var action = btn.getAttribute('data-site-action');
  var key = btn.getAttribute('data-site-key');
  if (!key) return;

  // Find definition
  var def = null;
  for (var i = 0; i < SITE_OVERRIDE_DEFS.length; i++) {
    if (SITE_OVERRIDE_DEFS[i].key === key) {
      def = SITE_OVERRIDE_DEFS[i];
      break;
    }
  }
  if (!def) return;

  if (action === 'reset') {
    // Remove override
    delete state.card[key];
    showEditorToast('Reset to global setting');
  } else if (action === 'cycle') {
    // Cycle through options
    var currentValue = state.card[key];
    var currentIdx = -1;
    for (var j = 0; j < def.options.length; j++) {
      if (def.options[j].value === currentValue) {
        currentIdx = j;
        break;
      }
    }
    var nextIdx = (currentIdx + 1) % def.options.length;
    state.card[key] = def.options[nextIdx].value;
  }

  renderFields();
  autoSaveCard('site:' + key);

  setTimeout(function() {
    var updatedBtn = document.querySelector('.tp-site-override-btn[data-site-key="' + key + '"]');
    if (updatedBtn) {
      updatedBtn.focus();
    }
  }, 50);
}

function handleDetailAction(btn) {
  if (!btn || !state.card) return;
  var action = btn.dataset.detailAction || '';

  if (action === 'edit-name') {
    var newName = prompt('Site Name:', state.card.name || '');
    if (newName !== null) {
      state.card.name = newName;
      renderFields();
      updatePreview();
      autoSaveCard('text:name');
      focusDetailButton(action);
    }
    return;
  }

  if (action === 'edit-url') {
    var newUrl = prompt('URL:', state.card.url || '');
    if (newUrl !== null) {
      if (newUrl) {
        newUrl = sanitizeUrl(newUrl);
        if (!newUrl || !isValidHttpUrl(newUrl)) {
          showEditorToast('Invalid URL');
          return;
        }
        newUrl = stripTrailingSlash(newUrl);
      }
      state.card.url = newUrl;
      renderFields();
      updatePreview();
      autoSaveCard('text:url');
      focusDetailButton(action);
    }
    return;
  }

  if (action === 'edit-icon') {
    var newIcon = prompt('Icon URL:', state.card.icon || '');
    if (newIcon !== null) {
      if (newIcon) {
        newIcon = sanitizeUrl(newIcon);
        if (!newIcon || !isValidHttpUrl(newIcon)) {
          showEditorToast('Invalid URL');
          return;
        }
      }
      state.card.icon = newIcon || '';
      renderFields();
      updatePreview();
      autoSaveCard('text:icon');
      focusDetailButton(action);
    }
    return;
  }

  if (action === 'fetch-icon') {
    handleFetchFavicon();
  }
}

function focusDetailButton(action) {
  if (!action) return;
  var btn = document.querySelector('.tp-detail-btn[data-detail-action="' + action + '"]');
  if (btn) {
    btn.focus();
  }
}

function focusUserscriptButton(scriptId, action) {
  if (!scriptId) return;
  var selector = '.tp-userscript-btn[data-userscript-id="' + scriptId + '"]';
  if (action) {
    selector += '[data-userscript-action="' + action + '"]';
  }
  var btn = document.querySelector(selector);
  if (btn) {
    btn.focus();
  }
}

/**
 * Get bundle option definition by key
 */
function getBundleOptionDef(key) {
  if (!state.card || !state.card.featureBundle) return null;
  var bundle = getBundle(state.card.featureBundle);
  var manifest = bundle && bundle.manifest;
  if (!manifest || !manifest.options || !manifest.options.length) return null;

  for (var i = 0; i < manifest.options.length; i++) {
    if (manifest.options[i].key === key) {
      return manifest.options[i];
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

function fetchUserscriptUrl(scriptId) {
  var script = getUserscriptById(scriptId);
  if (!script) return;

  var url = (script.url || '').trim();
  if (!url || !isValidHttpUrl(url)) {
    showEditorToast('Invalid script URL');
    return;
  }

  try {
    showEditorToast('Fetching script...');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          script.cached = xhr.responseText || '';
          script.lastFetched = Date.now();
          autoSaveCard('userscript:cached');
          renderFields();
          showEditorToast('Saved script data');
        } else {
          showEditorToast('Failed to fetch script');
        }
      }
    };
    xhr.send();
  } catch (err) {
    showEditorToast('Failed to fetch script');
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
  var previousBundle = state.card.featureBundle || null;
  saveUserscriptsForBundle(previousBundle);
  // "none" means null for featureBundle
  state.card.featureBundle = bundleName === 'none' ? null : bundleName;

  // Reset bundle options when bundle changes
  resetBundleOptionsForBundle(state.card.featureBundle);

  loadUserscriptsForBundle(state.card.featureBundle);
  
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
  var bundleEl = document.getElementById('tp-preview-bundle');
  var optionsEl = document.getElementById('tp-preview-options');
  var scriptsEl = document.getElementById('tp-preview-userscripts');
  
  if (nameEl) {
    nameEl.textContent = state.card.name || 'Site Name';
  }
  
  if (urlEl) {
    var displayUrl = state.card.url ? stripTrailingSlash(state.card.url) : 'https://...';
    urlEl.textContent = displayUrl;
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

  if (bundleEl) {
    bundleEl.textContent = getSectionSummary('bundle') || 'Bundle: None';
  }

  if (optionsEl) {
    optionsEl.textContent = getSectionSummary('options') || 'Options: Global';
  }

  if (scriptsEl) {
    scriptsEl.textContent = getSectionSummary('userscripts') || 'Scripts: None';
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
