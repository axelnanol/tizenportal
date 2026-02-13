/**
 * Text Scale Feature
 * 
 * Provides relative font-size scaling for improved TV legibility.
 * Uses percentage-based scaling to maintain design hierarchy.
 * Moved from core polyfills to allow user configuration.
 */

/**
 * Scale presets
 * Uses transform-based scaling to preserve relative sizing
 */
var SCALE_PRESETS = {
  off: 1.0,      // No scaling (100%)
  small: 1.1,    // Small boost (110%)
  medium: 1.25,  // Medium boost (125%)
  large: 1.5,    // Large boost (150%)
};

export default {
  name: 'textScale',
  displayName: 'Text Scale',
  
  /**
   * Get CSS for text scaling
   * @param {string} level - Scale level: 'off', 'small', 'medium', 'large'
   */
  getCSS: function(level) {
    var scale = SCALE_PRESETS[level] || 1.0;
    
    // If scale is 1.0, return empty (no changes needed)
    if (scale === 1.0) {
      return '';
    }
    
    // Apply relative scaling to all text elements
    // Uses CSS transform for better compatibility with Chrome 47
    // Also increases line-height and letter-spacing proportionally
    var css = [
      '/* TizenPortal Text Scale (' + level + ') */',
      'body, p, span, div, li, td, th, a, h1, h2, h3, h4, h5, h6, label {',
      '  font-size: ' + (scale * 100) + '% !important;',
      '}',
      '',
      '/* Improve readability with better spacing */',
      'body, p, div, li, td, th {',
      '  line-height: ' + (1.4 + (scale - 1) * 0.4) + ' !important;',
      '}',
      '',
      '/* Letter spacing for large text */',
      'p, li, td, th, span {',
      '  letter-spacing: ' + ((scale - 1) * 0.02) + 'em !important;',
      '}',
      '',
      '/* Ensure interactive elements are touch-friendly */',
      'button, input, select, textarea {',
      '  min-height: ' + Math.round(44 * scale) + 'px !important;',
      '  font-size: ' + (scale * 100) + '% !important;',
      '  padding: ' + Math.round(8 * scale) + 'px ' + Math.round(12 * scale) + 'px !important;',
      '}',
      '',
      '/* Constrain long text for readability */',
      'p, li, td, th {',
      '  max-width: 1200px !important;',
      '}',
      '',
      '/* Enhance link visibility */',
      'a {',
      '  text-decoration: underline !important;',
      '  padding: ' + Math.round(2 * scale) + 'px !important;',
      '}',
    ];
    
    return css.join('\n');
  },
  
  /**
   * Apply text scaling to document
   * @param {Document} doc
   * @param {string} level - Scale level
   */
  apply: function(doc, level) {
    if (!doc) return;
    
    // Remove existing style first
    this.remove(doc);
    
    // Get CSS for this level
    var css = this.getCSS(level || 'off');
    
    // If no CSS (level is 'off'), don't inject anything
    if (!css) return;
    
    try {
      var style = doc.createElement('style');
      style.id = 'tp-text-scale';
      style.textContent = css;
      
      var head = doc.head || doc.documentElement;
      if (head) {
        head.appendChild(style);
      }
    } catch (err) {
      if (window.TizenPortal) {
        TizenPortal.warn('Text Scale: Failed to apply:', err.message);
      }
    }
  },
  
  /**
   * Remove text scaling from document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    
    try {
      var style = doc.getElementById('tp-text-scale');
      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
      }
    } catch (err) {
      if (window.TizenPortal) {
        TizenPortal.warn('Text Scale: Failed to remove:', err.message);
      }
    }
  },
};
