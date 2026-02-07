/**
 * Default Bundle
 * 
 * Fallback bundle used when no site-specific bundle is configured.
 * Provides basic functionality without site-specific customizations.
 */

import defaultStyles from './style.css';

function tpLog() {
  if (window.TizenPortal && typeof TizenPortal.log === 'function') {
    TizenPortal.log.apply(TizenPortal, arguments);
  } else if (console && typeof console.log === 'function') {
    console.log.apply(console, arguments);
  }
}

function tpWarn() {
  if (window.TizenPortal && typeof TizenPortal.warn === 'function') {
    TizenPortal.warn.apply(TizenPortal, arguments);
  } else if (console && typeof console.warn === 'function') {
    console.warn.apply(console, arguments);
  }
}

export default {
  name: 'default',
  displayName: 'Default',
  description: 'Basic TV browser support using global features',
  
  /**
   * CSS to inject
   */
  style: defaultStyles,

  /**
   * Called before page content loads
   * @param {Window} win
   * @param {Object} card
   */
  onBeforeLoad: function(win, card) {
    tpLog('TizenPortal [default]: Loading', card.url);
  },

  /**
   * Called after page content has loaded
   * @param {Window} win
   * @param {Object} card
   */
  onAfterLoad: function(win, card) {
    tpLog('TizenPortal [default]: Loaded', card.url);
  },

  /**
   * Called when bundle is activated
   * @param {Window} win
   * @param {Object} card
   */
  onActivate: function(win, card) {
    tpLog('TizenPortal [default]: Activated');
  },

  /**
   * Called when bundle is deactivated
   * @param {Window} win
   * @param {Object} card
   */
  onDeactivate: function(win, card) {
    tpLog('TizenPortal [default]: Deactivated');
  },

  /**
   * Called when navigation occurs
   * @param {string} url
   */
  onNavigate: function(url) {
    tpLog('TizenPortal [default]: Navigated to', url);
  },

  /**
   * Called on keydown events
   * @param {KeyboardEvent} event
   * @returns {boolean} True to consume event
   */
  onKeyDown: function(event) {
    return false; // Let default handling proceed
  },
};
