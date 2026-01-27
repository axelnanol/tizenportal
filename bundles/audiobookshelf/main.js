/**
 * Audiobookshelf Bundle for TizenPortal
 * 
 * TV support for Audiobookshelf (https://www.audiobookshelf.org/)
 * 
 * ============================================================================
 * BUNDLE BEST PRACTICES DEMONSTRATED
 * ============================================================================
 * 
 * This bundle is an exemplary example of how to create a TizenPortal bundle
 * for a complex SPA website. It demonstrates:
 * 
 * 1. USE CORE UTILITIES
 *    Import from focus/manager.js and input/text-input.js instead of
 *    reimplementing common TV patterns.
 * 
 * 2. OVERRIDE VIA registerKeyHandler()
 *    Register a custom key handler that runs BEFORE core handlers.
 *    Return true to consume the event, false to let core handle it.
 * 
 * 3. SITE-SPECIFIC SELECTORS
 *    Define CSS selectors for the target site's DOM structure in one place.
 *    Update these when the site changes its HTML.
 * 
 * 4. CARD MARKING
 *    Mark focusable elements with data-tp-card="single" or "multi" so core
 *    knows how to handle Enter/Escape on those elements.
 * 
 * 5. LIFECYCLE HOOKS
 *    Use onActivate/onDeactivate for setup/cleanup. Always clean up listeners!
 * 
 * 6. CONFIGURATION OBJECTS
 *    Define site-specific options (scroll margins, focus targets) as objects
 *    that are passed to core utilities.
 * 
 * ============================================================================
 */

import absStyles from './style.css';

// ============================================================================
// CORE IMPORTS - Use these instead of reimplementing!
// ============================================================================

// Focus utilities: scroll-into-view, initial focus, viewport, DOM observation
import { 
  enableScrollIntoView,
  disableScrollIntoView,
  setInitialFocus,
  lockViewport,
  observeDOM,
  stopObservingDOM,
} from '../../focus/manager.js';

// Text input wrapping for TV-friendly keyboard handling
import {
  wrapTextInputs,
} from '../../input/text-input.js';

// NOTE: registerKeyHandler is accessed via window.TizenPortal.input.registerKeyHandler
// to avoid circular dependency (handler.js -> bundlemenu.js -> registry.js -> this file)

// Key constants
import { KEYS } from '../../input/keys.js';

// Card interaction utilities
import { 
  isInsideCard, 
  exitCard,
} from '../../navigation/card-interaction.js';

// Geometry utilities for spatial navigation spacing
import { 
  injectSpacingCSS, 
  SPACING_CLASS,
  validateSpacing,
  logViolations,
} from '../../navigation/geometry.js';

// ============================================================================
// ABS-SPECIFIC CONFIGURATION
// ============================================================================

/**
 * CSS Selectors for Audiobookshelf's DOM structure
 * 
 * These selectors match ABS's Vue/Nuxt-generated HTML.
 * Update these when ABS changes its HTML structure.
 * 
 * Reference: https://github.com/advplyr/audiobookshelf/tree/main/client
 */
