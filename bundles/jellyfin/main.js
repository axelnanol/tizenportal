/**
 * Jellyfin Bundle
 * 
 * Enhanced TV support for Jellyfin Media Server (https://jellyfin.org/)
 * 
 * Features:
 * - Viewport lock to 1920px
 * - Focus management for media cards and navigation
 * - Media key handling for video player
 * - Login page support
 */

import jellyfinStyles from './style.css';

/**
 * Page modes
 */
var MODE = {
  LOADING: 'loading',
  LOGIN: 'login',
  BROWSE: 'browse',
  PLAYER: 'player',
};

/**
 * State
 */
var state = {
  mode: MODE.LOADING,
  appReady: false,
  observer: null,
  checkInterval: null,
};

/**
 * Selectors for detecting page elements
 */
var SELECTORS = {
  appRoot: '#app-container, #skinBody, .layout-desktop',
  loginPage: '.loginPage, .selectUserPage, .manualLoginForm',
  browseContent: '.itemsContainer, .libraryPage, .indexPage, .homePageSection',
  mediaCards: '.card, .cardBox, .listItem, [data-type="movie"], [data-type="series"], [data-type="episode"]',
  navItems: '.navMenuOption, .sidebarHeader a, .mainDrawer a, .headerButton',
  videoPlayer: '.videoOsd, #videoOsdPage, .videoPlayerContainer',
  playerControls: '.osdControls button, .videoOsdBottomButtons button, .videoOsdMediaButton',
};

