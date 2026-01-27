/**
 * Audiobookshelf Bundle for TizenPortal
 * 
 * TV support for Audiobookshelf (https://www.audiobookshelf.org/)
 * 
 * This bundle is compiled into the TizenPortal runtime and runs directly in the page.
 * 
 * The core input handler provides card interaction (single/multi-action detection).
 * This bundle marks ABS elements with data-tp-card attributes and provides:
 * - Viewport adjustment for TV display
 * - Focus management for siderail and content
 * - TV-friendly focus indicators
 * - Text input wrapping (no keyboard until Enter pressed)
 * - Scroll-into-view with margin for focused elements
 * 
 * Card types are detected automatically by the core based on interactive children.
 */

import absStyles from './style.css';
import { 
  isInsideCard, 
  exitCard
} from '../../navigation/card-interaction.js';
import { 
  injectSpacingCSS, 
  MIN_GAP, 
  SPACING_CLASS,
  validateSpacing,
  logViolations,
  isElementVisible 
} from '../../navigation/geometry.js';

/**
 * Track if bundle has been activated
 */
var isActivated = false;

/**
 * DOM observer for dynamic content
 */
var observer = null;

/**
 * Debounce timeout
 */
var debounceTimeout = null;

/**
 * Track wrapped inputs to avoid re-wrapping
 */
var wrappedInputs = new WeakMap();

/**
 * Selectors based on actual ABS DOM structure
 */
var SELECTORS = {
  // Main layout
  appbar: '#appbar',
  siderail: '[role="toolbar"][aria-orientation="vertical"]',
  siderailLinks: '[role="toolbar"][aria-orientation="vertical"] a',
  siderailNav: '#siderail-buttons-container a',
  
  // Library dropdown
  libraryDropdown: '[aria-haspopup="menu"][aria-label*="Library"]',
  libraryMenuItems: '[role="menuitem"]',
  
  // Search and text inputs
  searchInput: 'input[placeholder*="Search"], [role="search"] input',
  textInputs: 'input[type="text"], input[type="search"], input:not([type])',
  
  // Bookshelf content - book cards are DIVs with id="book-card-N", not links
  bookshelfRow: '.bookshelfRow, .categorizedBookshelfRow',
  bookCards: '[id^="book-card-"]',
  bookshelfLinks: '.bookshelfRow a[href], .categorizedBookshelfRow a[href], #bookshelf a[href]',
  
  // Appbar buttons
  appbarButtons: '#appbar button, #appbar a[href]',
  
  // Generic interactive
  buttons: 'button:not([disabled]):not([aria-hidden="true"])',
  links: 'a[href]:not([aria-hidden="true"])',
};