var SELECTORS = {
  // ==========================================================================
  // LAYOUT CONTAINERS
  // ==========================================================================
  appbar: '#appbar',
  siderail: '[role="toolbar"][aria-orientation="vertical"]',
  siderailNav: '#siderail-buttons-container a',
  bookshelfRow: '.bookshelfRow, .categorizedBookshelfRow',
  pageWrapper: '#page-wrapper, .page',
  
  // ==========================================================================
  // CARDS - Different types have different aspect ratios
  // ==========================================================================
  // Book cards: 1:1 aspect ratio (square)
  bookCards: '[id^="book-card-"]',
  
  // Series cards: 2:1 aspect ratio (wider, shows multiple book covers)
  seriesCards: '[id^="series-card-"]',
  
  // Collection cards: 2:1 aspect ratio (similar to series)
  collectionCards: '[id^="collection-card-"]',
  
  // Author cards: different layout with photo + name
  authorCards: '.author-card, [id^="author-card-"]',
  
  // Playlist cards
  playlistCards: '[id^="playlist-card-"]',
  
  // All cards combined (for marking as focusable)
  allCards: '[id^="book-card-"], [id^="series-card-"], [id^="collection-card-"], [id^="playlist-card-"], .author-card',
  
  // ==========================================================================
  // LOGIN PAGE (/login)
  // ==========================================================================
  loginForm: 'form[action*="login"], form',
  loginUsername: 'input[name="username"], input[placeholder*="username" i]',
  loginPassword: 'input[type="password"]',
  loginSubmit: 'button[type="submit"], ui-btn[type="submit"]',
  loginOpenID: 'a[href*="/auth/openid"]',
  
  // ==========================================================================
  // BOOK/ITEM DETAIL PAGE (/item/_id)
  // ==========================================================================
  itemDetailPage: '.page:has([id*="item-"])',
  itemCover: '.covers-book-cover, [class*="book-cover"]',
  itemTitle: 'h1',
  itemPlayButton: 'button:has(.material-symbols):has(:not([disabled]))',
  itemEditButton: 'button[aria-label*="Edit"]',
  itemDetails: '.grow.px-2, [class*="item-details"]',
  itemTabs: '[role="tablist"]',
  itemTabPanels: '[role="tabpanel"]',
  
  // ==========================================================================
  // PLAYER (bottom bar when playing)
  // ==========================================================================
  playerContainer: '#mediaPlayerContainer',
  playerCover: '#mediaPlayerContainer .covers-book-cover',
  playerTitle: '#mediaPlayerContainer a[href^="/item/"]',
  playerPlayPause: '#mediaPlayerContainer button:has(.material-symbols):has(span:contains("play")), #mediaPlayerContainer button:has(.material-symbols):has(span:contains("pause"))',
  playerSeekBack: '#mediaPlayerContainer button:has(span[class*="replay"])',
  playerSeekForward: '#mediaPlayerContainer button:has(span[class*="forward"])',
  playerClose: '#mediaPlayerContainer button:has(span:contains("close"))',
  playerProgress: '#mediaPlayerContainer [class*="progress"], .player-progress-bar',
  playerChapters: '#mediaPlayerContainer [class*="chapter"]',
  
  // ==========================================================================
  // APPBAR (top navigation)
  // ==========================================================================
  appbarButtons: '#appbar button, #appbar a[href]',
  appbarSearch: '#appbar input[type="search"], #appbar input[placeholder*="Search"]',
  appbarLibrarySelect: '#appbar [class*="library-select"], #appbar button:has(.material-symbols)',
  appbarUserMenu: '#appbar [class*="user-menu"], #appbar button:has(img[class*="avatar"])',
  
  // ==========================================================================
  // MODALS & DIALOGS
  // ==========================================================================
  modal: '.modal, [role="dialog"]',
  modalClose: '.modal button[aria-label*="Close"], [role="dialog"] button:has(span:contains("close"))',
  modalButtons: '.modal button, [role="dialog"] button',
  
  // ==========================================================================
  // DROPDOWN MENUS
  // ==========================================================================
  menuItems: '[role="menuitem"]',
  dropdown: '.dropdown-menu, [role="menu"]',
  dropdownItem: '.dropdown-item, [role="menuitem"]',
  
  // ==========================================================================
  // CONFIG/SETTINGS PAGES
  // ==========================================================================
  configSideNav: '.app-config-side-nav, [class*="config-side-nav"]',
  configContent: '.configContent',
  settingsForm: 'form',
  settingsInput: 'input, select, textarea',
  settingsButton: 'button[type="submit"], .ui-btn',
  
  // ==========================================================================
  // TEXT INPUTS TO WRAP (TV keyboard handling)
  // ==========================================================================
  textInputs: 'input[type="text"], input[type="search"], input[type="password"], input:not([type]), textarea',
};

/**
 * Initial focus targets by page type (tried in order)
 * 
 * These selectors are passed to setInitialFocus() from core.
 * The first matching element gets focus on page load.
 */
