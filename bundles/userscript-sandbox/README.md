# Userscript Sandbox Bundle

A collection of high-quality userscripts designed for TV browsing with Samsung remote controls.

## Version 2.2.0

This bundle provides 20 carefully crafted userscripts that demonstrate both inline and external script loading capabilities.

---

## 📜 Included Scripts

### 1. **TV Readability Booster** ✅ *Enabled by Default*

**Purpose:** Optimizes text and interactive elements for TV viewing distance

**Features:**
- Font sizes automatically scale between 18-32px based on viewport
- Enhanced line height (1.8) and letter spacing for better readability
- Maximum width constraint (1200px) prevents excessive line length
- Links get high-visibility cyan outlines
- All interactive elements (buttons, inputs) sized for easy targeting
- Fully reversible with cleanup function

**Use Case:** Enable on any text-heavy site (news, blogs, documentation)

---

### 2. **Smart Auto-Scroll**

**Purpose:** Intelligent auto-scrolling with speed control and pause/resume

**Features:**
- Progressive scroll speed: 1px/30ms default
- **Up Arrow:** Decrease speed (-0.5px, min 0.5px)
- **Down Arrow:** Increase speed (+0.5px, max 5px)
- **Enter/Pause:** Toggle pause/resume
- **Stop/Back:** Stop scrolling and exit
- Real-time speed feedback via TizenPortal.log
- Fully reversible cleanup

**Use Case:** Long articles, documentation, scrolling credits

**Improvements over v1:**
- Variable speed control (was fixed 1px/50ms)
- Pause/resume functionality (was single-stop only)
- User feedback for all actions
- Better key handling with preventDefault

---

### 3. **Smart Dark Mode**

**Purpose:** Intelligent dark theme without image distortion