export default {
  name: 'jellyfin',
  displayName: 'Jellyfin',
  description: 'Enhanced TV support for Jellyfin media server',
  
  /**
   * CSS to inject into iframe
   */
  style: jellyfinStyles,

  /**
   * Called before iframe content loads
   * @param {HTMLIFrameElement} iframe
   * @param {Object} card
   */
  onBeforeLoad: function(iframe, card) {
    console.log('TizenPortal [Jellyfin]: Preparing to load', card.url);
    
    // Reset state
    state.mode = MODE.LOADING;
    state.appReady = false;
    
    // Clear any existing observers/intervals
    this.cleanup();
  },

  /**
   * Called after iframe content has loaded
   * @param {HTMLIFrameElement} iframe
   * @param {Object} card
   */
  onAfterLoad: function(iframe, card) {
    console.log('TizenPortal [Jellyfin]: Loaded', card.url);

    try {
      var doc = iframe.contentDocument;
      var win = iframe.contentWindow;
      
      if (!doc || !win) {
        console.warn('TizenPortal [Jellyfin]: Cannot access iframe content (cross-origin)');
        return;
      }

      // Lock viewport to 1920px
      this.lockViewport(doc);

      // Wait for Jellyfin to be ready
      this.waitForApp(doc, win, function() {
        console.log('TizenPortal [Jellyfin]: App ready');
        state.appReady = true;
        
        // Detect and set initial mode
        this.detectMode(doc);
        
        // Set up DOM observer for mode changes
        this.observeDOM(doc);
        
        // Make elements focusable
        this.setupFocusables(doc);
        
      }.bind(this));

    } catch (err) {
      console.error('TizenPortal [Jellyfin]: Error in onAfterLoad:', err.message);
    }
  },

  /**
   * Called when bundle is activated
   * @param {HTMLIFrameElement} iframe
   * @param {Object} card
   */
  onActivate: function(iframe, card) {
    console.log('TizenPortal [Jellyfin]: Activated');
  },

  /**
   * Called when bundle is deactivated
   * @param {HTMLIFrameElement} iframe
   * @param {Object} card
   */
  onDeactivate: function(iframe, card) {
    console.log('TizenPortal [Jellyfin]: Deactivated');
    this.cleanup();
  },

  /**
   * Called when navigation occurs within iframe
   * @param {string} url
   */
  onNavigate: function(url) {
    console.log('TizenPortal [Jellyfin]: Navigated to', url);
    
    // Reset mode to loading on navigation
    state.mode = MODE.LOADING;
  },

  /**
   * Called on keydown events
   * @param {KeyboardEvent} event
   * @returns {boolean} True to consume event
   */
  onKeyDown: function(event) {
    var keyCode = event.keyCode || event.which;
    
    // Only handle media keys when in player mode
    if (state.mode === MODE.PLAYER) {
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
    }
    
    return false; // Let default handling proceed
  },

  // ==========================================================================
  // VIEWPORT MANAGEMENT
  // ==========================================================================

  /**
   * Lock viewport to 1920px
   * @param {Document} doc
   */
  lockViewport: function(doc) {
    try {
      var viewport = doc.querySelector('meta[name="viewport"]');
      
      if (viewport) {
        viewport.setAttribute('content', 'width=1920, initial-scale=1, user-scalable=no');
      } else {
        viewport = doc.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=1920, initial-scale=1, user-scalable=no';
        doc.head.appendChild(viewport);
      }
      
      console.log('TizenPortal [Jellyfin]: Viewport locked to 1920px');
    } catch (err) {
      console.warn('TizenPortal [Jellyfin]: Could not lock viewport:', err.message);
    }
  },

  // ==========================================================================
  // APP DETECTION
  // ==========================================================================

  /**
   * Wait for Jellyfin app to be ready
   * @param {Document} doc
   * @param {Window} win
   * @param {Function} callback
   */
  waitForApp: function(doc, win, callback) {
    var maxWait = 10000; // 10 seconds max
    var startTime = Date.now();
    var checkDelay = 100;

    var check = function() {
      var isReady = this.isAppReady(doc, win);
      
      if (isReady) {
        console.log('TizenPortal [Jellyfin]: App detected as ready');
        callback();
        return;
      }
      
      if (Date.now() - startTime > maxWait) {
        console.warn('TizenPortal [Jellyfin]: Timeout waiting for app, proceeding anyway');
        callback();
        return;
      }
      
      state.checkInterval = setTimeout(check, checkDelay);
    }.bind(this);

    check();
  },

  /**
   * Check if Jellyfin app is ready
   * @param {Document} doc
   * @param {Window} win
   * @returns {boolean}
   */
  isAppReady: function(doc, win) {
    // Method 1: Check for Jellyfin global
    if (win.Jellyfin || win.ApiClient) {
      return true;
    }
    
    // Method 2: Check for app root element
    var appRoot = doc.querySelector(SELECTORS.appRoot);
    if (appRoot && appRoot.children.length > 0) {
      return true;
    }
    
    // Method 3: Check for actual content
    var hasContent = doc.querySelector(SELECTORS.loginPage) || 
                     doc.querySelector(SELECTORS.browseContent) ||
                     doc.querySelector(SELECTORS.mediaCards);
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
    
    // Check for video player
    var hasPlayer = doc.querySelector(SELECTORS.videoPlayer);
    if (hasPlayer) {
      var style = doc.defaultView.getComputedStyle(hasPlayer);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        state.mode = MODE.PLAYER;
        console.log('TizenPortal [Jellyfin]: Mode detected: player');
        return;
      }
    }
    
    // Check for login page
    var hasLogin = doc.querySelector(SELECTORS.loginPage);
    if (hasLogin) {
      state.mode = MODE.LOGIN;
      console.log('TizenPortal [Jellyfin]: Mode detected: login');
    } else {
      state.mode = MODE.BROWSE;
      console.log('TizenPortal [Jellyfin]: Mode detected: browse');
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
    console.log('TizenPortal [Jellyfin]: Mode changed from', oldMode, 'to', newMode);
    
    if (newMode === MODE.LOGIN) {
      // Focus first user tile or login input
      var userTile = doc.querySelector('.selectUserPage .card');
      var loginInput = doc.querySelector('.manualLoginForm input');
      
      if (userTile) {
        userTile.focus();
      } else if (loginInput) {
        loginInput.focus();
      }
    } else if (newMode === MODE.BROWSE) {
      // Focus first media card
      this.focusFirstContent(doc);
    } else if (newMode === MODE.PLAYER) {
      // Focus first player control
      var firstControl = doc.querySelector(SELECTORS.playerControls);
      if (firstControl) {
        firstControl.focus();
      }
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
      // Make media cards focusable
      var cards = doc.querySelectorAll(SELECTORS.mediaCards);
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
      
      console.log('TizenPortal [Jellyfin]: Made', cards.length, 'cards and', navItems.length, 'nav items focusable');
    } catch (err) {
      console.warn('TizenPortal [Jellyfin]: Error setting up focusables:', err.message);
    }
  },

  /**
   * Focus first content element
   * @param {Document} doc
   */
  focusFirstContent: function(doc) {
    try {
      // Try to focus first media card
      var firstCard = doc.querySelector(SELECTORS.mediaCards);
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
      console.warn('TizenPortal [Jellyfin]: Error focusing first content:', err.message);
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
        // Debounce
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
      
      console.log('TizenPortal [Jellyfin]: DOM observer active');
    } catch (err) {
      console.warn('TizenPortal [Jellyfin]: Could not set up DOM observer:', err.message);
    }
  },

  // ==========================================================================
  // MEDIA KEY HANDLERS
  // ==========================================================================

  /**
   * Get the Jellyfin player API
   * @returns {Object|null}
   */
  getPlayerAPI: function() {
    try {
      var iframe = document.getElementById('tp-site-iframe');
      if (!iframe || !iframe.contentWindow) return null;
      
      var win = iframe.contentWindow;
      
      // Try Jellyfin's playback manager
      if (win.Jellyfin && win.Jellyfin.PlaybackManager) {
        return win.Jellyfin.PlaybackManager;
      }
      
      // Try global API
      if (win.playbackManager) {
        return win.playbackManager;
      }
      
      return null;
    } catch (err) {
      return null;
    }
  },

  /**
   * Handle play/pause key
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  handlePlayPause: function(event) {
    console.log('TizenPortal [Jellyfin]: Play/Pause pressed');
    
    var player = this.getPlayerAPI();
    if (player) {
      try {
        if (typeof player.playPause === 'function') {
          player.playPause();
          return true;
        } else if (typeof player.togglePlay === 'function') {
          player.togglePlay();
          return true;
        }
      } catch (err) {
        console.warn('TizenPortal [Jellyfin]: Error calling player API:', err.message);
      }
    }
    
    // Fallback: click OSD button
    return this.clickPlayerButton('play', 'pause');
  },

  /**
   * Handle stop key
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  handleStop: function(event) {
    console.log('TizenPortal [Jellyfin]: Stop pressed');
    
    var player = this.getPlayerAPI();
    if (player && typeof player.stop === 'function') {
      try {
        player.stop();
        return true;
      } catch (err) {
        console.warn('TizenPortal [Jellyfin]: Error calling stop:', err.message);
      }
    }
    
    return this.clickPlayerButton('stop');
  },

  /**
   * Handle rewind key
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  handleRewind: function(event) {
    console.log('TizenPortal [Jellyfin]: Rewind pressed');
    
    var player = this.getPlayerAPI();
    if (player && typeof player.rewind === 'function') {
      try {
        player.rewind();
        return true;
      } catch (err) {
        console.warn('TizenPortal [Jellyfin]: Error calling rewind:', err.message);
      }
    }
    
    return this.clickPlayerButton('rewind', 'backward', 'back');
  },

  /**
   * Handle fast forward key
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  handleFastForward: function(event) {
    console.log('TizenPortal [Jellyfin]: Fast forward pressed');
    
    var player = this.getPlayerAPI();
    if (player && typeof player.fastForward === 'function') {
      try {
        player.fastForward();
        return true;
      } catch (err) {
        console.warn('TizenPortal [Jellyfin]: Error calling fastForward:', err.message);
      }
    }
    
    return this.clickPlayerButton('forward', 'skip');
  },

  /**
   * Click a player button by searching for keywords in aria-label
   * @param {...string} keywords
   * @returns {boolean}
   */
  clickPlayerButton: function() {
    var keywords = Array.prototype.slice.call(arguments);
    
    try {
      var iframe = document.getElementById('tp-site-iframe');
      if (!iframe || !iframe.contentDocument) return false;
      
      var doc = iframe.contentDocument;
      var buttons = doc.querySelectorAll(SELECTORS.playerControls);
      
      for (var i = 0; i < buttons.length; i++) {
        var label = (buttons[i].getAttribute('aria-label') || '').toLowerCase();
        var title = (buttons[i].getAttribute('title') || '').toLowerCase();
        var className = (buttons[i].className || '').toLowerCase();
        
        for (var j = 0; j < keywords.length; j++) {
          if (label.indexOf(keywords[j]) !== -1 || 
              title.indexOf(keywords[j]) !== -1 ||
              className.indexOf(keywords[j]) !== -1) {
            buttons[i].click();
            return true;
          }
        }
      }
    } catch (err) {
      console.warn('TizenPortal [Jellyfin]: Error clicking player button:', err.message);
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
