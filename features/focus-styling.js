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
  _ringWidthPx: 3,
  _ringOffsetPx: 2,
  _ringRadiusPx: 10,
  _ringShadowCss: '0 0 0 3px rgba(0, 178, 255, 0.45), 0 8px 24px rgba(0, 0, 0, 0.5)',

  getRingVisualConfig: function(mode) {
    var color = '#00b2ff';
    var ringAlpha = 0.45;
    var ringWidth = 3;
    var ringOffset = 2;
    var ringRadius = 10;
    if (mode === 'high') {
      color = '#fcd34d';
      ringAlpha = 0.7;
      ringWidth = 4;
    }
    var ringShadow = '0 0 0 ' + ringWidth + 'px ' + hexToRgba(color, ringAlpha) + ', 0 8px 24px rgba(0, 0, 0, 0.5)';
    return {
      color: color,
      width: ringWidth,
      offset: ringOffset,
      radius: ringRadius,
      shadow: ringShadow,
    };
  },

  getCSS: function(mode) {
    var ring = this.getRingVisualConfig(mode);
    var color = ring.color;
    var ringWidth = ring.width;
    var ringOffset = ring.offset;
    var ringRadius = ring.radius;
    var ringShadow = ring.shadow;

    return [
      '/* TizenPortal Focus Styling */',
      ':focus,',
      'body.tp-focus-mode-on :focus,',
      'body.tp-focus-mode-high :focus {',
      '  outline: ' + ringWidth + 'px solid ' + color + ' !important;',
      '  outline-offset: ' + ringOffset + 'px !important;',
      '  box-shadow: ' + ringShadow + ' !important;',
      '  -webkit-border-radius: ' + ringRadius + 'px !important;',
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
      '  -webkit-border-radius: ' + ringRadius + 'px !important;',
      '  border-radius: ' + ringRadius + 'px !important;',
      '}',
      '',
      '#tp-focus-ring-overlay {',
      '  position: fixed !important;',
      '  pointer-events: none !important;',
      '  z-index: 2147483646 !important;',
      '  box-sizing: border-box !important;',
      '  outline: none !important;',
      '  border: none !important;',
      '  -webkit-border-radius: ' + ringRadius + 'px !important;',
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
    if (target.nodeType === 1) return target;
    return null;
  },

  ensureRingOverlay: function(doc) {
    if (this._ringOverlay && this._ringOverlay.parentNode) return this._ringOverlay;
    var targetDoc = doc || document;
    var overlay = targetDoc.createElement('div');
    overlay.id = 'tp-focus-ring-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    (targetDoc.body || targetDoc.documentElement).appendChild(overlay);
    setImportantStyle(overlay, 'outline', 'none');
    setImportantStyle(overlay, 'border', 'none');
    setImportantStyle(overlay, 'box-sizing', 'border-box');
    setImportantStyle(overlay, '-webkit-border-radius', (this._ringRadiusPx || 10) + 'px');
    setImportantStyle(overlay, 'border-radius', (this._ringRadiusPx || 10) + 'px');
    setImportantStyle(overlay, 'box-shadow', this._ringShadowCss || 'none');
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

    var inset = this._ringOffsetPx || 0;
    setImportantStyle(this._ringOverlay, 'top', (rect.top - inset) + 'px');
    setImportantStyle(this._ringOverlay, 'left', (rect.left - inset) + 'px');
    setImportantStyle(this._ringOverlay, 'width', (width + inset * 2) + 'px');
    setImportantStyle(this._ringOverlay, 'height', (height + inset * 2) + 'px');
    setImportantStyle(this._ringOverlay, '-webkit-border-radius', (this._ringRadiusPx || 10) + 'px');
    setImportantStyle(this._ringOverlay, 'border-radius', (this._ringRadiusPx || 10) + 'px');
    setImportantStyle(this._ringOverlay, 'box-shadow', this._ringShadowCss || 'none');
    this._ringOverlay.classList.add('tp-visible');
  },

  installFocusProxy: function(doc) {
    var self = this;
    this.removeFocusProxy(doc);
    this._focusProxyHandler = function(event) {
      var target = event && event.target ? event.target : null;
      var proxy = self.resolveFocusProxy(target);
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
    var ring = this.getRingVisualConfig(mode);
    this._ringWidthPx = ring.width;
    this._ringOffsetPx = ring.offset;
    this._ringRadiusPx = ring.radius;
    this._ringShadowCss = ring.shadow;
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

function setImportantStyle(element, property, value) {
  if (!element || !element.style) return;
  try {
    element.style.setProperty(property, value, 'important');
  } catch (e) {
    // ignore
  }
}
