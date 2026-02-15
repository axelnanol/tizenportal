/**
 * Userscript Registry
 * 
 * Central registry of all available userscripts.
 * Now uses the unified registry system for consistency with features.
 * Scripts are categorized and can be enabled globally or per-site.
 */

import Registry from './registry.js';

/**
 * Userscript categories for UI organization
 * Only includes categories relevant to userscripts (not feature categories)
 */
var CATEGORIES = {
  ACCESSIBILITY: 'accessibility',
  READING: 'reading',
  VIDEO: 'video',
  NAVIGATION: 'navigation',
  PRIVACY: 'privacy',
  EXPERIMENTAL: 'experimental',
};

/**
 * All available userscripts
 * Each script has:
 * - id: unique identifier (no prefix needed, IDs are self-contained)
 * - name: display name
 * - category: CATEGORIES value for UI grouping
 * - description: short description
 * - defaultEnabled: boolean (default false)
 * - source: 'inline' or 'url'
 * - inline: inline script code (if source='inline')
 * - url: external URL (if source='url')
 * - provides: array of feature names for conflict detection
 */
var USERSCRIPTS = [
  // ACCESSIBILITY CATEGORY
  // NOTE: readability-booster moved to core polyfills (css-compatibility.js)
  // as it compensates for Chrome 47 lack of clamp() support; registry now contains 18 predefined userscripts
  {
    id: 'subtitle-enhancer',
    name: 'Subtitle Size Enhancer',
    category: CATEGORIES.ACCESSIBILITY,
    description: 'Increases subtitle/caption size for TV viewing',
    defaultEnabled: false,
    source: 'inline',
    provides: ['subtitle-enhancement'],
    inline: "(function(){var s=document.createElement('style');s.id='tp-subtitle-enhance';s.textContent='.ytp-caption-segment,.caption-window,.captions-text,::cue,video::cue{font-size:200%!important;line-height:1.4!important;background-color:rgba(0,0,0,0.85)!important;padding:8px 12px!important;border-radius:4px!important;text-shadow:2px 2px 4px rgba(0,0,0,0.9)!important}.caption-window{bottom:10%!important}';document.head.appendChild(s);var observer=new MutationObserver(function(){var captions=document.querySelectorAll('.ytp-caption-segment,.caption-window,.captions-text');for(var i=0;i<captions.length;i++){captions[i].style.fontSize='200%';captions[i].style.lineHeight='1.4';}});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});userscript.cleanup=function(){var el=document.getElementById('tp-subtitle-enhance');if(el)el.remove();if(observer)observer.disconnect();}})();",
  },
  {
    id: 'keyboard-help',
    name: 'Keyboard Shortcuts Overlay',
    category: CATEGORIES.ACCESSIBILITY,
    description: 'Display available TV remote shortcuts (Press Info or ?)',
    defaultEnabled: false,
    source: 'inline',
    provides: ['keyboard-help'],
    inline: "(function(){var overlay=null;var visible=false;function createOverlay(){var div=document.createElement('div');div.id='tp-kbd-help';div.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.95);color:#e8e6e3;padding:30px;border-radius:8px;z-index:999998;display:none;max-width:600px;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.5);';div.innerHTML='<h2 style=\"margin:0 0 20px 0;color:#8ab4f8;font-size:24px;\">TV Remote Shortcuts</h2><div style=\"line-height:2;\"><strong style=\"color:#c58af9;\">Navigation:</strong><br>↑ ↓ ← → : Move focus<br>Enter : Select<br>Back : Go back<br><br><strong style=\"color:#c58af9;\">Color Buttons:</strong><br>Red : Address bar<br>Green : Mouse mode<br>Yellow : Return to portal<br>Blue : Diagnostics<br><br><strong style=\"color:#c58af9;\">Media:</strong><br>Play/Pause : Toggle playback<br>Stop : Stop media<br>FF/Rewind : Seek<br><br><strong style=\"color:#c58af9;\">This Overlay:</strong><br>Info / ? : Toggle help</div>';document.body.appendChild(div);return div;}function toggleOverlay(){if(!overlay)overlay=createOverlay();visible=!visible;overlay.style.display=visible?'block':'none';}var keyHandler=function(e){if(e.keyCode===457||e.keyCode===63||e.keyCode===191){toggleOverlay();e.preventDefault();e.stopPropagation();}else if(visible&&(e.keyCode===10009||e.keyCode===13)){toggleOverlay();e.preventDefault();e.stopPropagation();}};document.addEventListener('keydown',keyHandler,true);userscript.cleanup=function(){document.removeEventListener('keydown',keyHandler,true);if(overlay)overlay.remove();}})();",
  },

  // READING CATEGORY
  {
    id: 'dark-reading-mode',
    name: 'Dark Reading Mode',
    category: CATEGORIES.READING,
    description: 'Optimized dark-themed reading experience for TV viewing',
    defaultEnabled: false,
    source: 'inline',
    provides: ['dark-mode', 'reading-mode', 'clutter-removal'],
    inline: "(function(){var s=document.createElement('style');s.id='tp-dark-reader';s.textContent='aside,nav:not([role=\"navigation\"]):not(.ytp-chrome-bottom),.sidebar,[class*=\"sidebar\"],[id*=\"sidebar\"],.ad,[class*=\"advertisement\"],[id*=\"advertisement\"],[class*=\"social-share\"],[id*=\"social\"]:not(article):not(main),.comments,[id*=\"comment\"]:not(article):not(main),.related,[class*=\"related\"]:not(main){display:none!important}body{background-color:#1a1a1a!important;color:#e8e6e3!important;padding:40px 20px!important}article,main,[role=\"main\"]{max-width:900px!important;margin:0 auto!important;padding:30px!important;background-color:#242424!important;border-radius:8px!important;box-shadow:0 2px 8px rgba(0,0,0,0.3)!important}article *,main *,[role=\"main\"] *{background-color:transparent!important}p,li,td,th,div{color:#e8e6e3!important;line-height:1.9!important;font-size:22px!important}h1,h2,h3,h4,h5,h6{color:#f0f0f0!important;margin-top:1.5em!important;margin-bottom:0.8em!important;line-height:1.4!important}a{color:#8ab4f8!important;text-decoration:underline!important}a:visited{color:#c58af9!important}img,video{opacity:0.95!important;border-radius:4px!important}code,pre{background-color:#2d2d2d!important;color:#a8dadc!important;padding:2px 6px!important;border-radius:3px!important}blockquote{border-left:4px solid #8ab4f8!important;padding-left:20px!important;margin-left:0!important;color:#d0d0d0!important}';document.head.appendChild(s);userscript.cleanup=function(){var el=document.getElementById('tp-dark-reader');if(el)el.remove();}})();",
  },
  {
    id: 'light-reading-mode',
    name: 'Light Reading Mode',
    category: CATEGORIES.READING,
    description: 'Optimized light-themed reading experience for TV viewing',
    defaultEnabled: false,
    source: 'inline',
    provides: ['light-mode', 'reading-mode', 'clutter-removal'],
    inline: "(function(){var s=document.createElement('style');s.id='tp-light-reader';s.textContent='aside,nav:not([role=\"navigation\"]):not(.ytp-chrome-bottom),.sidebar,[class*=\"sidebar\"],[id*=\"sidebar\"],.ad,[class*=\"advertisement\"],[id*=\"advertisement\"],[class*=\"social-share\"],[id*=\"social\"]:not(article):not(main),.comments,[id*=\"comment\"]:not(article):not(main),.related,[class*=\"related\"]:not(main){display:none!important}body{background-color:#faf8f5!important;color:#2c2c2c!important;padding:40px 20px!important}article,main,[role=\"main\"]{max-width:900px!important;margin:0 auto!important;padding:30px!important;background-color:#ffffff!important;border-radius:8px!important;box-shadow:0 2px 12px rgba(0,0,0,0.08)!important}article *,main *,[role=\"main\"] *{background-color:transparent!important}p,li,td,th,div{color:#2c2c2c!important;line-height:1.9!important;font-size:22px!important}h1,h2,h3,h4,h5,h6{color:#1a1a1a!important;margin-top:1.5em!important;margin-bottom:0.8em!important;line-height:1.4!important}a{color:#0066cc!important;text-decoration:underline!important}a:visited{color:#551a8b!important}img,video{border-radius:4px!important}code,pre{background-color:#f5f5f5!important;color:#d63384!important;padding:2px 6px!important;border-radius:3px!important;border:1px solid #e0e0e0!important}blockquote{border-left:4px solid #0066cc!important;padding-left:20px!important;margin-left:0!important;color:#555!important;font-style:italic!important}';document.head.appendChild(s);userscript.cleanup=function(){var el=document.getElementById('tp-light-reader');if(el)el.remove();}})();",
  },
  {
    id: 'smart-dark-mode',
    name: 'Smart Dark Mode',
    category: CATEGORIES.READING,
    description: 'Intelligent dark theme without image distortion',
    defaultEnabled: false,
    source: 'inline',
    provides: ['dark-mode'],
    inline: "(function(){var s=document.createElement('style');s.id='tp-smart-dark';s.textContent='html{background-color:#181818!important;color:#e8e6e3!important}body{background-color:#181818!important;color:#e8e6e3!important}div,section,article,main,aside,nav,header,footer,p,span,li,td,th,h1,h2,h3,h4,h5,h6{background-color:transparent!important;color:#e8e6e3!important}a{color:#8ab4f8!important}a:visited{color:#c58af9!important}input,textarea,select,button{background-color:#303134!important;color:#e8e6e3!important;border:1px solid #5f6368!important}input::placeholder,textarea::placeholder{color:#9aa0a6!important}img,video,canvas,iframe{opacity:0.9!important}*[style*=\"background\"]:not(img):not(video):not(canvas){background-color:#202124!important}*[style*=\"color\"]{color:#e8e6e3!important}';document.head.appendChild(s);userscript.cleanup=function(){var el=document.getElementById('tp-smart-dark');if(el)el.remove();}})();",
  },
  {
    id: 'page-simplifier',
    name: 'Page Simplifier',
    category: CATEGORIES.READING,
    description: 'Remove clutter for focused reading',
    defaultEnabled: false,
    source: 'inline',
    provides: ['clutter-removal'],
    inline: "(function(){var s=document.createElement('style');s.id='tp-simplify';s.textContent='aside,nav:not([role=\"navigation\"]):not(.ytp-chrome-bottom),.sidebar,[class*=\"sidebar\"],[id*=\"sidebar\"],.ad,[class*=\"advertisement\"],[id*=\"advertisement\"],[class*=\"social-share\"],[id*=\"social\"]:not(article):not(main),.comments,[id*=\"comment\"]:not(article):not(main),.related,[class*=\"related\"]:not(main){display:none!important}article,main,[role=\"main\"]{max-width:1400px!important;margin:0 auto!important;padding:20px!important}body{background:#181818!important}';document.head.appendChild(s);userscript.cleanup=function(){var el=document.getElementById('tp-simplify');if(el)el.remove();}})();",
  },
  {
    id: 'grayscale-mode',
    name: 'Grayscale Mode',
    category: CATEGORIES.READING,
    description: 'Convert page to grayscale for focus or accessibility',
    defaultEnabled: false,
    source: 'inline',
    provides: ['grayscale'],
    inline: "(function(){var s=document.createElement('style');s.id='tp-grayscale';s.textContent='html{-webkit-filter:grayscale(100%)!important;filter:grayscale(100%)!important}';document.head.appendChild(s);userscript.cleanup=function(){var el=document.getElementById('tp-grayscale');if(el)el.remove();}})();",
  },

  // VIDEO CATEGORY
  {
    id: 'video-speed-controller',
    name: 'Video Speed Controller',
    category: CATEGORIES.VIDEO,
    description: 'Fine-tune video playback speed (Shift+Up/Down)',
    defaultEnabled: false,
    source: 'inline',
    provides: ['video-speed-control'],
    inline: "(function(){var log=function(msg){if(window.TizenPortal&&TizenPortal.log)TizenPortal.log(msg);};var currentSpeed=1.0;var speeds=[0.25,0.5,0.75,1.0,1.25,1.5,1.75,2.0];var speedIndex=3;function setSpeed(speed){var vids=document.querySelectorAll('video');for(var i=0;i<vids.length;i++){vids[i].playbackRate=speed;}currentSpeed=speed;log('Video speed: '+speed+'x');}var keyHandler=function(e){if(e.shiftKey&&e.keyCode===38){speedIndex=Math.min(speeds.length-1,speedIndex+1);setSpeed(speeds[speedIndex]);e.preventDefault();}else if(e.shiftKey&&e.keyCode===40){speedIndex=Math.max(0,speedIndex-1);setSpeed(speeds[speedIndex]);e.preventDefault();}else if(e.shiftKey&&(e.keyCode===37||e.keyCode===39)){speedIndex=3;setSpeed(1.0);e.preventDefault();}};document.addEventListener('keydown',keyHandler);var observer=new MutationObserver(function(){var vids=document.querySelectorAll('video');for(var i=0;i<vids.length;i++){if(Math.abs(vids[i].playbackRate-currentSpeed)>0.01){vids[i].playbackRate=currentSpeed;}}});observer.observe(document.body,{childList:true,subtree:true});log('Video speed control active (Shift+Up/Down: adjust, Shift+Left/Right: reset)');userscript.cleanup=function(){document.removeEventListener('keydown',keyHandler);if(observer)observer.disconnect();}})();",
  },
  {
    id: 'video-autopause',
    name: 'Video Auto-Pause on Blur',
    category: CATEGORIES.VIDEO,
    description: 'Pause videos when app loses focus',
    defaultEnabled: false,
    source: 'inline',
    provides: ['video-auto-pause'],
    inline: "(function(){var log=function(msg){if(window.TizenPortal&&TizenPortal.log)TizenPortal.log(msg);};var pausedByScript=[];function pauseAll(){var vids=document.querySelectorAll('video');for(var i=0;i<vids.length;i++){if(!vids[i].paused){vids[i].pause();if(!pausedByScript.includes(vids[i])){pausedByScript.push(vids[i]);log('Paused video (visibility lost)');}}}}function resumeAll(){for(var i=0;i<pausedByScript.length;i++){try{pausedByScript[i].play();log('Resumed video (visibility restored)');}catch(e){}}pausedByScript=[];}var blurHandler=function(){pauseAll();};var focusHandler=function(){resumeAll();};var visibilityHandler=function(){if(document.hidden){pauseAll();}else{resumeAll();}};window.addEventListener('blur',blurHandler);window.addEventListener('focus',focusHandler);document.addEventListener('visibilitychange',visibilityHandler);userscript.cleanup=function(){window.removeEventListener('blur',blurHandler);window.removeEventListener('focus',focusHandler);document.removeEventListener('visibilitychange',visibilityHandler);}})();",
  },
  {
    id: 'autoplay-blocker',
    name: 'Auto-Play Video Blocker',
    category: CATEGORIES.VIDEO,
    description: 'Prevents videos from auto-playing',
    defaultEnabled: false,
    source: 'inline',
    provides: ['autoplay-blocking'],
    inline: "(function(){var pausedVideos=[];var log=function(msg){if(window.TizenPortal&&TizenPortal.log)TizenPortal.log(msg);};function pauseVideo(vid){if(!vid.paused&&!pausedVideos.includes(vid)){vid.pause();pausedVideos.push(vid);log('Auto-paused video');}}function checkVideos(){var vids=document.querySelectorAll('video');for(var i=0;i<vids.length;i++){if(!vids[i].paused&&vids[i].currentTime>0){pauseVideo(vids[i]);}}}var observer=new MutationObserver(checkVideos);observer.observe(document.body,{childList:true,subtree:true});checkVideos();var interval=setInterval(checkVideos,1000);userscript.cleanup=function(){if(observer)observer.disconnect();if(interval)clearInterval(interval);}})();",
  },
  {
    id: 'youtube-tv',
    name: 'YouTube TV Enhancements',
    category: CATEGORIES.VIDEO,
    description: 'Improves YouTube experience on TV (Note: Browser warnings automatically hidden)',
    defaultEnabled: false,
    source: 'inline',
    provides: ['youtube-enhancement'],
    inline: "(function(){if(!window.location.host.includes('youtube.com'))return;var log=function(msg){if(window.TizenPortal&&TizenPortal.log)TizenPortal.log(msg);};var s=document.createElement('style');s.id='tp-yt-tv';s.textContent='.ytp-chrome-top,.ytp-chrome-bottom,.ytp-gradient-top,.ytp-gradient-bottom{display:block!important;opacity:1!important}.html5-video-player:not(.ytp-fullscreen) .ytp-chrome-bottom{height:auto!important;padding:10px!important}.ytp-play-button,.ytp-time-display,.ytp-volume-panel{font-size:140%!important;min-width:50px!important;min-height:50px!important}video{max-height:90vh!important}';document.head.appendChild(s);var hideWarning=function(){var warnings=document.querySelectorAll('[class*=\"unsupported\"],[id*=\"unsupported\"],[class*=\"browser-update\"],[id*=\"browser-update\"]');for(var i=0;i<warnings.length;i++){if(warnings[i].textContent&&warnings[i].textContent.toLowerCase().indexOf('update')!==-1){warnings[i].style.display='none';log('Hid browser warning');}}};var observer=new MutationObserver(hideWarning);observer.observe(document.body,{childList:true,subtree:true});hideWarning();var checkInterval=setInterval(function(){var vid=document.querySelector('video');if(vid){vid.playbackRate=1.0;clearInterval(checkInterval);}},1000);userscript.cleanup=function(){var el=document.getElementById('tp-yt-tv');if(el)el.remove();if(checkInterval)clearInterval(checkInterval);if(observer)observer.disconnect();}})();",
  },

  // NAVIGATION CATEGORY
  {
    id: 'autoscroll',
    name: 'Smart Auto-Scroll',
    category: CATEGORIES.NAVIGATION,
    description: 'Intelligent auto-scrolling with speed control (Up/Down: speed, Enter: pause)',
    defaultEnabled: false,
    source: 'inline',
    provides: ['auto-scroll'],
    inline: "(function(){var speed=1;var interval=null;var scrolling=true;var log=function(msg){if(window.TizenPortal&&TizenPortal.log)TizenPortal.log(msg);};function startScroll(){if(interval)clearInterval(interval);interval=setInterval(function(){if(scrolling)window.scrollBy(0,speed);},30);}function stopScroll(){if(interval){clearInterval(interval);interval=null;}}function toggleScroll(){scrolling=!scrolling;log('Auto-scroll '+(scrolling?'resumed':'paused'));}var keyHandler=function(e){if(e.keyCode===38){speed=Math.max(0.5,speed-0.5);log('Scroll speed: '+speed+'px');e.preventDefault();}else if(e.keyCode===40){speed=Math.min(5,speed+0.5);log('Scroll speed: '+speed+'px');e.preventDefault();}else if(e.keyCode===19||e.keyCode===415||e.keyCode===13){toggleScroll();e.preventDefault();}else if(e.keyCode===413||e.keyCode===10009){stopScroll();document.removeEventListener('keydown',keyHandler);log('Auto-scroll stopped');e.preventDefault();}};document.addEventListener('keydown',keyHandler);startScroll();log('Auto-scroll started (Up/Down: speed, Enter/Pause: toggle, Stop/Back: exit)');userscript.cleanup=function(){stopScroll();document.removeEventListener('keydown',keyHandler);}})();",
  },
  {
    id: 'focus-escape',
    name: 'Focus Trap Escape',
    category: CATEGORIES.NAVIGATION,
    description: 'Break out of stuck focus loops (ESC to escape)',
    defaultEnabled: false,
    source: 'inline',
    provides: ['focus-escape'],
    inline: "(function(){var log=function(msg){if(window.TizenPortal&&TizenPortal.log)TizenPortal.log(msg);};var escapeAttempts=0;var lastFocused=null;var keyHandler=function(e){if(e.keyCode===27||e.keyCode===10182){var current=document.activeElement;if(current&&current!==document.body){current.blur();document.body.focus();log('Focus trap escaped - blur current element');e.preventDefault();}}else if(e.keyCode===37||e.keyCode===38||e.keyCode===39||e.keyCode===40){var current=document.activeElement;if(current===lastFocused){escapeAttempts++;if(escapeAttempts>5){var focusable=document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex=\"-1\"])');if(focusable.length>0){var randomIdx=Math.floor(Math.random()*Math.min(focusable.length,10));focusable[randomIdx].focus();log('Broke focus loop - jumped to random element');escapeAttempts=0;e.preventDefault();}}}else{escapeAttempts=0;}lastFocused=current;}};document.addEventListener('keydown',keyHandler,true);userscript.cleanup=function(){document.removeEventListener('keydown',keyHandler,true);}})();",
  },
  {
    id: 'remove-sticky',
    name: 'Remove Sticky Headers',
    category: CATEGORIES.NAVIGATION,
    description: 'Removes fixed/sticky headers that block content',
    defaultEnabled: false,
    source: 'inline',
    provides: ['sticky-removal'],
    inline: "(function(){var s=document.createElement('style');s.id='tp-no-sticky';s.textContent='*[style*=\"position: fixed\"],*[style*=\"position:fixed\"]{position:static!important}header[style*=\"position\"],nav[style*=\"position\"]{position:static!important}.fixed,.sticky,[class*=\"fixed\"],[class*=\"sticky\"]{position:static!important}';document.head.appendChild(s);userscript.cleanup=function(){var el=document.getElementById('tp-no-sticky');if(el)el.remove();}})();",
  },
  {
    id: 'image-zoom',
    name: 'Image Focus Zoom',
    category: CATEGORIES.NAVIGATION,
    description: 'Click any image to view it fullscreen',
    defaultEnabled: false,
    source: 'inline',
    provides: ['image-zoom'],
    inline: "(function(){var zoomedImg=null;var overlay=null;function createOverlay(){overlay=document.createElement('div');overlay.id='tp-zoom-overlay';overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:999999;display:none;align-items:center;justify-content:center;';var img=document.createElement('img');img.id='tp-zoom-img';img.style.cssText='max-width:95%;max-height:95%;object-fit:contain;';overlay.appendChild(img);document.body.appendChild(overlay);return overlay;}function showZoom(src){if(!overlay)overlay=createOverlay();var img=document.getElementById('tp-zoom-img');img.src=src;overlay.style.display='flex';zoomedImg=img;}function hideZoom(){if(overlay)overlay.style.display='none';zoomedImg=null;}var keyHandler=function(e){if(zoomedImg&&(e.keyCode===10009||e.keyCode===13)){hideZoom();e.preventDefault();e.stopPropagation();}};var clickHandler=function(e){var target=e.target;if(target.tagName==='IMG'&&target.src&&!target.closest('#tp-zoom-overlay')){showZoom(target.src);e.preventDefault();}};document.addEventListener('keydown',keyHandler,true);document.addEventListener('click',clickHandler,true);userscript.cleanup=function(){document.removeEventListener('keydown',keyHandler,true);document.removeEventListener('click',clickHandler,true);if(overlay)overlay.remove();}})();",
  },
  {
    id: 'link-target-control',
    name: 'Link Target Controller',
    category: CATEGORIES.NAVIGATION,
    description: 'Prevent links from opening in new tabs/windows',
    defaultEnabled: false,
    source: 'inline',
    provides: ['link-target-control'],
    inline: "(function(){var log=function(msg){if(window.TizenPortal&&TizenPortal.log)TizenPortal.log(msg);};var processed=0;function processLinks(){var links=document.querySelectorAll('a[target=\"_blank\"],a[target=\"_new\"]');for(var i=0;i<links.length;i++){links[i].removeAttribute('target');processed++;}if(processed>0){log('Removed target from '+processed+' links');processed=0;}}var observer=new MutationObserver(function(){setTimeout(processLinks,100);});observer.observe(document.body,{childList:true,subtree:true});processLinks();userscript.cleanup=function(){if(observer)observer.disconnect();}})();",
  },

  // PRIVACY CATEGORY
  {
    id: 'cookie-consent',
    name: 'Cookie Consent Auto-Closer',
    category: CATEGORIES.PRIVACY,
    description: 'Automatically dismiss cookie consent banners',
    defaultEnabled: false,
    source: 'inline',
    provides: ['cookie-consent-dismissal'],
    inline: "(function(){var log=function(msg){if(window.TizenPortal&&TizenPortal.log)TizenPortal.log(msg);};var dismissed=[];var cookieSelectors=['.cookie-banner','#cookie-banner','[class*=\"cookie-consent\"]','[id*=\"cookie-consent\"]','[class*=\"gdpr\"]','[id*=\"gdpr\"]','[class*=\"cookie-notice\"]','[id*=\"cookie-notice\"]','[aria-label*=\"cookie\" i]','[aria-label*=\"consent\" i]'];function dismissBanner(){var found=false;for(var i=0;i<cookieSelectors.length;i++){try{var banners=document.querySelectorAll(cookieSelectors[i]);for(var j=0;j<banners.length;j++){var banner=banners[j];if(banner.offsetParent&&!dismissed.includes(banner)){var acceptBtn=banner.querySelector('button,a');if(acceptBtn){acceptBtn.click();dismissed.push(banner);log('Dismissed cookie banner');found=true;}else{banner.style.display='none';dismissed.push(banner);log('Hidden cookie banner');found=true;}}}}catch(err){}}var allButtons=document.querySelectorAll('button,a');for(var k=0;k<allButtons.length;k++){var btn=allButtons[k];var text=(btn.textContent||'').toLowerCase();if(btn.offsetParent&&!dismissed.includes(btn)&&(text.indexOf('accept')!==-1||text.indexOf('agree')!==-1||text.indexOf('got it')!==-1)){var parent=btn.closest('[class*=\"cookie\"],[id*=\"cookie\"],[class*=\"consent\"],[id*=\"consent\"]');if(parent&&!dismissed.includes(parent)){btn.click();dismissed.push(parent);dismissed.push(btn);log('Clicked consent button');found=true;break;}}}return found;}var checkInterval=setInterval(dismissBanner,1500);var observer=new MutationObserver(function(){setTimeout(dismissBanner,200);});observer.observe(document.body,{childList:true,subtree:true});dismissBanner();userscript.cleanup=function(){if(checkInterval)clearInterval(checkInterval);if(observer)observer.disconnect();}})();",
  },
  {
    id: 'ad-skip-helper',
    name: 'Video Ad Skip Helper',
    category: CATEGORIES.PRIVACY,
    description: 'Automatically clicks "Skip Ad" buttons when they appear',
    defaultEnabled: false,
    source: 'inline',
    provides: ['ad-skip'],
    inline: "(function(){var observer=null;var log=function(msg){if(window.TizenPortal&&TizenPortal.log)TizenPortal.log(msg);};var skipButtons=['button[class*=\"skip\"]','button[class*=\"Skip\"]','button[id*=\"skip\"]','button[aria-label*=\"Skip\"]','.ytp-ad-skip-button','.ytp-skip-ad-button'];function clickSkip(){for(var i=0;i<skipButtons.length;i++){try{var btns=document.querySelectorAll(skipButtons[i]);for(var j=0;j<btns.length;j++){if(btns[j].offsetParent!==null){btns[j].click();log('Clicked skip button');return true;}}}catch(err){}}var allButtons=document.querySelectorAll('button');for(var k=0;k<allButtons.length;k++){var btn=allButtons[k];if(btn.offsetParent!==null&&btn.textContent&&btn.textContent.toLowerCase().indexOf('skip')!==-1){btn.click();log('Clicked skip button');return true;}}return false;}var checkInterval=setInterval(clickSkip,2000);observer=new MutationObserver(function(){setTimeout(clickSkip,100);});observer.observe(document.body,{childList:true,subtree:true});userscript.cleanup=function(){if(checkInterval)clearInterval(checkInterval);if(observer)observer.disconnect();}})();",
  },
];

