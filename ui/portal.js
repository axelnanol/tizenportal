/**
 * TizenPortal Portal UI
 * 
 * Launcher grid with site cards.
 */

import { getCards, addCard, updateCard, deleteCard } from './cards.js';
import { showAddCardModal, showEditCardModal, setRefreshPortalFn } from './modal.js';
import { showAddSiteEditor, showEditSiteEditor } from './siteeditor.js';
import { getBundle } from '../bundles/registry.js';
import { applyPortalPreferences, showPreferences } from './preferences.js';

/**
 * Portal container element
 */
var portalElement = null;

/**
 * Grid container element
 */
var gridElement = null;

/**
 * Currently focused card index
 */
var focusedIndex = 0;

/**
 * Initialize the portal UI
 */
export function initPortal() {
  portalElement = document.getElementById('tp-portal');
  gridElement = document.getElementById('tp-grid');

  if (!portalElement || !gridElement) {
    console.error('TizenPortal: Portal elements not found');
    return;
  }

  // Set up modal refresh callback to avoid circular dependency
  setRefreshPortalFn(refreshPortal);

  // Apply portal preferences (theme, background)
  applyPortalPreferences();

  setupHeaderLogoShortcut();

  renderCards();
  focusCard(0);
}

function setupHeaderLogoShortcut() {
  var logo = document.getElementById('tp-header-logo');
  if (!logo) return;

  logo.addEventListener('click', function() {
    showPreferences();
  });

  logo.addEventListener('keydown', function(e) {
    if (e.keyCode === 13 || e.keyCode === 32) {
      e.preventDefault();
      e.stopPropagation();
      showPreferences();
    }
  });
}

/**
 * Render all cards in the grid
 */
function renderCards() {
  if (!gridElement) return;

  // Clear existing cards
  gridElement.innerHTML = '';

  // Get saved cards
  var cards = getCards();

  // Render each card
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var cardEl = createCardElement(card, i);
    gridElement.appendChild(cardEl);
  }

  // Add the "+" card
  var addCardEl = createAddCardElement(cards.length);
  gridElement.appendChild(addCardEl);
}

/**
 * Long press threshold in milliseconds
 */
var LONG_PRESS_MS = 500;

/**
 * Create a card element
 * @param {Object} card - Card data
 * @param {number} index - Card index
 * @returns {HTMLElement}
 */
function createCardElement(card, index) {
  var el = document.createElement('div');
  el.className = 'tp-card';
  el.setAttribute('tabindex', '0');
  el.setAttribute('data-card-id', card.id);
  el.setAttribute('data-index', index);
  // Note: Portal cards don't use data-tp-card because they have their own long-press handling

  // Icon
  var iconEl = document.createElement('div');
  iconEl.className = 'tp-card-icon';
  var fallbackIcon = window.TizenPortal && window.TizenPortal._portalFaviconUrl ? window.TizenPortal._portalFaviconUrl : '';
  var iconSrc = card.icon || fallbackFavicon;
  if (iconSrc) {
    var img = document.createElement('img');
    img.src = iconSrc;
    img.alt = card.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '8px';
    img.onerror = function() {
      this.style.display = 'none';
      iconEl.textContent = getInitial(card.name);
    };
    iconEl.appendChild(img);
  } else {
    iconEl.textContent = getInitial(card.name);
  }
  el.appendChild(iconEl);

  // Name
  var nameEl = document.createElement('div');
  nameEl.className = 'tp-card-name';
  nameEl.textContent = card.name || 'Untitled';
  el.appendChild(nameEl);

  // Bundle subtitle (optional)
  if (card.featureBundle) {
    var bundle = getBundle(card.featureBundle);
    var manifest = bundle && bundle.manifest;
    var bundleName = (manifest && manifest.displayName) ? manifest.displayName : card.featureBundle;
    var bundleEl = document.createElement('div');
    bundleEl.className = 'tp-card-subtitle';
    bundleEl.textContent = bundleName;
    el.appendChild(bundleEl);
  }

  // Long press detection for edit
  var pressStartTime = 0;
  var pressTimer = null;

  // Click handler (short press)
  el.addEventListener('click', function() {
    launchCard(card);
  });

  // Keyboard handler with long press detection
  el.addEventListener('keydown', function(event) {
    if (event.keyCode === 13 && !event.repeat) { // Enter - first press only
      event.preventDefault();
      pressStartTime = Date.now();
      pressTimer = setTimeout(function() {
        // Long press - show edit dialog
        console.log('TizenPortal: Long press - edit card');
        showEditSiteEditor(card, refreshPortal);
        pressTimer = null;
      }, LONG_PRESS_MS);
    }
  });

  el.addEventListener('keyup', function(event) {
    if (event.keyCode === 13) { // Enter released
      var pressDuration = Date.now() - pressStartTime;
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
        // Short press - launch
        if (pressDuration < LONG_PRESS_MS) {
          launchCard(card);
        }
      }
    }
  });

  // Focus tracking
  el.addEventListener('focus', function() {
    focusedIndex = index;
  });

  return el;
}