var INITIAL_FOCUS_SELECTORS = {
  // Default (library/home page)
  default: [
    '#siderail-buttons-container a.nuxt-link-active',  // Active nav link
    '#siderail-buttons-container a',                    // First nav link
    '[id^="book-card-"]',                               // First book card
    '[id^="series-card-"]',                             // First series card
    'input[placeholder*="Search"]',                     // Search input
  ],
  
  // Login page
  login: [
    'input[name="username"]',                           // Username field
    'input[placeholder*="username" i]',                 // Username field alt
    'a[href*="/auth/openid"]',                          // OpenID login button
    'button[type="submit"]',                            // Submit button
  ],
  
  // Item detail page
  item: [
    'button:has(.material-symbols):has(span)',          // Play button
    'h1',                                               // Title (for reading)
    '.covers-book-cover',                               // Cover image
  ],
  
  // Config/Settings pages
  config: [
    '.app-config-side-nav a.nuxt-link-active',          // Active config link
    '.app-config-side-nav a',                           // First config link
    'form input:first-of-type',                         // First form input
  ],
};

/**
 * Get initial focus selectors for current page
 * @returns {string[]}
 */
function getInitialFocusSelectors() {
  var path = window.location.pathname || '';
  
  if (path.indexOf('/login') !== -1) {
    return INITIAL_FOCUS_SELECTORS.login;
  }
  if (path.indexOf('/item/') !== -1) {
    return INITIAL_FOCUS_SELECTORS.item;
  }
  if (path.indexOf('/config') !== -1) {
    return INITIAL_FOCUS_SELECTORS.config;
  }
  
  return INITIAL_FOCUS_SELECTORS.default;
}

/**
 * Scroll-into-view configuration for ABS layout
 * 
 * These options are passed to enableScrollIntoView() from core.
 * Customize for ABS's specific layout (appbar height, siderail width).
 */
var SCROLL_OPTIONS = {
  topOffset: 64,        // ABS appbar height in pixels
  leftOffset: 80,       // ABS siderail width in pixels  
  marginTop: 100,       // Start scrolling when element is within 100px of top
  marginBottom: 200,    // Start scrolling when element is within 200px of bottom
  marginLeft: 100,
  marginRight: 100,
  scrollContainer: '.bookshelfRow, .categorizedBookshelfRow', // Horizontal scroll containers
};

// ============================================================================
// BUNDLE STATE
// ============================================================================

/** Track if bundle has been activated */
var isActivated = false;

/** Unregister function for custom key handler */
var unregisterKeyHandler = null;

/** Stop function for DOM observer */
var stopObserver = null;

// ============================================================================
// BUNDLE EXPORT
// ============================================================================

