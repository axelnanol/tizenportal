/**
 * Focus Styling Feature
 *
 * Provides visible focus indicators for TV navigation.
 */

import { injectCSS, removeCSS } from '../core/utils.js';

export default {
  name: 'focusStyling',
  displayName: 'Focus Styling',
  _focusProxyHandler: null,
  _focusedProxy: null,
  _ringOverlay: null,
  _ringUpdateHandler: null,
  _ringScrollHandler: null,
  _ringResizeHandler: null,
  _ringMode: 'on',

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
    var ringOffset = 2;
    var ringRadius = 10;

    return [
      '/* TizenPortal Focus Styling */',
      ':focus,',
      'body.tp-focus-mode-on :focus,',
      'body.tp-focus-mode-high :focus {',
      '  outline: ' + ringWidth + 'px solid ' + color + ' !important;',
      '  outline-offset: ' + ringOffset + 'px !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  border-radius: ' + ringRadius + 'px !important;',
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
      '  outline: ' + ringWidth + 'px solid ' + color + ' !important;',
      '  outline-offset: ' + ringOffset + 'px !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  border-radius: ' + ringRadius + 'px !important;',
      '}',
      '',
      '.tp-focus-proxy {',
      '  outline: ' + ringWidth + 'px solid ' + color + ' !important;',
      '  outline-offset: ' + ringOffset + 'px !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  border-radius: ' + ringRadius + 'px !important;',
      '}',
      '',
      '#tp-focus-ring-overlay {',
      '  position: fixed !important;',
      '  pointer-events: none !important;',
      '  z-index: 2147483646 !important;',
      '  box-sizing: border-box !important;',
      '  outline: ' + ringWidth + 'px solid ' + color + ' !important;',
      '  outline-offset: ' + ringOffset + 'px !important;',
      '  border: none !important;',
      '  border-radius: ' + ringRadius + 'px !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  opacity: 0 !important;',
      '  transition: opacity 0.08s linear !important;',
      '}',
      '#tp-focus-ring-overlay.tp-visible {',
      '  opacity: 1 !important;',
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

  ensureRingOverlay: function(doc) {
    if (this._ringOverlay && this._ringOverlay.parentNode) return this._ringOverlay;
    var targetDoc = doc || document;
    var overlay = targetDoc.createElement('div');
    overlay.id = 'tp-focus-ring-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    (targetDoc.body || targetDoc.documentElement).appendChild(overlay);
    this._ringOverlay = overlay;
    return overlay;
  },

  hideRingOverlay: function() {
    if (!this._ringOverlay) return;
    this._ringOverlay.classList.remove('tp-visible');
    this._ringOverlay.style.width = '0px';
    this._ringOverlay.style.height = '0px';
  },

  isCssRingLikelyVisible: function(target) {
    if (!target || !target.ownerDocument || !target.ownerDocument.defaultView) return false;
    var view = target.ownerDocument.defaultView;
    var computed = null;
    try {
      computed = view.getComputedStyle(target);
    } catch (e) {
      return false;
    }
    if (!computed) return false;

    var outlineStyle = (computed.outlineStyle || '').toLowerCase();
    var outlineWidth = parseCssPx(computed.outlineWidth);
    var outlineColor = (computed.outlineColor || '').toLowerCase();
    var hasOutline = outlineStyle !== 'none' && outlineWidth > 0 && !isTransparentCssColor(outlineColor);

    var boxShadow = (computed.boxShadow || '').toLowerCase();
    var hasShadow = boxShadow && boxShadow !== 'none' && boxShadow.indexOf('rgba(0, 0, 0, 0)') === -1;

    return hasOutline || hasShadow;
  },

  getTargetRingRadius: function(target) {
    if (!target || !target.ownerDocument || !target.ownerDocument.defaultView) return '10px';
    try {
      var computed = target.ownerDocument.defaultView.getComputedStyle(target);
      var radius = computed && computed.borderRadius ? computed.borderRadius : '';
      if (radius && radius !== '0px' && radius !== '0px 0px 0px 0px') {
        return radius;
      }
    } catch (e) {
      // ignore
    }
    return '10px';
  },

  updateRingOverlay: function() {
    if (!this._ringOverlay) return;

    var target = document.activeElement || this._focusedProxy;
    if (!target || target === document.body || !target.getBoundingClientRect) {
      this.hideRingOverlay();
      return;
    }

    if (this.isCssRingLikelyVisible(target)) {
      this.hideRingOverlay();
      return;
    }

    var rect = target.getBoundingClientRect();
    var width = rect.width;
    var height = rect.height;
    if (width <= 0 || height <= 0) {
      this.hideRingOverlay();
      return;
    }

    this._ringOverlay.style.top = rect.top + 'px';
    this._ringOverlay.style.left = rect.left + 'px';
    this._ringOverlay.style.width = width + 'px';
    this._ringOverlay.style.height = height + 'px';
    this._ringOverlay.style.borderRadius = this.getTargetRingRadius(target);
    this._ringOverlay.classList.add('tp-visible');
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
      self.updateRingOverlay();
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
    this.hideRingOverlay();
  },

  installRingTracking: function(doc) {
    var self = this;
    this.removeRingTracking(doc);
    this.ensureRingOverlay(doc);

    this._ringUpdateHandler = function() { self.updateRingOverlay(); };
    this._ringScrollHandler = function() { self.updateRingOverlay(); };
    this._ringResizeHandler = function() { self.updateRingOverlay(); };

    doc.addEventListener('focusin', this._ringUpdateHandler, true);
    doc.addEventListener('focusout', this._ringUpdateHandler, true);
    window.addEventListener('scroll', this._ringScrollHandler, true);
    window.addEventListener('resize', this._ringResizeHandler, true);

    this.updateRingOverlay();
  },

  removeRingTracking: function(doc) {
    var targetDoc = doc || document;

    if (this._ringUpdateHandler) {
      try { targetDoc.removeEventListener('focusin', this._ringUpdateHandler, true); } catch (e) { /* ignore */ }
      try { targetDoc.removeEventListener('focusout', this._ringUpdateHandler, true); } catch (e2) { /* ignore */ }
    }
    if (this._ringScrollHandler) {
      try { window.removeEventListener('scroll', this._ringScrollHandler, true); } catch (e3) { /* ignore */ }
    }
    if (this._ringResizeHandler) {
      try { window.removeEventListener('resize', this._ringResizeHandler, true); } catch (e4) { /* ignore */ }
    }

    this._ringUpdateHandler = null;
    this._ringScrollHandler = null;
    this._ringResizeHandler = null;

    if (this._ringOverlay && this._ringOverlay.parentNode) {
      try { this._ringOverlay.parentNode.removeChild(this._ringOverlay); } catch (e5) { /* ignore */ }
    }
    this._ringOverlay = null;
  },

  apply: function(doc) {
    if (!doc) return;
    var mode = arguments.length > 1 ? arguments[1] : 'on';
    this._ringMode = mode;
    this.remove(doc);
    if (mode === 'off') return;
    injectCSS(doc, 'tp-focus-styling', this.getCSS(mode));
    this.installFocusProxy(doc);
    this.installRingTracking(doc);
    TizenPortal.log('Focus styling applied: ' + mode);
  },

  remove: function(doc) {
    if (!doc) return;
    this.removeFocusProxy(doc);
    this.removeRingTracking(doc);
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

function parseCssPx(value) {
  if (!value) return 0;
  var parsed = parseFloat(String(value).replace('px', ''));
  return isNaN(parsed) ? 0 : parsed;
}

function isTransparentCssColor(value) {
  if (!value) return true;
  var color = String(value).toLowerCase();
  return color === 'transparent' || color === 'rgba(0, 0, 0, 0)' || color === 'rgba(0,0,0,0)';
}
