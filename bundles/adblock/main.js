/**
 * Ad Blocker Bundle
 * 
 * Lightweight generic ad blocking for TV browsing.
 * 
 * Approach:
 * 1. CSS-based hiding of common ad selectors (lightweight, instant)
 * 2. DOM removal of known ad elements (cleanup)
 * 3. Request interception for known ad domains (where possible)
 * 4. MutationObserver to catch dynamically inserted ads
 * 
 * Note: This is a best-effort generic blocker. Site-specific bundles
 * (like Audiobookshelf, Jellyfin) typically don't have ads, so this
 * is mainly for general web browsing.
 */

import adblockStyles from './style.css';

/**
 * Known ad-related URL patterns (for script/iframe blocking)
 */
var AD_URL_PATTERNS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com/analytics',
  'adservice.google',
  'pagead2.googlesyndication',
  'adserver',
  'ads.yahoo',
  'advertising.com',
  'taboola.com',
  'outbrain.com',
  'revcontent.com',
  'mgid.com',
  'zergnet.com',
  'adroll.com',
  'criteo.com',
  'amazon-adsystem.com',
  'facebook.com/tr',  // FB tracking pixel
  'connect.facebook.net/en_US/fbevents',
];

/**
 * Selectors for elements to remove from DOM
 * More aggressive than CSS hiding - removes the element entirely
 */
var AD_SELECTORS = [
  // Google Ads
  'ins.adsbygoogle',
  '.adsbygoogle',
  '[id^="google_ads_"]',
  '[id^="div-gpt-ad"]',
  
  // Common ad containers
  '[class*="ad-container"]',
  '[class*="ad-wrapper"]',
  '[class*="ad-banner"]',
  '[class*="advertisement"]',
  '[id*="ad-container"]',
  '[id*="ad-wrapper"]',
  '[id*="advertisement"]',
  
  // Third-party networks
  '.taboola',
  '.outbrain',
  '[class*="taboola"]',
  '[class*="outbrain"]',
  '[class*="revcontent"]',
  
  // Iframes with ad sources
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]',
  'iframe[src*="adserver"]',
  
  // Popup/overlay ads
  '[class*="popup-ad"]',
  '[class*="ad-popup"]',
  '[class*="interstitial"]',
];

/**
 * State
 */
var state = {
  observer: null,
  blocked: 0,
  enabled: true,
};

