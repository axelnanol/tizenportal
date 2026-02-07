# Contributing to TizenPortal

Thank you for your interest in contributing to TizenPortal! This guide explains how you can help improve the project.

---

## Table of Contents

1. [Ways to Contribute](#ways-to-contribute)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Code Guidelines](#code-guidelines)
5. [Submitting Changes](#submitting-changes)
6. [Creating Bundles](#creating-bundles)
7. [Improving Documentation](#improving-documentation)
8. [Reporting Issues](#reporting-issues)
9. [Community Guidelines](#community-guidelines)

---

## Ways to Contribute

There are many ways to contribute, whether or not you write code:

### Non-Code Contributions

- **Report bugs** — Found something broken? Let us know!
- **Suggest features** — Have an idea? We'd love to hear it
- **Improve documentation** — Fix typos, add examples, clarify confusing sections
- **Answer questions** — Help others in issues and discussions
- **Spread the word** — Star the repo, tell your friends

### Code Contributions

- **Fix bugs** — Pick an issue labeled "bug" and submit a fix
- **Implement features** — Work on issues labeled "enhancement"
- **Create bundles** — Add support for new sites
- **Improve performance** — Optimize code for TV hardware
- **Write tests** — Help ensure reliability

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or later
- **npm** (comes with Node.js)
- **Git** for version control
- A **text editor** (VS Code recommended)
- Optionally: Samsung TV or Tizen emulator for testing

### Fork and Clone

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tizenportal.git
   cd tizenportal
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/alexnolan/tizenportal.git
   ```

---

## Development Setup

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

### Watch Mode (Auto-rebuild)

```bash
npm run watch
```

### Project Structure

```
tizenportal/
├── core/           # Runtime entry and core modules
├── ui/             # UI components
├── bundles/        # Site-specific bundles
├── input/          # Input handling
├── focus/          # Focus management
├── navigation/     # Spatial navigation
├── polyfills/      # Browser polyfills
├── diagnostics/    # Debug tools
├── docs/           # Documentation
└── dist/           # Built output
```

### Testing Your Changes

1. Build the project: `npm run build`
2. The output is in `dist/tizenportal.js`
3. Deploy to GitHub Pages (fork) or local server
4. Add your fork as a TizenBrew module for testing

---

## Code Guidelines

### JavaScript Style

TizenPortal targets Chrome 47-69. Babel transpiles ES6+, but follow these guidelines:

```javascript
// ✅ Good
var element = document.getElementById('id');
function handleClick(event) {
  // ...
}

// ⚠️ Use carefully (Babel handles, but verbose output)
const value = getValue();
const fn = () => {};

// ❌ Avoid (not supported or problematic)
async function fetch() {}  // async/await not available
const { a, b } = obj;      // Destructuring is verbose when transpiled
```

### Error Handling

**Always wrap code in try-catch** — uncaught errors crash Tizen:

```javascript
try {
  doSomething();
} catch (err) {
  console.error('[module] Error:', err.message);
}
```

### Logging

Use the diagnostics system:

```javascript
// For user-visible logs
TizenPortal.log('Message');
TizenPortal.warn('Warning');
TizenPortal.error('Error');

// For debug output
console.log('[module] Debug info');
```

### CSS Style

```css
/* ✅ Supported */
display: flex;
transform: scale(1.1);
transition: all 0.2s;

/* ❌ Not supported in Chrome 47 */
display: grid;
gap: 10px;
:focus-visible {}
```

### Comments

```javascript
/**
 * Function description
 * @param {string} name - Parameter description
 * @returns {boolean} Return description
 */
function example(name) {
  // Inline comments for complex logic
  return true;
}
```

---

## Submitting Changes

### Branch Naming

```
feature/add-jellyfin-bundle
fix/navigation-scroll-issue
docs/update-user-guide
```

### Commit Messages

```
Add Jellyfin bundle with navigation support

- Implement keyboard navigation for library grid
- Add media key handlers for playback
- Include viewport lock CSS

Closes #123
```

### Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes** and commit

3. **Push to your fork**:
   ```bash
   git push origin feature/your-feature
   ```

4. **Open a Pull Request** on GitHub

5. **Fill out the PR template** with:
   - Description of changes
   - Related issues
   - Testing performed
   - Screenshots (if UI changes)

6. **Wait for review** — maintainers will review and may request changes

7. **Merge** — Once approved, your PR will be merged

### Pull Request Checklist

- [ ] Code builds without errors (`npm run build`)
- [ ] Code follows project style guidelines
- [ ] New features have documentation
- [ ] Commit messages are clear and descriptive
- [ ] PR description explains the changes

---

## Creating Bundles

Bundles are the most impactful contribution! They add support for new sites.

### Bundle Structure

```
bundles/
└── my-site/
    ├── main.js         # Bundle logic
    ├── style.css       # CSS fixes
    └── manifest.json   # Metadata
```

### Step-by-Step

1. **Create folder**: `bundles/your-site/`

2. **Create manifest.json**:
   ```json
   {
     "name": "your-site",
     "displayName": "Your Site",
     "version": "1.0.0",
     "description": "TV support for Your Site",
     "author": "Your Name",
     "homepage": "https://example.com"
   }
   ```

3. **Create style.css** with viewport lock and focus styles

4. **Create main.js** with bundle logic

5. **Register in registry.js**:
   ```javascript
   import yourSiteBundle from './your-site/main.js';
   
   var bundles = {
     // ... existing bundles
     'your-site': yourSiteBundle,
   };
   ```

6. **Test thoroughly** on actual TV hardware if possible

7. **Submit PR** with your bundle

See the [Bundle Authoring Guide](Bundle-Authoring.md) for detailed instructions.

---

## Improving Documentation

Documentation is just as important as code!

### What to Improve

- Fix typos and grammar
- Add missing information
- Clarify confusing sections
- Add examples and screenshots
- Update outdated content
- Translate to other languages

### Documentation Files

| File | Purpose |
|------|---------|
| `docs/Home.md` | Wiki home page |
| `docs/Getting-Started.md` | Installation guide |
| `docs/User-Guide.md` | Usage instructions |
| `docs/Troubleshooting.md` | Problem solutions |
| `docs/FAQ.md` | Common questions |
| `docs/Architecture.md` | Technical design |
| `docs/Api-Reference.md` | API documentation |
| `docs/Build-System.md` | Build instructions |
| `docs/Bundle-Authoring.md` | Bundle creation |

### Documentation Style

- Use clear, simple language
- Include code examples where helpful
- Use tables for structured information
- Link to related documentation
- Keep formatting consistent

---

## Reporting Issues

### Before Reporting

1. **Search existing issues** — It may already be reported
2. **Try troubleshooting** — See [Troubleshooting Guide](Troubleshooting.md)
3. **Reproduce the issue** — Can you make it happen consistently?

### Bug Report Template

```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- TV Model: [e.g., Samsung UN55TU8000]
- TV Year: [e.g., 2020]
- TizenPortal Version: [e.g., 0449]
- Site URL: [if applicable]

## Screenshots/Logs
[Attach diagnostics screenshots or logs]
```

### Feature Request Template

```markdown
## Feature Description
What feature would you like?

## Use Case
Why do you need this feature?

## Proposed Solution
How do you think it should work?

## Alternatives Considered
Other ways to solve the problem
```

---

## Community Guidelines

### Be Respectful

- Treat everyone with respect
- Be welcoming to newcomers
- Give constructive feedback
- Assume good intentions

### Be Patient

- Maintainers are volunteers
- Reviews take time
- Questions may need research

### Be Helpful

- Share knowledge
- Help others learn
- Celebrate contributions

### Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct. Please report unacceptable behavior to the maintainers.

---

## Recognition

Contributors are recognized in:

- Git commit history
- GitHub contributors page
- Release notes (for significant contributions)

Thank you for contributing to TizenPortal! 🎉

---

*Return to [Documentation Home](Home.md)*
