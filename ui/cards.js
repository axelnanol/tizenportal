/**
 * TizenPortal Card Storage
 * 
 * Card data model and localStorage persistence.
 */

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
      
      // Migration: Convert old 'bundle' field to 'featureBundle'
      var needsSave = false;
      for (var i = 0; i < cardCache.length; i++) {
        var card = cardCache[i];
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
        // Ensure featureBundle field exists
        if (!card.hasOwnProperty('featureBundle')) {
          card.featureBundle = null;
          needsSave = true;
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

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cardCache));
  } catch (err) {
    console.error('TizenPortal: Failed to save cards:', err);
    if (err.name === 'QuotaExceededError') {
      console.warn('TizenPortal: Storage quota exceeded');
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
    userAgent: cardData.userAgent || 'tizen',
    icon: cardData.icon || null,
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
