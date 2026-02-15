/**
 * TizenPortal Card Storage
 * 
 * Card data model and localStorage persistence.
 */

import { escapeHtml, sanitizeUrl, safeLocalStorageSet, ensureProperties, getTypedValue } from '../core/utils.js';

/**
 * Storage key for cards
 */
var STORAGE_KEY = 'tp_apps';

/**
 * In-memory card cache
 */
var cardCache = null;

/**
 * Generate a simple UUID
 * @returns {string}
 */
function generateId() {
  var chars = '0123456789abcdef';
  var segments = [8, 4, 4, 4, 12];
  var result = [];

  for (var i = 0; i < segments.length; i++) {
    var segment = '';
    for (var j = 0; j < segments[i]; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result.push(segment);
  }

  return result.join('-');
}

function createDefaultUserscript(index) {
  return {
    id: generateId(),
    name: 'Custom Script ' + index,
    enabled: false,
    source: 'inline',
    url: '',
    inline: '',
    cached: '',
    lastFetched: 0,
  };
}

function normalizeUserscripts(userscripts) {
  var list = Array.isArray(userscripts) ? userscripts : [];
  var normalized = [];

  for (var i = 0; i < list.length; i++) {
    var entry = list[i] || {};
    normalized.push({
      id: entry.id || generateId(),
      name: entry.name || 'Custom Script ' + (i + 1),
      enabled: entry.enabled === true,
      source: entry.source === 'url' ? 'url' : 'inline',
      url: getTypedValue(entry.url, 'string', ''),
      inline: getTypedValue(entry.inline, 'string', ''),
      cached: getTypedValue(entry.cached, 'string', ''),
      lastFetched: getTypedValue(entry.lastFetched, 'number', 0),
    });
  }

  if (!normalized.length) {
    normalized.push(createDefaultUserscript(1));
  }

  return normalized;
}

function normalizeUserscriptsByBundle(map, fallbackScripts, bundleName) {
  var result = {};
  var source = map && typeof map === 'object' ? map : {};

  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      result[key] = normalizeUserscripts(source[key]);
    }
  }

  var scopeKey = bundleName || 'default';
  if (!result[scopeKey]) {
    result[scopeKey] = normalizeUserscripts(fallbackScripts || []);
  }

  return result;
}

/**
 * Load cards from localStorage
 * @returns {Array}
 */