// Register all userscripts in the unified registry
for (var i = 0; i < USERSCRIPTS.length; i++) {
  var script = USERSCRIPTS[i];
  Registry.register({
    id: script.id,
    type: Registry.ITEM_TYPES.USERSCRIPT,
    name: script.name,
    displayName: script.name,
    category: script.category,
    description: script.description,
    defaultEnabled: script.defaultEnabled || false,
    source: script.source,
    inline: script.inline,
    url: script.url,
    provides: script.provides,
  });
}

/**
 * Get all userscripts
 * Delegates to unified registry query API
 */
function getAllUserscripts() {
  return Registry.query({ type: Registry.ITEM_TYPES.USERSCRIPT });
}

/**
 * Get userscript by ID
 * Delegates to unified registry query API
 */
function getUserscriptById(id) {
  var results = Registry.query({ type: Registry.ITEM_TYPES.USERSCRIPT, id: id });
  return results.length > 0 ? results[0] : null;
}

/**
 * Get userscripts by category
 * Delegates to unified registry query API
 */
function getUserscriptsByCategory(category) {
  return Registry.query({ type: Registry.ITEM_TYPES.USERSCRIPT, category: category });
}

/**
 * Get all categories
 */
function getCategories() {
  return CATEGORIES;
}

/**
 * Check for feature conflicts
 * Returns array of conflicting userscript IDs
 * Now delegates to unified registry
 */
function checkConflicts(enabledIds) {
  return Registry.checkConflicts(enabledIds);
}

export default {
  getAllUserscripts: getAllUserscripts,
  getUserscriptById: getUserscriptById,
  getUserscriptsByCategory: getUserscriptsByCategory,
  getCategories: getCategories,
  checkConflicts: checkConflicts,
  CATEGORIES: CATEGORIES,
  
  // Expose registry for advanced use
  registry: Registry,
};
