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
 * Consolidated ad-related URL patterns
 * Organized by category for maintainability
 */

// Google ad/tracking domains (consolidated from multiple lists)
var GOOGLE_PATTERNS = [
  'doubleclick',
  'googlesyndication',
  'googleadservices', 
  'google-analytics',
  'googletagmanager',
  'googletagservices',
  'pagead2',
];

// Third-party ad networks
var AD_NETWORKS = [
  'taboola.com',
  'outbrain.com',
  'revcontent.com',
  'mgid.com',
  'zergnet.com',
  'adroll.com',
  'criteo.com',
  'adnxs.com',
  'adsrvr.org',
  'pubmatic.com',
  'rubiconproject.com',
  'openx.net',
  'advertising.com',
  'amazon-adsystem.com',
];

// Analytics and tracking
var ANALYTICS_PATTERNS = [
  'doubleverify.com',
  'scorecardresearch.com',
  'quantserve.com',
  'chartbeat.com',
  'facebook.com/tr',
  'fbevents',
];

// Generic ad-related terms (used in strict mode)
var GENERIC_AD_TERMS = [
  'adserver',
  'adsystem',
  'adservice',
  '/ads/',
  '/ad/',
];

// Tracking terms (used in strict mode)
var TRACKING_TERMS = [
  'pixel',
  'tracker',
  'tracking',
  'analytics',
  'beacon',
];

// Promotional terms (used in strict mode)
var PROMO_TERMS = [
  'promo',
  'sponsor',
  'sponsored',
];

/**
 * Pre-compiled regex patterns for faster matching
 * ~23x faster than indexOf loops
 */
var AD_REGEX = null;
var STRICT_AD_REGEX = null;

function buildRegexPatterns() {
  // Build standard pattern (Google + networks + analytics)
  var standardPatterns = []
    .concat(GOOGLE_PATTERNS)
    .concat(AD_NETWORKS.map(function(n) { return n.replace('.', '\\.'); }))
    .concat(ANALYTICS_PATTERNS.map(function(n) { return n.replace('.', '\\.').replace('/', '\\/'); }));
  
  AD_REGEX = new RegExp(standardPatterns.join('|'), 'i');
  
  // Build strict pattern (standard + generic ad terms + tracking + promo)
  var strictPatterns = standardPatterns
    .concat(GENERIC_AD_TERMS.map(function(t) { return t.replace('/', '\\/'); }))
    .concat(TRACKING_TERMS)
    .concat(PROMO_TERMS);
  
  STRICT_AD_REGEX = new RegExp(strictPatterns.join('|'), 'i');
}

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
 * Additional strict selectors
 */
var STRICT_AD_SELECTORS = [
  '[class*="sponsor"]',
  '[id*="sponsor"]',
  '[class*="promoted"]',
  '[id*="promoted"]',
  '[class*="paid"]',
  '[id*="paid"]',
  '[aria-label*="sponsor"]',
  '[aria-label*="sponsored"]',
  '[aria-label*="advert"]',
  '[data-ad]','[data-ads]','[data-advert]','[data-advertisement]','[data-sponsored]','[data-sponsor]',
  'iframe[src*="ad"]',
  'iframe[id*="ad"]',
  'iframe[class*="ad"]',
  'div[id*="ad-"]',
  'div[class*="ad-"]',
];

/**
 * Cookie/consent banner selectors
 */
var COOKIE_SELECTORS = [
  '[id*="cookie"]',
  '[class*="cookie"]',
  '[id*="consent"]',
  '[class*="consent"]',
  '[id*="gdpr"]',
  '[class*="gdpr"]',
  '[id*="privacy"]',
  '[class*="privacy"]',
  '[class*="cc-window"]',
  '[class*="cookie-banner"]',
  '[class*="cookie-consent"]',
  '[class*="consent-banner"]'
];

/**
 * Banner keyword hints
 */
var BANNER_KEYWORDS = [
  'banner',
  'leaderboard',
  'skyscraper',
  'billboard',
  'sponsor',
  'sponsored',
  'promoted',
  'promo',
  'advert',
  'adserver',
  'adsystem',
  'doubleclick',
  '/ads/',
  'ads.'
];

/**
 * State
 */
var state = {
  observer: null,
  cleanupInterval: null,
  blocked: 0,
  enabled: true,
  strict: false,
  allowlist: [],
  domIntercepted: false,
  originalAppendChild: null,
  originalInsertBefore: null,
  originalReplaceChild: null,
  strictStyleEl: null,
  cookieStyleEl: null,
  hideCookieBanners: false,
  inlineHeuristics: true,
  urlCheckCache: {}, // Cache for URL checks (cleared on navigation)
};