export default {
  name: 'audiobookshelf',
  displayName: 'Audiobookshelf',
  description: 'TV support for Audiobookshelf audiobook server',
  
  /**
   * CSS to inject
   */
  style: absStyles,

  /**
   * Called when bundle is activated
   */
  onActivate: function() {
    if (isActivated) {
      console.log('TizenPortal [ABS]: Already activated');
      return;
    }
    
    console.log('TizenPortal [ABS]: Activating');
    isActivated = true;
    
    // Lock viewport immediately
    this.lockViewport();
    
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
    
    // Inject geometry spacing CSS
    injectSpacingCSS();
    
    // Set up focusable elements with card markers
    this.setupFocusables();
    
    // Apply spacing class to card containers
    this.applySpacingClasses();
    
    // Wrap text inputs for TV-friendly keyboard handling
    this.wrapTextInputs();
    
    // Set up scroll-into-view for focused elements
    this.setupScrollIntoView();
    
    // Observe DOM for dynamic content (Nuxt/Vue renders dynamically)
    this.observeDOM();
    
    // Validate spacing in debug mode
    if (window.TizenPortal && window.TizenPortal.debug) {
      this.validateAllSpacing();
    }
    
    // Set initial focus after a short delay (let Vue render)
    var self = this;
    setTimeout(function() {
      self.setInitialFocus();
    }, 500);
  },

  /**
   * Called when bundle is deactivated
   */
  onDeactivate: function() {
    console.log('TizenPortal [ABS]: Deactivating');
    isActivated = false;
    
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }
    
    // Remove focus listener
    document.removeEventListener('focusin', this.handleFocusIn);
    
    // Exit any entered card
    if (isInsideCard()) {
      exitCard();
    }
  },
  
  /**
   * Apply spacing classes to containers
   */
  applySpacingClasses: function() {
    var count = 0;
    
    try {
      // Bookshelf rows need spacing
      var rows = document.querySelectorAll(SELECTORS.bookshelfRow);
      for (var i = 0; i < rows.length; i++) {
        if (!rows[i].classList.contains(SPACING_CLASS)) {
          rows[i].classList.add(SPACING_CLASS);
          count++;
        }
      }
      
      // Siderail container
      var siderail = document.querySelector('#siderail-buttons-container');
      if (siderail && !siderail.classList.contains(SPACING_CLASS)) {
        siderail.classList.add(SPACING_CLASS);
        count++;
      }
      
      // Appbar
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
   * Validate spacing in all containers (debug mode)
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
  
  /**
   * Set up scroll-into-view behavior for focused elements
   */
  setupScrollIntoView: function() {
    var self = this;
    
    // Store bound function for removal
    this.handleFocusIn = function(e) {
      self.scrollElementIntoView(e.target);
    };
    
    document.addEventListener('focusin', this.handleFocusIn);
    console.log('TizenPortal [ABS]: Scroll-into-view enabled');
  },
  
  /**
   * Scroll element into view with margin
   * @param {HTMLElement} el
   */
  scrollElementIntoView: function(el) {
    if (!el || !el.getBoundingClientRect) return;
    
    try {
      var rect = el.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      
      // Margin from edge before we scroll (200px gives good buffer)
      var margin = 200;
      
      // Check if element is near bottom edge
      if (rect.bottom > viewportHeight - margin) {
        // Scroll down to bring element more into view
        var scrollAmount = rect.bottom - (viewportHeight - margin);
        window.scrollBy(0, scrollAmount);
        console.log('TizenPortal [ABS]: Scrolled down by', scrollAmount);
      }
      
      // Check if element is near top edge (below appbar at 64px)
      if (rect.top < 64 + margin) {
        // Scroll up to bring element more into view
        var scrollUpAmount = (64 + margin) - rect.top;
        window.scrollBy(0, -scrollUpAmount);
        console.log('TizenPortal [ABS]: Scrolled up by', scrollUpAmount);
      }
      
      // Horizontal scroll for bookshelf rows
      var parent = el.closest('.bookshelfRow, .categorizedBookshelfRow');
      if (parent) {
        // Scroll horizontally within the row
        if (rect.right > viewportWidth - margin) {
          parent.scrollLeft += rect.right - (viewportWidth - margin);
        }
        if (rect.left < 80 + margin) { // 80px for siderail
          parent.scrollLeft -= (80 + margin) - rect.left;
        }
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Scroll error:', err.message);
    }
  },
  
  /**
   * Wrap text inputs for TV-friendly keyboard handling
   * Inputs don't pop up keyboard until user presses Enter
   */
  wrapTextInputs: function() {
    var self = this;
    var inputs = document.querySelectorAll(SELECTORS.textInputs);
    var count = 0;
    
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      
      // Skip if already wrapped or is our own input
      if (wrappedInputs.has(input) || input.classList.contains('tp-wrapped')) {
        continue;
      }
      
      // Skip hidden inputs
      if (input.type === 'hidden' || input.closest('[style*="display: none"]')) {
        continue;
      }
      
      this.wrapSingleInput(input);
      count++;
    }
    
    if (count > 0) {
      console.log('TizenPortal [ABS]: Wrapped', count, 'text inputs');
    }
  },
  
  /**
   * Wrap a single text input
   * @param {HTMLInputElement} input
   */
  wrapSingleInput: function(input) {
    var self = this;
    
    // Create wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'tp-input-wrapper';
    wrapper.setAttribute('tabindex', '0');
    
    // Create display element
    var display = document.createElement('span');
    display.className = 'tp-input-display';
    var placeholder = input.getAttribute('placeholder') || 'Enter text...';
    display.textContent = input.value || placeholder;
    if (input.value) {
      display.classList.add('has-value');
    }
    
    // Insert wrapper before input
    input.parentNode.insertBefore(wrapper, input);
    
    // Move input inside wrapper
    wrapper.appendChild(display);
    wrapper.appendChild(input);
    
    // Mark input as wrapped
    input.classList.add('tp-wrapped');
    input.setAttribute('tabindex', '-1');
    wrappedInputs.set(input, wrapper);
    
    // Handle wrapper activation (Enter key or click)
    wrapper.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) { // Enter
        e.preventDefault();
        e.stopPropagation();
        self.activateInput(wrapper, input, display);
      }
    });
    
    wrapper.addEventListener('click', function() {
      self.activateInput(wrapper, input, display);
    });
    
    // Handle input deactivation
    input.addEventListener('blur', function() {
      self.deactivateInput(wrapper, input, display);
    });
    
    input.addEventListener('keydown', function(e) {
      if (e.keyCode === 27 || e.keyCode === 10009) { // Escape or Back
        e.preventDefault();
        self.deactivateInput(wrapper, input, display);
        wrapper.focus();
      } else if (e.keyCode === 13) { // Enter - submit and deactivate
        // Let the form handle Enter, then deactivate
        setTimeout(function() {
          self.deactivateInput(wrapper, input, display);
        }, 100);
      }
    });
    
    // Sync display when input changes
    input.addEventListener('input', function() {
      display.textContent = input.value || placeholder;
      if (input.value) {
        display.classList.add('has-value');
      } else {
        display.classList.remove('has-value');
      }
    });
  },
  
  /**
   * Activate input for editing
   */
  activateInput: function(wrapper, input, display) {
    wrapper.classList.add('editing');
    display.style.display = 'none';
    input.style.display = 'block';
    input.setAttribute('tabindex', '0');
    
    try {
      input.focus();
      input.select();
    } catch (err) {
      console.warn('TizenPortal [ABS]: Input focus error:', err.message);
    }
    
    console.log('TizenPortal [ABS]: Input activated');
  },
  
  /**
   * Deactivate input (return to display mode)
   */
  deactivateInput: function(wrapper, input, display) {
    if (!wrapper.classList.contains('editing')) return;
    
    wrapper.classList.remove('editing');
    var placeholder = input.getAttribute('placeholder') || 'Enter text...';
    display.textContent = input.value || placeholder;
    display.style.display = 'block';
    input.style.display = 'none';
    input.setAttribute('tabindex', '-1');
    
    if (input.value) {
      display.classList.add('has-value');
    } else {
      display.classList.remove('has-value');
    }
    
    console.log('TizenPortal [ABS]: Input deactivated');
  },

  /**
   * Adjust viewport for TV display
   * Instead of forcing a fixed width, we ensure proper scaling
   */
  lockViewport: function() {
    try {
      var viewport = document.querySelector('meta[name="viewport"]');
      
      if (viewport) {
        // Store original for potential restoration
        var original = viewport.getAttribute('content');
        if (original) {
          viewport.setAttribute('data-tp-original', original);
        }
        // Use device width but disable user scaling
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=no');
      } else {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1, user-scalable=no';
        document.head.appendChild(viewport);
      }
      
      console.log('TizenPortal [ABS]: Viewport adjusted for TV');
    } catch (err) {
      console.warn('TizenPortal [ABS]: Could not adjust viewport:', err.message);
    }
  },

  /**
   * Set up focusable elements with tabindex and card markers
   */
  setupFocusables: function() {
    var count = 0;
    
    try {
      // Siderail navigation links - these are single-action cards
      var siderailLinks = document.querySelectorAll(SELECTORS.siderailNav);
      for (var i = 0; i < siderailLinks.length; i++) {
        var el = siderailLinks[i];
        if (el.getAttribute('tabindex') !== '0') {
          el.setAttribute('tabindex', '0');
          count++;
        }
        // Mark as single-action card (siderail links are always single-action)
        el.setAttribute('data-tp-card', 'single');
      }
      
      // Book cards (main content) - these are divs with id="book-card-N"
      // ABS cards use Vue @click handlers to navigate to item detail
      // For TV, pressing Enter should navigate (single-action), hover buttons are mouse-only
      var bookCards = document.querySelectorAll(SELECTORS.bookCards);
      for (var j = 0; j < bookCards.length; j++) {
        var card = bookCards[j];
        // Already have tabindex="0" in HTML but ensure it's set
        if (card.getAttribute('tabindex') !== '0') {
          card.setAttribute('tabindex', '0');
          count++;
        }
        // Mark as single-action - Enter clicks the card to navigate to detail
        if (!card.hasAttribute('data-tp-card')) {
          card.setAttribute('data-tp-card', 'single');
        }
      }
      
      // Appbar interactive elements (buttons and links with href)
      var appbarEls = document.querySelectorAll(SELECTORS.appbarButtons);
      for (var k = 0; k < appbarEls.length; k++) {
        var appEl = appbarEls[k];
        // Skip hidden elements and aria-hidden elements
        if (appEl.getAttribute('tabindex') !== '0' && 
            !appEl.closest('[style*="display: none"]') &&
            appEl.getAttribute('aria-hidden') !== 'true') {
          appEl.setAttribute('tabindex', '0');
          count++;
        }
      }
      
      // Menu items (dropdown menus)
      var menuItems = document.querySelectorAll(SELECTORS.libraryMenuItems);
      for (var m = 0; m < menuItems.length; m++) {
        var menuEl = menuItems[m];
        if (menuEl.getAttribute('tabindex') !== '0') {
          menuEl.setAttribute('tabindex', '0');
          count++;
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
   * Set initial focus to a sensible element
   */
  setInitialFocus: function() {
    try {
      // If nothing is focused or body is focused
      if (!document.activeElement || document.activeElement === document.body) {
        
        // Try siderail "Home" link first (usually the active one)
        var activeNav = document.querySelector(SELECTORS.siderailNav + '.nuxt-link-active');
        if (activeNav) {
          activeNav.focus();
          console.log('TizenPortal [ABS]: Focused active siderail link');
          return;
        }
        
        // Try first siderail link
        var firstSiderail = document.querySelector(SELECTORS.siderailNav);
        if (firstSiderail) {
          firstSiderail.focus();
          console.log('TizenPortal [ABS]: Focused first siderail link');
          return;
        }
        
        // Fallback to first book card
        var firstBook = document.querySelector(SELECTORS.bookCards);
        if (firstBook) {
          firstBook.focus();
          console.log('TizenPortal [ABS]: Focused first book card');
          return;
        }
        
        // Last resort: search input
        var searchInput = document.querySelector(SELECTORS.searchInput);
        if (searchInput) {
          searchInput.focus();
          console.log('TizenPortal [ABS]: Focused search input');
          return;
        }
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error setting initial focus:', err.message);
    }
  },

  /**
   * Observe DOM for dynamically added content (Vue/Nuxt)
   */
  observeDOM: function() {
    try {
      if (observer) {
        observer.disconnect();
      }
      
      var self = this;
      
      observer = new MutationObserver(function(mutations) {
        // Debounce - process once per 250ms
        if (debounceTimeout) return;
        
        debounceTimeout = setTimeout(function() {
          debounceTimeout = null;
          self.setupFocusables();
          self.applySpacingClasses();
          self.wrapTextInputs();
        }, 250);
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      
      console.log('TizenPortal [ABS]: DOM observer active');
    } catch (err) {
      console.warn('TizenPortal [ABS]: Could not set up DOM observer:', err.message);
    }
  },

  /**
   * Handle key events (called by input handler if bundle is active)
   * Reserved for bundle-specific key handling (e.g., media keys for player)
   * Card interaction is now handled by the core input handler
   * @param {KeyboardEvent} event
   * @returns {boolean} True if event was consumed
   */
  onKeyDown: function(event) {
    // Future: Add media key handling for player
    return false;
  },
};