export default {
  name: 'adblock',
  displayName: 'Ad Blocker',
  description: 'Block common web advertisements',
  
  /**
   * CSS to inject
   */
  style: adblockStyles,

  /**
   * Called before iframe content loads
   */
  onBeforeLoad: function(iframe, card) {
    console.log('TizenPortal [AdBlock]: Preparing');
    state.blocked = 0;
    state.enabled = true;
    this.cleanup();
  },

  /**
   * Called after iframe content has loaded
   */
  onAfterLoad: function(iframe, card) {
    console.log('TizenPortal [AdBlock]: Loaded, starting ad blocking');

    try {
      var doc = iframe.contentDocument;
      var win = iframe.contentWindow;
      
      if (!doc || !win) {
        console.warn('TizenPortal [AdBlock]: Cannot access iframe (cross-origin)');
        return;
      }

      // Initial cleanup
      this.removeAds(doc);
      
      // Block ad scripts from loading
      this.interceptRequests(win);
      
      // Watch for dynamically inserted ads
      this.observeDOM(doc);
      
      // Neutralize common ad functions
      this.neutralizeAdFunctions(win);

    } catch (err) {
      console.error('TizenPortal [AdBlock]: Error:', err.message);
    }
  },

  /**
   * Called when bundle is activated
   */
  onActivate: function(iframe, card) {
    console.log('TizenPortal [AdBlock]: Activated');
  },

  /**
   * Called when bundle is deactivated
   */
  onDeactivate: function(iframe, card) {
    console.log('TizenPortal [AdBlock]: Deactivated - blocked', state.blocked, 'ads');
    this.cleanup();
  },

  /**
   * Called on navigation
   */
  onNavigate: function(url) {
    console.log('TizenPortal [AdBlock]: Navigation, resetting counters');
    state.blocked = 0;
  },

  // ==========================================================================
  // AD REMOVAL
  // ==========================================================================

  /**
   * Remove existing ad elements from the DOM
   * @param {Document} doc
   */
  removeAds: function(doc) {
    var removed = 0;
    
    for (var i = 0; i < AD_SELECTORS.length; i++) {
      try {
        var elements = doc.querySelectorAll(AD_SELECTORS[i]);
        for (var j = 0; j < elements.length; j++) {
          var el = elements[j];
          // Don't remove if it's part of critical page structure
          if (!this.isSafeToRemove(el)) continue;
          
          el.remove();
          removed++;
        }
      } catch (err) {
        // Invalid selector, skip
      }
    }
    
    if (removed > 0) {
      state.blocked += removed;
      console.log('TizenPortal [AdBlock]: Removed', removed, 'ad elements');
    }
  },

  /**
   * Check if element is safe to remove (not critical structure)
   * @param {Element} el
   * @returns {boolean}
   */
  isSafeToRemove: function(el) {
    // Don't remove body, html, main content areas
    var tag = el.tagName.toLowerCase();
    if (tag === 'body' || tag === 'html' || tag === 'head') return false;
    
    // Don't remove main content containers
    var id = el.id || '';
    if (id === 'main' || id === 'content' || id === 'app' || id === 'root') return false;
    
    // Don't remove navigation
    if (tag === 'nav' || tag === 'header' || tag === 'footer') return false;
    
    return true;
  },

  // ==========================================================================
  // REQUEST INTERCEPTION
  // ==========================================================================

  /**
   * Intercept and block ad-related requests
   * @param {Window} win
   */
  interceptRequests: function(win) {
    var self = this;
    
    // Intercept XMLHttpRequest
    try {
      var originalXHROpen = win.XMLHttpRequest.prototype.open;
      win.XMLHttpRequest.prototype.open = function(method, url) {
        if (self.isAdURL(url)) {
          console.log('TizenPortal [AdBlock]: Blocked XHR:', url.substring(0, 60));
          state.blocked++;
          // Return a dummy that does nothing
          this._blocked = true;
          return;
        }
        return originalXHROpen.apply(this, arguments);
      };
      
      var originalXHRSend = win.XMLHttpRequest.prototype.send;
      win.XMLHttpRequest.prototype.send = function() {
        if (this._blocked) return;
        return originalXHRSend.apply(this, arguments);
      };
    } catch (err) {
      console.warn('TizenPortal [AdBlock]: Could not intercept XHR:', err.message);
    }
    
    // Intercept fetch (if available)
    if (win.fetch) {
      try {
        var originalFetch = win.fetch;
        win.fetch = function(url, options) {
          var urlStr = typeof url === 'string' ? url : (url.url || '');
          if (self.isAdURL(urlStr)) {
            console.log('TizenPortal [AdBlock]: Blocked fetch:', urlStr.substring(0, 60));
            state.blocked++;
            // Return rejected promise
            return Promise.reject(new Error('Blocked by TizenPortal AdBlock'));
          }
          return originalFetch.apply(this, arguments);
        };
      } catch (err) {
        console.warn('TizenPortal [AdBlock]: Could not intercept fetch:', err.message);
      }
    }
  },

  /**
   * Check if URL is ad-related
   * @param {string} url
   * @returns {boolean}
   */
  isAdURL: function(url) {
    if (!url || typeof url !== 'string') return false;
    var lower = url.toLowerCase();
    
    for (var i = 0; i < AD_URL_PATTERNS.length; i++) {
      if (lower.indexOf(AD_URL_PATTERNS[i]) !== -1) {
        return true;
      }
    }
    return false;
  },

  // ==========================================================================
  // FUNCTION NEUTRALIZATION
  // ==========================================================================

  /**
   * Neutralize common ad-loading functions
   * @param {Window} win
   */
  neutralizeAdFunctions: function(win) {
    try {
      // Google AdSense push
      if (win.adsbygoogle) {
        win.adsbygoogle = { push: function() {} };
      } else {
        Object.defineProperty(win, 'adsbygoogle', {
          value: { push: function() {} },
          writable: false,
          configurable: false
        });
      }
    } catch (err) {
      // May already be defined
    }
    
    try {
      // Google Publisher Tag
      if (!win.googletag) {
        win.googletag = {
          cmd: [],
          pubads: function() { return this; },
          enableServices: function() {},
          defineSlot: function() { return this; },
          addService: function() { return this; },
          display: function() {},
          setTargeting: function() { return this; },
          refresh: function() {},
        };
      }
    } catch (err) {
      // May already be defined
    }
    
    try {
      // Common ad init functions
      var noOp = function() {};
      var adFunctions = [
        '__cmp',  // GDPR consent management (often used for ad targeting)
        '_taboola',
        'OUTBRAIN',
      ];
      
      for (var i = 0; i < adFunctions.length; i++) {
        if (!win[adFunctions[i]]) {
          win[adFunctions[i]] = noOp;
        }
      }
    } catch (err) {
      // Ignore
    }
  },

  // ==========================================================================
  // DOM OBSERVATION
  // ==========================================================================

  /**
   * Watch for dynamically inserted ads
   * @param {Document} doc
   */
  observeDOM: function(doc) {
    var self = this;
    
    if (state.observer) {
      state.observer.disconnect();
    }
    
    try {
      state.observer = new MutationObserver(function(mutations) {
        var shouldClean = false;
        
        for (var i = 0; i < mutations.length; i++) {
          var mutation = mutations[i];
          
          // Check added nodes for ads
          for (var j = 0; j < mutation.addedNodes.length; j++) {
            var node = mutation.addedNodes[j];
            if (node.nodeType !== 1) continue; // Element nodes only
            
            if (self.isAdElement(node)) {
              shouldClean = true;
              break;
            }
          }
          if (shouldClean) break;
        }
        
        if (shouldClean) {
          // Debounce cleanup
          if (self._cleanTimeout) return;
          self._cleanTimeout = setTimeout(function() {
            self._cleanTimeout = null;
            self.removeAds(doc);
          }, 100);
        }
      });
      
      state.observer.observe(doc.body, {
        childList: true,
        subtree: true,
      });
      
      console.log('TizenPortal [AdBlock]: DOM observer active');
    } catch (err) {
      console.warn('TizenPortal [AdBlock]: Could not observe DOM:', err.message);
    }
  },

  /**
   * Check if element looks like an ad
   * @param {Element} el
   * @returns {boolean}
   */
  isAdElement: function(el) {
    var className = el.className || '';
    var id = el.id || '';
    var combined = (className + ' ' + id).toLowerCase();
    
    // Quick checks for common ad patterns
    var adPatterns = ['adsbygoogle', 'ad-container', 'ad-wrapper', 'ad-banner', 
                      'advertisement', 'taboola', 'outbrain', 'sponsored'];
    
    for (var i = 0; i < adPatterns.length; i++) {
      if (combined.indexOf(adPatterns[i]) !== -1) {
        return true;
      }
    }
    
    // Check iframes
    if (el.tagName === 'IFRAME') {
      var src = el.src || '';
      if (this.isAdURL(src)) {
        return true;
      }
    }
    
    return false;
  },

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Clean up observers and state
   */
  cleanup: function() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    
    if (this._cleanTimeout) {
      clearTimeout(this._cleanTimeout);
      this._cleanTimeout = null;
    }
  },
};
