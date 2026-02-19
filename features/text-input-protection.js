/**
 * Text Input Protection Feature
 *
 * Injects CSS for the TV-friendly text input wrapper. The wrapper
 * intercepts focus so that navigating to a text field with the remote
 * doesn't immediately open the on-screen keyboard; the user must press
 * Enter (or click/tap) to activate editing.
 *
 * CSS mirrors the portal's inline-edit approach: the display span looks
 * like a normal field value and the real <input> is revealed in-place on
 * activation.
 */

import { injectCSS, removeCSS } from '../core/utils.js';

export default {
  name: 'wrapTextInputs',
  displayName: 'Text Input Protection',

  /**
   * CSS injected into every guarded page.
   */
  getCSS: function() {
    return [
      '/* TizenPortal Text Input Protection */',
      '',
      '/* Wrapper - takes over the layout position of the original input */',
      '.tp-input-wrapper {',
      '  display: -webkit-box !important;',
      '  display: -webkit-flex !important;',
      '  display: flex !important;',
      '  -webkit-box-align: center !important;',
      '  -webkit-align-items: center !important;',
      '  align-items: center !important;',
      '  position: relative !important;',
      '  width: 100% !important;',
      '  background: transparent !important;',
      '  cursor: pointer !important;',
      '}',
      '',
      '/* Display span - shows the current value or placeholder */',
      '.tp-input-display {',
      '  display: block !important;',
      '  -webkit-box-flex: 1 !important;',
      '  -webkit-flex: 1 !important;',
      '  flex: 1 !important;',
      '  overflow: hidden !important;',
      '  text-overflow: ellipsis !important;',
      '  white-space: nowrap !important;',
      '  pointer-events: none !important;',
      '  opacity: 0.6 !important;',
      '}',
      '',
      '/* Value present - restore full opacity */',
      '.tp-input-display.has-value {',
      '  opacity: 1 !important;',
      '}',
      '',
      '/* Real input - hidden until activated; shown inline like the portal */',
      '.tp-input-wrapper input.tp-wrapped {',
      '  display: none !important;',
      '}',
      '',
      '.tp-input-wrapper.editing .tp-input-display {',
      '  display: none !important;',
      '}',
      '',
      '.tp-input-wrapper.editing input.tp-wrapped {',
      '  display: block !important;',
      '  -webkit-box-flex: 1 !important;',
      '  -webkit-flex: 1 !important;',
      '  flex: 1 !important;',
      '}',
    ].join('\n');
  },

  /**
   * Inject wrapper CSS into the given document.
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;
    injectCSS(doc, 'tp-text-input-protection', this.getCSS());
    TizenPortal.log('Text input protection: CSS applied');
  },

  /**
   * Remove wrapper CSS from the given document.
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    removeCSS(doc, 'tp-text-input-protection');
    TizenPortal.log('Text input protection: CSS removed');
  },
};
