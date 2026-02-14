/**
 * Audiobookshelf Bundle for TizenPortal
 * TV support for Audiobookshelf (https://www.audiobookshelf.org/)
 *
 * Bundle practices (short):
 * - Use core utilities (focus/input) instead of reimplementing.
 * - registerKeyHandler() to override core keys safely.
 * - Keep site selectors centralized and updated.
 * - Mark focusable elements with data-tp-card.
 * - Clean up listeners in onDeactivate.
 * - Prefer config objects for site-specific behavior.
 */

import absStyles from './style.css';

// ============================================================================
// CORE IMPORTS - Use these instead of reimplementing!
// ============================================================================

// Focus utilities: initial focus, DOM observation
import { 
  setInitialFocus,
  observeDOM,
} from '../../focus/manager.js';

// Navigation helpers: standard focus and navigation utilities
// Navigation helpers intentionally not used (core navigation handles focus moves)

// NOTE: registerKeyHandler is accessed via window.TizenPortal.input.registerKeyHandler
// to avoid circular dependency (handler.js -> registry.js -> this file)

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

// ABS-specific configuration

/**
 * CSS selectors for ABS DOM (update when ABS HTML changes).
 * Reference: https://github.com/advplyr/audiobookshelf/tree/main/client
 */
var SELECTORS = {
  // Layout containers
  appbar: '#appbar',
  siderail: '[role="toolbar"][aria-orientation="vertical"]',
  siderailNav: '#siderail-buttons-container a',
  bookshelfRow: '.bookshelfRow, .categorizedBookshelfRow',
  pageWrapper: '#page-wrapper, .page',
  
  // Cards (different aspect ratios)
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
  
  // Login page (/login)
  loginForm: 'form[action*="login"], form',
  loginUsername: 'input[name="username"], input[placeholder*="username" i]',
  loginPassword: 'input[type="password"]',
  loginSubmit: 'button[type="submit"], ui-btn[type="submit"]',
  loginOpenID: 'a[href*="/auth/openid"]',
  
  // Item detail page (/item/_id) - no :has() in Chrome 47
  itemDetailPage: '.page',
  itemCover: '.covers-book-cover, [class*="book-cover"]',
  itemTitle: 'h1',
  itemPlayButton: '#page-wrapper button .material-symbols',
  itemEditButton: 'button[aria-label*="Edit"]',
  itemDetails: '.grow.px-2, [class*="item-details"]',
  itemTabs: '[role="tablist"]',
  itemTabPanels: '[role="tabpanel"]',
  
  // Player (bottom bar) - no :has() in Chrome 47
  playerContainer: '#mediaPlayerContainer',
  playerCover: '#mediaPlayerContainer .covers-book-cover',
  playerTitle: '#mediaPlayerContainer a[href^="/item/"]',
  playerPlayPause: '#mediaPlayerContainer button',
  playerSeekBack: '#mediaPlayerContainer button',
  playerSeekForward: '#mediaPlayerContainer button',
  playerClose: '#mediaPlayerContainer button',
  playerProgress: '#mediaPlayerContainer [class*="progress"], .player-progress-bar',
  playerChapters: '#mediaPlayerContainer [class*="chapter"]',
  
  // Appbar (top nav) - no :has() in Chrome 47
  appbarButtons: '#appbar button, #appbar a[href], #appbar [role="button"], #appbar .icon-btn, #appbar .ui-icon-btn',
  appbarSearch: '#appbar input[type="search"], #appbar input[placeholder*="Search"], #appbar input[type="text"]',
  appbarLibrarySelect: '#appbar [class*="library-select"], #appbar button',
  appbarUserMenu: '#appbar [class*="user-menu"], #appbar a[href*="/account"]',
  
  // Modals/dialogs - no :has() in Chrome 47
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
  
  // Text inputs to wrap (TV keyboard handling)
  textInputs: 'input[type="text"], input[type="search"], input[type="password"], input:not([type]), textarea',
};

/**
 * Initial focus targets by page type (in priority order).
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


// Bundle state

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

/** Bundle matcher registration flag */
var matcherRegistered = false;

/** Audio element being monitored */
var monitoredAudioElement = null;

/** Audio event handlers for cleanup */
var audioEventHandlers = {
  loadstart: null,
  canplay: null,
  playing: null,
  pause: null,
  error: null,
  waiting: null,
  stalled: null,
};

/** DOMContentLoaded handler reference */
var domReadyHandler = null;

// Bundle export