function loadCards() {
  if (cardCache !== null) {
    return cardCache;
  }

  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cardCache = JSON.parse(stored);
      // Ensure array
      if (!Array.isArray(cardCache)) {
        cardCache = [];
      }
      
      // Migration: Ensure all cards have IDs and convert old 'bundle' field to 'featureBundle'
      var needsSave = false;
      for (var i = 0; i < cardCache.length; i++) {
        var card = cardCache[i];
        
        // Ensure card has an ID
        if (!card.id) {
          card.id = generateId();
          needsSave = true;
          console.log('TizenPortal: Generated ID for card:', card.name);
        }
        
        if (card.bundle && !card.featureBundle) {
          // Migrate old bundle field
          if (card.bundle === 'default') {
            // Default bundle is now global features, so no feature bundle
            card.featureBundle = null;
          } else {
            // Other bundles become feature bundles
            card.featureBundle = card.bundle;
          }
          delete card.bundle;
          needsSave = true;
        }
        
        // Ensure all card fields exist using helper function
        var cardFields = [
          'featureBundle', 'viewportMode', 'focusOutlineMode', 'userAgent',
          'tabindexInjection', 'scrollIntoView', 'safeArea', 'gpuHints',
          'cssReset', 'hideScrollbars', 'wrapTextInputs'
        ];
        if (ensureProperties(card, cardFields, null)) {
          needsSave = true;
        }

        if (!card.hasOwnProperty('userscripts') || !Array.isArray(card.userscripts)) {
          card.userscripts = normalizeUserscripts(card.userscripts);
          needsSave = true;
        } else {
          var normalizedScripts = normalizeUserscripts(card.userscripts);
          if (normalizedScripts.length !== card.userscripts.length) {
            card.userscripts = normalizedScripts;
            needsSave = true;
          }
        }

        var normalizedByBundle = normalizeUserscriptsByBundle(card.userscriptsByBundle, card.userscripts, card.featureBundle);
        if (!card.hasOwnProperty('userscriptsByBundle') || typeof card.userscriptsByBundle !== 'object' || card.userscriptsByBundle === null) {
          card.userscriptsByBundle = normalizedByBundle;
          needsSave = true;
        } else {
          try {
            var before = JSON.stringify(card.userscriptsByBundle);
            var after = JSON.stringify(normalizedByBundle);
            if (before !== after) {
              card.userscriptsByBundle = normalizedByBundle;
              needsSave = true;
            }
          } catch (e) {
            card.userscriptsByBundle = normalizedByBundle;
            needsSave = true;
          }
        }

        // Ensure bundle options storage exists
        if (!card.hasOwnProperty('bundleOptions') || typeof card.bundleOptions !== 'object' || card.bundleOptions === null) {
          card.bundleOptions = {};
          needsSave = true;
        }

        if (!card.hasOwnProperty('bundleOptionData') || typeof card.bundleOptionData !== 'object' || card.bundleOptionData === null) {
          card.bundleOptionData = {};
          needsSave = true;
        }

        if (!card.hasOwnProperty('userscriptToggles') || typeof card.userscriptToggles !== 'object' || card.userscriptToggles === null) {
          card.userscriptToggles = {};
          needsSave = true;
        }

        if (!card.hasOwnProperty('bundleUserscriptToggles') || typeof card.bundleUserscriptToggles !== 'object' || card.bundleUserscriptToggles === null) {
          card.bundleUserscriptToggles = {};
          needsSave = true;
        }

        // MIGRATION: Sync card.userscripts with the correct bundle's scripts
        // This fixes cross-bundle contamination where card.userscripts might contain
        // scripts from a different bundle that was edited in the site editor
        // NOTE: card.featureBundle is the bundle registry key, which equals bundle.name
        // used at runtime, ensuring consistent userscript isolation
        var bundleKey = card.featureBundle || 'default';
        var correctScripts = card.userscriptsByBundle && card.userscriptsByBundle[bundleKey] 
          ? card.userscriptsByBundle[bundleKey] 
          : [];
        
        // Lightweight comparison: check length first, then deep compare if needed
        var currentScripts = card.userscripts || [];
        var scriptsMatch = currentScripts.length === correctScripts.length;
        
        if (scriptsMatch && currentScripts.length > 0) {
          // Only do deep comparison if lengths match and array is non-empty
          try {
            scriptsMatch = JSON.stringify(currentScripts) === JSON.stringify(correctScripts);
          } catch (e) {
            scriptsMatch = false;
          }
        }
        
        if (!scriptsMatch) {
          // Use a normalized copy so card.userscripts is a working copy,
          // not a shared reference to userscriptsByBundle[bundleKey]
          card.userscripts = normalizeUserscripts(correctScripts || []);
          needsSave = true;
          console.log('TizenPortal: Migrated userscripts for card "' + card.name + '" to bundle: ' + bundleKey);
        }
      }
      
      if (needsSave) {
        console.log('TizenPortal: Migrated', cardCache.length, 'cards to new bundle format');
        saveCards();
      }
    } else {
      cardCache = [];
    }
  } catch (err) {
    console.error('TizenPortal: Failed to load cards:', err);
    cardCache = [];
  }

  return cardCache;
}

/**
 * Save cards to localStorage
 */
function saveCards() {
  if (cardCache === null) return;

  var result = safeLocalStorageSet(STORAGE_KEY, JSON.stringify(cardCache));
  if (!result.success) {
    if (result.error === 'quota') {
      console.error('TizenPortal: ' + result.message);
    } else {
      console.error('TizenPortal: Failed to save cards: ' + result.message);
    }
  }
}

/**
 * Get all cards
 * @returns {Array}
 */
export function getCards() {
  return loadCards().slice(); // Return copy
}

/**
 * Add a new card
 * @param {Object} cardData - Card data (name, url, featureBundle, userAgent, icon)
 * @returns {Object} The created card
 */
