/**
 * Audiobookshelf Bundle
 * 
 * Enhanced TV support for Audiobookshelf (https://www.audiobookshelf.org/)
 * 
 * Features:
 * - Viewport lock to 1920px (disables Tailwind responsive breakpoints)
 * - Nuxt detection (waits for app to be ready)
 * - Mode tracking (form vs content)
 * - Focus management for book cards
 * - CSS fixes for mobile elements
 */

import absStyles from './style.css';

/**
 * Page modes
 */
var MODE = {
  LOADING: 'loading',  // Nuxt still loading
  FORM: 'form',        // Login, search, settings forms
  CONTENT: 'content',  // Library, book details, player
};

/**
 * State
 */
var state = {
  mode: MODE.LOADING,
  nuxtReady: false,
  observer: null,
  checkInterval: null,
};

/**
 * Selectors for detecting page mode
 */
var SELECTORS = {
  nuxtApp: '[id*="__nuxt"], #__nuxt, #app, .nuxt',
  nuxtLoading: '#nuxt-loading, .nuxt-loading, .nuxt-progress',
  loginForm: 'form[action*="login"], input[type="password"], .login-form, [class*="LoginForm"]',
  searchForm: 'input[type="search"], .search-input, [class*="Search"]',
  bookCards: '.book-card, [class*="BookCard"], .card[href*="/item/"], .card[href*="/library/"]',
  navItems: 'nav a, nav button, .nav-link, [role="navigation"] a',
  playerBar: '.player-bar, [class*="PlayerBar"], .audio-player, #player',
};

