/**
 * Focus Styling Feature
 * 
 * Provides blue outline focus indicators for TV navigation.
 * Extracted from default bundle.
 */

import { injectCSS, removeCSS } from '../core/utils.js';

export default {
  name: 'focusStyling',
  displayName: 'Focus Styling',
  _focusProxyHandler: null,
  _focusedProxy: null,
  
  /**
   * CSS to inject
   */
  getCSS: function(mode) {
    var color = '#00b2ff';
    var ringAlpha = 0.45;
    var ringWidth = 3;
    if (mode === 'high') {
      color = '#fcd34d';
      ringAlpha = 0.7;
      ringWidth = 4;
    }
    var ringShadow = '0 0 0 ' + ringWidth + 'px ' + hexToRgba(color, ringAlpha) + ', 0 8px 24px rgba(0, 0, 0, 0.5)';
    var outlineColor = mode === 'high' ? '#fcd34d' : '#00b2ff';
    var outlineWidth = mode === 'high' ? 4 : 3;

    return [
      '/* TizenPortal Focus Styling */',
      ':focus,',
      'body.tp-focus-mode-on :focus,',
      'body.tp-focus-mode-high :focus {',
      '  outline: ' + outlineWidth + 'px solid ' + outlineColor + ' !important;',
      '  outline-offset: 2px !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  border-radius: 10px !important;',
      '}',
      '',
      'a:focus,',
      'button:focus,',
      '[role="button"]:focus,',
      '[role="link"]:focus,',
      '[role="menuitem"]:focus,',
      '[role="tab"]:focus,',
      '[role="option"]:focus,',
      '[tabindex]:focus,',
      'input:focus,',
      'select:focus,',
      'textarea:focus {',
      '  outline: ' + outlineWidth + 'px solid ' + outlineColor + ' !important;',
      '  outline-offset: 2px !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  border-radius: 10px !important;',
      '}',
      '',
      '.tp-focus-proxy {',
      '  outline: ' + outlineWidth + 'px solid ' + outlineColor + ' !important;',
      '  outline-offset: 2px !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  border-radius: 10px !important;',
      '}',
      '',
      '*:focus {',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
    ].join('\n');
  },

  resolveFocusProxy: function(target) {
    if (!target) return null;
    var node = target;
    while (node && node !== document && node.nodeType === 1) {
      var tag = node.tagName ? node.tagName.toUpperCase() : '';
      var role = node.getAttribute ? node.getAttribute('role') : null;
      var tabindex = node.getAttribute ? node.getAttribute('tabindex') : null;
      var href = node.getAttribute ? node.getAttribute('href') : null;
      if (
        tag === 'A' ||
        tag === 'BUTTON' ||
        tag === 'INPUT' ||
        tag === 'SELECT' ||
        tag === 'TEXTAREA' ||
        role === 'button' ||
        role === 'link' ||
        role === 'menuitem' ||
        role === 'tab' ||
        role === 'option' ||
        (tabindex !== null && tabindex !== '-1') ||
        (tag === 'A' && href)
      ) {
        return node;
      }
      node = node.parentNode;
    }
    return target;
  },

  installFocusProxy: function(doc) {
    var self = this;
    this.removeFocusProxy(doc);
    this._focusProxyHandler = function(event) {
      var target = event && event.target ? event.target : null;
      var proxy = self.resolveFocusProxy(target);
      if (self._focusedProxy && self._focusedProxy !== proxy) {
        try { self._focusedProxy.classList.remove('tp-focus-proxy'); } catch (e) { /* ignore */ }
      }
      if (proxy && proxy.classList) {
        try { proxy.classList.add('tp-focus-proxy'); } catch (e2) { /* ignore */ }
      }
      self._focusedProxy = proxy || null;
    };
    doc.addEventListener('focusin', this._focusProxyHandler, true);
  },

  removeFocusProxy: function(doc) {
    if (doc && this._focusProxyHandler) {
      try { doc.removeEventListener('focusin', this._focusProxyHandler, true); } catch (e) { /* ignore */ }
    }
    this._focusProxyHandler = null;
    if (this._focusedProxy && this._focusedProxy.classList) {
      try { this._focusedProxy.classList.remove('tp-focus-proxy'); } catch (e2) { /* ignore */ }
    }
    this._focusedProxy = null;
  },
  
  /**
   * Apply feature to document
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;
    var mode = arguments.length > 1 ? arguments[1] : 'on';
    this.remove(doc);
    if (mode === 'off') return;
    injectCSS(doc, 'tp-focus-styling', this.getCSS(mode));
    this.installFocusProxy(doc);
    TizenPortal.log('Focus styling applied: ' + mode);
  },
  
  /**
   * Remove feature from document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    this.removeFocusProxy(doc);
    removeCSS(doc, 'tp-focus-styling');
    TizenPortal.log('Focus styling removed');
  },
};

function hexToRgba(hex, alpha) {
  var raw = (hex || '').replace('#', '');
  if (raw.length === 3) {
    raw = raw.charAt(0) + raw.charAt(0) + raw.charAt(1) + raw.charAt(1) + raw.charAt(2) + raw.charAt(2);
  }
  var value = parseInt(raw, 16);
  if (isNaN(value)) {
    return 'rgba(0, 178, 255, ' + alpha + ')';
  }
  var r = (value >> 16) & 255;
  var g = (value >> 8) & 255;
  var b = value & 255;
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}