export default {
  /**
   * CSS to inject
   */
  style: adblockStyles,

  /**
   * Called before page content loads
   */
  onBeforeLoad: function(win, card) {
    console.log('TizenPortal [AdBlock]: Preparing');
    state.blocked = 0;
    state.enabled = true;
    state.urlCheckCache = {}; // Clear cache on new page
    
    // Build regex patterns if not already built
    if (!AD_REGEX || !STRICT_AD_REGEX) {
      buildRegexPatterns();
    }
    
    this.applyOptions(card);
    if (state.strict) {
      this.injectStrictScript(win);
      this.injectStrictStyles(win);
    }
    if (state.hideCookieBanners) {
      this.injectCookieStyles(win);
    }
    this.cleanup();
  },

  /**
   * Called after page content has loaded
   */
  onAfterLoad: function(win, card) {
    console.log('TizenPortal [AdBlock]: Loaded, starting ad blocking');

    try {
      var doc = win.document || document;
      
      if (!doc || !win) {
        console.warn('TizenPortal [AdBlock]: Cannot access document');
        return;
      }

      // Initial cleanup
      this.removeAds(doc);
      this.removeCookieBanners(doc);
      
      // Block ad scripts from loading
      this.interceptRequests(win);

      // Intercept DOM insertions for ad elements
      this.interceptDomInsertion(win);
      
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
  onActivate: function(win, card) {
    console.log('TizenPortal [AdBlock]: Activated');
  },

  /**
   * Called when bundle is deactivated
   */
  onDeactivate: function(win, card) {
    console.log('TizenPortal [AdBlock]: Deactivated - blocked', state.blocked, 'ads');
    this.cleanup();
  },

  /**
   * Called on navigation
   */
  onNavigate: function(url) {
    console.log('TizenPortal [AdBlock]: Navigation, resetting counters');
    state.blocked = 0;
    state.urlCheckCache = {}; // Clear cache on navigation
  },

  // ========================================================================
  // OPTIONS
  // ========================================================================

  /**
   * Apply bundle options from card
   * @param {Object} card
   */
  applyOptions: function(card) {
    var options = (card && card.bundleOptions) ? card.bundleOptions : {};
    var optionData = (card && card.bundleOptionData) ? card.bundleOptionData : {};

    state.strict = !!options.strict;
    state.hideCookieBanners = !!options.hideCookieBanners;
    state.inlineHeuristics = options.inlineHeuristics !== false;

    // Parse allowlist contents (if provided)
    var allowlistText = optionData.allowlistUrl || '';
    state.allowlist = this.parseAllowlist(allowlistText);
  },

  /**
   * Parse allowlist text into array
   * @param {string} text
   * @returns {string[]}
   */
  parseAllowlist: function(text) {
    if (!text || typeof text !== 'string') return [];
    var lines = text.split(/\r?\n/);
    var list = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!line) continue;
      line = line.trim();
      if (!line || line.charAt(0) === '#') continue;
      list.push(line.toLowerCase());
    }
    return list;
  },

  /**
   * Check if URL is allowlisted
   * @param {string} url
   * @returns {boolean}
   */
  isAllowlisted: function(url) {
    if (!url || !state.allowlist || !state.allowlist.length) return false;
    var lower = url.toLowerCase();
    for (var i = 0; i < state.allowlist.length; i++) {
      if (lower.indexOf(state.allowlist[i]) !== -1) {
        return true;
      }
    }
    return false;
  },

  /**
   * Inject a strict script to harden ad blocking
   * @param {Window} win
   */
  injectStrictScript: function(win) {
    try {
      var doc = win.document || document;
      if (!doc || !doc.createElement) return;
      var script = doc.createElement('script');
      script.type = 'text/javascript';
      script.text = '(function(){try{var w=window;w.__tpAdblockStrict=true;var d=document;var ow=d.write;d.write=function(h){try{var s=String(h||\'\').toLowerCase();if(s.indexOf("adsbygoogle")!==-1||s.indexOf("doubleclick")!==-1||s.indexOf("googlesyndication")!==-1||s.indexOf("adservice")!==-1){return;}}catch(e){}return ow.apply(d,arguments);};}catch(e){}})();';
      (doc.head || doc.documentElement || doc.body).appendChild(script);
    } catch (err) {
      // Ignore
    }
  },

  /**
   * Inject additional strict CSS (only in strict mode)
   * @param {Window} win
   */
  injectStrictStyles: function(win) {
    try {
      var doc = win.document || document;
      if (!doc || !doc.createElement) return;
      if (state.strictStyleEl) return;

      var style = doc.createElement('style');
      style.type = 'text/css';
      style.textContent = [
        '[data-google-query-id],[data-ad-client],[data-ad-slot],[data-ad-unit],[data-ad-format],[data-adtest],',
        '[data-testid*="ad"],[data-testid*="sponsor"],[data-testid*="promoted"],',
        '[aria-label*="Sponsored"],[aria-label*="sponsored"],[aria-label*="Advertisement"],[aria-label*="advertisement"],',
        '[id*="sponsored"],[class*="sponsored"],[id*="promoted"],[class*="promoted"],',
        '[id*="native-ad"],[class*="native-ad"],[id*="ad-"],[class*="ad-"],',
        'iframe[src*="ads"],iframe[src*="doubleclick"],iframe[src*="adservice"],',
        'img[src*="pixel"],img[src*="tracker"],img[src*="tracking"],',
        'div[style*="z-index: 2147483647"]',
        '{display:none !important;visibility:hidden !important;height:0 !important;width:0 !important;overflow:hidden !important;opacity:0 !important;}'
      ].join('');

      (doc.head || doc.documentElement || doc.body).appendChild(style);
      state.strictStyleEl = style;
    } catch (err) {
      // Ignore
    }
  },

  /**
   * Inject cookie banner hiding styles
   * @param {Window} win
   */
  injectCookieStyles: function(win) {
    try {
      var doc = win.document || document;
      if (!doc || !doc.createElement) return;
      if (state.cookieStyleEl) return;

      var style = doc.createElement('style');
      style.type = 'text/css';
      style.textContent = COOKIE_SELECTORS.join(',') + '{display:none !important;visibility:hidden !important;height:0 !important;overflow:hidden !important;opacity:0 !important;}';
      (doc.head || doc.documentElement || doc.body).appendChild(style);
      state.cookieStyleEl = style;
    } catch (err) {
      // Ignore
    }
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
    var selectors = AD_SELECTORS;
    if (state.strict) {
      selectors = AD_SELECTORS.concat(STRICT_AD_SELECTORS);
    }
    
    for (var i = 0; i < selectors.length; i++) {
      try {
        var elements = doc.querySelectorAll(selectors[i]);
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

    // Heuristic image banner removal
    if (state.inlineHeuristics || state.strict) {
      var imageRemoved = this.removeImageAds(doc);
      if (imageRemoved > 0) {
        state.blocked += imageRemoved;
        console.log('TizenPortal [AdBlock]: Removed', imageRemoved, 'ad images');
      }
    }
  },

  /**
   * Remove cookie/consent banners
   * @param {Document} doc
   */
  removeCookieBanners: function(doc) {
    if (!state.hideCookieBanners && !state.strict) return;
    var removed = 0;
    for (var i = 0; i < COOKIE_SELECTORS.length; i++) {
      try {
        var elements = doc.querySelectorAll(COOKIE_SELECTORS[i]);
        for (var j = 0; j < elements.length; j++) {
          var el = elements[j];
          if (!this.isSafeToRemove(el)) continue;
          el.remove();
          removed++;
        }
      } catch (err) {
        // ignore
      }
    }

    if (removed > 0) {
      state.blocked += removed;
      console.log('TizenPortal [AdBlock]: Removed', removed, 'cookie/consent elements');
    }
  },

  /**
   * Remove likely ad banner images
   * @param {Document} doc
   * @returns {number}
   */
  removeImageAds: function(doc) {
    var removed = 0;
    var images = doc.querySelectorAll('img');
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (this.isLikelyAdImage(img)) {
        if (!this.isSafeToRemove(img)) continue;
        img.remove();
        removed++;
      }
    }
    return removed;
  },

  /**
   * Heuristic to detect ad banner images
   * @param {HTMLImageElement} img
   * @returns {boolean}
   */
  isLikelyAdImage: function(img) {
    if (!img || !img.src) return false;
    var src = (img.src || '').toLowerCase();

    if (this.isAllowlisted(src)) return false;

    var className = (img.className || '').toLowerCase();
    var id = (img.id || '').toLowerCase();
    var combined = className + ' ' + id + ' ' + src;

    var hasKeyword = false;
    for (var i = 0; i < BANNER_KEYWORDS.length; i++) {
      if (combined.indexOf(BANNER_KEYWORDS[i]) !== -1) {
        hasKeyword = true;
        break;
      }
    }

    var wAttr = img.getAttribute ? img.getAttribute('width') : '';
    var hAttr = img.getAttribute ? img.getAttribute('height') : '';
    var w = parseInt(wAttr, 10) || img.width || 0;
    var h = parseInt(hAttr, 10) || img.height || 0;

    var isBannerSize = (w >= 728 && h >= 90) || (w >= 300 && h >= 50) || (w >= 160 && h >= 600) || (w >= 250 && h >= 250) || (w >= 468 && h >= 60);
    var isGif = src.indexOf('.gif') !== -1;

    if (hasKeyword && (isBannerSize || isGif)) return true;
    if (state.strict && isGif && (w >= 200 || h >= 200)) return true;

    return false;
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

    // Don't remove allowlisted sources
    try {
      var src = el.getAttribute ? (el.getAttribute('src') || '') : '';
      var href = el.getAttribute ? (el.getAttribute('href') || '') : '';
      if ((src && this.isAllowlisted(src)) || (href && this.isAllowlisted(href))) {
        return false;
      }
    } catch (err) {
      // Ignore
    }
    
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
   * Intercept DOM insertions to block ad elements early
   * Optimized: Only check SCRIPT and IFRAME nodes for performance
   * @param {Window} win
   */
  interceptDomInsertion: function(win) {
    var self = this;

    if (state.domIntercepted) return;

    try {
      var proto = win.Element && win.Element.prototype;
      if (!proto) return;

      state.originalAppendChild = proto.appendChild;
      state.originalInsertBefore = proto.insertBefore;
      state.originalReplaceChild = proto.replaceChild;

      proto.appendChild = function(node) {
        // Fast path: only check element nodes (nodeType 1)
        if (node && node.nodeType === 1) {
          var tag = node.tagName;
          // Only intercept SCRIPT and IFRAME for performance
          if (tag === 'SCRIPT' || tag === 'IFRAME') {
            if (self.shouldBlockNode(node)) {
              state.blocked++;
              return node;
            }
          }
        }
        return state.originalAppendChild.apply(this, arguments);
      };

      proto.insertBefore = function(node, ref) {
        // Fast path: only check element nodes
        if (node && node.nodeType === 1) {
          var tag = node.tagName;
          if (tag === 'SCRIPT' || tag === 'IFRAME') {
            if (self.shouldBlockNode(node)) {
              state.blocked++;
              return node;
            }
          }
        }
        return state.originalInsertBefore.apply(this, arguments);
      };

      proto.replaceChild = function(node, oldChild) {
        // Fast path: only check element nodes
        if (node && node.nodeType === 1) {
          var tag = node.tagName;
          if (tag === 'SCRIPT' || tag === 'IFRAME') {
            if (self.shouldBlockNode(node)) {
              state.blocked++;
              return oldChild;
            }
          }
        }
        return state.originalReplaceChild.apply(this, arguments);
      };

      state.domIntercepted = true;
    } catch (err) {
      console.warn('TizenPortal [AdBlock]: Could not intercept DOM insertion:', err.message);
    }
  },

  /**
   * Determine if an inserted node should be blocked
   * @param {Node} node
   * @returns {boolean}
   */
  shouldBlockNode: function(node) {
    if (!node || node.nodeType !== 1) return false;

    var tag = node.tagName ? node.tagName.toUpperCase() : '';

    if (tag === 'SCRIPT') {
      var src = node.src || '';
      if (src && this.isAdURL(src)) {
        return true;
      }
      if (!src && (state.inlineHeuristics || state.strict)) {
        var text = node.text || node.textContent || '';
        if (this.isInlineAdScript(text)) {
          return true;
        }
      }
    }

    if (tag === 'IFRAME') {
      var iframeSrc = node.src || '';
      if (iframeSrc && this.isAdURL(iframeSrc)) {
        return true;
      }
    }

    if (state.strict && tag === 'IMG') {
      var imgSrc = node.src || '';
      if (imgSrc && this.isAdURL(imgSrc)) {
        return true;
      }
      var w = node.getAttribute ? node.getAttribute('width') : '';
      var h = node.getAttribute ? node.getAttribute('height') : '';
      if ((w === '1' && h === '1') || (node.width === 1 && node.height === 1)) {
        return true;
      }
    }

    // Generic ad element check (strict only)
    if (state.strict && this.isAdElement(node)) {
      return true;
    }

    return false;
  },

  /**
   * Detect inline ad scripts by heuristics (uses compiled regex)
   * @param {string} text
   * @returns {boolean}
   */
  isInlineAdScript: function(text) {
    if (!text || typeof text !== 'string') return false;
    var lower = text.toLowerCase();
    
    // Use standard ad regex for inline scripts
    return AD_REGEX.test(lower);
  },

  /**
   * Check if URL is ad-related (with caching and compiled regex)
   * @param {string} url
   * @returns {boolean}
   */
  isAdURL: function(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Check cache first
    if (state.urlCheckCache[url] !== undefined) {
      return state.urlCheckCache[url];
    }
    
    var lower = url.toLowerCase();

    // Check allowlist
    if (this.isAllowlisted(lower)) {
      state.urlCheckCache[url] = false;
      return false;
    }

    // Use compiled regex for fast pattern matching
    var regex = state.strict ? STRICT_AD_REGEX : AD_REGEX;
    var result = regex.test(lower);
    
    // Cache result
    state.urlCheckCache[url] = result;
    return result;
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

    try {
      // Common analytics stubs
      if (!win.gtag) win.gtag = function() {};
      if (!win.ga) win.ga = function() {};
      if (!win.fbq) win.fbq = function() {};
      if (!win._gaq) win._gaq = [];
      if (!win.dataLayer) win.dataLayer = [];
      if (win.dataLayer && !win.dataLayer.push) {
        win.dataLayer.push = function() {};
      }
      if (!win.__tcfapi) win.__tcfapi = function() {};
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
    
    // Fallback periodic cleanup if MutationObserver not available
    if (typeof MutationObserver === 'undefined') {
      this.startCleanupInterval(doc);
      return;
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
            self.removeCookieBanners(doc);
          }, 100);
        }
      });
      
      var target = doc.body || doc.documentElement;
      if (!target) {
        this.startCleanupInterval(doc);
        return;
      }

      state.observer.observe(target, {
        childList: true,
        subtree: true,
      });
      
      console.log('TizenPortal [AdBlock]: DOM observer active');
    } catch (err) {
      console.warn('TizenPortal [AdBlock]: Could not observe DOM:', err.message);
      this.startCleanupInterval(doc);
    }
  },

  /**
   * Start periodic cleanup interval (fallback)
   * @param {Document} doc
   */
  startCleanupInterval: function(doc) {
    if (state.cleanupInterval) return;
    state.cleanupInterval = setInterval(function() {
      try {
        if (doc && doc.body && this.removeAds) {
          // Remove ads periodically (fallback)
          this.removeAds(doc);
          this.removeCookieBanners(doc);
        }
      } catch (err) {
        // Ignore
      }
    }.bind(this), 2500);

    console.log('TizenPortal [AdBlock]: Cleanup interval active');
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
    if (state.strict) {
      adPatterns = adPatterns.concat(['promoted', 'promo', 'sponsor', 'advert', 'ad-', 'ads-']);
    }
    
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
    try {
      if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
      }
    } catch (err) {
      console.warn('TizenPortal [AdBlock]: cleanup observer error:', err.message);
    }

    try {
      if (state.cleanupInterval) {
        clearInterval(state.cleanupInterval);
        state.cleanupInterval = null;
      }
    } catch (err) {
      console.warn('TizenPortal [AdBlock]: cleanup interval error:', err.message);
    }

    if (state.domIntercepted) {
      try {
        var proto = Element && Element.prototype;
        if (proto) {
          if (state.originalAppendChild) proto.appendChild = state.originalAppendChild;
          if (state.originalInsertBefore) proto.insertBefore = state.originalInsertBefore;
          if (state.originalReplaceChild) proto.replaceChild = state.originalReplaceChild;
        }
      } catch (err) {
        console.warn('TizenPortal [AdBlock]: cleanup DOM intercept error:', err.message);
      }
      state.domIntercepted = false;
      state.originalAppendChild = null;
      state.originalInsertBefore = null;
      state.originalReplaceChild = null;
    }

    try {
      if (state.strictStyleEl && state.strictStyleEl.parentNode) {
        state.strictStyleEl.parentNode.removeChild(state.strictStyleEl);
      }
    } catch (err) {
      console.warn('TizenPortal [AdBlock]: cleanup strict style error:', err.message);
    }
    state.strictStyleEl = null;

    try {
      if (state.cookieStyleEl && state.cookieStyleEl.parentNode) {
        state.cookieStyleEl.parentNode.removeChild(state.cookieStyleEl);
      }
    } catch (err) {
      console.warn('TizenPortal [AdBlock]: cleanup cookie style error:', err.message);
    }
    state.cookieStyleEl = null;
    
    try {
      if (this._cleanTimeout) {
        clearTimeout(this._cleanTimeout);
        this._cleanTimeout = null;
      }
    } catch (err) {
      console.warn('TizenPortal [AdBlock]: cleanup timeout error:', err.message);
    }
  },
};
