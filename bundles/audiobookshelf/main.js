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
  // NOTE: Chrome 47 doesn't support :has() - use simpler selectors
  // ==========================================================================
  itemDetailPage: '.page',
  itemCover: '.covers-book-cover, [class*="book-cover"]',
  itemTitle: 'h1',
  itemPlayButton: '#page-wrapper button .material-symbols',
  itemEditButton: 'button[aria-label*="Edit"]',
  itemDetails: '.grow.px-2, [class*="item-details"]',
  itemTabs: '[role="tablist"]',
  itemTabPanels: '[role="tabpanel"]',
  
  // ==========================================================================
  // PLAYER (bottom bar when playing)
  // NOTE: Chrome 47 doesn't support :has() - use simpler selectors
  // ==========================================================================
  playerContainer: '#mediaPlayerContainer',
  playerCover: '#mediaPlayerContainer .covers-book-cover',
  playerTitle: '#mediaPlayerContainer a[href^="/item/"]',
  playerPlayPause: '#mediaPlayerContainer button',
  playerSeekBack: '#mediaPlayerContainer button',
  playerSeekForward: '#mediaPlayerContainer button',
  playerClose: '#mediaPlayerContainer button',
  playerProgress: '#mediaPlayerContainer [class*="progress"], .player-progress-bar',
  playerChapters: '#mediaPlayerContainer [class*="chapter"]',
  
  // ==========================================================================
  // APPBAR (top navigation)
  // NOTE: Chrome 47 doesn't support :has() - use simpler selectors
  // ==========================================================================
  appbarButtons: '#appbar button, #appbar a[href]',
  appbarSearch: '#appbar input[type="search"], #appbar input[placeholder*="Search"]',
  appbarLibrarySelect: '#appbar [class*="library-select"], #appbar button',
  appbarUserMenu: '#appbar [class*="user-menu"], #appbar a[href*="/account"]',
  
  // ==========================================================================
  // MODALS & DIALOGS
  // NOTE: Chrome 47 doesn't support :has() - use simpler selectors
  // ==========================================================================
  modal: '.modal, [role="dialog"]',
  modalClose: '.modal button[aria-label*="Close"], [role="dialog"] button',
  modalButtons: '.modal button, [role="dialog"] button',
  
  // ==========================================================================
  // DROPDOWN MENUS
  // ==========================================================================
  menuItems: '[role="menuitem"], [role="option"]',
  dropdown: '.dropdown-menu, [role="menu"], [role="listbox"]',
  dropdownItem: '.dropdown-item, [role="menuitem"], [role="option"]',
  dropdownContainer: '.ui-dropdown-menu, [role="menu"], [role="listbox"], .dropdown-menu',
  
  // ==========================================================================
  // FILTER/SORT DROPDOWNS - LibraryFilterSelect.vue
  // These have nested sublists (Genre -> list of genres with back button)
  // ==========================================================================
  filterDropdown: '.ui-dropdown-menu',
  filterDropdownItems: '.ui-dropdown-menu li',
  filterDropdownBackButton: '.ui-dropdown-menu li:first-child span.mdi-arrow-left',
  filterDropdownSublist: '.ui-dropdown-menu ul',
  
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
  // Default (library/home page) - comprehensive list
  default: [
    '#siderail-buttons-container a.nuxt-link-active',  // Active nav link
    '#siderail-buttons-container a',                    // First nav link
    '[id^="book-card-"]',                               // Book card
    '[id^="series-card-"] .categoryPlacard',            // Series card title
    '[id^="series-card-"] [tabindex="0"]',              // Series card focusable
    '[id^="collection-card-"] .categoryPlacard',        // Collection card title
    '[id^="collection-card-"] [tabindex="0"]',          // Collection card focusable
    '.author-card, [id^="author-card-"]',               // Author card
    '[id^="playlist-card-"]',                           // Playlist card
    'button[tabindex="0"]',                             // Any focusable button
    'a[tabindex="0"]',                                  // Any focusable link
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
    '#page-wrapper button',                             // Play button
    'button[tabindex="0"]',                             // Any focusable button
    'h1',                                               // Title (for reading)
    '.covers-book-cover',                               // Cover image
  ],
  
  // Config/Settings pages
  config: [
    '.app-config-side-nav a.nuxt-link-active',          // Active config link
    '.app-config-side-nav a',                           // First config link
    'form input:first-of-type',                         // First form input
  ],
  
  // Series page
  series: [
    '#siderail-buttons-container a.nuxt-link-active',  // Active nav link
    '[id^="book-card-"]',                               // Book cards in the series
    'button[tabindex="0"]',                             // Sort/filter buttons
    'a[tabindex="0"]',                                  // Any link
  ],
  
  // Author page
  author: [
    '[id^="book-card-"]',                               // Books by author
    'button[tabindex="0"]',                             // Any button
    'a[tabindex="0"]',                                  // Any link
    '#siderail-buttons-container a',                    // Siderail
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
  if (path.indexOf('/series/') !== -1) {
    return INITIAL_FOCUS_SELECTORS.series;
  }
  if (path.indexOf('/author/') !== -1) {
    return INITIAL_FOCUS_SELECTORS.author;
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

/** Last known URL for detecting SPA navigation */
var lastUrl = '';

/** Cleanup function for URL change detection */
var stopUrlWatcher = null;

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
    
    // CORE: Register cards using the new card registration API
    // This replaces manual setupFocusables() for card elements
    this.registerCardSelectors();
    
    // ABS-SPECIFIC: Move toolbar elements into appbar
    this.relocateToolbarToAppbar();
    
    // ABS-SPECIFIC: Set up non-card focusables (siderail, appbar, etc.)
    this.setupOtherFocusables();
    
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
      // Card selectors are auto-processed by core observer
      self.relocateToolbarToAppbar();
      self.setupOtherFocusables();
      self.applySpacingClasses();
      wrapTextInputs(SELECTORS.textInputs);
    }, { debounceMs: 250 });
    
    // SPA NAVIGATION: Watch for URL changes and reset navigation state
    // Nuxt uses History API for navigation, which doesn't trigger page reload
    stopUrlWatcher = this.watchUrlChanges();
    
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
    
    // Clean up URL watcher
    if (stopUrlWatcher) {
      stopUrlWatcher();
      stopUrlWatcher = null;
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
   * Register card selectors with the core card system
   * 
   * This replaces the manual tabindex/data-tp-card setup.
   * Core handles observing DOM and processing new elements.
   */
  registerCardSelectors: function() {
    if (!window.TizenPortal || !window.TizenPortal.cards) {
      console.warn('TizenPortal [ABS]: Card registration API not available');
      return;
    }
    
    var cards = window.TizenPortal.cards;
    
    // Book cards - multi-action (have hover buttons)
    cards.register({
      selector: SELECTORS.bookCards,
      type: 'multi'
    });
    
    // Series cards - single-action (click navigates to series)
    cards.register({
      selector: SELECTORS.seriesCards,
      type: 'single'
    });
    
    // Collection cards - single-action
    cards.register({
      selector: SELECTORS.collectionCards,
      type: 'single'
    });
    
    // Playlist cards - single-action
    cards.register({
      selector: SELECTORS.playlistCards,
      type: 'single'
    });
    
    // Author cards - single-action
    // Register both class and ID patterns separately
    cards.register({
      selector: '.author-card',
      type: 'single'
    });
    cards.register({
      selector: '[id^="author-card-"]',
      type: 'single'
    });
    // Homepage author cards are just links to /author/ URLs
    cards.register({
      selector: 'a[href*="/author/"]',
      type: 'single'
    });
    
    // Siderail links - single-action
    cards.register({
      selector: SELECTORS.siderailNav,
      type: 'single'
    });
    
    console.log('TizenPortal [ABS]: Card selectors registered');
  },

  /**
   * Relocate toolbar elements (filter, sort, options) into the appbar
   * 
   * The #toolbar div below the appbar takes up space on TV.
   * We move its actual DOM elements into the appbar for a cleaner look.
   * This preserves Vue reactivity, nested dropdowns, and all functionality.
   * 
   * The toolbar structure is typically:
   *   #toolbar
   *     .libraryFilterSelect (dropdown with filters)
   *     .librarySortSelect (dropdown with sorts)
   *     .tooltip-container (options menu)
   *     ... other controls
   * 
   * These are moved into #appbar where they appear integrated with search, config, etc.
   */
  relocateToolbarToAppbar: function() {
    var toolbar = document.getElementById('toolbar');
    var appbar = document.getElementById('appbar');
    
    if (!toolbar || !appbar) return;
    
    try {
      // ========================================================================
      // PART 1: CREATE OR GET CONTAINER IN APPBAR
      // ========================================================================
      // Look for existing container (created on initial load)
      var container = appbar.querySelector('.tp-toolbar-container');
      
      if (!container) {
        // Create container on first run
        container = document.createElement('div');
        container.className = 'tp-toolbar-container';
        container.setAttribute('data-tp-nav', 'horizontal');
        container.style.cssText = 'display: flex; align-items: center; gap: 0; flex-wrap: wrap;';
        
        // Find insertion point - after search/library select, before stats/config
        var searchBox = appbar.querySelector('input[placeholder*="Search" i]');
        var statsLink = appbar.querySelector('a[href*="/stats"]');
        var insertPoint = statsLink || appbar;
        
        if (searchBox) {
          // Insert after search box
          var searchParent = searchBox.parentElement;
          if (searchParent && searchParent.nextElementSibling) {
            searchParent.parentElement.insertBefore(container, searchParent.nextElementSibling);
          } else {
            appbar.insertBefore(container, insertPoint);
          }
        } else {
          // Insert before stats link or at end
          appbar.insertBefore(container, insertPoint);
        }
      }
      
      // ========================================================================
      // PART 2: CLEAR OLD ITEMS AND MOVE NEW ONES
      // ========================================================================
      // Remove previous toolbar items from container
      var previousItems = container.querySelectorAll('[data-tp-toolbar-item]');
      for (var pi = 0; pi < previousItems.length; pi++) {
        previousItems[pi].parentElement.removeChild(previousItems[pi]);
      }
      
      // ========================================================================
      // PART 3: MOVE TOOLBAR ELEMENTS (NOT CLONE!)
      // ========================================================================
      // Find all interactive elements in toolbar
      // These are typically the filter/sort dropdowns and options menu
      // IMPORTANT: Convert to array first! toolbar.children is a live collection
      // that changes as we move elements, causing us to skip items.
      var toolbarChildren = Array.prototype.slice.call(toolbar.children);
      var movedCount = 0;
      
      for (var i = 0; i < toolbarChildren.length; i++) {
        var child = toolbarChildren[i];
        
        // Skip if it's just whitespace/text node
        if (child.nodeType !== 1) continue; // Not an element node
        
        // NOTE: We do NOT check offsetParent here because #toolbar is hidden
        // via CSS (display:none), so all children would have offsetParent === null.
        // We move all elements and let the appbar's display:flex show them.
        
        // Move the actual element (not a clone)
        // This preserves Vue bindings, dropdowns, event listeners, etc.
        child.setAttribute('data-tp-toolbar-item', 'true');
        
        // Adjust styles to fit in appbar
        child.style.margin = '0 4px'; // Reset margin
        
        // Move into container
        container.appendChild(child);
        movedCount++;
      }
      
      // ========================================================================
      // PART 4: ENSURE CONTAINER IS VISIBLE IF IT HAS CONTENT
      // ========================================================================
      if (movedCount > 0 && container.style.display === 'none') {
        container.style.display = 'flex';
      }
      
      // Hide container if it's now empty
      if (movedCount === 0 && container.children.length === 0) {
        container.style.display = 'none';
      }
      
      if (movedCount > 0) {
        console.log('TizenPortal [ABS]: Relocated', movedCount, 'toolbar elements to appbar');
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error relocating toolbar:', err.message);
    }
  },

  /**
   * Set up focusable elements that are NOT cards
   * 
   * This handles siderail navigation, appbar, table rows, etc.
   * Card elements are handled by the core card registration system.
   */
  setupOtherFocusables: function() {
    var count = 0;
    
    try {
      // ========================================================================
      // SIDERAIL - Mark for vertical-only navigation
      // ========================================================================
      var siderail = document.querySelector(SELECTORS.siderail);
      if (siderail && !siderail.hasAttribute('data-tp-nav')) {
        siderail.setAttribute('data-tp-nav', 'vertical');
      }
      
      // ========================================================================
      // GENERIC FOCUSABLE ELEMENTS (links, buttons in content area)
      // ========================================================================
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
      // FILTER DROPDOWN ITEMS (LibraryFilterSelect.vue)
      // These use li elements without role attributes, including nested sublists
      // ========================================================================
      var filterItems = document.querySelectorAll(SELECTORS.filterDropdownItems);
      for (var fi = 0; fi < filterItems.length; fi++) {
        var filterItem = filterItems[fi];
        // Make visible li elements focusable
        if (filterItem.offsetParent !== null && filterItem.getAttribute('tabindex') !== '0') {
          filterItem.setAttribute('tabindex', '0');
          count++;
        }
      }
      
      // ========================================================================
      // DROPDOWN CONTAINERS - Add spacing class for navigation
      // ========================================================================
      var dropdownContainers = document.querySelectorAll(SELECTORS.dropdownContainer);
      for (var dc = 0; dc < dropdownContainers.length; dc++) {
        var container = dropdownContainers[dc];
        if (!container.classList.contains(SPACING_CLASS)) {
          container.classList.add(SPACING_CLASS);
        }
        // Also ensure vertical navigation
        if (!container.hasAttribute('data-tp-nav')) {
          container.setAttribute('data-tp-nav', 'vertical');
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
  
  /**
   * Watch for SPA URL changes and reset navigation state
   * 
   * Nuxt/Vue uses the History API for SPA navigation, which doesn't trigger
   * page reload. When the URL changes, we need to:
   * 1. Force re-process all card registrations (some DOM elements are stale)
   * 2. Reset focus to something sensible on the new page
   * 
   * @returns {Function} Cleanup function to stop watching
   */
  watchUrlChanges: function() {
    var self = this;
    lastUrl = window.location.href;
    
    // Handler for URL changes
    function onUrlChange() {
      var currentUrl = window.location.href;
      if (currentUrl === lastUrl) return;
      
      console.log('TizenPortal [ABS]: URL changed from', lastUrl, 'to', currentUrl);
      lastUrl = currentUrl;
      
      // Exit any entered card state
      if (isInsideCard()) {
        exitCard();
      }
      
      // Force re-process cards - remove all data-tp-card attributes first
      // so they get re-registered with fresh DOM elements
      var staleCards = document.querySelectorAll('[data-tp-card]');
      for (var i = 0; i < staleCards.length; i++) {
        staleCards[i].removeAttribute('data-tp-card');
        staleCards[i].removeAttribute('tabindex');
      }
      
      // Small delay for Vue/Nuxt to render new content
      setTimeout(function() {
        // Re-run card registration
        if (window.TizenPortal && window.TizenPortal.cards) {
          window.TizenPortal.cards.processCards();
        }
        
        // Re-run other focusables
        self.setupOtherFocusables();
        self.applySpacingClasses();
        wrapTextInputs(SELECTORS.textInputs);
        
        // Set initial focus on new page
        setInitialFocus(getInitialFocusSelectors(), 100);
      }, 300);
    }
    
    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', onUrlChange);
    
    // Also poll for URL changes (catches programmatic navigation)
    var pollInterval = setInterval(function() {
      if (window.location.href !== lastUrl) {
        onUrlChange();
      }
    }, 500);
    
    // Return cleanup function
    return function() {
      window.removeEventListener('popstate', onUrlChange);
      clearInterval(pollInterval);
    };
  },
};
