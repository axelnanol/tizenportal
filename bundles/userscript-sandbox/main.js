/**
 * Userscript Sandbox Bundle
 * 
 * Provides a safe place to experiment with user scripts.
 */

import styles from './style.css';

export default {
  style: styles,
  userscripts: [
    {
      id: 'sandbox-readability',
      name: 'TV Readability Booster',
      enabled: true,
      inline: "(function(){var s=document.createElement('style');s.textContent='body,p,span,div,li,td,th,a,h1,h2,h3{font-size:clamp(18px,2.5vw,32px)!important;line-height:1.7!important}a{text-decoration:underline!important;outline:2px solid cyan!important}';document.head.appendChild(s)})();",
    },
    {
      id: 'sandbox-autoscroll',
      name: 'Auto Scroll (Slow)',
      enabled: false,
      inline: "(function(){var t=setInterval(function(){window.scrollBy(0,1);},50);window.addEventListener('keydown',function(e){if(e.keyCode===19||e.keyCode===415){clearInterval(t);}},{once:true});})();",
    },
    {
      id: 'sandbox-dark-invert',
      name: 'Dark Invert',
      enabled: false,
      inline: "(function(){var s=document.createElement('style');s.textContent='html{filter:invert(1) hue-rotate(180deg) !important;}img,video,canvas{filter:invert(1) hue-rotate(180deg) !important;}';document.head.appendChild(s)})();",
    },
  ],

  onActivate: function(win, card) {
    try {
      if (win && win.TizenPortal && win.TizenPortal.log) {
        win.TizenPortal.log('Userscript Sandbox: Active');
      }
    } catch (err) {
      // Ignore
    }
  },

  onDeactivate: function() {
    // No-op
  },
};
