/**
 * Example Bundle: Element Registration System Demo
 * 
 * Demonstrates all element registration operations with practical examples.
 * This bundle shows how to use declarative element manipulation to reduce
 * code complexity and improve maintainability.
 */

export default {
  name: 'example-elements',
  
  /**
   * Activate bundle - register element manipulations
   */
  onActivate: function(window, card) {
    console.log('Example Bundle: Activating element registration demo');
    
    // ========================================================================
    // 1. FOCUSABLE OPERATION
    // Make elements keyboard/remote navigable
    // ========================================================================
    
    // Make all links in navigation focusable with vertical navigation
    window.TizenPortal.elements.register({
      selector: 'nav a',
      operation: 'focusable',
      nav: 'vertical'
    });
    
    // Make toolbar buttons focusable with horizontal navigation
    window.TizenPortal.elements.register({
      selector: '.toolbar button',
      operation: 'focusable',
      nav: 'horizontal',
      classes: ['tp-spacing']
    });
    
    // Make all buttons focusable (generic fallback)
    window.TizenPortal.elements.register({
      selector: 'button',
      operation: 'focusable'
    });
    
    // ========================================================================
    // 2. CLASS OPERATION
    // Add/remove CSS classes for styling
    // ========================================================================
    
    // Add utility classes to cards
    window.TizenPortal.elements.register({
      selector: '.card',
      operation: 'class',
      classes: ['tp-card', 'tp-focusable']
    });
    
    // Remove unwanted classes
    window.TizenPortal.elements.register({
      selector: '.mobile-only',
      operation: 'class',
      classes: ['visible', 'show'],
      remove: true
    });
    
    // ========================================================================
    // 3. ATTRIBUTE OPERATION
    // Set HTML attributes for accessibility and behavior
    // ========================================================================
    
    // Add ARIA labels to icon-only buttons
    window.TizenPortal.elements.register({
      selector: 'button[aria-label=""]',
      operation: 'attribute',
      attributes: {
        'aria-label': 'Action button',
        'role': 'button'
      }
    });
    
    // Add data attributes for tracking
    window.TizenPortal.elements.register({
      selector: '.interactive',
      operation: 'attribute',
      attributes: {
        'data-tp-interactive': 'true',
        'data-bundle': 'example-elements'
      }
    });
    
    // ========================================================================
    // 4. STYLE OPERATION
    // Apply inline CSS styles for TV layout
    // ========================================================================
    
    // Position header for TV viewing
    window.TizenPortal.elements.register({
      selector: 'header',
      operation: 'style',
      styles: {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        zIndex: '100',
        backgroundColor: 'rgba(0, 0, 0, 0.9)'
      },
      important: true
    });
    
    // Adjust card sizing for 1920px viewport
    window.TizenPortal.elements.register({
      selector: '.card',
      operation: 'style',
      styles: {
        minWidth: '280px',
        minHeight: '160px',
        margin: '8px'
      }
    });
    
    // ========================================================================
    // 5. HIDE OPERATION
    // Hide elements not needed on TV
    // ========================================================================
    
    // Hide mobile-specific UI
    window.TizenPortal.elements.register({
      selector: '.mobile-menu',
      operation: 'hide'
    });
    
    window.TizenPortal.elements.register({
      selector: '.touch-hint',
      operation: 'hide'
    });
    
    // Hide advertisements
    window.TizenPortal.elements.register({
      selector: '.ad-banner',
      operation: 'hide'
    });
    
    // ========================================================================
    // 6. SHOW OPERATION
    // Show elements that might be hidden by default
    // ========================================================================
    
    // Show desktop-only features
    window.TizenPortal.elements.register({
      selector: '.desktop-only',
      operation: 'show'
    });
    
    // ========================================================================
    // 7. REMOVE OPERATION (use sparingly)
    // Remove elements from DOM completely
    // ========================================================================
    
    // Remove cookie banners that interfere with navigation
    window.TizenPortal.elements.register({
      selector: '.cookie-banner',
      operation: 'remove'
    });
    
    // ========================================================================
    // ADVANCED: Conditional Registration
    // Only apply operation if element meets criteria
    // ========================================================================
    
    window.TizenPortal.elements.register({
      selector: '[role="button"]',
      operation: 'focusable',
      condition: function(element) {
        // Only make focusable if not already
        return !element.hasAttribute('tabindex');
      }
    });
    
    // ========================================================================
    // ADVANCED: Scoped Registration
    // Limit operation to specific container
    // ========================================================================
    
    window.TizenPortal.elements.register({
      selector: 'a',
      operation: 'focusable',
      container: '#main-content'  // Only links in main content
    });
    
    // ========================================================================
    // ADVANCED: Immediate Processing
    // Process critical elements without debounce delay
    // ========================================================================
    
    window.TizenPortal.elements.register({
      selector: '.hero-button',
      operation: 'focusable',
      immediate: true  // Process now, don't wait
    });
    
    console.log('Example Bundle: All element registrations complete');
    console.log('Example Bundle: Observer watching for dynamic content');
  },
  
  /**
   * Deactivate bundle - cleanup is automatic
   */
  onDeactivate: function(window, card) {
    console.log('Example Bundle: Deactivating');
    // Element registrations are automatically cleared by core
    // Only clean up custom imperative code here
  }
};
