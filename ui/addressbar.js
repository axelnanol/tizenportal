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
}

/**
 * Create the address bar DOM elements
 */
function createAddressBar() {
  var bar = document.createElement('div');
  bar.id = 'tp-addressbar';
  bar.className = 'tp-addressbar';
  
  bar.innerHTML = '' +
    '<div class="tp-addressbar-content">' +
      // Portal button - return to grid
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-portal" tabindex="0" title="Back to Portal">' +
        '<span class="tp-btn-icon">P</span>' +
      '</button>' +
      // Home button - go to site's home URL
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-home" tabindex="0" title="Site Home">' +
        '<span class="tp-btn-icon">H</span>' +
      '</button>' +
      // Back button
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-back" tabindex="0" title="Back">' +
        '<span class="tp-btn-icon">&lt;</span>' +
      '</button>' +
      // Forward button
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-forward" tabindex="0" title="Forward">' +
        '<span class="tp-btn-icon">&gt;</span>' +
      '</button>' +
      // Reload button
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-reload" tabindex="0" title="Reload">' +
        '<span class="tp-btn-icon">R</span>' +
      '</button>' +
      // URL container (focusable, press Enter to edit)
      '<div class="tp-addressbar-url-container" id="tp-addressbar-url-container" tabindex="0">' +
        '<span class="tp-addressbar-url-display" id="tp-addressbar-url-display">Press ENTER to edit URL</span>' +
        '<input type="text" class="tp-addressbar-url" id="tp-addressbar-url" tabindex="-1" placeholder="Enter URL...">' +
      '</div>' +
      // Go button
      '<button type="button" class="tp-addressbar-btn tp-addressbar-go" id="tp-addressbar-go" tabindex="0" title="Go">' +
        '<span class="tp-btn-icon">GO</span>' +
      '</button>' +
      // Open in Tizen Browser button
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-tizen" tabindex="0" title="Open in Tizen Browser">' +
        '<span class="tp-btn-icon">TB</span>' +
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
  
  // Tizen Browser button
  var tizenBtn = bar.querySelector('#tp-addressbar-tizen');
  if (tizenBtn) {
    tizenBtn.addEventListener('click', handleTizenBrowser);
    tizenBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleTizenBrowser();
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
  var container = document.getElementById('tp-addressbar-url-container');
  var display = document.getElementById('tp-addressbar-url-display');
  var input = document.getElementById('tp-addressbar-url');
  
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
  
  var container = document.getElementById('tp-addressbar-url-container');
  var display = document.getElementById('tp-addressbar-url-display');
  var input = document.getElementById('tp-addressbar-url');
  
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
  
  // Update URL from current iframe
  updateUrlFromIframe();
  
  // Show bar
  if (addressBarElement) {
    addressBarElement.classList.add('visible');
    isVisible = true;
    
    // Focus the URL container (not the input itself)
    var urlContainer = document.getElementById('tp-addressbar-url-container');
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
  
  // Restore previous focus
  if (previousFocus) {
    try {
      previousFocus.focus();
    } catch (err) {
      // Ignore
    }
    previousFocus = null;
  }
  
  console.log('TizenPortal: Address bar hidden');
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
 * Update URL display and input from current iframe
 */
function updateUrlFromIframe() {
  var display = document.getElementById('tp-addressbar-url-display');
  var input = document.getElementById('tp-addressbar-url');
  
  var url = '';
  
  var iframe = document.getElementById('tp-iframe');
  if (iframe) {
    try {
      // Try to get actual URL from contentWindow
      url = iframe.contentWindow.location.href;
    } catch (err) {
      // Cross-origin - use src attribute instead
      url = iframe.src || '';
    }
  } else {
    // No iframe - get URL from state
    try {
      var state = window.TizenPortal ? window.TizenPortal.getState() : null;
      if (state && state.currentCard) {
        url = state.currentCard.url || '';
      }
    } catch (err) {
      // Ignore
    }
  }
  
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
  
  // Navigate iframe to home URL
  var iframe = document.getElementById('tp-iframe');
  if (iframe) {
    try {
      iframe.contentWindow.location.href = homeUrl;
    } catch (err) {
      iframe.src = homeUrl;
    }
    
    if (window.TizenPortal) {
      window.TizenPortal.showToast('Going to site home');
    }
    
    // Update URL input
    if (urlInputElement) {
      urlInputElement.value = homeUrl;
    }
  }
  
  hideAddressBar();
}

/**
 * Handle Tizen Browser button - open current URL in Tizen browser
 */
function handleTizenBrowser() {
  console.log('TizenPortal: Address bar - Open in Tizen Browser');
  
  // Get current URL from input field
  var url = urlInputElement ? urlInputElement.value.trim() : '';
  
  if (!url) {
    // Try to get from iframe
    var iframe = document.getElementById('tp-iframe');
    if (iframe) {
      try {
        url = iframe.contentWindow.location.href;
      } catch (err) {
        url = iframe.src || '';
      }
    }
  }
  
  if (!url) {
    if (window.TizenPortal) {
      window.TizenPortal.showToast('No URL to open');
    }
    return;
  }
  
  hideAddressBar();
  
  // Use TizenPortal API to open in Tizen browser
  if (window.TizenPortal && window.TizenPortal.openInTizenBrowser) {
    window.TizenPortal.openInTizenBrowser(url);
  } else {
    // Fallback - try direct Tizen API
    try {
      var appControl = new tizen.ApplicationControl(
        'http://tizen.org/appcontrol/operation/view',
        url,
        null,
        null
      );
      tizen.application.launchAppControl(
        appControl,
        null,
        function() { console.log('TizenPortal: Launched Tizen browser'); },
        function(err) { console.error('TizenPortal: Failed to launch browser:', err.message); }
      );
    } catch (err) {
      console.error('TizenPortal: Tizen API not available:', err.message);
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Cannot open Tizen browser');
      }
    }
  }
}

/**
 * Handle Back button - go back in iframe history
 */
function handleBack() {
  console.log('TizenPortal: Address bar - Back');
  
  var iframe = document.getElementById('tp-iframe');
  if (iframe) {
    try {
      iframe.contentWindow.history.back();
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Back');
      }
    } catch (err) {
      console.warn('TizenPortal: Cannot go back (cross-origin)');
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Cannot go back');
      }
    }
  }
}

