/**
 * Default Bundle
 * 
 * Fallback bundle used when no site-specific bundle is configured.
 * Provides basic functionality without site-specific customizations.
 */

import defaultStyles from './style.css';
import { log as tpLog } from '../../core/utils.js';

export default {
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