/**
 * Create the add card element
 * @param {number} index - Index for this element
 * @returns {HTMLElement}
 */
function createAddCardElement(index) {
  var el = document.createElement('div');
  el.className = 'tp-card tp-card-add';
  el.setAttribute('tabindex', '0');
  el.setAttribute('data-index', index);
  el.setAttribute('data-tp-card', 'single'); // Add card is single-action

  // Icon
  var iconEl = document.createElement('div');
  iconEl.className = 'tp-card-icon';
  iconEl.textContent = '+';
  el.appendChild(iconEl);

  // Name
  var nameEl = document.createElement('div');
  nameEl.className = 'tp-card-name';
  nameEl.textContent = 'Add Site';
  el.appendChild(nameEl);

  // Click handler
  el.addEventListener('click', function() {
    showAddCardDialog();
  });

  // Keyboard handler
  el.addEventListener('keydown', function(event) {
    if (event.keyCode === 13) { // Enter
      event.preventDefault();
      showAddCardDialog();
    }
  });

  // Focus tracking
  el.addEventListener('focus', function() {
    focusedIndex = index;
  });

  return el;
}

/**
 * Get first letter of name for icon fallback
 * @param {string} name
 * @returns {string}
 */
function getInitial(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

/**
 * Launch a card (load site)
 * @param {Object} card
 */
function launchCard(card) {
  console.log('TizenPortal: Launching card:', card.name, card.url);

  if (window.TizenPortal && window.TizenPortal.loadSite) {
    window.TizenPortal.loadSite(card);
  }
}

/**
 * Show add card dialog
 */
function showAddCardDialog() {
  console.log('TizenPortal: Add card dialog');
  showAddSiteEditor(refreshPortal);
}

/**
 * Focus a card by index
 * @param {number} index
 */
function focusCard(index) {
  var cards = gridElement.querySelectorAll('.tp-card');
  if (index >= 0 && index < cards.length) {
    cards[index].focus();
    focusedIndex = index;
  }
}

/**
 * Refresh the portal UI
 */
export function refreshPortal() {
  renderCards();
  focusCard(Math.min(focusedIndex, getCards().length)); // Focus add button if last card deleted
}

/**
 * Show the portal
 */
export function showPortal() {
  if (portalElement) {
    portalElement.style.display = 'flex';
    focusCard(focusedIndex);
  }
}

/**
 * Hide the portal
 */
export function hidePortal() {
  if (portalElement) {
    portalElement.style.display = 'none';
  }
}

/**
 * Get the currently focused card data
 * Returns null if the Add Site button is focused
 * @returns {Object|null}
 */
export function getFocusedCard() {
  var focusedElement = document.activeElement;
  if (!focusedElement) return null;
  
  // Check if it's the Add Site card
  if (focusedElement.classList.contains('tp-card-add')) {
    return null;
  }
  
  // Check if it's a card with a card ID
  var cardId = focusedElement.getAttribute('data-card-id');
  if (!cardId) return null;
  
  // Find the card in our stored cards
  var cards = getCards();
  for (var i = 0; i < cards.length; i++) {
    if (cards[i].id === cardId) {
      return cards[i];
    }
  }
  
  return null;
}
