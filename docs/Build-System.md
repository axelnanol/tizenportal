# TizenPortal Build System

> **Version:** 3.0  
> **Date:** February 7, 2026  
> **Status:** Universal Runtime (v0449)  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Requirements](#2-requirements)
3. [Rollup Configuration](#3-rollup-configuration)
4. [Version Injection](#4-version-injection)
5. [Build Scripts](#5-build-scripts)
6. [Bundle Output](#6-bundle-output)
7. [Development Workflow](#7-development-workflow)
8. [Deployment](#8-deployment)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Overview

TizenPortal uses **Rollup** with **Babel** to bundle ES6+ source code into an ES5-compatible IIFE that runs on Samsung Tizen TVs (Chrome 47-69).

### Single Build Architecture

The build system produces **one universal output**:

| Output | Input | Size | Purpose |
|--------|-------|------|---------|
| `dist/tizenportal.js` | `core/index.js` | ~320KB | Universal runtime for portal and target sites |

### Why Single Build?

TizenPortal operates as a **TizenBrew MOD module** with a unified runtime:

1. TizenBrew injects `tizenportal.js` into ALL pages
2. On portal page: Runtime renders launcher UI
3. On target sites: Runtime applies bundles and overlays

The same script runs everywhere, detecting context automatically.

---

## 2. Requirements

### Node.js Version

- **Minimum:** Node 18.x
- **Recommended:** Node 20.x LTS

### Package Manager

- **npm** (comes with Node.js)

### Dependencies

```json
{
  "devDependencies": {
    "rollup": "^4.0.0",
    "@rollup/plugin-babel": "^6.0.0",
    "@rollup/plugin-node-resolve": "^15.0.0",
    "@rollup/plugin-commonjs": "^25.0.0",
    "@rollup/plugin-replace": "^6.0.3",
    "@rollup/plugin-terser": "^0.4.0",
    "@babel/core": "^7.23.0",
    "@babel/preset-env": "^7.23.0",
    "rollup-plugin-string": "^3.0.0"
  },
  "dependencies": {
    "core-js": "^3.47.0",
    "whatwg-fetch": "^3.6.20",
    "spatial-navigation-polyfill": "^1.3.1"
  }
}
```

### Installation

```bash
npm install
```

---

## 3. Rollup Configuration

The configuration builds a single universal runtime:

```js
// rollup.config.js
import { string } from 'rollup-plugin-string';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';

// Read version from package.json - single source of truth
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const VERSION = pkg.version;

// Shared plugins
const plugins = [
  // Replace __VERSION__ placeholder with actual version
  replace({
    preventAssignment: true,
    values: { '__VERSION__': VERSION },
  }),

  // Import CSS files as strings
  string({ include: '**/*.css' }),

  // Resolve node_modules imports
  nodeResolve({ browser: true, preferBuiltins: false }),

  // Convert CommonJS modules to ES modules
  commonjs({ include: [/node_modules/], transformMixedEsModules: true }),

  // Transpile to ES5 for Chrome 47+ compatibility
  babel({
    babelHelpers: 'bundled',
    presets: [['@babel/preset-env', { targets: { chrome: '47' }, modules: false }]],
    exclude: 'node_modules/**',
  }),

  // Minify output
  terser({ ecma: 5, mangle: true, compress: { drop_console: false } }),
];

export default [
  // Single build: Universal runtime
  {
    input: 'core/index.js',
    output: {
      file: 'dist/tizenportal.js',
      format: 'iife',
      name: 'TizenPortal',
      sourcemap: false,
    },
    plugins,
  },
];
```

### Plugin Purposes

| Plugin | Purpose |
|--------|---------|
| `@rollup/plugin-replace` | Inject version from package.json at build time |
| `rollup-plugin-string` | Import CSS files as strings |
| `@rollup/plugin-node-resolve` | Resolve imports from node_modules |
| `@rollup/plugin-commonjs` | Convert CommonJS to ES modules |
| `@rollup/plugin-babel` | Transpile ES6+ syntax to ES5 |
| `@rollup/plugin-terser` | Minify output |

---

## 4. Version Injection

Version is centralized in `package.json` and injected at build time.

### How It Works

1. **package.json** holds the single source of truth:
   ```json
  { "version": "0449" }
   ```

2. **Rollup reads** the version at build time:
   ```js
   const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
   const VERSION = pkg.version;
   ```

3. **Replace plugin** substitutes `__VERSION__` in source code:
   ```js
   replace({ values: { '__VERSION__': VERSION } })
   ```

4. **Source files** use the placeholder:
   ```js
  const VERSION = '__VERSION__';  // Becomes '0449' in output
   ```

### Benefits

- Only update version in one place
- Git tags match package.json version
- Build artifacts always have current version
- No manual synchronization needed

---

## 5. Build Scripts

Defined in `package.json`:

```json
{
  "scripts": {
    "build": "rollup -c",
    "watch": "rollup -c --watch",
    "clean": "node -e \"require('fs').rmSync('dist/tizenportal.js', {force: true})\""
  }
}
```

### Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build (minified) |
| `npm run watch` | Development with auto-rebuild |
| `npm run clean` | Remove built files |

### Build Output

```
dist/
├── index.html        # Portal HTML (manually maintained)
└── tizenportal.js    # Built runtime (~320KB minified)
```

---

## 6. Bundle Output

### Output Structure

```js
// dist/tizenportal.js (IIFE format)
var TizenPortal = (function () {
  'use strict';
  
  // Polyfills (core-js, fetch, DOMRect)
  // Spatial navigation polyfill
  // Configuration system
  // Input handling
  // Focus management
  // UI components
  // Bundle registry
  // Core initialization
  
  return {
    version: '0449',
    config: {...},
    input: {...},
    focus: {...},
    keys: {...},
    log: function() {...},
    // ... more exports
  };
})();
```

### Size Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Minified | < 400KB | ~320KB |
| Gzipped | < 100KB | ~80KB |

### Contents

The build includes:

1. **Polyfills** (core-js, fetch, DOMRect)
2. **Spatial Navigation** polyfill
3. **Core Modules** (config, cards, loader)
4. **UI Components** (portal, siteeditor, overlays)
5. **Input Handling** (keys, pointer, text-input)
6. **Focus Management**
7. **Diagnostics** (console capture)
8. **Bundles** (default, audiobookshelf, adblock)

---

## 7. Development Workflow

### Standard Workflow

```bash
# 1. Start watch mode
npm run watch

# 2. Edit source files
# 3. Build auto-runs on save
# 4. Test on TV or emulator
```

### Making Changes

1. Edit source files in `core/`, `ui/`, `bundles/`, etc.
2. Rollup rebuilds automatically in watch mode
3. Deploy `dist/` folder to test

### Adding a New Bundle

1. Create bundle folder: `bundles/my-bundle/`
2. Add `main.js`, `style.css`, `manifest.json`
3. Register in `bundles/registry.js`
4. Rebuild: `npm run build`

### Testing Locally

Since the runtime is injected by TizenBrew, local testing requires:

1. **TizenBrew on TV** - Deploy to GitHub Pages
2. **Browser Testing** - Open `dist/index.html` locally for portal UI
3. **Emulator** - Samsung Tizen Studio emulator

---

## 8. Deployment

### Version Bump Process

```bash
# 1. Update version in package.json
"version": "0392"

# 2. Rebuild
npm run build

# 3. Commit and tag
git add .
git commit -m "Bump to 0392"
git tag 0392
git push origin master --tags
```

### GitHub Pages Deployment

The `dist/` folder is deployed to GitHub Pages:

```
https://alexnolan.github.io/tizenportal/dist/index.html
https://alexnolan.github.io/tizenportal/dist/tizenportal.js
```

### TizenBrew CDN

TizenBrew caches by git tag. To update:

1. Create new git tag (e.g., `0392`)
2. Push tag to GitHub
3. On TV: Remove old module, add new version

**Important:** Without a new tag, TizenBrew serves cached old code!

---

## 9. Troubleshooting

### Build Fails

```bash
# Clear node_modules and rebuild
rm -rf node_modules
npm install
npm run build
```

### Version Not Updated

1. Check package.json version
2. Rebuild: `npm run build`
3. Verify in output: `grep "version" dist/tizenportal.js`

### Bundle Not Included

1. Verify bundle is in `bundles/` folder
2. Check import in `bundles/registry.js`
3. Verify no syntax errors in bundle code
4. Rebuild and check console for errors

### Runtime Errors on TV

1. Enable diagnostics (Blue button)
2. Check for ES5 incompatible code
3. Wrap suspicious code in try-catch
4. Test specific code in Chrome 47 DevTools

### Size Too Large

1. Check for duplicate imports
2. Review polyfill inclusion
3. Consider code splitting (future)
4. Use tree-shaking hints

---

## Appendix: File Processing

### CSS Files

CSS files are imported as strings:

```js
// In bundle main.js
import styles from './style.css';

export default {
  style: styles,  // String of CSS content
  // ...
};
```

The `rollup-plugin-string` plugin handles this.

### ES6+ Features

Babel transpiles modern JavaScript:

| ES6+ Feature | ES5 Output |
|--------------|------------|
| Arrow functions | Regular functions |
| const/let | var |
| Classes | Constructor functions |
| Template literals | String concatenation |
| Spread operator | Array.concat / Object.assign |
| Async/await | Not supported (avoid using) |

### Polyfills Included

Via core-js and whatwg-fetch:

- `Promise`
- `Object.assign`
- `Array.from`, `Array.of`
- `Array.prototype.find`, `findIndex`
- `String.prototype.includes`
- `fetch` API
- And many more ES6+ features

---

*End of Build System Documentation*