export default {
  name: 'audiobookshelf',
  displayName: 'Audiobookshelf',
  description: 'Enhanced TV support for Audiobookshelf audiobook server',
  
  /**
   * CSS to inject into iframe
   */
  style: absStyles,

  /**
   * Called before iframe content loads
   * @param {HTMLIFrameElement} iframe
   * @param {Object} card
   */
  onBeforeLoad: function(iframe, card) {
    console.log('TizenPortal [ABS]: Preparing to load', card.url);
    
    // Reset state
    state.mode = MODE.LOADING;
    state.nuxtReady = false;
    
    // Clear any existing observers/intervals
    this.cleanup();
  },

  /**
   * Called after iframe content has loaded
   * @param {HTMLIFrameElement} iframe
   * @param {Object} card
   */
  onAfterLoad: function(iframe, card) {
    console.log('TizenPortal [ABS]: Loaded', card.url);

    try {
      var doc = iframe.contentDocument;
      var win = iframe.contentWindow;
      
      if (!doc || !win) {
        console.warn('TizenPortal [ABS]: Cannot access iframe content (cross-origin)');
        return;
      }

      // Lock viewport to 1920px
      this.lockViewport(doc);

      // Wait for Nuxt to be ready
      this.waitForNuxt(doc, win, function() {
        console.log('TizenPortal [ABS]: Nuxt ready');
        state.nuxtReady = true;
        
        // Detect and set initial mode
        this.detectMode(doc);
        
        // Set up DOM observer for mode changes
        this.observeDOM(doc);
        
        // Make elements focusable
        this.setupFocusables(doc);
        
      }.bind(this));

    } catch (err) {
      console.error('TizenPortal [ABS]: Error in onAfterLoad:', err.message);
    }
  },

  /**
   * Called when bundle is activated
   * @param {HTMLIFrameElement} iframe
   * @param {Object} card
   */
  onActivate: function(iframe, card) {
    console.log('TizenPortal [ABS]: Activated');
  },

  /**
   * Called when bundle is deactivated
   * @param {HTMLIFrameElement} iframe
   * @param {Object} card
   */
  onDeactivate: function(iframe, card) {
    console.log('TizenPortal [ABS]: Deactivated');
    this.cleanup();
  },

  /**
   * Called when navigation occurs within iframe
   * @param {string} url
   */
  onNavigate: function(url) {
    console.log('TizenPortal [ABS]: Navigated to', url);
    
    // Reset mode to loading on navigation
    state.mode = MODE.LOADING;
  },

  /**
   * Called on keydown events
   * @param {KeyboardEvent} event
   * @returns {boolean} True to consume event
   */
  onKeyDown: function(event) {
    // Media key handling for player
    var keyCode = event.keyCode || event.which;
    
    // Play/Pause: 415 (Play), 19 (Pause), 10252 (Play/Pause toggle)
    if (keyCode === 415 || keyCode === 19 || keyCode === 10252) {
      return this.handlePlayPause(event);
    }
    
    // Stop: 413
    if (keyCode === 413) {
      return this.handleStop(event);
    }
    
    // Rewind: 412
    if (keyCode === 412) {
      return this.handleRewind(event);
    }
    
    // Fast Forward: 417
    if (keyCode === 417) {
      return this.handleFastForward(event);
    }
    
    return false; // Let default handling proceed
  },

  // ==========================================================================
  // VIEWPORT MANAGEMENT
  // ==========================================================================

  /**
   * Lock viewport to 1920px to disable responsive breakpoints
   * @param {Document} doc
   */
  lockViewport: function(doc) {
    try {
      // Find or create viewport meta
      var viewport = doc.querySelector('meta[name="viewport"]');
      
      if (viewport) {
        viewport.setAttribute('content', 'width=1920, initial-scale=1, user-scalable=no');
      } else {
        viewport = doc.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=1920, initial-scale=1, user-scalable=no';
        doc.head.appendChild(viewport);
      }
      
      console.log('TizenPortal [ABS]: Viewport locked to 1920px');
    } catch (err) {
      console.warn('TizenPortal [ABS]: Could not lock viewport:', err.message);
    }
  },

  // ==========================================================================
  // NUXT DETECTION
  // ==========================================================================

  /**
   * Wait for Nuxt app to be ready
   * @param {Document} doc
   * @param {Window} win
   * @param {Function} callback
   */
  waitForNuxt: function(doc, win, callback) {
    var maxWait = 10000; // 10 seconds max
    var startTime = Date.now();
    var checkDelay = 100;

    var check = function() {
      // Check if Nuxt is ready
      var isReady = this.isNuxtReady(doc, win);
      
      if (isReady) {
        console.log('TizenPortal [ABS]: Nuxt detected as ready');
        callback();
        return;
      }
      
      // Timeout check
      if (Date.now() - startTime > maxWait) {
        console.warn('TizenPortal [ABS]: Timeout waiting for Nuxt, proceeding anyway');
        callback();
        return;
      }
      
      // Keep checking
      state.checkInterval = setTimeout(check, checkDelay);
    }.bind(this);

    check();
  },

  /**
   * Check if Nuxt app is ready
   * @param {Document} doc
   * @param {Window} win
   * @returns {boolean}
   */
  isNuxtReady: function(doc, win) {
    // Method 1: Check window.__NUXT__
    if (win.__NUXT__) {
      return true;
    }
    
    // Method 2: Check for Nuxt root element with content
    var nuxtRoot = doc.querySelector(SELECTORS.nuxtApp);
    if (nuxtRoot && nuxtRoot.children.length > 0) {
      // Check if loading indicator is hidden
      var loading = doc.querySelector(SELECTORS.nuxtLoading);
      if (!loading) {
        return true;
      }
      
      // Check if loading indicator is hidden via style
      var style = win.getComputedStyle(loading);
      if (style.opacity === '0' || style.display === 'none' || style.visibility === 'hidden') {
        return true;
      }
    }
    
    // Method 3: Check for actual content (book cards, nav items)
    var hasContent = doc.querySelector(SELECTORS.bookCards) || 
                     doc.querySelector(SELECTORS.navItems);
    if (hasContent) {
      return true;
    }
    
    return false;
  },

  // ==========================================================================
  // MODE DETECTION
  // ==========================================================================

  /**
   * Detect current page mode
   * @param {Document} doc
   */
  detectMode: function(doc) {
    var oldMode = state.mode;
    
    // Check for form mode
    var hasLoginForm = doc.querySelector(SELECTORS.loginForm);
    var hasSearchForm = doc.querySelector(SELECTORS.searchForm);
    
    if (hasLoginForm) {
      state.mode = MODE.FORM;
      console.log('TizenPortal [ABS]: Mode detected: form (login)');
    } else if (hasSearchForm && document.activeElement === doc.querySelector(SELECTORS.searchForm)) {
      state.mode = MODE.FORM;
      console.log('TizenPortal [ABS]: Mode detected: form (search)');
    } else {
      state.mode = MODE.CONTENT;
      console.log('TizenPortal [ABS]: Mode detected: content');
    }
    
    // If mode changed, update focus management
    if (oldMode !== state.mode) {
      this.onModeChange(doc, oldMode, state.mode);
    }
  },

  /**
   * Handle mode change
   * @param {Document} doc
   * @param {string} oldMode
   * @param {string} newMode
   */
  onModeChange: function(doc, oldMode, newMode) {
    console.log('TizenPortal [ABS]: Mode changed from', oldMode, 'to', newMode);
    
    if (newMode === MODE.FORM) {
      // Focus first input in form
      var firstInput = doc.querySelector('input:not([type="hidden"]):not([disabled])');
      if (firstInput) {
        firstInput.focus();
      }
    } else if (newMode === MODE.CONTENT) {
      // Focus first navigable element
      this.focusFirstContent(doc);
    }
  },

  // ==========================================================================
  // FOCUS MANAGEMENT
  // ==========================================================================

  /**
   * Set up focusable elements
   * @param {Document} doc
   */
  setupFocusables: function(doc) {
    try {
      // Make book cards focusable
      var cards = doc.querySelectorAll(SELECTORS.bookCards);
      for (var i = 0; i < cards.length; i++) {
        if (!cards[i].hasAttribute('tabindex')) {
          cards[i].setAttribute('tabindex', '0');
        }
      }
      
      // Make nav items focusable
      var navItems = doc.querySelectorAll(SELECTORS.navItems);
      for (var j = 0; j < navItems.length; j++) {
        if (!navItems[j].hasAttribute('tabindex')) {
          navItems[j].setAttribute('tabindex', '0');
        }
      }
      
      console.log('TizenPortal [ABS]: Made', cards.length, 'cards and', navItems.length, 'nav items focusable');
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error setting up focusables:', err.message);
    }
  },

  /**
   * Focus first content element
   * @param {Document} doc
   */
  focusFirstContent: function(doc) {
    try {
      // Try to focus first book card
      var firstCard = doc.querySelector(SELECTORS.bookCards);
      if (firstCard) {
        firstCard.focus();
        return;
      }
      
      // Fall back to first nav item
      var firstNav = doc.querySelector(SELECTORS.navItems);
      if (firstNav) {
        firstNav.focus();
        return;
      }
      
      // Fall back to any focusable element
      var focusable = doc.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) {
        focusable.focus();
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error focusing first content:', err.message);
    }
  },

  // ==========================================================================
  // DOM OBSERVATION
  // ==========================================================================

  /**
   * Set up DOM observer for dynamic content
   * @param {Document} doc
   */
  observeDOM: function(doc) {
    try {
      if (state.observer) {
        state.observer.disconnect();
      }
      
      var self = this;
      state.observer = new MutationObserver(function(mutations) {
        // Debounce - only process once per frame
        if (self._observerTimeout) return;
        
        self._observerTimeout = setTimeout(function() {
          self._observerTimeout = null;
          
          // Re-detect mode on significant changes
          self.detectMode(doc);
          
          // Re-setup focusables for new content
          self.setupFocusables(doc);
        }, 100);
      });
      
      state.observer.observe(doc.body, {
        childList: true,
        subtree: true,
      });
      
      console.log('TizenPortal [ABS]: DOM observer active');
    } catch (err) {
      console.warn('TizenPortal [ABS]: Could not set up DOM observer:', err.message);
    }
  },

  // ==========================================================================
  // MEDIA KEY HANDLERS
  // ==========================================================================

  /**
   * Handle play/pause key
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  handlePlayPause: function(event) {
    console.log('TizenPortal [ABS]: Play/Pause pressed');
    
    // Try to find and click the play/pause button
    try {
      var iframe = document.getElementById('tp-site-iframe');
      if (!iframe || !iframe.contentDocument) return false;
      
      var doc = iframe.contentDocument;
      var playBtn = doc.querySelector('.player-bar button[aria-label*="play"], .player-bar button[aria-label*="pause"], [class*="PlayerBar"] button');
      
      if (playBtn) {
        playBtn.click();
        return true;
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error handling play/pause:', err.message);
    }
    
    return false;
  },

  /**
   * Handle stop key
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  handleStop: function(event) {
    console.log('TizenPortal [ABS]: Stop pressed');
    // ABS doesn't have a stop button, so just pause
    return this.handlePlayPause(event);
  },

  /**
   * Handle rewind key
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  handleRewind: function(event) {
    console.log('TizenPortal [ABS]: Rewind pressed');
    
    try {
      var iframe = document.getElementById('tp-site-iframe');
      if (!iframe || !iframe.contentDocument) return false;
      
      var doc = iframe.contentDocument;
      var rewindBtn = doc.querySelector('.player-bar button[aria-label*="rewind"], .player-bar button[aria-label*="back"], [class*="PlayerBar"] button[aria-label*="back"]');
      
      if (rewindBtn) {
        rewindBtn.click();
        return true;
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error handling rewind:', err.message);
    }
    
    return false;
  },

  /**
   * Handle fast forward key
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  handleFastForward: function(event) {
    console.log('TizenPortal [ABS]: Fast forward pressed');
    
    try {
      var iframe = document.getElementById('tp-site-iframe');
      if (!iframe || !iframe.contentDocument) return false;
      
      var doc = iframe.contentDocument;
      var ffwdBtn = doc.querySelector('.player-bar button[aria-label*="forward"], .player-bar button[aria-label*="skip"], [class*="PlayerBar"] button[aria-label*="forward"]');
      
      if (ffwdBtn) {
        ffwdBtn.click();
        return true;
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error handling fast forward:', err.message);
    }
    
    return false;
  },

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Clean up observers and intervals
   */
  cleanup: function() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    
    if (state.checkInterval) {
      clearTimeout(state.checkInterval);
      state.checkInterval = null;
    }
    
    if (this._observerTimeout) {
      clearTimeout(this._observerTimeout);
      this._observerTimeout = null;
    }
  },
};