export function addCard(cardData) {
  var cards = loadCards();

  var card = {
    id: generateId(),
    name: cardData.name || 'Untitled',
    url: cardData.url || '',
    featureBundle: cardData.featureBundle || null,
    navigationMode: cardData.hasOwnProperty('navigationMode') ? cardData.navigationMode : null,
    viewportMode: cardData.hasOwnProperty('viewportMode') ? cardData.viewportMode : null,
    focusOutlineMode: cardData.hasOwnProperty('focusOutlineMode') ? cardData.focusOutlineMode : null,
    userAgent: cardData.hasOwnProperty('userAgent') ? cardData.userAgent : null,
    tabindexInjection: cardData.hasOwnProperty('tabindexInjection') ? cardData.tabindexInjection : null,
    scrollIntoView: cardData.hasOwnProperty('scrollIntoView') ? cardData.scrollIntoView : null,
    safeArea: cardData.hasOwnProperty('safeArea') ? cardData.safeArea : null,
    gpuHints: cardData.hasOwnProperty('gpuHints') ? cardData.gpuHints : null,
    cssReset: cardData.hasOwnProperty('cssReset') ? cardData.cssReset : null,
    hideScrollbars: cardData.hasOwnProperty('hideScrollbars') ? cardData.hideScrollbars : null,
    wrapTextInputs: cardData.hasOwnProperty('wrapTextInputs') ? cardData.wrapTextInputs : null,
    icon: cardData.icon || null,
    bundleOptions: cardData.bundleOptions || {},
    bundleOptionData: cardData.bundleOptionData || {},
    userscripts: normalizeUserscripts(cardData.userscripts || []),
    userscriptsByBundle: normalizeUserscriptsByBundle(cardData.userscriptsByBundle, cardData.userscripts, cardData.featureBundle),
    userscriptToggles: cardData.userscriptToggles || {},
    bundleUserscriptToggles: cardData.bundleUserscriptToggles || {},
    order: cards.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  cards.push(card);
  cardCache = cards;
  saveCards();

  return card;
}

/**
 * Update an existing card
 * @param {string} id - Card ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated card or null if not found
 */
export function updateCard(id, updates) {
  var cards = loadCards();

  for (var i = 0; i < cards.length; i++) {
    if (cards[i].id === id) {
      // Apply updates
      for (var key in updates) {
        if (updates.hasOwnProperty(key) && key !== 'id' && key !== 'createdAt') {
          cards[i][key] = updates[key];
        }
      }
      cards[i].updatedAt = Date.now();

      cardCache = cards;
      saveCards();
      return cards[i];
    }
  }

  return null;
}

/**
 * Delete a card
 * @param {string} id - Card ID
 * @returns {boolean} True if deleted
 */
export function deleteCard(id) {
  var cards = loadCards();
  var newCards = [];

  for (var i = 0; i < cards.length; i++) {
    if (cards[i].id !== id) {
      newCards.push(cards[i]);
    }
  }

  if (newCards.length < cards.length) {
    // Reorder remaining cards
    for (var j = 0; j < newCards.length; j++) {
      newCards[j].order = j;
    }

    cardCache = newCards;
    saveCards();
    return true;
  }

  return false;
}

/**
 * Get a card by ID
 * @param {string} id - Card ID
 * @returns {Object|null}
 */
export function getCardById(id) {
  var cards = loadCards();

  for (var i = 0; i < cards.length; i++) {
    if (cards[i].id === id) {
      return cards[i];
    }
  }

  return null;
}

/**
 * Reorder cards
 * @param {string[]} ids - Array of card IDs in new order
 */
export function reorderCards(ids) {
  var cards = loadCards();
  var newCards = [];

  for (var i = 0; i < ids.length; i++) {
    var card = getCardById(ids[i]);
    if (card) {
      card.order = i;
      newCards.push(card);
    }
  }

  // Add any cards not in ids list (shouldn't happen, but safety)
  for (var j = 0; j < cards.length; j++) {
    var found = false;
    for (var k = 0; k < ids.length; k++) {
      if (cards[j].id === ids[k]) {
        found = true;
        break;
      }
    }
    if (!found) {
      cards[j].order = newCards.length;
      newCards.push(cards[j]);
    }
  }

  cardCache = newCards;
  saveCards();
}

/**
 * Clear all cards (for testing/reset)
 */
export function clearCards() {
  cardCache = [];
  saveCards();
}