export default {
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

    if (!matcherRegistered && window.TizenPortal && window.TizenPortal.registerBundleMatcher) {
      window.TizenPortal.registerBundleMatcher({
        bundleName: 'audiobookshelf',
        titleContains: ['audiobookshelf'],
        selectors: ['#siderail-buttons-container', '#appbar', '#mediaPlayerContainer']
      });
      matcherRegistered = true;
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      domReadyHandler = this.onDOMReady.bind(this);
      document.addEventListener('DOMContentLoaded', domReadyHandler);
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
    
    // TIZEN AUDIO: Check TV audio once at startup (just logs availability)
    // Actual unmute/volume happens on playback to avoid premature calls
    this.initializeTizenAudio();
    
    // CORE: Inject geometry spacing CSS for spatial navigation
    injectSpacingCSS();
    
    // CORE: Register cards using the new card registration API
    // This replaces manual setupFocusables() for card elements
    this.registerCardSelectors();
    
    // CORE: Register element manipulations using declarative API
    // This replaces all imperative DOM manipulation patterns
    this.registerElementManipulations();
    
    // Global features handle text input wrapping and scroll-into-view.
    
    // CORE: Observe DOM for dynamic Vue/Nuxt content changes
    stopObserver = observeDOM(function() {
      try {
        // Re-run setup when DOM changes (new cards loaded, etc.)
        // Card selectors and element registrations are auto-processed by core observers
        // Global features handle text input wrapping.
        // Monitor audio element when DOM changes (player may have been created)
        self.monitorAudioElement();
        // Handle color hints visibility based on player state
        self.updateColorHintsVisibility();
      } catch (err) {
        console.warn('TizenPortal [ABS]: Error in DOM observer:', err.message);
      }
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
    
    // Clean up DOMContentLoaded listener (if it was added)
    if (domReadyHandler) {
      document.removeEventListener('DOMContentLoaded', domReadyHandler);
      domReadyHandler = null;
    }
    
    // Clean up audio element event listeners
    if (monitoredAudioElement) {
      if (audioEventHandlers.loadstart) {
        monitoredAudioElement.removeEventListener('loadstart', audioEventHandlers.loadstart);
      }
      if (audioEventHandlers.canplay) {
        monitoredAudioElement.removeEventListener('canplay', audioEventHandlers.canplay);
      }
      if (audioEventHandlers.playing) {
        monitoredAudioElement.removeEventListener('playing', audioEventHandlers.playing);
      }
      if (audioEventHandlers.pause) {
        monitoredAudioElement.removeEventListener('pause', audioEventHandlers.pause);
      }
      if (audioEventHandlers.error) {
        monitoredAudioElement.removeEventListener('error', audioEventHandlers.error);
      }
      if (audioEventHandlers.waiting) {
        monitoredAudioElement.removeEventListener('waiting', audioEventHandlers.waiting);
      }
      if (audioEventHandlers.stalled) {
        monitoredAudioElement.removeEventListener('stalled', audioEventHandlers.stalled);
      }
      
      // Clear monitored flag so monitoring can be re-established if bundle is reactivated
      delete monitoredAudioElement.dataset.tpMonitored;
      monitoredAudioElement = null;
    }
    
    // Clear audio event handler references
    audioEventHandlers = {
      loadstart: null,
      canplay: null,
      playing: null,
      pause: null,
      error: null,
      waiting: null,
      stalled: null,
    };
    
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
    
    // Debug: Log all key presses handled by ABS bundle
    console.log('TizenPortal [ABS]: handleKeyDown received keyCode:', keyCode);
    
    
    // ========================================================================
    // MEDIA KEYS: Play/Pause/Seek when player is visible
    // ========================================================================
    var player = document.querySelector(SELECTORS.playerContainer);
    // offsetParent doesn't work for fixed positioned elements - check computed style
    var playerVisible = player && getComputedStyle(player).display !== 'none';
    
    // Log media key presses for debugging
    if (keyCode === KEYS.PLAY_PAUSE || keyCode === KEYS.PLAY || keyCode === KEYS.PAUSE ||
        keyCode === KEYS.FAST_FORWARD || keyCode === KEYS.REWIND || keyCode === KEYS.STOP) {
      console.log('TizenPortal [ABS]: Media key pressed:', keyCode, 'Player visible:', playerVisible);
    }
    
    if (playerVisible) {
      // Player is visible - handle media keys globally
      
      // PLAY/PAUSE - toggle audio playback
      if (keyCode === KEYS.PLAY_PAUSE || keyCode === KEYS.PLAY || keyCode === KEYS.PAUSE) {
        console.log('TizenPortal [ABS]: Handling PLAY/PAUSE key');
        this.togglePlayback();
        return true;
      }
      
      // FAST FORWARD - seek forward
      if (keyCode === KEYS.FAST_FORWARD) {
        console.log('TizenPortal [ABS]: Handling FAST_FORWARD key');
        this.seekForward();
        return true;
      }
      
      // REWIND - seek backward
      if (keyCode === KEYS.REWIND) {
        console.log('TizenPortal [ABS]: Handling REWIND key');
        this.seekBackward();
        return true;
      }
      
      // STOP - close player
      if (keyCode === KEYS.STOP) {
        console.log('TizenPortal [ABS]: Handling STOP key');
        this.closePlayer();
        return true;
      }
    }
    
    // ========================================================================
    // PLAY KEY WITHOUT PLAYER: Start playback on item detail or card
    // ========================================================================
    if (!playerVisible && (keyCode === KEYS.PLAY_PAUSE || keyCode === KEYS.PLAY)) {
      // Check if we're on item detail page
      if (this.isOnItemDetailPage()) {
        this.playItemFromDetailPage();
        return true;
      }
      
      // Check if we have a card focused
      var focusedCard = active && active.closest(SELECTORS.allCards);
      if (focusedCard) {
        this.playFromFocusedCard(focusedCard);
        return true;
      }
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
   * WHAT GOES IN CARD REGISTRATION:
   * - Visual card elements (books, series, collections, authors, playlists)
   * - Primary navigation items (siderail links)
   * - Any element that represents a distinct "item" with card-like behavior
   * 
   * WHAT STAYS IN setupOtherFocusables():
   * - UI chrome (appbar buttons, search inputs)
   * - Transient elements (dropdown menus, modal buttons)
   * - Context-specific elements (player controls, table rows)
   * - Generic fallback (remaining unprocessed links/buttons)
   * 
   * NOTE: setupOtherFocusables uses :not([tabindex]) to avoid duplicates
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
   * Register element manipulations using declarative API
   * 
   * This replaces many imperative DOM manipulations from setupOtherFocusables()
   * with declarative registrations that are automatically applied to existing
   * and dynamically added elements.
   */
  registerElementManipulations: function() {
    if (!window.TizenPortal || !window.TizenPortal.elements) {
      console.warn('TizenPortal [ABS]: Element registration API not available');
      return;
    }
    
    var elements = window.TizenPortal.elements;
    
    // ========================================================================
    // SIDERAIL - Mark for vertical navigation
    // ========================================================================
    elements.register({
      selector: SELECTORS.siderail,
      operation: 'attribute',
      attributes: {
        'data-tp-nav': 'vertical'
      }
    });
    
    // ========================================================================
    // DROPDOWN CONTAINERS - Add spacing and vertical navigation
    // ========================================================================
    elements.register({
      selector: SELECTORS.dropdownContainer,
      operation: 'focusable',
      nav: 'vertical',
      classes: [SPACING_CLASS]
    });
    
    // ========================================================================
    // DROPDOWN MENU ITEMS - Make focusable
    // ========================================================================
    elements.register({
      selector: SELECTORS.menuItems,
      operation: 'focusable'
    });
    
    // ========================================================================
    // FILTER DROPDOWN ITEMS - Make visible items focusable
    // ========================================================================
    elements.register({
      selector: SELECTORS.filterDropdownItems,
      operation: 'focusable',
      condition: function(el) {
        // Only make focusable if visible
        return el.offsetParent !== null;
      }
    });
    
    // ========================================================================
    // APPBAR - Search and buttons
    // ========================================================================
    elements.register({
      selector: SELECTORS.appbarButtons,
      operation: 'focusable',
      condition: function(el) {
        // Only if visible and not hidden
        return !el.closest('[style*="display: none"]') && 
               el.getAttribute('aria-hidden') !== 'true';
      }
    });
    
    elements.register({
      selector: SELECTORS.appbarSearch,
      operation: 'focusable',
      condition: function(el) {
        return el.getAttribute('aria-hidden') !== 'true';
      }
    });
    
    // ========================================================================
    // PLAYER CONTROLS - Make horizontal and all controls focusable
    // ========================================================================
    elements.register({
      selector: SELECTORS.playerContainer,
      operation: 'attribute',
      attributes: {
        'data-tp-nav': 'horizontal'
      }
    });
    
    // Player interactive elements (buttons, links, controls)
    var playerInteractiveSelector = [
      SELECTORS.playerContainer + ' button',
      SELECTORS.playerContainer + ' a',
      SELECTORS.playerContainer + ' [role="button"]'
    ].join(', ');
    
    elements.register({
      selector: playerInteractiveSelector,
      operation: 'focusable',
      container: SELECTORS.playerContainer,
      condition: function(el) {
        return !el.disabled && el.getAttribute('aria-hidden') !== 'true';
      }
    });
    
    // ========================================================================
    // GENERIC PAGE CONTENT - Links and buttons (excluding specific areas)
    // ========================================================================
    elements.register({
      selector: SELECTORS.pageWrapper + ' a[href]:not([tabindex])',
      operation: 'focusable',
      container: SELECTORS.pageWrapper,
      condition: function(el) {
        // Skip if inside siderail or appbar (handled separately)
        return !el.closest(SELECTORS.siderail) && 
               !el.closest('#appbar') &&
               el.offsetParent !== null;
      }
    });
    
    elements.register({
      selector: SELECTORS.pageWrapper + ' button:not([tabindex])',
      operation: 'focusable',
      container: SELECTORS.pageWrapper,
      condition: function(el) {
        return !el.closest(SELECTORS.siderail) && 
               !el.closest('#appbar') &&
               !el.disabled &&
               el.offsetParent !== null;
      }
    });
    
    // ========================================================================
    // TABLE ROWS - Clickable rows
    // ========================================================================
    elements.register({
      selector: SELECTORS.pageWrapper + ' tr[class*="cursor-pointer"], ' +
                SELECTORS.pageWrapper + ' tr.hover\\:bg-',
      operation: 'focusable',
      container: SELECTORS.pageWrapper
    });
    
    // Also mark table rows as single-action cards
    elements.register({
      selector: SELECTORS.pageWrapper + ' tr[class*="cursor-pointer"], ' +
                SELECTORS.pageWrapper + ' tr.hover\\:bg-',
      operation: 'attribute',
      container: SELECTORS.pageWrapper,
      attributes: {
        'data-tp-card': 'single'
      }
    });
    
    // ========================================================================
    // ITEM DETAIL PAGE - Icon buttons and links
    // ========================================================================
    // Icon buttons (Play, Queue, Edit, Finished, More)
    elements.register({
      selector: '.icon-btn, [class*="icon-btn"], button.mx-0\\.5',
      operation: 'focusable',
      condition: function(el) {
        return window.location.pathname.indexOf('/item/') !== -1 && !el.disabled;
      }
    });
    
    // ui-btn components (Play button, Read button)
    elements.register({
      selector: '#item-page-wrapper button, #page-wrapper .flex.items-center button',
      operation: 'focusable',
      condition: function(el) {
        return window.location.pathname.indexOf('/item/') !== -1 && !el.disabled;
      }
    });
    
    // Links to series/author
    elements.register({
      selector: '#item-page-wrapper a[href], #page-wrapper .grow a[href]',
      operation: 'focusable',
      condition: function(el) {
        return window.location.pathname.indexOf('/item/') !== -1;
      }
    });
    
    // ========================================================================
    // LOGIN PAGE - Form elements
    // ========================================================================
    elements.register({
      selector: SELECTORS.loginUsername + ', ' + SELECTORS.loginPassword,
      operation: 'focusable',
      condition: function(el) {
        return window.location.pathname.indexOf('/login') !== -1;
      }
    });
    
    elements.register({
      selector: SELECTORS.loginSubmit,
      operation: 'focusable',
      condition: function(el) {
        return window.location.pathname.indexOf('/login') !== -1;
      }
    });
    
    elements.register({
      selector: SELECTORS.loginOpenID,
      operation: 'focusable',
      condition: function(el) {
        return window.location.pathname.indexOf('/login') !== -1;
      }
    });
    
    // ========================================================================
    // MODALS - All interactive elements when modal is visible
    // ========================================================================
    elements.register({
      selector: SELECTORS.modal + ' button, ' + 
                SELECTORS.modal + ' a, ' + 
                SELECTORS.modal + ' input, ' + 
                SELECTORS.modal + ' select',
      operation: 'focusable',
      condition: function(el) {
        // Only make focusable if modal is visible
        var modal = el.closest(SELECTORS.modal);
        return modal && modal.offsetParent !== null;
      }
    });
    
    // ========================================================================
    // SPACING CLASSES - Apply to containers for spatial navigation
    // ========================================================================
    // Bookshelf rows (horizontal scroll containers)
    elements.register({
      selector: SELECTORS.bookshelfRow,
      operation: 'class',
      classes: [SPACING_CLASS]
    });
    
    // Siderail navigation container
    elements.register({
      selector: '#siderail-buttons-container',
      operation: 'class',
      classes: [SPACING_CLASS]
    });
    
    // Top appbar
    elements.register({
      selector: SELECTORS.appbar,
      operation: 'class',
      classes: [SPACING_CLASS]
    });
    
    // Player container
    elements.register({
      selector: SELECTORS.playerContainer,
      operation: 'class',
      classes: [SPACING_CLASS]
    });
    
    // ========================================================================
    // PLAYER CONTROLS - Additional setup for navigation
    // ========================================================================
    // Mark buttons for horizontal navigation within player
    elements.register({
      selector: SELECTORS.playerContainer + ' button',
      operation: 'attribute',
      container: SELECTORS.playerContainer,
      attributes: {
        'data-tp-nav-item': 'true'
      },
      condition: function(el) {
        return !el.disabled && el.getAttribute('aria-hidden') !== 'true';
      }
    });
    
    // ========================================================================
    // DETAIL PAGES - Page-specific elements
    // ========================================================================
    // Item/Collection/Playlist detail pages - Play buttons
    elements.register({
      selector: '.bg-success',
      operation: 'focusable',
      condition: function(el) {
        var path = window.location.pathname || '';
        return (path.indexOf('/item/') !== -1 || 
                path.indexOf('/collection/') !== -1 || 
                path.indexOf('/playlist/') !== -1);
      }
    });
    
    // Chapter rows on item detail page
    elements.register({
      selector: '[class*="chapters"] > div > div, .chapter-row',
      operation: 'focusable',
      condition: function(el) {
        return window.location.pathname.indexOf('/item/') !== -1;
      }
    });
    
    // Book rows in collection page
    elements.register({
      selector: '[class*="collection"] > div, .collection-book-row, .w-full.flex.items-center',
      operation: 'focusable',
      condition: function(el) {
        return window.location.pathname.indexOf('/collection/') !== -1 && 
               el.querySelector('.covers-book-cover, [class*="book-cover"]');
      }
    });
    
    // Playlist item rows
    elements.register({
      selector: '[class*="playlist"] .w-full.flex, .playlist-item-row',
      operation: 'focusable',
      condition: function(el) {
        return window.location.pathname.indexOf('/playlist/') !== -1 && 
               el.querySelector('.covers-book-cover, [class*="book-cover"], [class*="preview-cover"]');
      }
    });
    
    console.log('TizenPortal [ABS]: Element manipulations registered');
  },
  
  /**
   * DEPRECATED: Apply spacing classes to containers
   * This function is no longer needed - spacing is handled by element registration
   */
  applySpacingClasses: function() {
    // Spacing now handled by registerElementManipulations()
    // This function kept for compatibility but does nothing
  },
  
  /**
   * DEPRECATED: Setup player controls
   * This function is no longer needed - player setup is handled by element registration
   */
  setupPlayerControls: function() {
    // Player controls now handled by registerElementManipulations()
    // This function kept for compatibility but does nothing
  },
  
  /**
   * Update color hints visibility based on player state
   * 
   * When the media player is visible, the color hints at the bottom
   * overlap badly with the player controls. We hide them during playback.
   */
  updateColorHintsVisibility: function() {
    try {
      var hints = document.querySelector('.tp-site-hints');
      if (!hints) return;
      
      var playerContainer = document.querySelector(SELECTORS.playerContainer);
      // offsetParent doesn't work for fixed elements - check display/visibility instead
      var playerVisible = playerContainer && 
        playerContainer.style.display !== 'none' &&
        getComputedStyle(playerContainer).display !== 'none';
      
      if (playerVisible) {
        // Hide color hints when player is visible
        if (hints.style.display !== 'none') {
          hints.style.display = 'none';
          console.log('TizenPortal [ABS]: Hiding color hints (player visible)');
        }
      } else {
        // Show color hints when player is hidden
        if (hints.style.display === 'none') {
          hints.style.display = '';
          console.log('TizenPortal [ABS]: Showing color hints (player hidden)');
        }
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error updating color hints:', err.message);
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
    // offsetParent doesn't work for fixed elements
    return player && getComputedStyle(player).display !== 'none';
  },
  
  // Navigation helpers removed; core navigation handles focus movement.
  
  /**
   * Toggle playback in the media player
   * Uses the HTML5 audio element directly for reliable control
   */
  togglePlayback: function() {
    // ABS creates an audio element with id="audio-player"
    var audioEl = document.getElementById('audio-player');
    if (audioEl) {
      // Ensure audio element monitoring is set up
      this.monitorAudioElement();
      
      // Log current state for debugging
      console.log('TizenPortal [ABS]: Toggle playback, current state:', {
        paused: audioEl.paused,
        muted: audioEl.muted,
        volume: audioEl.volume,
        src: audioEl.currentSrc,
        readyState: audioEl.readyState
      });
      
      // Ensure audio is unmuted and volume is up
      if (audioEl.muted) {
        audioEl.muted = false;
      }
      if (audioEl.volume < 0.1) {
        audioEl.volume = 1.0;
      }
      
      if (audioEl.paused) {
        // Ensure Tizen TV audio is ready
        this.initializeTizenAudio();
        
        var playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.then(function() {
            console.log('TizenPortal [ABS]: Play started successfully');
          }).catch(function(error) {
            console.error('TizenPortal [ABS]: Play failed:', error.message);
          });
        }
        console.log('TizenPortal [ABS]: Play audio');
      } else {
        audioEl.pause();
        console.log('TizenPortal [ABS]: Pause audio');
      }
      return;
    }
    
    // Fallback: Try clicking the play/pause button in the player UI
    // Look for the accent-colored play button with material-symbols
    var playBtn = document.querySelector('#mediaPlayerContainer button.bg-accent') ||
                  document.querySelector('#mediaPlayerContainer .p-2.bg-accent');
    if (playBtn) {
      playBtn.click();
      console.log('TizenPortal [ABS]: Toggle playback via button click');
    }
  },
  
  /**
   * Seek forward in the media player
   * Uses the HTML5 audio element directly
   */
  seekForward: function() {
    var audioEl = document.getElementById('audio-player');
    if (audioEl && !isNaN(audioEl.duration)) {
      // Default jump forward is 30 seconds in ABS
      var jumpAmount = 30;
      audioEl.currentTime = Math.min(audioEl.currentTime + jumpAmount, audioEl.duration);
      console.log('TizenPortal [ABS]: Seek forward', jumpAmount, 'seconds');
      return;
    }
    
    // Fallback: Click the forward button
    var fwdBtns = document.querySelectorAll('#mediaPlayerContainer button');
    for (var i = 0; i < fwdBtns.length; i++) {
      var icon = fwdBtns[i].querySelector('.material-symbols');
      if (icon && icon.textContent && icon.textContent.indexOf('forward') !== -1) {
        fwdBtns[i].click();
        console.log('TizenPortal [ABS]: Seek forward via button');
        return;
      }
    }
  },
  
  /**
   * Seek backward in the media player
   * Uses the HTML5 audio element directly
   */
  seekBackward: function() {
    var audioEl = document.getElementById('audio-player');
    if (audioEl && !isNaN(audioEl.duration)) {
      // Default jump backward is 10 seconds in ABS
      var jumpAmount = 10;
      audioEl.currentTime = Math.max(audioEl.currentTime - jumpAmount, 0);
      console.log('TizenPortal [ABS]: Seek backward', jumpAmount, 'seconds');
      return;
    }
    
    // Fallback: Click the rewind button
    var btns = document.querySelectorAll('#mediaPlayerContainer button');
    for (var i = 0; i < btns.length; i++) {
      var icon = btns[i].querySelector('.material-symbols');
      if (icon && icon.textContent && icon.textContent.indexOf('replay') !== -1) {
        btns[i].click();
        console.log('TizenPortal [ABS]: Seek backward via button');
        return;
      }
    }
  },
  
  /**
   * Close/minimize the media player
   * Finds and clicks the close button
   */
  closePlayer: function() {
    // Look for close button with "close" icon or aria-label
    var closeBtn = document.querySelector('#mediaPlayerContainer button[aria-label*="Close"]') ||
                   document.querySelector('#mediaPlayerContainer .material-symbols');
    
    // Find button containing "close" text
    var btns = document.querySelectorAll('#mediaPlayerContainer button');
    for (var i = 0; i < btns.length; i++) {
      var text = btns[i].textContent || '';
      if (text.indexOf('close') !== -1) {
        btns[i].click();
        console.log('TizenPortal [ABS]: Close player');
        return;
      }
    }
    
    if (closeBtn && closeBtn.closest('button')) {
      closeBtn.closest('button').click();
      console.log('TizenPortal [ABS]: Close player');
    }
  },
  
  /**
   * Check if we're on an item detail page
   * @returns {boolean}
   */
  isOnItemDetailPage: function() {
    var path = window.location.pathname || '';
    return path.indexOf('/item/') !== -1;
  },
  
  /**
   * Play the item from the detail page
   * Finds and clicks the green play button
   */
  playItemFromDetailPage: function() {
    // Look for the green success-colored play button
    var playBtn = document.querySelector('#page-wrapper .bg-success') ||
                  document.querySelector('#item-page-wrapper .bg-success') ||
                  document.querySelector('button.bg-success');
    if (playBtn) {
      playBtn.click();
      console.log('TizenPortal [ABS]: Play from detail page');
      return;
    }
    
    // Fallback: look for button with play_arrow icon
    var btns = document.querySelectorAll('#page-wrapper button, #item-page-wrapper button');
    for (var i = 0; i < btns.length; i++) {
      var icon = btns[i].querySelector('.material-symbols');
      if (icon) {
        var text = icon.textContent || '';
        // Check for play_arrow unicode (\ue037) or text
        if (text.indexOf('\ue037') !== -1 || text.indexOf('play_arrow') !== -1 || text === '') {
          btns[i].click();
          console.log('TizenPortal [ABS]: Play from detail page (fallback)');
          return;
        }
      }
    }
  },
  
  /**
   * Play from a focused book/series card
   * Simulates the hover-to-play behavior
   * @param {Element} card - The focused card element
   */
  playFromFocusedCard: function(card) {
    // Try to click the card's play button (shown on hover)
    var playBtn = card.querySelector('[cy-id="playButton"]') ||
                  card.querySelector('.material-symbols');
    
    // Check for play icon
    if (playBtn) {
      var text = playBtn.textContent || '';
      if (text.indexOf('play_arrow') !== -1 || text.indexOf('\ue037') !== -1) {
        playBtn.click();
        console.log('TizenPortal [ABS]: Play from card');
        return;
      }
    }
    
    // Fallback: navigate to item and auto-play
    // For book cards, navigate to the item page
    var itemLink = card.querySelector('a[href^="/item/"]');
    if (itemLink) {
      var href = itemLink.getAttribute('href');
      // Set flag to auto-play after navigation
      window.sessionStorage.setItem('tp_autoplay', 'true');
      window.location.href = href;
      console.log('TizenPortal [ABS]: Navigate to item for playback');
      return;
    }
    
    // For series cards, just click to navigate
    card.click();
  },
  
  /**
   * Watch for SPA URL changes and reset navigation state
   * 
   * Nuxt/Vue uses the History API for SPA navigation, which doesn't trigger
   * page reload. When the URL changes, we need to:
   * 1. Force re-process all card registrations (some DOM elements are stale)
   * 2. Reset focus to something sensible on the new page
   * 3. Clear and re-relocate toolbar elements
   * 4. Check for auto-play flag
   * 
   * @returns {Function} Cleanup function to stop watching
   */
  watchUrlChanges: function() {
    var self = this;
    lastUrl = window.location.href;
    
    // Handler for URL changes
    function onUrlChange() {
      try {
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
          try {
            // Re-run card registration
            if (window.TizenPortal && window.TizenPortal.cards) {
              window.TizenPortal.cards.process();
            }
            
            // Element registrations are automatically reapplied by core observers
            // Global features handle text input wrapping.
        
            // Set initial focus on new page
            setInitialFocus(getInitialFocusSelectors(), 100);
            
            // Check for auto-play flag (set when navigating from card via PLAY key)
            if (window.sessionStorage.getItem('tp_autoplay') === 'true') {
              window.sessionStorage.removeItem('tp_autoplay');
              setTimeout(function() {
                self.playItemFromDetailPage();
              }, 500);
            }
          } catch (err) {
            console.warn('TizenPortal [ABS]: Error in URL change timeout:', err.message);
          }
        }, 300);
      } catch (err) {
        console.warn('TizenPortal [ABS]: Error in URL change handler:', err.message);
      }
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
  
  /**
   * Set up focusable elements on item detail, collection, and playlist pages
   * These pages have different layouts than the main bookshelf grid
   */
  setupDetailPageFocusables: function() {
    // Now handled by registerElementManipulations()
  },
  
  /**
   * Setup focusable elements on item detail page
   */
  setupItemDetailPage: function() {
    // Now handled by registerElementManipulations()
  },
  
  /**
   * Setup focusable elements on collection page
   */
  setupCollectionPage: function() {
    // Now handled by registerElementManipulations()
  },
  
  /**
   * Setup focusable elements on playlist page
   */
  setupPlaylistPage: function() {
    // Now handled by registerElementManipulations()
  },
  
  // ==========================================================================
  // TIZEN AUDIO HANDLING
  // ==========================================================================
  
  /**
   * Initialize Tizen TV audio system
   * 
   * On Tizen TVs, HTML5 audio elements may not output sound if:
   * - The TV is muted via tizen.tvaudiocontrol
   * - The audio element needs special handling
   * 
   * This function ensures the TV audio is ready for playback.
   * Only logs "not available" message once to reduce log spam.
   */
  initializeTizenAudio: function() {
    try {
      // Check if Tizen API is available
      if (typeof tizen !== 'undefined' && tizen.tvaudiocontrol) {
        // Only log availability once
        if (!this._tizenAudioChecked) {
          console.log('TizenPortal [ABS]: Tizen TV Audio API available');
          this._tizenAudioChecked = true;
        }
        
        // Check if TV is muted
        var isMuted = tizen.tvaudiocontrol.isMute();
        
        if (isMuted) {
          // Unmute the TV
          tizen.tvaudiocontrol.setMute(false);
          console.log('TizenPortal [ABS]: TV unmuted for audio playback');
        }
        
        // Get current volume - only adjust if very low
        var volume = tizen.tvaudiocontrol.getVolume();
        if (volume < 5) {
          tizen.tvaudiocontrol.setVolume(20);
          console.log('TizenPortal [ABS]: TV volume was', volume, ', set to 20');
        }
        
      } else {
        // Only log "not available" once to reduce spam
        if (!this._tizenAudioChecked) {
          console.log('TizenPortal [ABS]: Tizen TV Audio API not available (may not be Tizen)');
          this._tizenAudioChecked = true;
        }
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error initializing Tizen audio:', err.message);
    }
  },
  
  /**
   * Monitor the ABS audio element for playback issues
   * 
   * This adds event listeners to the audio element to:
   * 1. Log playback state changes
   * 2. Detect errors
   * 3. Ensure audio is unmuted and volume is set
   * 4. Optimize preloading for faster start
   */
  monitorAudioElement: function() {
    var audioEl = document.getElementById('audio-player');
    if (!audioEl) return;
    
    // Only set up monitoring once
    if (audioEl.dataset.tpMonitored) return;
    audioEl.dataset.tpMonitored = 'true';
    
    var self = this;
    
    // Store reference for cleanup
    monitoredAudioElement = audioEl;
    
    console.log('TizenPortal [ABS]: Setting up audio element monitoring');
    
    // Configure audio element for better streaming performance
    // 'auto' tells the browser to preload more aggressively
    if (audioEl.preload !== 'auto') {
      audioEl.preload = 'auto';
      console.log('TizenPortal [ABS]: Set audio preload to auto');
    }
    
    // Log initial audio element state (reduced detail)
    console.log('TizenPortal [ABS]: Audio element:', {
      paused: audioEl.paused,
      readyState: audioEl.readyState,
      networkState: audioEl.networkState
    });
    
    // Ensure audio element is not muted
    if (audioEl.muted) {
      audioEl.muted = false;
      console.log('TizenPortal [ABS]: Audio element unmuted');
    }
    
    // Ensure volume is set
    if (audioEl.volume < 0.1) {
      audioEl.volume = 1.0;
      console.log('TizenPortal [ABS]: Audio element volume set to 1.0');
    }
    
    // If audio has a source but hasn't started loading, call load() to kickstart buffering
    // readyState: 0 = HAVE_NOTHING, 1 = HAVE_METADATA, 2 = HAVE_CURRENT_DATA, 3 = HAVE_FUTURE_DATA, 4 = HAVE_ENOUGH_DATA
    // networkState: 0 = EMPTY, 1 = IDLE, 2 = LOADING, 3 = NO_SOURCE
    if (audioEl.src && audioEl.readyState === 0 && audioEl.networkState !== 2) {
      console.log('TizenPortal [ABS]: Calling load() to kickstart buffering');
      audioEl.load();
    }
    
    // Track buffering time for diagnostics
    var loadStartTime = 0;
    
    // Add event listeners for debugging - only essential events
    // Store handlers for cleanup
    audioEventHandlers.loadstart = function() {
      loadStartTime = Date.now();
      console.log('TizenPortal [ABS]: Audio loading...');
    };
    audioEl.addEventListener('loadstart', audioEventHandlers.loadstart);
    
    audioEventHandlers.canplay = function() {
      var loadTime = loadStartTime ? (Date.now() - loadStartTime) : 'unknown';
      console.log('TizenPortal [ABS]: Audio ready to play (loaded in', loadTime, 'ms)');
    };
    audioEl.addEventListener('canplay', audioEventHandlers.canplay);
    
    audioEventHandlers.playing = function() {
      console.log('TizenPortal [ABS]: Audio playing');
    };
    audioEl.addEventListener('playing', audioEventHandlers.playing);
    
    audioEventHandlers.pause = function() {
      console.log('TizenPortal [ABS]: Audio paused');
    };
    audioEl.addEventListener('pause', audioEventHandlers.pause);
    
    audioEventHandlers.error = function(e) {
      var error = audioEl.error;
      console.error('TizenPortal [ABS]: Audio error:', {
        code: error ? error.code : 'unknown',
        message: error ? error.message : 'unknown'
      });
    };
    audioEl.addEventListener('error', audioEventHandlers.error);
    
    audioEventHandlers.waiting = function() {
      console.log('TizenPortal [ABS]: Audio buffering...');
    };
    audioEl.addEventListener('waiting', audioEventHandlers.waiting);
    
    audioEventHandlers.stalled = function() {
      console.log('TizenPortal [ABS]: Audio stalled (network issue)');
    };
    audioEl.addEventListener('stalled', audioEventHandlers.stalled);
  },
};
