/**
 * TizenPortal Modal System
 * 
 * TV-friendly modal dialogs for card editing and forms.
 * Uses spatial navigation for focus management.
 */

import { addCard, updateCard, deleteCard, getCards } from './cards.js';
import { getBundleNames } from '../bundles/registry.js';

/**
 * Refresh portal function (set externally to avoid circular dependency)
 */
var refreshPortalFn = null;

/**
 * Set the refresh portal function
 * @param {Function} fn
 */
export function setRefreshPortalFn(fn) {
  refreshPortalFn = fn;
}

/**
 * Call refresh portal
 */
function refreshPortal() {
  if (refreshPortalFn) {
    refreshPortalFn();
  } else if (window.TizenPortal && window.TizenPortal._refreshPortal) {
    window.TizenPortal._refreshPortal();
  }
}

/**
 * Currently open modal element
 */
var activeModal = null;

/**
 * Element that had focus before modal opened
 */
var previousFocusElement = null;

/**
 * Available user agent options
 */
var userAgentOptions = [
  { value: 'tizen', label: 'Tizen (default)' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' }
];

/**
 * Initialize the modal system
 */
export function initModal() {
  // Create modal container if it doesn't exist
  if (!document.getElementById('tp-modal-container')) {
    var container = document.createElement('div');
    container.id = 'tp-modal-container';
    document.body.appendChild(container);
  }
  
  // Handle escape key to close modal
  document.addEventListener('keydown', function(event) {
    if (event.keyCode === 27 || event.keyCode === 10009) { // Escape or Back
      if (activeModal) {
        event.preventDefault();
        event.stopPropagation();
        closeModal();
      }
    }
  }, true);
}

/**
 * Show the add card dialog
 */
export function showAddCardModal() {
  var content = createCardForm(null);
  showModal('Add Site', content, function(form) {
    var name = form.name.value.trim();
    var url = form.url.value.trim();
    
    if (!name) {
      showFormError(form, 'Please enter a site name');
      return false;
    }
    
    if (!url) {
      showFormError(form, 'Please enter a URL');
      return false;
    }
    
    // Ensure URL has protocol
    if (url.indexOf('://') === -1) {
      url = 'https://' + url;
    }
    
    addCard({
      name: name,
      url: url,
      bundle: form.bundle.value,
      userAgent: form.userAgent.value,
      icon: form.icon.value || null,
    });
    
    refreshPortal();
    
    if (window.TizenPortal) {
      window.TizenPortal.showToast('Added: ' + name);
    }
    
    return true; // Close modal
  });
}

/**
 * Show the edit card dialog
 * @param {Object} card - Card to edit
 */
export function showEditCardModal(card) {
  var content = createCardForm(card);
  showModal('Edit Site', content, function(form) {
    var name = form.name.value.trim();
    var url = form.url.value.trim();
    
    if (!name) {
      showFormError(form, 'Please enter a site name');
      return false;
    }
    
    if (!url) {
      showFormError(form, 'Please enter a URL');
      return false;
    }
    
    // Ensure URL has protocol
    if (url.indexOf('://') === -1) {
      url = 'https://' + url;
    }
    
    updateCard(card.id, {
      name: name,
      url: url,
      bundle: form.bundle.value,
      userAgent: form.userAgent.value,
      icon: form.icon.value || null,
    });
    
    refreshPortal();
    
    if (window.TizenPortal) {
      window.TizenPortal.showToast('Updated: ' + name);
    }
    
    return true; // Close modal
  }, function() {
    // Delete button callback
    if (confirm('Delete ' + card.name + '?')) {
      deleteCard(card.id);
      refreshPortal();
      
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Deleted: ' + card.name);
      }
      
      closeModal();
    }
  });
}

/**
 * Create card form HTML content
 * @param {Object|null} card - Card to edit, or null for new card
 * @returns {string}
 */
