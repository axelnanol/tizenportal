/**
 * TizenPortal Card Interaction Model
 * 
 * Manages the interaction behavior for single-action and multi-action cards.
 * 
 * Architecture:
 * - Navigation targets stable outer shells (the card container)
 * - Single-action cards: OK activates immediately, Back/Escape exits focus
 * - Multi-action cards: OK enters the card for inner navigation, Back/Escape exits
 * 
 * Detection:
 * - Single-action: Card has zero or one interactive child (or is itself the action)
 * - Multi-action: Card has multiple focusable children (buttons, links, etc.)
 */

/**
 * Focusable element selector
 */
var FOCUSABLE_SELECTOR = 'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

/**
 * Interactive element selector (elements that can be clicked/activated)
 */
var INTERACTIVE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"], [onclick]';

/**
 * State tracking for entered cards
 */
var enteredCard = null;

/**
 * Determine if an element is a single-action card
 * Single-action cards have zero or one interactive child element
 * @param {HTMLElement} card - The card element to check
 * @returns {boolean}
 */
export function isSingleActionCard(card) {
  if (!card) return false;
  
  // Count interactive children (excluding the card itself if it's interactive)
  var interactiveChildren = card.querySelectorAll(INTERACTIVE_SELECTOR);
  var count = 0;
  
  for (var i = 0; i < interactiveChildren.length; i++) {
    // Skip hidden elements
    var el = interactiveChildren[i];
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') {
      continue;
    }
    // Skip the card itself
    if (el === card) continue;
    count++;
  }
  
  // Single action if 0 or 1 interactive children
  return count <= 1;
}

/**
 * Determine if an element is a multi-action card
 * Multi-action cards have multiple interactive child elements
 * @param {HTMLElement} card - The card element to check
 * @returns {boolean}
 */
export function isMultiActionCard(card) {
  return !isSingleActionCard(card);
}

/**
 * Get the primary action element within a card
 * For single-action cards, this is the element to activate on OK press
 * @param {HTMLElement} card - The card element
 * @returns {HTMLElement|null}
 */
export function getPrimaryAction(card) {
  if (!card) return null;
  
  // If the card itself is a link or button, it's the primary action
  if (card.tagName === 'A' && card.hasAttribute('href')) return card;
  if (card.tagName === 'BUTTON') return card;
  if (card.hasAttribute('onclick')) return card;
  
  // Find the first interactive child
  var interactive = card.querySelectorAll(INTERACTIVE_SELECTOR);
  for (var i = 0; i < interactive.length; i++) {
    var el = interactive[i];
    if (el !== card && el.offsetParent !== null) {
      return el;
    }
  }
  
  return null;
}

/**
 * Get all focusable children within a card (for multi-action navigation)
 * @param {HTMLElement} card - The card element
 * @returns {HTMLElement[]}
 */
export function getFocusableChildren(card) {
  if (!card) return [];
  
  var focusables = card.querySelectorAll(FOCUSABLE_SELECTOR);
  var result = [];
  
  for (var i = 0; i < focusables.length; i++) {
    var el = focusables[i];
    // Skip the card itself
    if (el === card) continue;
    // Skip hidden elements
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') {
      continue;
    }
    result.push(el);
  }
  
  return result;
}

/**
 * Enter a multi-action card for inner navigation
 * @param {HTMLElement} card - The card element to enter
 * @returns {boolean} True if entry was successful
 */
export function enterCard(card) {
  if (!card) return false;
  
  var focusables = getFocusableChildren(card);
  if (focusables.length === 0) {
    // No inner focusables, treat as single-action
    return false;
  }
  
  enteredCard = card;
  card.classList.add('tp-card-entered');
  
  // Focus the first focusable child
  focusables[0].focus();
  
  console.log('TizenPortal [CardInteraction]: Entered card with', focusables.length, 'focusable children');
  return true;
}

/**
 * Exit the currently entered card
 * @returns {HTMLElement|null} The card that was exited, or null if not in a card
 */
export function exitCard() {
  if (!enteredCard) return null;
  
  var card = enteredCard;
  enteredCard = null;
  card.classList.remove('tp-card-entered');
  
  // Return focus to the card shell
  card.focus();
  
  console.log('TizenPortal [CardInteraction]: Exited card');
  return card;
}

/**
 * Check if currently inside a multi-action card
 * @returns {boolean}
 */
export function isInsideCard() {
  return enteredCard !== null;
}

/**
 * Get the currently entered card
 * @returns {HTMLElement|null}
 */
export function getEnteredCard() {
  return enteredCard;
}

/**
 * Handle OK/Enter key press on a card
 * @param {HTMLElement} card - The focused card element
 * @returns {boolean} True if handled
 */
export function handleOK(card) {
  if (!card) return false;
  
  // If already inside a card, let normal interaction proceed
  if (enteredCard && enteredCard.contains(document.activeElement)) {
    return false;
  }
  
  // Check if single or multi-action
  if (isSingleActionCard(card)) {
    // Activate the primary action
    var action = getPrimaryAction(card);
    if (action) {
      action.click();
      console.log('TizenPortal [CardInteraction]: Activated single-action card');
      return true;
    }
    // If no primary action but card is clickable
    if (card.hasAttribute('onclick') || card.tagName === 'A' || card.tagName === 'BUTTON') {
      card.click();
      return true;
    }
    return false;
  } else {
    // Multi-action: enter the card
    return enterCard(card);
  }
}

/**
 * Handle Back/Escape key press
 * @returns {boolean} True if handled (exited a card)
 */
export function handleBack() {
  if (enteredCard) {
    exitCard();
    return true;
  }
  return false;
}

/**
 * Check if an element is a navigable card shell
 * Cards are marked with data-tp-card or have specific class patterns
 * @param {HTMLElement} el - Element to check
 * @returns {boolean}
 */
export function isCardShell(el) {
  if (!el) return false;
  
  // Explicit marker
  if (el.hasAttribute('data-tp-card')) return true;
  
  // Common card patterns
  if (el.id && el.id.match(/^(book-card-|series-card-|media-card-)/)) return true;
  if (el.classList.contains('tp-card')) return true;
  
  return false;
}

/**
 * Find the nearest card shell ancestor
 * @param {HTMLElement} el - Starting element
 * @returns {HTMLElement|null}
 */
export function findCardShell(el) {
  while (el && el !== document.body) {
    if (isCardShell(el)) return el;
    el = el.parentElement;
  }
  return null;
}