/**
 * Handle Forward button - go forward in iframe history
 */
function handleForward() {
  console.log('TizenPortal: Address bar - Forward');
  
  var iframe = document.getElementById('tp-iframe');
  if (iframe) {
    try {
      iframe.contentWindow.history.forward();
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Forward');
      }
    } catch (err) {
      console.warn('TizenPortal: Cannot go forward (cross-origin)');
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Cannot go forward');
      }
    }
  }
}

/**
 * Handle Reload button - reload iframe
 */
function handleReload() {
  console.log('TizenPortal: Address bar - Reload');
  
  var iframe = document.getElementById('tp-iframe');
  if (iframe) {
    if (window.TizenPortal) {
      window.TizenPortal.showToast('Reloading...');
    }
    try {
      iframe.contentWindow.location.reload();
    } catch (err) {
      // Cross-origin - reset src
      var src = iframe.src;
      iframe.src = '';
      iframe.src = src;
    }
  }
}

/**
 * Handle Go button - navigate to URL
 */
function handleGo() {
  if (!urlInputElement) return;
  
  var url = urlInputElement.value.trim();
  if (!url) return;
  
  // Ensure URL has protocol
  if (url.indexOf('://') === -1) {
    // Check if it looks like a domain
    if (url.indexOf('.') !== -1 || url.indexOf('localhost') !== -1) {
      url = 'https://' + url;
    } else {
      // Treat as search (could be expanded to use a search engine)
      url = 'https://' + url;
    }
  }
  
  console.log('TizenPortal: Address bar - Go to:', url);
  
  // Navigate
  var iframe = document.getElementById('tp-iframe');
  if (iframe) {
    try {
      iframe.contentWindow.location.href = url;
    } catch (err) {
      iframe.src = url;
    }
    
    if (window.TizenPortal) {
      window.TizenPortal.showToast('Loading...');
    }
  } else {
    // No iframe - load as new site
    if (window.TizenPortal && window.TizenPortal.loadSite) {
      window.TizenPortal.loadSite({
        name: 'URL',
        url: url,
        bundle: 'default',
        userAgent: 'tizen',
      });
    }
  }
  
  hideAddressBar();
}
