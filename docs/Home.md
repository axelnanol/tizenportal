# TizenPortal Documentation

Welcome to the TizenPortal documentation! This wiki provides comprehensive guides for users and developers.

## 📚 Documentation Index

### For Users

| Guide | Description |
|-------|-------------|
| [Getting Started](Getting-Started.md) | Installation and first-time setup |
| [User Guide](User-Guide.md) | How to use TizenPortal on your TV |
| [Troubleshooting](Troubleshooting.md) | Common issues and solutions |
| [FAQ](FAQ.md) | Frequently asked questions |

### For Developers

| Guide | Description |
|-------|-------------|
| [Architecture](Architecture.md) | System design and data flow |
| [Build System](Build-System.md) | How to build from source |
| [Bundle Authoring](Bundle-Authoring.md) | Creating site-specific bundles |
| [Bundle Navigation Guide](Bundle-Navigation-Guide.md) | Navigation patterns for bundle developers |
| [Navigation Mode Configuration](Navigation-Mode-Configuration.md) | Spatial navigation mode system |
| [Manifest Schema](Manifest-Schema.md) | Bundle manifest.json reference |
| [API Reference](Api-Reference.md) | Complete API documentation |
| [Focus Transitions Guide](Focus-Transitions-Guide.md) | Focus management and transitions |
| [Security](Security.md) | Security features and best practices |
| [Engineering Plan](Engineering-Plan.md) | Roadmap and project status |
| [Progress Tracker](Progress.md) | Version history and changelog |
| [Contributing](Contributing.md) | How to contribute to the project |

---

## Quick Links

- 🏠 [Project Repository](https://github.com/axelnanol/tizenportal)
- 📦 [Latest Release](https://github.com/axelnanol/tizenportal/releases)
- 🐛 [Report an Issue](https://github.com/axelnanol/tizenportal/issues)
- 💬 [Discussions](https://github.com/axelnanol/tizenportal/discussions)

---

## What is TizenPortal?

TizenPortal is a browser shell for Samsung Tizen Smart TVs that provides:

- **Portal Launcher** — A clean grid interface to manage your self-hosted web apps
- **Bundle System** — Site-specific fixes for TV compatibility
- **Remote Control Support** — Full D-pad and color button navigation
- **Diagnostics** — Built-in debug tools for troubleshooting

### Supported Sites

TizenPortal includes built-in support for:

| Site | Bundle | Status |
|------|--------|--------|
| [Audiobookshelf](https://www.audiobookshelf.org/) | `audiobookshelf` | ✅ Full Support |
| Any Website | `default` | ✅ Basic Support |
| Ad-heavy Sites | `adblock` | ✅ Ad Blocking |

### Requirements

- Samsung Tizen Smart TV (2017-2022 models)
- [TizenBrew](https://github.com/reisxd/TizenBrew) installed on your TV
- Network access to your self-hosted services

---

## Version Information

| Item | Value |
|------|-------|
| Current Version | See [package.json](../package.json) or [CHANGELOG](CHANGELOG.md) |
| Architecture | Universal Runtime |
| Last Updated | February 13, 2026 |

---

*Navigate using the links above or browse the docs folder directly.*