export default {
  name: 'audiobookshelf',
  displayName: 'Audiobookshelf',
  description: 'TV support for Audiobookshelf audiobook server',
  
  /**
   * CSS to inject (imported from style.css)
   */
  style: absStyles,

  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================

  /**
   * Called when bundle is activated
   * 
   * This is where we set up all TV adaptations using core utilities
   * plus any ABS-specific customizations.
   */
  onActivate: function() {
    if (isActivated) {
      console.log('TizenPortal [ABS]: Already activated');
      return;
    }
    
    console.log('TizenPortal [ABS]: Activating');
    isActivated = true;
    
    // CORE: Lock viewport for TV (disables pinch zoom, etc.)
    lockViewport();
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.onDOMReady.bind(this));
    } else {
      this.onDOMReady();
    }
  },

  /**
   * Called when DOM is ready
   */
  onDOMReady: function() {
    console.log('TizenPortal [ABS]: DOM ready');
    var self = this;
    
    // CORE: Inject geometry spacing CSS for spatial navigation
    injectSpacingCSS();
    
    // ABS-SPECIFIC: Set up focusable elements and card markers
    this.setupFocusables();
    
    // ABS-SPECIFIC: Apply spacing classes to containers
    this.applySpacingClasses();
    
    // CORE: Wrap text inputs for TV keyboard handling
    // Uses the core utility with ABS-specific selector
    wrapTextInputs(SELECTORS.textInputs);
    
    // CORE: Enable scroll-into-view with ABS-specific layout options
    enableScrollIntoView(SCROLL_OPTIONS);
    
    // CORE: Observe DOM for dynamic Vue/Nuxt content changes
    stopObserver = observeDOM(function() {
      // Re-run setup when DOM changes (new cards loaded, etc.)
      self.setupFocusables();
      self.applySpacingClasses();
      wrapTextInputs(SELECTORS.textInputs);
    }, { debounceMs: 250 });
    
    // OVERRIDE: Register custom key handler for ABS-specific behavior
    // This runs BEFORE core handlers - return true to consume the event
    // NOTE: Accessed via global API to avoid circular dependency
    if (window.TizenPortal && window.TizenPortal.input && window.TizenPortal.input.registerKeyHandler) {
      unregisterKeyHandler = window.TizenPortal.input.registerKeyHandler(this.handleKeyDown.bind(this));
    } else {
      console.warn('TizenPortal [ABS]: registerKeyHandler not available');
    }
    
    // CORE: Set initial focus after Vue finishes rendering
    setInitialFocus(getInitialFocusSelectors(), 500);
    
    // Debug: Validate spacing in debug mode
    if (window.TizenPortal && window.TizenPortal.debug) {
      this.validateAllSpacing();
    }
  },

  /**
   * Called when bundle is deactivated
   * 
   * IMPORTANT: Always clean up listeners and state!
   */
  onDeactivate: function() {
    console.log('TizenPortal [ABS]: Deactivating');
    isActivated = false;
    
    // Clean up custom key handler
    if (unregisterKeyHandler) {
      unregisterKeyHandler();
      unregisterKeyHandler = null;
    }
    
    // Clean up DOM observer
    if (stopObserver) {
      stopObserver();
      stopObserver = null;
    }
    
    // Clean up scroll-into-view listener
    disableScrollIntoView();
    
    // Exit any entered card
    if (isInsideCard()) {
      exitCard();
    }
  },
  
  // ==========================================================================
  // KEY HANDLING OVERRIDE
  // ==========================================================================
  
  /**
   * Custom key handler - OVERRIDES core behavior when returning true
   * 
   * This function is registered with registerKeyHandler() and runs BEFORE
   * any core handlers. Return true to consume the event (core won't see it),
   * return false to let core handle it normally.
   * 
   * Use this for:
   * - Media keys for the ABS player
   * - Custom navigation for ABS-specific UI patterns (siderail, player)
   * - Intercepting keys that core handles "wrong" for ABS
   * 
   * @param {KeyboardEvent} event
   * @returns {boolean} True if event was consumed (core won't handle)
   */
  handleKeyDown: function(event) {
    var keyCode = event.keyCode;
    var active = document.activeElement;
    
    // ========================================================================
    // SIDERAIL: Vertical-only navigation
    // ========================================================================
    // The siderail is a vertical list of navigation links.
    // Left/Right should exit siderail, not move within it.
    
    if (this.isInSiderail(active)) {
      // LEFT: Exit siderail, focus first card on bookshelf
      if (keyCode === KEYS.LEFT) {
        // Jump LEFT from siderail doesn't make sense - siderail is on the left
        // So we do nothing (don't let spatial nav try to go further left)
        return true; // Consume - nowhere to go left
      }
      
      // RIGHT: Exit siderail to bookshelf
      if (keyCode === KEYS.RIGHT) {
        var firstCard = document.querySelector(SELECTORS.allCards);
        if (firstCard) {
          firstCard.focus();
          return true; // Consumed
        }
        // Fall through to let spatial nav handle it
      }
      
      // UP/DOWN: Let spatial nav handle vertical movement within siderail
      // But restrict it to only siderail elements
      if (keyCode === KEYS.UP || keyCode === KEYS.DOWN) {
        var links = document.querySelectorAll(SELECTORS.siderailNav);
        if (links.length > 0) {
          var currentIndex = -1;
          for (var i = 0; i < links.length; i++) {
            if (links[i] === active) {
              currentIndex = i;
              break;
            }
          }
          
          if (currentIndex !== -1) {
            var nextIndex;
            if (keyCode === KEYS.UP) {
              nextIndex = Math.max(0, currentIndex - 1);
            } else {
              nextIndex = Math.min(links.length - 1, currentIndex + 1);
            }
            
            if (nextIndex !== currentIndex) {
              links[nextIndex].focus();
            }
            return true; // Consumed - handled vertical navigation ourselves
          }
        }
      }
    }
    
    // ========================================================================
    // BOOKSHELF: LEFT goes to siderail
    // ========================================================================
    if (this.isOnBookshelf() && keyCode === KEYS.LEFT) {
      // Check if we're at the leftmost card in a row
      var currentCard = active.closest(SELECTORS.allCards);
      if (currentCard) {
        var row = currentCard.closest(SELECTORS.bookshelfRow);
        if (row) {
          var cards = row.querySelectorAll(SELECTORS.allCards);
          if (cards.length > 0 && cards[0] === currentCard) {
            // We're at the leftmost card - jump to siderail
            this.focusSiderail();
            return true; // Consumed
          }
        }
      }
    }
    
    // ========================================================================
    // PLAYER CONTROLS: Horizontal-only navigation
    // ========================================================================
    if (this.isInPlayer(active)) {
      // UP/DOWN should exit player, not move within it
      if (keyCode === KEYS.UP) {
        // Focus something above the player (bookshelf or siderail)
        var above = document.querySelector(SELECTORS.allCards + ', ' + SELECTORS.siderailNav);
        if (above) {
          above.focus();
          return true;
        }
      }
      if (keyCode === KEYS.DOWN) {
        // Player is at bottom - nowhere to go
        return true; // Consume
      }
      
      // Media keys for player (future implementation)
      // if (keyCode === KEYS.PLAY_PAUSE) {
      //   this.togglePlayback();
      //   return true;
      // }
    }
    
    // ========================================================================
    // MODAL: Trap focus within modal
    // ========================================================================
    var modal = document.querySelector(SELECTORS.modal + ':not([style*="display: none"])');
    if (modal && modal.offsetParent !== null && modal.contains(active)) {
      // Focus is inside a visible modal - let core handle navigation within it
      // but don't let focus escape
    }
    
    // Return false to let core handle the key
    return false;
  },
  
  // ==========================================================================
  // ABS-SPECIFIC DOM SETUP
  // ==========================================================================
  
  /**
   * Set up focusable elements and mark cards
   * 
   * This is ABS-specific because it knows:
   * - Which elements should be focusable
   * - Which elements are "cards" (for Enter/Escape handling)
   * - Whether cards are single-action or multi-action
   * - Which containers should have restricted navigation
   */
  setupFocusables: function() {
    var count = 0;
    
    try {
      // ========================================================================
      // SIDERAIL - Vertical navigation (up/down only)
      // ========================================================================
      var siderail = document.querySelector(SELECTORS.siderail);
      if (siderail && !siderail.hasAttribute('data-tp-nav')) {
        // Mark siderail for vertical-only navigation
        siderail.setAttribute('data-tp-nav', 'vertical');
      }
      
      var siderailLinks = document.querySelectorAll(SELECTORS.siderailNav);
      for (var i = 0; i < siderailLinks.length; i++) {
        var el = siderailLinks[i];
        if (el.getAttribute('tabindex') !== '0') {
          el.setAttribute('tabindex', '0');
          count++;
        }
        // Mark as single-action card (clicking navigates)
        el.setAttribute('data-tp-card', 'single');
      }
      
      // ========================================================================
      // BOOK CARDS - Multi-action (Enter enters card for play/edit/more buttons)
      // ========================================================================
      // Book cards have hover buttons that appear on mouse hover.
      // For TV: Enter "enters" the card, then navigate to buttons, Enter activates.
      var bookCards = document.querySelectorAll(SELECTORS.bookCards);
      for (var j = 0; j < bookCards.length; j++) {
        var card = bookCards[j];
        if (card.getAttribute('tabindex') !== '0') {
          card.setAttribute('tabindex', '0');
          count++;
        }
        // MULTI-ACTION: Enter enters the card to access hover buttons
        if (!card.hasAttribute('data-tp-card')) {
          card.setAttribute('data-tp-card', 'multi');
        }
      }
      
      // ========================================================================
      // SERIES CARDS - Focus on TITLE PLACARD, not the card itself
      // ========================================================================
      // Series cards display multiple book covers which is confusing for nav.
      // Instead, make the title placard underneath focusable.
      var seriesCards = document.querySelectorAll(SELECTORS.seriesCards);
      for (var s = 0; s < seriesCards.length; s++) {
        var sCard = seriesCards[s];
        // Remove tabindex from the card itself - we don't want it focusable
        sCard.setAttribute('tabindex', '-1');
        sCard.removeAttribute('data-tp-card');
        
        // Find the title placard (standard or detail view)
        var titlePlacard = sCard.querySelector('.categoryPlacard') || 
                          sCard.querySelector('[cy-id="detailBottomText"]') ||
                          sCard.querySelector('[cy-id="standardBottomText"]');
        if (titlePlacard) {
          if (titlePlacard.getAttribute('tabindex') !== '0') {
            titlePlacard.setAttribute('tabindex', '0');
            count++;
          }
          // Single-action: clicking title navigates to series
          titlePlacard.setAttribute('data-tp-card', 'single');
          // Store reference to parent card for click handling
          titlePlacard.setAttribute('data-tp-series-card', sCard.id);
          
          // Add click handler to navigate when Enter pressed on title
          if (!titlePlacard.hasAttribute('data-tp-click-setup')) {
            titlePlacard.setAttribute('data-tp-click-setup', 'true');
            titlePlacard.addEventListener('click', function() {
              var cardId = this.getAttribute('data-tp-series-card');
              var parentCard = document.getElementById(cardId);
              if (parentCard) {
                parentCard.click();
              }
            });
          }
        }
      }
      
      // ========================================================================
      // COLLECTION CARDS - Focus on title, similar to series
      // ========================================================================
      var collectionCards = document.querySelectorAll(SELECTORS.collectionCards);
      for (var c = 0; c < collectionCards.length; c++) {
        var cCard = collectionCards[c];
        // Remove tabindex from card itself
        cCard.setAttribute('tabindex', '-1');
        cCard.removeAttribute('data-tp-card');
        
        // Find title element
        var collectionTitle = cCard.querySelector('.categoryPlacard') ||
                              cCard.querySelector('p.truncate');
        if (collectionTitle) {
          if (collectionTitle.getAttribute('tabindex') !== '0') {
            collectionTitle.setAttribute('tabindex', '0');
            count++;
          }
          collectionTitle.setAttribute('data-tp-card', 'single');
          collectionTitle.setAttribute('data-tp-collection-card', cCard.id);
          
          if (!collectionTitle.hasAttribute('data-tp-click-setup')) {
            collectionTitle.setAttribute('data-tp-click-setup', 'true');
            collectionTitle.addEventListener('click', function() {
              var cardId = this.getAttribute('data-tp-collection-card');
              var parentCard = document.getElementById(cardId);
              if (parentCard) {
                parentCard.click();
              }
            });
          }
        }
      }
      
      // ========================================================================
      // PLAYLIST CARDS - Single-action
      // ========================================================================
      var playlistCards = document.querySelectorAll(SELECTORS.playlistCards);
      for (var p = 0; p < playlistCards.length; p++) {
        var pCard = playlistCards[p];
        if (pCard.getAttribute('tabindex') !== '0') {
          pCard.setAttribute('tabindex', '0');
          count++;
        }
        if (!pCard.hasAttribute('data-tp-card')) {
          pCard.setAttribute('data-tp-card', 'single');
        }
      }
      
      // ========================================================================
      // AUTHOR CARDS - Focus on the card (has name and image)
      // ========================================================================
      var authorCards = document.querySelectorAll(SELECTORS.authorCards);
      for (var a = 0; a < authorCards.length; a++) {
        var aCard = authorCards[a];
        if (aCard.getAttribute('tabindex') !== '0') {
          aCard.setAttribute('tabindex', '0');
          count++;
        }
        // Single-action: clicking navigates to author page
        if (!aCard.hasAttribute('data-tp-card')) {
          aCard.setAttribute('data-tp-card', 'single');
        }
      }
      
      // ========================================================================
      // GENERIC FOCUSABLE ELEMENTS (links, buttons in content area)
      // ========================================================================
      // This catches elements on author pages, narrator pages, settings, etc.
      var pageWrapper = document.querySelector(SELECTORS.pageWrapper);
      if (pageWrapper) {
        // Links in content
        var links = pageWrapper.querySelectorAll('a[href]:not([tabindex])');
        for (var l = 0; l < links.length; l++) {
          var link = links[l];
          // Skip if inside a component we've already handled
          if (!link.closest(SELECTORS.siderail) && 
              !link.closest('#appbar') &&
              link.offsetParent !== null) {
            link.setAttribute('tabindex', '0');
            count++;
          }
        }
        
        // Buttons in content
        var buttons = pageWrapper.querySelectorAll('button:not([tabindex])');
        for (var b = 0; b < buttons.length; b++) {
          var btn = buttons[b];
          if (!btn.closest(SELECTORS.siderail) && 
              !btn.closest('#appbar') &&
              !btn.disabled &&
              btn.offsetParent !== null) {
            btn.setAttribute('tabindex', '0');
            count++;
          }
        }
        
        // Table rows that might be clickable (narrators table, etc.)
        var tableRows = pageWrapper.querySelectorAll('tr[class*="cursor-pointer"], tr.hover\\:bg-');
        for (var tr = 0; tr < tableRows.length; tr++) {
          var row = tableRows[tr];
          if (row.getAttribute('tabindex') !== '0') {
            row.setAttribute('tabindex', '0');
            row.setAttribute('data-tp-card', 'single');
            count++;
          }
        }
      }
      
      // ========================================================================
      // APPBAR - Search and buttons
      // ========================================================================
      var appbarEls = document.querySelectorAll(SELECTORS.appbarButtons);
      for (var k = 0; k < appbarEls.length; k++) {
        var appEl = appbarEls[k];
        if (appEl.getAttribute('tabindex') !== '0' && 
            !appEl.closest('[style*="display: none"]') &&
            appEl.getAttribute('aria-hidden') !== 'true') {
          appEl.setAttribute('tabindex', '0');
          count++;
        }
      }
      
      // ========================================================================
      // DROPDOWN MENU ITEMS
      // ========================================================================
      var menuItems = document.querySelectorAll(SELECTORS.menuItems);
      for (var m = 0; m < menuItems.length; m++) {
        var menuEl = menuItems[m];
        if (menuEl.getAttribute('tabindex') !== '0') {
          menuEl.setAttribute('tabindex', '0');
          count++;
        }
      }
      
      // ========================================================================
      // PLAYER CONTROLS (when player is visible)
      // ========================================================================
      var playerContainer = document.querySelector(SELECTORS.playerContainer);
      if (playerContainer) {
        // Mark player for horizontal navigation
        if (!playerContainer.hasAttribute('data-tp-nav')) {
          playerContainer.setAttribute('data-tp-nav', 'horizontal');
        }
        
        var playerButtons = playerContainer.querySelectorAll('button');
        for (var pb = 0; pb < playerButtons.length; pb++) {
          var pBtn = playerButtons[pb];
          if (pBtn.getAttribute('tabindex') !== '0' &&
              !pBtn.disabled &&
              pBtn.getAttribute('aria-hidden') !== 'true') {
            pBtn.setAttribute('tabindex', '0');
            count++;
          }
        }
      }
      
      // ========================================================================
      // LOGIN PAGE (special handling)
      // ========================================================================
      if (window.location.pathname.indexOf('/login') !== -1) {
        // Login form inputs
        var loginInputs = document.querySelectorAll(SELECTORS.loginUsername + ', ' + SELECTORS.loginPassword);
        for (var li = 0; li < loginInputs.length; li++) {
          var input = loginInputs[li];
          if (input.getAttribute('tabindex') !== '0') {
            input.setAttribute('tabindex', '0');
            count++;
          }
        }
        
        // Login submit button
        var submitBtns = document.querySelectorAll(SELECTORS.loginSubmit);
        for (var sb = 0; sb < submitBtns.length; sb++) {
          if (submitBtns[sb].getAttribute('tabindex') !== '0') {
            submitBtns[sb].setAttribute('tabindex', '0');
            count++;
          }
        }
        
        // OpenID login link
        var openIdLinks = document.querySelectorAll(SELECTORS.loginOpenID);
        for (var oi = 0; oi < openIdLinks.length; oi++) {
          if (openIdLinks[oi].getAttribute('tabindex') !== '0') {
            openIdLinks[oi].setAttribute('tabindex', '0');
            count++;
          }
        }
      }
      
      // ========================================================================
      // MODALS (when visible)
      // ========================================================================
      var modals = document.querySelectorAll(SELECTORS.modal);
      for (var md = 0; md < modals.length; md++) {
        var modal = modals[md];
        if (modal.offsetParent !== null) { // Modal is visible
          var modalBtns = modal.querySelectorAll('button, a, input, select');
          for (var mb = 0; mb < modalBtns.length; mb++) {
            if (modalBtns[mb].getAttribute('tabindex') !== '0') {
              modalBtns[mb].setAttribute('tabindex', '0');
              count++;
            }
          }
        }
      }
      
      if (count > 0) {
        console.log('TizenPortal [ABS]: Made', count, 'elements focusable');
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error setting up focusables:', err.message);
    }
  },
  
  /**
   * Apply spacing classes to containers for spatial navigation
   * 
   * The SPACING_CLASS ensures minimum gaps between focusable elements
   * so spatial navigation doesn't get confused by overlapping hitboxes.
   */
  applySpacingClasses: function() {
    var count = 0;
    
    try {
      // Bookshelf rows (horizontal scroll containers)
      var rows = document.querySelectorAll(SELECTORS.bookshelfRow);
      for (var i = 0; i < rows.length; i++) {
        if (!rows[i].classList.contains(SPACING_CLASS)) {
          rows[i].classList.add(SPACING_CLASS);
          count++;
        }
      }
      
      // Siderail navigation container
      var siderail = document.querySelector('#siderail-buttons-container');
      if (siderail && !siderail.classList.contains(SPACING_CLASS)) {
        siderail.classList.add(SPACING_CLASS);
        count++;
      }
      
      // Top appbar
      var appbar = document.querySelector(SELECTORS.appbar);
      if (appbar && !appbar.classList.contains(SPACING_CLASS)) {
        appbar.classList.add(SPACING_CLASS);
        count++;
      }
      
      if (count > 0) {
        console.log('TizenPortal [ABS]: Applied spacing class to', count, 'containers');
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error applying spacing classes:', err.message);
    }
  },
  
  /**
   * Validate spacing in debug mode
   * 
   * Logs warnings if focusable elements are too close together,
   * which can cause spatial navigation to misbehave.
   */
  validateAllSpacing: function() {
    var rows = document.querySelectorAll(SELECTORS.bookshelfRow);
    for (var i = 0; i < rows.length; i++) {
      var result = validateSpacing(rows[i]);
      if (!result.valid) {
        console.warn('TizenPortal [ABS]: Bookshelf row', i, 'has spacing violations');
        logViolations(result);
      }
    }
  },
  
  // ==========================================================================
  // ABS-SPECIFIC HELPERS (examples for future expansion)
  // ==========================================================================
  
  /**
   * Check if the ABS player is currently active
   * @returns {boolean}
   */
  isPlayerActive: function() {
    var player = document.querySelector(SELECTORS.playerContainer);
    return player && player.offsetParent !== null;
  },
  
  /**
   * Check if focus is currently in the siderail
   * @param {Element} [el] - Element to check (defaults to activeElement)
   * @returns {boolean}
   */
  isInSiderail: function(el) {
    var active = el || document.activeElement;
    if (!active) return false;
    
    var siderail = document.querySelector(SELECTORS.siderail);
    return siderail && siderail.contains(active);
  },
  
  /**
   * Check if focus is currently in the player
   * @param {Element} [el] - Element to check (defaults to activeElement)
   * @returns {boolean}
   */
  isInPlayer: function(el) {
    var active = el || document.activeElement;
    if (!active) return false;
    
    var player = document.querySelector(SELECTORS.playerContainer);
    return player && player.contains(active);
  },
  
  /**
   * Check if focus is currently on a bookshelf card
   * @returns {boolean}
   */
  isOnBookshelf: function() {
    var active = document.activeElement;
    return active && active.closest(SELECTORS.bookshelfRow) !== null;
  },
  
  /**
   * Focus the first siderail link (or the active one)
   */
  focusSiderail: function() {
    // Try to focus the active link first
    var activeLink = document.querySelector(SELECTORS.siderailNav + '.nuxt-link-active');
    if (activeLink) {
      activeLink.focus();
      return;
    }
    
    // Fall back to first link
    var first = document.querySelector(SELECTORS.siderailNav);
    if (first) {
      first.focus();
    }
  },
};
