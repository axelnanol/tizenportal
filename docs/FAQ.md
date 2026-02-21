# Frequently Asked Questions

Common questions about TizenPortal.

---

## General Questions

### What is TizenPortal?

TizenPortal is a browser shell for Samsung Tizen Smart TVs. It provides a launcher interface to manage self-hosted web apps (like Audiobookshelf, etc.) and injects site-specific fixes to make them work better with TV remote controls.

### What TVs are supported?

TizenPortal supports Samsung Smart TVs from 2017-2022 running Tizen OS 3.0 or later. This includes:

- 2017 models (Tizen 3.0)
- 2018 models (Tizen 4.0)
- 2019 models (Tizen 5.0)
- 2020 models (Tizen 5.5)
- 2021 models (Tizen 6.0)
- 2022 models (Tizen 6.5)

Newer models may work but are not officially tested.

### Is TizenPortal free?

Yes! TizenPortal is free and open-source software licensed under the MIT license.

### Does TizenPortal require root/developer mode?

No, TizenPortal runs through TizenBrew, which handles any necessary permissions. You don't need to enable developer mode on your TV.

---

## Installation Questions

### How do I install TizenPortal?

1. Install [TizenBrew](https://github.com/reisxd/TizenBrew) on your TV
2. Add the module: `axelnanol/tizenportal`
3. Launch TizenPortal from TizenBrew

See the [Getting Started](Getting-Started.md) guide for detailed instructions.

### How do I update TizenPortal?

TizenBrew automatically serves the latest version. If you need to force a refresh:

1. Remove the module (`axelnanol/tizenportal`)
2. Add the module again (`axelnanol/tizenportal`)

Your saved sites are preserved between updates.

### Can I use TizenPortal without TizenBrew?

No, TizenPortal requires TizenBrew to inject its runtime into web pages. There is no standalone version.

### Will TizenPortal void my warranty?

TizenPortal is a software application that doesn't modify your TV's firmware. However, consult your warranty terms and use at your own risk.

---

## Usage Questions

### How do I return to the portal?

Press the **🟡 Yellow** button on your remote to return to the portal launcher from any site.

### How do I navigate sites without a mouse?

Use the **D-pad** (arrow keys) on your remote. TizenPortal enables spatial navigation that moves focus between clickable elements. Press **Enter** to activate the focused element.

For sites that require mouse control, press **🟢 Green** to enable mouse mode.

### Can I use my phone as a remote?

Yes! If your TV supports Samsung's SmartThings remote app, you can use it with TizenPortal. The color buttons may not work depending on the app version.

### How do I type text?

Text inputs are protected by default to avoid the on-screen keyboard popping up. Navigate to an input and press **Enter** to activate the keyboard. You can disable this in **Preferences → Protect Text Inputs (TV Keyboard)**.

### Can I cast/mirror to TizenPortal?

TizenPortal runs on the TV itself—it's not a casting receiver. Your self-hosted apps run directly in the TV's browser.

---

## Site Compatibility Questions

### What sites work with TizenPortal?

Most websites work to some degree. Sites with dedicated bundles work best:

| Site | Support Level |
|------|--------------|
| Audiobookshelf | ✅ Full support |
| Most websites | ⚠️ Basic support |

### Why doesn't [site] work?

Common reasons:

1. **JavaScript too modern** — TV uses Chrome 47-69, which lacks some features
2. **Requires mouse interaction** — Try mouse mode (🟢 Green)
3. **Uses unsupported technology** — Flash, WebGL, etc.
4. **Auth issues** — Some login systems don't work

### Can you add support for [site]?

Maybe! You can:

1. [Open an issue](https://github.com/axelnanol/tizenportal/issues) requesting the site
2. [Create a bundle](Bundle-Authoring.md) yourself and submit a PR
3. Use the `default` bundle for basic compatibility

### Will Netflix/YouTube/Prime Video work?

These streaming services have their own Tizen apps and typically block browser access. Use the official apps instead.

### Does TizenPortal block ads?

Yes! Use the `adblock` bundle for sites with intrusive ads. It supports **Strict Mode**, **Allowlist URL**, **Hide Cookie Banners**, and **Inline Ad Heuristics** for better coverage. Ad blocking is still best-effort and may not catch everything.

---

## Technical Questions

### What browser engine does TizenPortal use?

TizenPortal uses the TV's built-in browser, which is based on Chrome 47-69 depending on your TV model. TizenPortal doesn't include its own browser engine.

### Where are my settings stored?

Settings and saved sites are stored in the TV's `localStorage`, which persists between sessions but is cleared if you reset the TV or uninstall TizenBrew.

### How much storage does TizenPortal use?

The runtime is approximately 320KB. Your saved sites use minimal additional storage (a few KB each).

### Is my data sent anywhere?

No. TizenPortal runs entirely locally on your TV. It does not collect or transmit any data. The only network requests are to your own self-hosted services.

### Can I use TizenPortal offline?

TizenPortal itself can run offline (after initial load), but you'll need network access to reach your self-hosted services.

---

## Troubleshooting Questions

### Why does the screen go black?

This usually means a JavaScript error crashed the page. Try:

1. Press **🟡 Yellow** to return to portal
2. Long-press **🔵 Blue** for safe mode
3. Check diagnostics for error messages

### Why is everything so slow?

The TV browser is limited. Try:

1. Restart TizenBrew periodically
2. Remove unused site cards
3. Use the adblock bundle
4. Avoid JavaScript-heavy sites

### Why can't I focus on elements?

Some sites have poor accessibility. Try:

1. Mouse mode (🟢 Green)
2. Different bundle
3. Tab key (if you have a keyboard)

### The portal forgot my sites!

Sites are stored in localStorage, which can be cleared by:

1. TV factory reset
2. Clearing browser data
3. TizenBrew reinstallation

There's no backup feature currently. Consider keeping a list of your sites elsewhere.

---

## Development Questions

### Can I create my own bundle?

Yes! See the [Bundle Authoring Guide](Bundle-Authoring.md) for instructions.

### How do I contribute to TizenPortal?

See the [Contributing Guide](Contributing.md). We welcome:

- Bug reports
- Feature requests
- Bundle contributions
- Documentation improvements
- Code contributions

### Is there an API?

Yes, bundles can access the `window.TizenPortal` API. See the [API Reference](Api-Reference.md).

### Can I run TizenPortal in development mode?

Yes, use `npm run watch` for auto-rebuilding during development. See the [Build System](Build-System.md) documentation.

---

## Other Questions

### Who created TizenPortal?

TizenPortal was created by axelnanol. See the [GitHub repository](https://github.com/axelnanol/tizenportal) for contributors.

### How can I support the project?

- ⭐ Star the repository on GitHub
- 🐛 Report bugs and suggest features
- 📝 Improve documentation
- 🔧 Contribute code or bundles
- 📢 Tell others about TizenPortal

### I have a question not listed here

- Check the [Troubleshooting Guide](Troubleshooting.md)
- Search [GitHub Issues](https://github.com/axelnanol/tizenportal/issues)
- Open a new issue or discussion

---

*Return to [Documentation Home](Home.md)*