**Features:**
- Background colors: Dark gray (#181818) with warm white text (#e8e6e3)
- Preserves image/video colors (90% opacity for comfort)
- Link colors: Blue (#8ab4f8) and purple (#c58af9) for visited
- Form elements styled for dark mode with proper borders
- Input placeholders use subtle gray (#9aa0a6)
- Inline style overrides for dynamic backgrounds
- Fully reversible with style element removal

**Use Case:** Any bright website (Google, Wikipedia, news sites)

**Improvements over v1:**
- No hue rotation distortion (was invert + hue-rotate)
- Images/videos not inverted (was double-inverted)
- Proper color palette instead of simple inversion
- Handles inline styles with targeted overrides
- Works correctly on Google homepage and other white backgrounds

---

### 4. **YouTube TV Enhancements**

**Purpose:** Improves YouTube experience on TV

**Features:**
- Forces player controls to stay visible
- Enlarges play button, time display, and volume controls (140%)
- Increases clickable area (50px minimum)
- Sets video max height to 90vh for better visibility
- Normalizes playback rate to 1.0x
- Only activates on youtube.com domains

**Use Case:** Watching YouTube videos on TV

---

### 5. **Video Ad Skip Helper**

**Purpose:** Automatically clicks "Skip Ad" buttons when they appear

**Features:**
- Monitors for skip buttons across multiple selectors
- Checks every 2 seconds for new skip buttons
- Uses MutationObserver for instant detection of new elements
- Handles YouTube and generic ad skip patterns
- Logs when skip buttons are clicked
- Fully reversible cleanup

**Use Case:** YouTube, Twitch, and other video platforms with skippable ads

---

### 6. **Image Focus Zoom**

**Purpose:** Click any image to view it fullscreen

**Features:**
- Fullscreen overlay with dark background (90% opacity)
- Image scaled to fit 95% of viewport
- Press **Back** or **Enter** to close
- Works with any image on the page
- Prevents propagation to avoid unintended navigation
- Fully reversible cleanup

**Use Case:** Product images, galleries, social media, documentation diagrams

---

### 7. **Auto-Play Video Blocker**

**Purpose:** Prevents videos from auto-playing

**Features:**
- Automatically pauses any auto-playing video detected
- Monitors for new videos via MutationObserver
- Checks every second for auto-play attempts
- Logs when videos are paused
- Fully reversible cleanup

**Use Case:** News sites, social media, any site with annoying auto-play videos

---

### 8. **Remove Sticky Headers**

**Purpose:** Removes fixed/sticky headers that block content

**Features:**
- Converts `position: fixed` to `position: static`
- Handles inline styles and class-based positioning
- Targets headers, navbars, and common sticky patterns
- Fully reversible with style element removal

**Use Case:** News sites, documentation sites with sticky navigation

---

### 9. **Grayscale Mode**

**Purpose:** External script example - converts page to grayscale

**Features:**
- Demonstrates loading scripts from external URLs
- Uses jsdelivr CDN for reliable delivery
- Source: Stylus browser extension's grayscale tool
- Cached after first load for offline use

**Use Case:** Reduce eye strain, accessibility, focus mode

**Note:** This is an example of loading external userscripts. The URL-based script will be fetched and cached on first use.

---

### 10. **Custom CSS Template**

**Purpose:** Template for users to add their own CSS

**Features:**
- Pre-configured style injection framework
- Cleanup function for reversibility
- Example CSS structure commented
- Fully reversible

**Use Case:** Quick CSS experiments, site-specific tweaks

**To Customize:**
1. Copy the script to a new entry in Preferences → Userscripts
2. Edit the inline code to replace the CSS content
3. Enable the script

---

### 11. **Cookie Consent Auto-Closer**

**Purpose:** Automatically dismiss cookie consent banners

**Features:**
- Detects cookie/GDPR/consent banners using multiple selectors
- Attempts to click "Accept" buttons first
- Falls back to hiding banner if no button found
- Monitors for new banners via MutationObserver
- Checks every 1.5 seconds as fallback
- Tracks dismissed banners to avoid re-processing
- Logs actions for visibility

**Use Case:** Any website with cookie consent popups (news sites, blogs, commercial sites)

**Patterns Detected:**
- Class/ID containing: cookie, consent, gdpr, notice
- ARIA labels with cookie/consent
- Buttons with: accept, agree, "got it", OK

---

### 12. **Subtitle Size Enhancer**

**Purpose:** Increases subtitle/caption size for TV viewing

**Features:**
- Doubles subtitle font size (200%)
- Enhanced line height (1.4) for readability
- Strong background (85% black) for contrast
- Adds padding and border radius for clean appearance
- Text shadow for better visibility
- Repositions captions to 10% from bottom
- Works with YouTube and generic video players
- MutationObserver monitors for dynamic caption updates
- Fully reversible

**Use Case:** Watching videos with subtitles on TV (YouTube, streaming sites, video platforms)

**Technical Notes:**
- Targets YouTube caption classes and generic ::cue pseudo-element
- Uses both CSS injection and DOM manipulation for reliability
- Monitors style attribute changes to override player defaults

---

### 13. **Focus Trap Escape**

**Purpose:** Break out of stuck focus loops

**Features:**
- **ESC key:** Blur current element and return focus to body
- **Auto-detection:** Detects when arrow keys don't change focus
- After 5+ failed navigation attempts, jumps to random focusable element
- Prevents getting stuck in broken navigation implementations
- Logs escape actions for debugging
- Fully reversible

**Use Case:** Sites with broken spatial navigation, modal dialogs that trap focus, infinite loops

**How It Works:**
- Tracks last focused element
- Counts consecutive arrow key presses on same element
- After threshold, selects random element from first 10 focusable items
- ESC provides immediate manual escape

---

### 14. **Page Simplifier**

**Purpose:** Remove clutter for focused reading

**Features:**
- Hides sidebars, ads, social sharing buttons, comments
- Centers main content with max-width (1400px)
- Adds padding for comfortable reading
- Preserves article/main content and navigation
- Dark background (#181818) for eye comfort
- Fully reversible
- No JavaScript overhead (pure CSS)

**Use Case:** News articles, blogs, documentation sites with cluttered layouts

**Elements Hidden:**
- Sidebars (aside, .sidebar, [class*="sidebar"])
- Advertisements (.ad, [class*="advertisement"])
- Social sharing ([class*="social-share"])
- Comments sections
- Related content widgets (except in main content)

---

### 15. **Dark Reading Mode**

**Purpose:** Optimized dark-themed reading experience for TV viewing

**Features:**
- Combines clutter removal with professional dark theme
- Warm dark background (#1a1a1a) with content card (#242424)
- Warm off-white text (#e8e6e3) to reduce eye strain
- Optimized for TV viewing distance: 18-28px responsive font sizing
- Generous line height (1.9) for comfortable reading
- Narrow max-width (900px) for optimal line length
- Enhanced heading visibility (#f0f0f0)
- High-contrast links (blue #8ab4f8, visited purple #c58af9)
- Rounded content card with subtle shadow
- Code blocks with syntax-friendly colors (#a8dadc on #2d2d2d)
- Styled blockquotes with blue accent border
- Semi-transparent images (95% opacity) for consistency
- Fully reversible (pure CSS)

**Use Case:** Long-form reading on TV (articles, documentation, blog posts) in low-light environments

**Typography Optimizations:**
- Line height: 1.9 for body text, 1.4 for headings
- Font scaling: clamp(18px, 2.2vw, 28px)
- Generous margins: 1.5em top, 0.8em bottom for headings
- Enhanced spacing throughout

---

### 16. **Light Reading Mode**

**Purpose:** Optimized light-themed reading experience for TV viewing

**Features:**
- Combines clutter removal with clean light theme
- Warm beige background (#faf8f5) with pure white content card
- High-contrast dark text (#2c2c2c) for excellent readability
- Optimized for TV viewing distance: 18-28px responsive font sizing
- Generous line height (1.9) for comfortable reading
- Narrow max-width (900px) for optimal line length
- Deep black headings (#1a1a1a) for hierarchy
- Standard web colors (blue #0066cc, visited purple #551a8b)
- Rounded content card with subtle shadow
- Code blocks with pink accent (#d63384 on #f5f5f5)
- Styled blockquotes with blue border and italic text
- Maintains full image brightness
- Fully reversible (pure CSS)

**Use Case:** Long-form reading on TV (articles, documentation, blog posts) in well-lit environments

**Typography Optimizations:**
- Line height: 1.9 for body text, 1.4 for headings
- Font scaling: clamp(18px, 2.2vw, 28px)
- Generous margins: 1.5em top, 0.8em bottom for headings
- Enhanced spacing throughout

**Comparison with Dark Reading Mode:**
- Light: Better for daytime/bright rooms, traditional reading feel
- Dark: Better for nighttime/dark rooms, reduces eye strain in low light
- Both: Remove clutter, optimize typography, enhance readability

---

### 17. **Video Speed Controller**

**Purpose:** Fine-tune video playback speed with keyboard

**Features:**
- **Shift+Up:** Increase speed (0.25x increments, max 2.0x)
- **Shift+Down:** Decrease speed (0.25x increments, min 0.25x)
- **Shift+Left/Right:** Reset to 1.0x
- Speed presets: 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0
- Real-time feedback via log
- Applies to all videos on page
- MutationObserver ensures new videos inherit speed
- Fully reversible

**Use Case:** Educational videos, tutorials, podcasts, lectures, slow-motion review

**Why Useful on TV:**
- Native speed controls often hidden or difficult to access
- Keyboard shortcuts easier than navigating UI
- Useful for content consumption optimization

---

### 18. **Keyboard Shortcuts Overlay**

**Purpose:** Display available TV remote shortcuts

**Features:**
- **Info key (457) or ? key:** Toggle overlay
- **Back/Enter:** Close overlay
- Displays all TizenPortal shortcuts:
  - Navigation keys
  - Color button mappings
  - Media controls
  - Overlay controls
- Dark semi-transparent background (95% opacity)
- Centered modal with readable typography
- Color-coded sections (blue headers, purple subheadings)
- No external dependencies
- Fully reversible

**Use Case:** New users learning shortcuts, quick reference, accessibility

**Shortcut Categories:**
- Navigation (arrows, enter, back)
- Color Buttons (red, green, yellow, blue)
- Media (play, pause, stop, FF, rewind)
- Help (info key)

---

### 19. **Link Target Controller**

**Purpose:** Prevent links from opening in new tabs/windows

**Features:**
- Removes `target="_blank"` and `target="_new"` from all links
- Forces links to open in same context
- MutationObserver monitors for dynamically added links
- Processes links every 100ms after DOM changes
- Logs number of links modified
- Fully reversible

**Use Case:** TV browsing where new tabs/windows are problematic

**Why Important on TV:**
- New windows can cause navigation confusion
- TizenBrew may not handle multiple windows well
- Keeps browsing linear and predictable
- Prevents losing portal context

---

### 20. **Video Auto-Pause on Blur**

**Purpose:** Pause videos when app loses focus

**Features:**
- Pauses all videos when window loses focus (blur event)
- Pauses videos when document becomes hidden (visibility API)
- Resumes videos when focus/visibility restored
- Tracks which videos were paused by script
- Only resumes videos that script paused (respects user intent)
- Logs pause/resume actions
- Fully reversible

**Use Case:** Multitasking, switching between apps, background video prevention

**Events Monitored:**
- `window.blur` - Window loses focus
- `window.focus` - Window regains focus
- `document.visibilitychange` - Tab/app visibility changes

**Smart Resume:**
- Remembers which videos it paused
- Doesn't resume videos user manually paused
- Clears tracking list on focus restore

---

## 🎯 Script Quality Improvements

### What Changed from v1.0.0

**1. Dark Mode (Major Overhaul)**
- **Old:** Simple invert filter with hue-rotate (inverted images twice)
- **New:** Intelligent color palette that preserves media colors
- **Impact:** Works correctly on Google homepage, no more "inverted white = white"

**2. Auto-Scroll (Significant Enhancement)**
- **Old:** Fixed speed, single stop
- **New:** Variable speed control, pause/resume, user feedback
- **Impact:** Much more practical for different content types

**3. Readability Booster (Refinement)**
- **Old:** Basic font sizing
- **New:** Comprehensive typography improvements, max-width, better spacing
- **Impact:** Professional-grade text layout for TV viewing

**4. New Scripts in v2.0.0**
- YouTube TV enhancements
- Ad skip automation
- Image zoom viewer
- Auto-play blocking
- Sticky header removal
- External script example (grayscale)
- CSS template for user customization

**5. Additional Scripts in v2.1.0**
- Cookie consent auto-closer
- Subtitle size enhancer
- Focus trap escape
- Page simplifier
- Video speed controller
- Keyboard shortcuts overlay
- Link target controller
- Video auto-pause on blur

---

## 🔧 Technical Implementation

### Chrome 47 Compatibility

All scripts are written for compatibility with Samsung Tizen's Chrome 47 engine:

- ✅ ES5 syntax (no arrow functions in built output)
- ✅ `var` instead of `let`/`const` where needed
- ✅ Traditional function expressions
- ✅ MutationObserver (Chrome 26+)
- ✅ querySelector/querySelectorAll (Chrome 1+)
- ✅ Basic DOM manipulation

### Cleanup Pattern

Every script implements the cleanup pattern:

```javascript
userscript.cleanup = function() {
  // Remove event listeners
  // Clear intervals
  // Remove injected elements
  // Disconnect observers
};
```

This ensures scripts can be toggled on/off without leaving artifacts.

### Logging

Scripts use `TizenPortal.log()` for user-visible feedback:

```javascript
TizenPortal.log('Auto-scroll started');
```

These messages appear in the diagnostics panel (Blue button).

---

## 🎮 Usage Tips

### Enabling Scripts

1. Navigate to a site with the Userscript Sandbox bundle
2. Press **Yellow** to return to portal
3. Long-press **Enter** on the site card
4. Scroll to "Bundle Scripts" section
5. Toggle scripts on/off as needed

### Script Order Matters

Scripts execute in order. If you have conflicts:
- Disable conflicting scripts
- Reorder in the bundle definition
- Check the diagnostics panel for errors

### Performance Notes

- Auto-scroll and video blocker use intervals/observers (minimal CPU)
- Dark mode and readability inject static CSS (no overhead)
- Image zoom and ad skipper only activate on user interaction

---

## 📚 Adding Your Own Scripts

### Inline Script Template

```javascript
{
  id: 'my-script',
  name: 'My Script Name',
  enabled: false,
  inline: "(function(){/* Your code here */})();",
}
```

### External Script Template

```javascript
{
  id: 'my-external',
  name: 'My External Script',
  source: 'url',
  enabled: false,
  url: 'https://cdn.example.com/script.js',
  inline: '',
  cached: '',
}
```

### Best Practices

1. **Always use IIFE:** `(function(){ ... })();`
2. **Implement cleanup:** `userscript.cleanup = function(){ ... }`
3. **Check TizenPortal exists:** `if (window.TizenPortal)`
4. **Log important actions:** `TizenPortal.log('...')`
5. **Handle errors gracefully:** Use try-catch for DOM queries
6. **Prefix IDs:** Use unique prefixes for injected elements
7. **Test on Tizen:** Chrome 47 has limitations

---

## 🔗 External Script Sources

The grayscale script demonstrates loading from jsdelivr CDN:

```
https://cdn.jsdelivr.net/gh/openstyles/stylus@1.5.31/tools/grayscale.user.js
```

### Recommended External Sources

- **jsdelivr:** Fast, reliable CDN for GitHub repos
- **cdnjs:** Common libraries and utilities
- **unpkg:** NPM packages
- **GitHub raw:** Direct file access (use jsdelivr instead for better caching)

### Security Note

External scripts run with full page access. Only enable scripts from trusted sources.

---

## 📖 Examples from the Web

These scripts were inspired by and adapted from:

1. **Dark Reader** methodology (color inversion → palette replacement)
2. **Stylus** browser extension (grayscale example)
3. **TV-friendly UX** patterns from TizenTube and similar projects
4. **YouTube TV** interfaces (control visibility and sizing)
5. Common userscript patterns from **Greasyfork** and **OpenUserJS**

---

## 🎓 Learning Resources

Want to write your own userscripts? Check out:

- [MDN Web Docs](https://developer.mozilla.org/) - JavaScript and DOM APIs
- [Greasyfork](https://greasyfork.org/) - Userscript repository
- [OpenUserJS](https://openuserjs.org/) - More userscripts
- [TizenPortal Docs](../../docs/) - Platform-specific features

---

## 🐛 Troubleshooting

### Script Not Working

1. Check if script is enabled in site card settings
2. Look for errors in diagnostics panel (Blue button)
3. Verify site domain isn't blocked by script logic
4. Check Chrome 47 compatibility

### Script Conflicts

1. Disable all scripts except one
2. Test each script individually
3. Check for CSS specificity issues
4. Review script execution order

### Performance Issues

1. Disable auto-scroll and video blocker first (use intervals)
2. Check diagnostics for repeated errors
3. Reduce concurrent scripts
4. Clear cache and reload

---

## 📜 License

MIT - Same as TizenPortal

---

## 🙏 Acknowledgments

- **Dark Reader** for dark mode methodology
- **Stylus** for the grayscale script
- **TizenTube** for TV UX patterns
- **Greasyfork** community for userscript inspiration
