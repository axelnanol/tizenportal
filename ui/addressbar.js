import { sanitizeUrl } from '../core/utils.js';

/**
 * TizenPortal Address Bar
 * 
 * Full browser chrome with Home, Back, Forward, Reload, URL, Go.
 * Activated with Red button (short press).
 */

/**
 * Address bar element
 */
var addressBarElement = null;

/**
 * URL input element
 */
var urlInputElement = null;

/**
 * Cached DOM elements for address bar sub-components
 * Only populated after initAddressBar() is called
 */
var cachedElements = {
  container: null,
  display: null,
  input: null,
};

/**
 * Is address bar currently visible
 */
var isVisible = false;

/**
 * Previous focus element before opening address bar
 */
var previousFocus = null;

/**
 * Initialize the address bar
 */
export function initAddressBar() {
  // Create address bar if it doesn't exist
  if (!document.getElementById('tp-addressbar')) {
    createAddressBar();
  }
  
  addressBarElement = document.getElementById('tp-addressbar');
  urlInputElement = document.getElementById('tp-addressbar-url');
  
  // Pre-cache frequently accessed elements
  cachedElements.container = document.getElementById('tp-addressbar-url-container');
  cachedElements.display = document.getElementById('tp-addressbar-url-display');
  cachedElements.input = urlInputElement;
}

/**
 * Create the address bar DOM elements
 */
function createAddressBar() {
  var bar = document.createElement('div');
  bar.id = 'tp-addressbar';
  bar.className = 'tp-addressbar';
  // Mark for horizontal-only navigation (buttons in a row)
  bar.setAttribute('data-tp-nav', 'horizontal');
  
  // SVG icons for better visual quality
  var homeIcon = '<svg viewBox="0 0 24 24" fill="currentColor" class="tp-btn-svg"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>';
  var portalIcon = '<svg viewBox="0 0 24 24" fill="currentColor" class="tp-btn-svg"><path d="M3 5v14h18V5H3zm4 2h4v4H7V7zm-2 10v-4h4v4H5zm12 0h-4v-4h4v4zm2-6h-4V7h4v4z"/></svg>';
  
  bar.innerHTML = '' +
    '<div class="tp-addressbar-content">' +
      // Portal button - return to grid
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-portal" tabindex="0" title="Back to Portal">' +
        portalIcon +
      '</button>' +
      // Home button - go to site's home URL
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-home" tabindex="0" title="Site Home">' +
        homeIcon +
      '</button>' +
      // Back button
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-back" tabindex="0" title="Back">' +
        '<span class="tp-btn-icon">←</span>' +
      '</button>' +
      // Forward button
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-forward" tabindex="0" title="Forward">' +
        '<span class="tp-btn-icon">→</span>' +
      '</button>' +
      // Reload button
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-reload" tabindex="0" title="Reload">' +
        '<span class="tp-btn-icon">↻</span>' +
      '</button>' +
      // URL container (focusable, press Enter to edit)
      '<div class="tp-addressbar-url-container" id="tp-addressbar-url-container" tabindex="0">' +
        '<span class="tp-addressbar-url-display" id="tp-addressbar-url-display"></span>' +
        '<input type="text" class="tp-addressbar-url" id="tp-addressbar-url" tabindex="-1" placeholder="Enter URL...">' +
      '</div>' +
      // Go button
      '<button type="button" class="tp-addressbar-btn tp-addressbar-go" id="tp-addressbar-go" tabindex="0" title="Go">' +
        '<span class="tp-btn-icon">→</span>' +
      '</button>' +
      // Info button - open TizenPortal documentation
      '<button type="button" class="tp-addressbar-btn tp-addressbar-info" id="tp-addressbar-info" tabindex="0" title="TizenPortal Documentation">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" class="tp-btn-svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>' +
      '</button>' +
    '</div>';
  
  // Insert at beginning of shell
  var shell = document.getElementById('tp-shell');
  if (shell) {
    shell.insertBefore(bar, shell.firstChild);
  } else {
    document.body.appendChild(bar);
  }
  
  // Attach event handlers
  attachEventHandlers(bar);
}

/**
 * Attach event handlers to address bar elements
 * @param {HTMLElement} bar
 */
