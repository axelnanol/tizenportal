/**
 * Scroll-into-View Feature
 * 
 * Automatically scrolls focused elements into view with TV-friendly margins.
 * Wraps existing focus manager behavior.
 */

export default {
  name: 'scrollIntoView',
  displayName: 'Scroll-into-View',
  
  /**
   * Whether feature is currently active
   */
  _active: false,
  
  /**
   * Apply feature
   * Enables scroll-into-view tracking in focus manager
   */
  apply: function() {
    if (this._active) return;
    
    // Focus manager already has scroll-into-view built in
    // This feature just enables/disables it
    if (window.TizenPortal && window.TizenPortal.focus) {
      TizenPortal.focus.setScrollEnabled(true);
      this._active = true;
      TizenPortal.log('Scroll-into-view: Enabled');
    }
  },
  
  /**
   * Remove feature
   * Disables scroll-into-view tracking
   */
  remove: function() {
    if (!this._active) return;
    
    if (window.TizenPortal && window.TizenPortal.focus) {
      TizenPortal.focus.setScrollEnabled(false);
      this._active = false;
      TizenPortal.log('Scroll-into-view: Disabled');
    }
  },
};