function createCardForm(card) {
  var isEdit = card !== null;
  var name = card ? card.name : '';
  var url = card ? card.url : '';
  var bundle = card ? (card.bundle || 'default') : 'default';
  var userAgent = card ? (card.userAgent || 'tizen') : 'tizen';
  var icon = card ? (card.icon || '') : '';
  
  var html = '<form class="tp-modal-form">';
  
  // Name field
  html += '<div class="tp-form-group">';
  html += '<label for="tp-form-name">Name</label>';
  html += '<input type="text" id="tp-form-name" name="name" value="' + escapeHtml(name) + '" tabindex="0" placeholder="Site name">';
  html += '</div>';
  
  // URL field
  html += '<div class="tp-form-group">';
  html += '<label for="tp-form-url">URL</label>';
  html += '<input type="text" id="tp-form-url" name="url" value="' + escapeHtml(url) + '" tabindex="0" placeholder="https://...">';
  html += '</div>';
  
  // Bundle selector
  var bundleNames = getBundleNames();
  html += '<div class="tp-form-group">';
  html += '<label for="tp-form-bundle">Bundle</label>';
  html += '<select id="tp-form-bundle" name="bundle" tabindex="0">';
  for (var i = 0; i < bundleNames.length; i++) {
    var b = bundleNames[i];
    var selected = b === bundle ? ' selected' : '';
    html += '<option value="' + b + '"' + selected + '>' + b + '</option>';
  }
  html += '</select>';
  html += '</div>';
  
  // User agent selector
  html += '<div class="tp-form-group">';
  html += '<label for="tp-form-ua">User Agent</label>';
  html += '<select id="tp-form-ua" name="userAgent" tabindex="0">';
  for (var j = 0; j < userAgentOptions.length; j++) {
    var ua = userAgentOptions[j];
    var uaSelected = ua.value === userAgent ? ' selected' : '';
    html += '<option value="' + ua.value + '"' + uaSelected + '>' + ua.label + '</option>';
  }
  html += '</select>';
  html += '</div>';
  
  // Icon URL (optional)
  html += '<div class="tp-form-group">';
  html += '<label for="tp-form-icon">Icon URL (optional)</label>';
  html += '<input type="text" id="tp-form-icon" name="icon" value="' + escapeHtml(icon) + '" tabindex="0" placeholder="https://...">';
  html += '</div>';
  
  // Error message placeholder
  html += '<div class="tp-form-error" id="tp-form-error"></div>';
  
  // Buttons
  html += '<div class="tp-form-buttons">';
  if (isEdit) {
    html += '<button type="button" class="tp-btn tp-btn-danger" tabindex="0" data-action="delete">Delete</button>';
  }
  html += '<button type="button" class="tp-btn tp-btn-secondary" tabindex="0" data-action="cancel">Cancel</button>';
  html += '<button type="submit" class="tp-btn tp-btn-primary" tabindex="0">Save</button>';
  html += '</div>';
  
  html += '</form>';
  
  return html;
}

/**
 * Show a modal dialog
 * @param {string} title - Modal title
 * @param {string} content - HTML content
 * @param {Function} onSubmit - Submit callback(form) returns true to close
 * @param {Function} onDelete - Delete button callback (optional)
 */
function showModal(title, content, onSubmit, onDelete) {
  // Store previous focus
  previousFocusElement = document.activeElement;
  
  // Create modal
  var modal = document.createElement('div');
  modal.className = 'tp-modal-overlay';
  modal.innerHTML = '' +
    '<div class="tp-modal">' +
      '<div class="tp-modal-header">' +
        '<h3>' + escapeHtml(title) + '</h3>' +
        '<button type="button" class="tp-modal-close" tabindex="0">&times;</button>' +
      '</div>' +
      '<div class="tp-modal-content">' +
        content +
      '</div>' +
    '</div>';
  
  // Get container
  var container = document.getElementById('tp-modal-container');
  if (!container) {
    container = document.body;
  }
  
  container.appendChild(modal);
  activeModal = modal;
  
  // Event handlers
  var closeBtn = modal.querySelector('.tp-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('keydown', function(event) {
      if (event.keyCode === 13) {
        closeModal();
      }
    });
  }
  
  // Form handling
  var form = modal.querySelector('form');
  if (form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      if (onSubmit && onSubmit(form)) {
        closeModal();
      }
    });
    
    // Cancel button
    var cancelBtn = form.querySelector('[data-action="cancel"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
    
    // Delete button
    var deleteBtn = form.querySelector('[data-action="delete"]');
    if (deleteBtn && onDelete) {
      deleteBtn.addEventListener('click', onDelete);
    }
  }
  
  // Focus first input
  setTimeout(function() {
    var firstInput = modal.querySelector('input, select, button');
    if (firstInput) {
      firstInput.focus();
    }
  }, 100);
}

/**
 * Show a form error message
 * @param {HTMLFormElement} form
 * @param {string} message
 */
function showFormError(form, message) {
  var errorEl = form.querySelector('#tp-form-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

/**
 * Close the current modal
 */
export function closeModal() {
  if (!activeModal) return;
  
  // Remove modal
  if (activeModal.parentNode) {
    activeModal.parentNode.removeChild(activeModal);
  }
  activeModal = null;
  
  // Restore focus
  if (previousFocusElement) {
    try {
      previousFocusElement.focus();
    } catch (err) {
      // Ignore
    }
    previousFocusElement = null;
  }
}

/**
 * Check if a modal is currently open
 * @returns {boolean}
 */
export function isModalOpen() {
  return activeModal !== null;
}

/**
 * Escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