function attachEventHandlers(bar) {
  // Portal button - back to grid
  var portalBtn = bar.querySelector('#tp-addressbar-portal');
  if (portalBtn) {
    portalBtn.addEventListener('click', handlePortal);
    portalBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handlePortal();
    });
  }
  
  // Home button - site's home URL
  var homeBtn = bar.querySelector('#tp-addressbar-home');
  if (homeBtn) {
    homeBtn.addEventListener('click', handleHome);
    homeBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleHome();
    });
  }
  
  // Back button
  var backBtn = bar.querySelector('#tp-addressbar-back');
  if (backBtn) {
    backBtn.addEventListener('click', handleBack);
    backBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleBack();
    });
  }
  
  // Forward button
  var forwardBtn = bar.querySelector('#tp-addressbar-forward');
  if (forwardBtn) {
    forwardBtn.addEventListener('click', handleForward);
    forwardBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleForward();
    });
  }
  
  // Reload button
  var reloadBtn = bar.querySelector('#tp-addressbar-reload');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', handleReload);
    reloadBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleReload();
    });
  }
  
  // Go button
  var goBtn = bar.querySelector('#tp-addressbar-go');
  if (goBtn) {
    goBtn.addEventListener('click', handleGo);
    goBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleGo();
    });
  }
  
  // Info button - open TizenPortal documentation
  var infoBtn = bar.querySelector('#tp-addressbar-info');
  if (infoBtn) {
    infoBtn.addEventListener('click', handleInfo);
    infoBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleInfo();
    });
  }
  
  
  // URL container - Enter key focuses the input
  var urlContainer = bar.querySelector('#tp-addressbar-url-container');
  if (urlContainer) {
    urlContainer.addEventListener('click', handleUrlContainerActivate);
    urlContainer.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) { // Enter
        e.preventDefault();
        handleUrlContainerActivate();
      }
    });
  }
  
  // URL input - handles typing and escape
  var urlInput = bar.querySelector('#tp-addressbar-url');
  if (urlInput) {
    urlInput.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) { // Enter - submit
        e.preventDefault();
        handleGo();
        deactivateUrlInput();
      } else if (e.keyCode === 27 || e.keyCode === 10009) { // Escape or Back - cancel edit
        e.preventDefault();
        deactivateUrlInput();
      }
    });
    
    urlInput.addEventListener('blur', function() {
      // When input loses focus, deactivate it
      deactivateUrlInput();
    });
  }
}

/**
 * Track if URL input is currently active (editable)
 */
var isUrlInputActive = false;

/**
 * Activate URL input for editing
 */
function handleUrlContainerActivate() {
  var container = cachedElements.container;
  var display = cachedElements.display;
  var input = cachedElements.input;
  
  if (!container || !input) return;
  
  // Show input, hide display
  container.classList.add('editing');
  if (display) display.style.display = 'none';
  input.style.display = 'block';
  input.tabIndex = 0;
  
  // Focus and select input
  try {
    input.focus();
    input.select();
  } catch (err) {
    console.warn('TizenPortal: URL input focus error:', err.message);
  }
  
  isUrlInputActive = true;
  console.log('TizenPortal: URL input activated');
}

/**
 * Deactivate URL input (return to display mode)
 */
function deactivateUrlInput() {
  if (!isUrlInputActive) return;
  
  var container = cachedElements.container;
  var display = cachedElements.display;
  var input = cachedElements.input;
  
  if (!container) return;
  
  // Update display with current input value
  if (display && input) {
    var url = input.value.trim();
    display.textContent = url || 'Press ENTER to edit URL';
    display.style.display = 'block';
  }
  
  // Hide input, show display
  container.classList.remove('editing');
  if (input) {
    input.style.display = 'none';
    input.tabIndex = -1;
  }
  
  // Return focus to container
  container.focus();
  
  isUrlInputActive = false;
  console.log('TizenPortal: URL input deactivated');
}

/**
 * Show the address bar
 */
export function showAddressBar() {
  if (isVisible) return;
  
  // Store previous focus
  previousFocus = document.activeElement;
  
  // Update URL from current location
  updateUrlFromCurrentLocation();
  
  // Show bar
  if (addressBarElement) {
    addressBarElement.classList.add('visible');
    isVisible = true;
    
    // Focus the URL container (not the input itself)
    var urlContainer = cachedElements.container;
    if (urlContainer) {
      try {
        urlContainer.focus();
      } catch (err) {
        console.warn('TizenPortal: Address bar focus error:', err.message);
      }
    }
  }
  
  console.log('TizenPortal: Address bar shown');
}

/**
 * Hide the address bar
 */
export function hideAddressBar() {
  if (!isVisible) return;
  
  // Deactivate URL input if active
  deactivateUrlInput();
  
  if (addressBarElement) {
    addressBarElement.classList.remove('visible');
    isVisible = false;
  }
  
  // Restore previous focus (if still valid)
  var restored = false;
  if (previousFocus) {
    try {
      // Check if element is still in DOM and visible
      if (previousFocus.offsetParent !== null || previousFocus === document.body) {
        previousFocus.focus();
        restored = true;
      }
    } catch (err) {
      // Ignore
    }
    previousFocus = null;
  }
  
  // If couldn't restore, try to find something sensible to focus
  if (!restored) {
    restoreFocusAfterOverlay();
  }
  
  console.log('TizenPortal: Address bar hidden');
}

