# Troubleshooting TizenPortal

This guide helps you diagnose and fix common issues with TizenPortal.

---

## Quick Fixes

Before diving into specific issues, try these quick fixes:

1. **Reload the page** — Long-press 🔴 Red
2. **Try safe mode** — Long-press 🔵 Blue
3. **Return to portal** — Press 🟡 Yellow
4. **Check diagnostics** — Press 🔵 Blue to view logs
5. **Restart TizenBrew** — Exit and relaunch the app

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Portal Problems](#portal-problems)
3. [Site Navigation Issues](#site-navigation-issues)
4. [Display & Layout Issues](#display--layout-issues)
5. [Input Problems](#input-problems)
6. [Performance Issues](#performance-issues)
7. [Bundle Issues](#bundle-issues)
8. [Network Issues](#network-issues)
9. [Advanced Troubleshooting](#advanced-troubleshooting)

---

## Installation Issues

### TizenPortal won't install

**Symptoms:**
- Error when adding module
- Module doesn't appear in list

**Solutions:**

1. **Check the module name** — Ensure you typed it correctly:
   ```
   alexnolan/tizenportal@0443
   ```

2. **Check your internet connection** — TizenBrew needs to download from GitHub

3. **Try a different version** — Check the [releases page](https://github.com/alexnolan/tizenportal/releases) for the latest version

4. **Restart TizenBrew** — Close and reopen TizenBrew completely

### TizenPortal crashes on launch

**Symptoms:**
- Black screen after launching
- Returns to TizenBrew immediately

**Solutions:**

1. **Remove and re-add the module** — The cached version may be corrupted

2. **Clear TizenBrew cache** — Check TizenBrew settings for cache options

3. **Check TV compatibility** — TizenPortal requires Tizen 3.0 or later

---

## Portal Problems

### Portal shows blank/empty

**Symptoms:**
- No cards visible
- Only the + card shows

**Solutions:**

1. **This is normal for first launch** — You need to add sites manually

2. **Cards were deleted** — Re-add your sites

3. **Check localStorage** — Open diagnostics (🔵 Blue) and look for storage errors

### Cards won't save

**Symptoms:**
- Add a card but it disappears
- Edit doesn't persist

**Solutions:**

1. **Storage quota exceeded** — Delete some cards or clear diagnostics logs

2. **Invalid URL** — Ensure URL starts with `http://` or `https://`

3. **Check for errors** — Open diagnostics and look for save errors

### Portal is slow/laggy

**Symptoms:**
- Slow navigation between cards
- Delayed response to input

**Solutions:**

1. **Too many cards** — Remove unused sites

2. **Large icons** — Use smaller icon images or skip custom icons

3. **Restart TizenBrew** — Memory may be fragmented

---

## Site Navigation Issues

### Site won't load

**Symptoms:**
- Blank page after selecting card
- Loading forever

**Solutions:**

1. **Check the URL** — Press 🔴 Red to verify the URL is correct

2. **Check network** — Ensure your TV can reach the server

3. **Try in TV browser** — If the site doesn't work in Samsung's browser, it won't work here

4. **Check HTTPS** — Some self-signed certificates may cause issues

### Can't navigate the site

**Symptoms:**
- D-pad doesn't move focus
- Can't select anything

**Solutions:**

1. **Try mouse mode** — Press 🟢 Green to use cursor

2. **Wrong bundle** — Some sites need specific bundles

3. **Site uses unsupported technology** — Canvas-based or Flash sites won't work

4. **Check diagnostics** — Look for JavaScript errors

### Focus jumps unexpectedly

**Symptoms:**
- Focus moves to wrong element
- Navigation feels random

**Solutions:**

1. **Use mouse mode** — More precise control

2. **Try different bundle** — Bundle may have navigation fixes

3. **Site issue** — Some sites have poor tab order

### Can't click buttons

**Symptoms:**
- Enter key doesn't activate buttons
- Nothing happens on click

**Solutions:**

1. **Use mouse mode** — Some buttons only respond to click events

2. **Element not focusable** — The site may not have proper accessibility

3. **Try long-press Enter** — Some elements need held press

---

## Display & Layout Issues

### Site shows mobile layout

**Symptoms:**
- Hamburger menu visible
- Narrow/phone layout

**Solutions:**

1. **Bundle not applied** — Check if correct bundle is selected

2. **Viewport lock failed** — Try reloading with long-press 🔴 Red

3. **Site forces mobile** — Some sites detect TV as mobile device

### Text too small

**Symptoms:**
- Can't read content
- Everything is tiny

**Solutions:**

1. **Viewport lock issue** — The site may have CSS that overrides our fixes

2. **Use TV zoom** — Some Samsung TVs have accessibility zoom features

3. **Try different bundle** — May have better CSS fixes

### Elements cut off

**Symptoms:**
- Content extends beyond screen
- Can't see full page

**Solutions:**

1. **Enable scroll** — Use mouse mode to scroll

2. **Viewport issue** — Try safe mode (long-press 🔵 Blue)

3. **Check TV display settings** — Ensure no overscan

### Colors look wrong

**Symptoms:**
- Wrong colors or contrast
- Can't see focus indicators

**Solutions:**

1. **Enable focus highlight** — Long-press 🟢 Green

2. **Check TV picture settings** — May need adjustment

3. **Site uses unsupported CSS** — Older browser doesn't support some features

---

## Input Problems

### Remote buttons don't work

**Symptoms:**
- Color buttons unresponsive
- D-pad does nothing

**Solutions:**

1. **Check TizenBrew** — Keys must be registered properly

2. **Restart TizenBrew** — Key registration may have failed

3. **Button conflict** — Some TV system functions may intercept keys

### Keyboard doesn't appear

**Symptoms:**
- Can't type in text fields
- No on-screen keyboard

**Solutions:**

1. **Focus the field** — Navigate to input and press Enter

2. **Mouse mode** — Click directly on the field

3. **System keyboard issue** — This is a TV/TizenBrew limitation

### Keyboard types wrong characters

**Symptoms:**
- Different characters than expected
- Symbols appear as letters

**Solutions:**

1. **Check keyboard language** — TV keyboard settings

2. **Use simple characters** — Avoid special characters if possible

---

## Performance Issues

### Everything is slow

**Symptoms:**
- Laggy navigation
- Slow page loads
- Delayed button response

**Solutions:**

1. **Restart TizenBrew** — Clear memory

2. **Close other apps** — Free up TV resources

3. **Use simpler sites** — Heavy sites tax old TV hardware

4. **Enable adblock bundle** — Reduces resource usage

### Out of memory

**Symptoms:**
- App crashes
- "Memory" warnings in diagnostics

**Solutions:**

1. **Reduce card count** — Fewer saved sites

2. **Restart regularly** — Prevents memory buildup

3. **Avoid heavy sites** — Some sites use excessive memory

### Site freezes

**Symptoms:**
- Page stops responding
- Can't navigate or return

**Solutions:**

1. **Wait** — May be processing

2. **Press 🟡 Yellow** — Try to return to portal

3. **Restart TizenBrew** — If completely frozen

---

## Bundle Issues

### Bundle not applying

**Symptoms:**
- Site looks unstyled
- Missing expected fixes

**Solutions:**

1. **Check card settings** — Verify correct bundle selected

2. **Reload** — Long-press 🔴 Red

3. **Check diagnostics** — Look for bundle errors

### Wrong bundle applied

**Symptoms:**
- Site looks different than expected
- Features missing

**Solutions:**

1. **Edit card** — Change to the correct bundle in the site editor

2. **Reload** — Long-press 🔴 Red

3. **Check diagnostics** — Look for bundle load errors

### Bundle causes errors

**Symptoms:**
- JavaScript errors in diagnostics
- Site partially broken

**Solutions:**

1. **Try safe mode** — Long-press 🔵 Blue

2. **Disable the bundle** — Set the bundle to “None” in the site editor

3. **Report issue** — Bundle may need updates

---

## Network Issues

### Can't reach server

**Symptoms:**
- Connection errors
- Timeout messages

**Solutions:**

1. **Check TV network** — Verify Wi-Fi/Ethernet connection

2. **Check server** — Ensure your server is running

3. **Check firewall** — Server may be blocking TV IP

4. **Try IP address** — Use IP instead of hostname

### SSL/HTTPS errors

**Symptoms:**
- Certificate warnings
- Secure connection failed

**Solutions:**

1. **Check certificate** — Self-signed certs may not work

2. **Use HTTP** — For local/trusted networks only

3. **Install proper cert** — Get a valid SSL certificate

### DNS resolution fails

**Symptoms:**
- "Server not found"
- Works with IP but not hostname

**Solutions:**

1. **Check DNS settings** — TV may use different DNS

2. **Use IP address** — Bypass DNS entirely

3. **Check local DNS** — If using local domain names

---

## Advanced Troubleshooting

### Reading Diagnostics Logs

The diagnostics panel shows:

```
[LOG] Normal information
[WARN] Potential issues
[ERROR] Actual problems
```

**Common messages:**

| Message | Meaning |
|---------|---------|
| "Bundle activated" | Bundle loaded successfully |
| "No matching card" | URL not found in saved cards |
| "Cross-origin" | Security restriction (usually OK) |
| "Focus lost" | Navigation may be stuck |

### Checking Console Errors

For detailed debugging:

1. Open diagnostics (🔵 Blue)
2. Look for red [ERROR] entries
3. Note the error message and location
4. Search for the error or [open an issue](https://github.com/alexnolan/tizenportal/issues)

### Reporting Bugs

When reporting issues, include:

1. **TV model and year**
2. **TizenPortal version** (shown in diagnostics)
3. **Steps to reproduce**
4. **Diagnostics log** (screenshot or text)
5. **Site URL** (if applicable)

### Factory Reset (Last Resort)

To completely reset TizenPortal:

1. Open diagnostics panel
2. Note this clears all saved sites
3. Clear localStorage via diagnostics console
4. Remove and re-add the TizenBrew module

---

## Still Need Help?

If none of these solutions work:

1. **Search existing issues** — [GitHub Issues](https://github.com/alexnolan/tizenportal/issues)
2. **Open a new issue** — Include all relevant details
3. **Join discussions** — [GitHub Discussions](https://github.com/alexnolan/tizenportal/discussions)

---

*Return to [Documentation Home](Home.md)*
