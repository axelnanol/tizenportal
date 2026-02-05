/**
 * GPU Acceleration Hints Feature
 * 
 * Adds CSS hints for hardware acceleration on animated elements.
 * Improves scrolling and animation performance.
 */

export default {
  name: 'gpuHints',
  displayName: 'GPU Acceleration',
  
  /**
   * CSS to inject
   */
  getCSS: function() {
    return [
      '/* TizenPortal GPU Acceleration Hints */',
      '',
      '/* Force GPU layers for common animated elements */',
      '[class*="modal"],',
      '[class*="dialog"],',
      '[class*="menu"],',
      '[class*="dropdown"],',
      '[class*="popup"],',
      '[class*="toast"],',
      '[class*="notification"],',
      '[class*="overlay"] {',
      '  transform: translateZ(0);',
      '  will-change: transform, opacity;',
      '}',
      '',
      '/* Smooth scrolling containers */',
      '[class*="scroll"],',
      '[class*="list"],',
      '[class*="grid"] {',
      '  -webkit-overflow-scrolling: touch;',
      '}',
      '',
      '/* Reduce repaints */',
      'img, video, canvas {',
      '  backface-visibility: hidden;',
      '}',
    ].join('\n');
  },
  
  /**
   * Apply feature to iframe document
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;
    
    var style = doc.createElement('style');
    style.id = 'tp-gpu-hints';
    style.textContent = this.getCSS();
    
    var head = doc.head || doc.documentElement;
    if (head) {
      head.appendChild(style);
      TizenPortal.log('GPU hints: Applied hardware acceleration');
    }
  },
  
  /**
   * Remove feature from iframe document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    
    var style = doc.getElementById('tp-gpu-hints');
    if (style) {
      style.parentNode.removeChild(style);
      TizenPortal.log('GPU hints: Removed');
    }
  },
};