/**
 * Restore focus after closing an overlay when previousFocus is invalid
 */
function restoreFocusAfterOverlay() {
  // On portal page, focus cards
  var targets = [
    '.tp-card:focus',
    '.tp-card',
    '.tp-add-card',
    '#tp-portal-grid',
  ];
  
  for (var i = 0; i < targets.length; i++) {
    var el = document.querySelector(targets[i]);
    if (el && el.offsetParent !== null) {
      try {
        el.focus();
        console.log('TizenPortal: Focus restored to:', targets[i]);
        return;
      } catch (err) {
        // Try next
      }
    }
  }
}

/**
 * Toggle address bar visibility
 */
export function toggleAddressBar() {
  if (isVisible) {
    hideAddressBar();
  } else {
    showAddressBar();
  }
}

/**
 * Check if address bar is visible
 * @returns {boolean}
 */
export function isAddressBarVisible() {
  return isVisible;
}

/**
 * Update URL display and input from current location
 */
function updateUrlFromCurrentLocation() {
  var display = cachedElements.display;
  var input = cachedElements.input;
  
  // Use current window location
  var url = window.location.href;
  
  // Update both display and input
  if (display) {
    display.textContent = url || 'Press ENTER to edit URL';
  }
  if (input) {
    input.value = url;
  }
}

/**
 * Handle Portal button - return to portal grid
 */
function handlePortal() {
  console.log('TizenPortal: Address bar - Portal');
  hideAddressBar();
  
  if (window.TizenPortal && window.TizenPortal.closeSite) {
    window.TizenPortal.closeSite();
  }
}

/**
 * Handle Home button - go to site's original URL
 */
function handleHome() {
  console.log('TizenPortal: Address bar - Site Home');
  
  // Get the current card's original URL
  var homeUrl = null;
  try {
    var state = window.TizenPortal ? window.TizenPortal.getState() : null;
    if (state && state.currentCard) {
      homeUrl = state.currentCard.url;
    }
  } catch (err) {
    console.warn('TizenPortal: Cannot get current card');
  }
  
  if (!homeUrl) {
    if (window.TizenPortal) {
      window.TizenPortal.showToast('No home URL');
    }
    return;
  }
  
  // Navigate to home URL
  window.location.href = homeUrl;
  
  if (window.TizenPortal) {
    window.TizenPortal.showToast('Going to site home');
  }
  
  hideAddressBar();
}


/**
 * Handle Back button - go back in history
 */
function handleBack() {
  console.log('TizenPortal: Address bar - Back');
  
  // Use window history
  window.history.back();
  
  if (window.TizenPortal) {
    window.TizenPortal.showToast('Back');
  }
}

/**
 * Handle Forward button - go forward in history
 */
function handleForward() {
  console.log('TizenPortal: Address bar - Forward');
  
  // Use window history
  window.history.forward();
  
  if (window.TizenPortal) {
    window.TizenPortal.showToast('Forward');
  }
}

/**
 * Handle Reload button - reload page
 */
function handleReload() {
  console.log('TizenPortal: Address bar - Reload');
  
  if (window.TizenPortal) {
    window.TizenPortal.showToast('Reloading...');
  }
  
  // Reload current window
  window.location.reload();
}

/**
 * Handle Go button - navigate to URL
 */
function handleGo() {
  if (!urlInputElement) return;
  
  var url = urlInputElement.value.trim();
  if (!url) return;
  
  // Validate and normalise URL
  url = sanitizeUrl(url);
  if (!url) {
    if (window.TizenPortal) {
      window.TizenPortal.showToast('Invalid URL — only http/https allowed');
    }
    return;
  }
  
  console.log('TizenPortal: Address bar - Go to:', url);
  
  // Navigate to URL
  if (window.TizenPortal) {
    window.TizenPortal.showToast('Loading...');
  }
  window.location.href = url;
  
  hideAddressBar();
}

/**
 * Handle Info button - navigate to TizenPortal documentation via portal relay
 */
function handleInfo() {
  console.log('TizenPortal: Address bar - Info');
  hideAddressBar();
  var docsUrl = 'https://axelnanol.github.io/tizenportal/';
  if (window.TizenPortal && window.TizenPortal.navigateUrl) {
    window.TizenPortal.navigateUrl(docsUrl);
  } else {
    window.location.href = docsUrl;
  }
}
