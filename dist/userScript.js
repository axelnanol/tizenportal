(function() {
    if (window.location.hostname.indexOf('github.io') > -1) return;

    var logs = [];
    var tpHud = function(msg){
        try {
            var h = document.getElementById('tp-diag');
            if(!h){
                h = document.createElement('div'); h.id='tp-diag';
                h.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#222;color:#FFD700;font-size:14px;font-family:sans-serif;padding:10px 15px;pointer-events:none;text-align:left;border-bottom:2px solid #FFD700;box-shadow:0 5px 15px rgba(0,0,0,0.5);font-weight:bold;';
                document.body.appendChild(h);
            }
            h.textContent = '[TP] ' + msg;
            setTimeout(function(){ try { if(h) h.style.opacity='0.6'; } catch(e){} }, 3000);
        } catch(e){}
    };
    function log(type, args) {
        var msg = Array.prototype.slice.call(args).map(function(a){ return (typeof a==='object'?JSON.stringify(a):String(a)); }).join(' ');
        var time = new Date().toTimeString().substring(0, 8);
        logs.unshift({t:time, type:type, msg:msg}); if (logs.length > 200) logs.pop();
        if (window.TP && window.TP.ui) window.TP.ui.updateConsole();
    }
    var origLog = console.log; console.log = function() { log('INF', arguments); origLog.apply(console, arguments); }; console.error = function() { log('ERR', arguments); };

    var Config = {
        payload: null, homeUrl: 'https://alexnolan.github.io/tizenportal/dist/index.html',
        load: function() {
            try {
                // 1. Check URL Hash (Client-Side, bypasses server limits)
                var m = window.location.hash.match(/[#&]tp=([^&]+)/);
                if (m && m[1]) {
                    var j = atob(m[1]); this.payload = JSON.parse(j); 
                    sessionStorage.setItem('tp_conf', j); localStorage.setItem('tp_conf', j);
                    // Clear hash without reloading
                    history.replaceState(null, document.title, window.location.pathname + window.location.search);
                    tpHud('Hash payload loaded'); console.log("[TP] Hash payload loaded"); return true;
                }

                // 2. Check URL Param (Legacy/Direct)
                var m2 = window.location.href.match(/[?&]tp=([^&]+)/);
                if (m2 && m2[1]) {
                    var j = atob(m2[1]); this.payload = JSON.parse(j); 
                    sessionStorage.setItem('tp_conf', j); localStorage.setItem('tp_conf', j);
                    window.history.replaceState({}, document.title, window.location.href.replace(/[?&]tp=[^&]+/, ''));
                    tpHud('Query payload loaded'); console.log("[TP] Query payload loaded"); return true;
                }
                
                // 3. Fallback to Storage (Session first, then Local)
                var s = sessionStorage.getItem('tp_conf'); 
                if(s){this.payload=JSON.parse(s);tpHud('Session payload loaded');console.log("[TP] Session payload loaded");return true;}
                var l = localStorage.getItem('tp_conf');
                if(l){this.payload=JSON.parse(l);tpHud('Local payload loaded');console.log("[TP] Local payload loaded");return true;}
            } catch(e) { console.error("Conf load failed", e); tpHud('Config load failed: ' + (e.message || 'parse error')); } return false;
        },
        apply: function() {
            if (!this.payload) return false;
            // Apply User Agent override first
            if (this.payload.ua) { 
                try { 
                    Object.defineProperty(navigator, 'userAgent', { get: function(){ return Config.payload.ua; } }); 
                    tpHud('UA: ' + Config.payload.ua.substring(0, 40) + '...'); 
                } catch(e){ 
                    tpHud('UA override failed'); console.error('UA override failed', e); 
                } 
            }
            // Apply CSS
            if (this.payload.css) { 
                try { 
                    var s=document.createElement('style'); 
                    s.textContent=this.payload.css; 
                    document.head.appendChild(s); 
                    tpHud('CSS applied (' + Math.round(this.payload.css.length/1024) + 'KB)'); 
                } catch(e){ 
                    tpHud('CSS injection failed'); console.error('CSS inject failed', e); 
                } 
            }
            // Apply JS (preset initialization)
            if (this.payload.js) { 
                try { 
                    new Function(this.payload.js)(); 
                    tpHud('Preset JS initialized'); 
                } catch(e){ 
                    tpHud('JS init failed: ' + (e.message || 'unknown')); console.error('JS exec failed', e); 
                } 
            }
            return true;
        }
    };

    var UI = {
        focused: 'main', // 'main' or 'sidebar'
        idx: 0, contentMode: 'none', // 'none', 'logs', 'source'
        items: [
            { l: "🏠 Exit Home", fn: function(){ window.location.href = Config.homeUrl; }, c:"#FFD700" },
            { l: "⬅️ Back", fn: function(){ window.history.back(); }, c:"#0f0" },
            { l: "➡️ Forward", fn: function(){ window.history.forward(); }, c:"#0f0" },
            { l: "🔄 Reload", fn: function(){ window.location.reload(); }, c:"#fff" },
            { l: "🌐 URL", fn: function(){ var u = prompt("Go to URL:", window.location.href); if(u) window.location.href=u; }, c:"#0f0" },
            { l: "🖱️ Mouse", fn: function(){ Input.toggleMouse(); }, c:"#fff" },
            { l: "📐 Aspect", fn: function(){ Input.toggleAspect(); }, c:"#fff" },
            { l: " Source", fn: function(){ UI.setMode('source'); }, c:"#0ff" },
            { l: "📜 Logs", fn: function(){ UI.setMode('logs'); }, c:"#aaa" }
        ],
        init: function() {
            var css = "" +
                "#tp-b { position:fixed; top:0; right:0; width:300px; bottom:0; background:#111; border-left:3px solid #FFD700; z-index:2147483646 !important; font-family:sans-serif; display:flex; flex-direction:column; box-shadow:-10px 0 50px rgba(0,0,0,0.8); overflow:hidden; }" +
                "#tp-b.unfocused { pointer-events:none; opacity:0.5; }" +
                "#tp-h { padding:15px; background:#222; border-bottom:1px solid #444; font-size:12px; color:#FFD700; word-break:break-all; font-weight:bold; }" +
                "#tp-l { flex-shrink:0; overflow-y:auto; max-height:60%; border-bottom:1px solid #333; }" +
                ".tp-i { padding:12px; color:#fff; cursor:pointer; border-bottom:1px solid #222; font-size:16px; transition:background 0.1s; }" +
                ".tp-i:focus { outline:3px solid #FF6600; background:#333; }" +
                ".tp-i.active { background:#FFD700; color:#000; font-weight:bold; }" +
                "#tp-c { flex:1; background:#000; color:#0f0; font-family:monospace; font-size:11px; padding:10px; overflow-y:auto; border-top:1px solid #444; white-space:pre-wrap; word-break:break-all; outline:none; }" +
                "#tp-c.focused { border: 2px solid #FFD700; background: #080808; }" +
                ".tp-t { position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#222; color:#fff; padding:10px; border:1px solid #FFD700; opacity:0; transition:opacity 0.5s; z-index:2147483647 !important; pointer-events:none; }";
            
            var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
            var d = document.createElement('div'); d.id='tp-b'; d.className='unfocused';
            d.innerHTML = '<div id="tp-h">TizenPortal 0526</div>' +
                          '<div id="tp-l"></div>' +
                          '<div id="tp-c" tabindex="0"></div>';
            document.body.appendChild(d);

            var l = document.getElementById('tp-l');
            this.items.forEach(function(item, i) {
                var el = document.createElement('div'); el.className='tp-i'; el.innerText=item.l; el.tabIndex=0; el.style.color=item.c;
                el.onclick = function() { UI.idx=i; UI.upd(); item.fn(); };
                el.onkeydown = function(e) {
                    if(e.keyCode === 13) { UI.idx=i; item.fn(); e.preventDefault(); }
                };
                l.appendChild(el);
            });
            var t = document.createElement('div'); t.className='tp-t'; t.id='tp-toast'; document.body.appendChild(t);
        },
        toggleFocus: function() { 
            this.focused = (this.focused === 'main') ? 'sidebar' : 'main';
            var b = document.getElementById('tp-b');
            if(this.focused === 'sidebar') {
                b.className = 'focused';
                b.style.pointerEvents = 'auto';
                if(this.items.length) document.querySelector('.tp-i').focus();
            } else {
                b.className = 'unfocused';
                b.style.pointerEvents = 'none';
                document.body.focus();
            }
            this.upd();
        },
        setMode: function(mode) {
            this.contentMode = mode;
            var c = document.getElementById('tp-c');
            c.innerHTML = ''; // Memory Nuke
            
            if (mode === 'none') {
                c.style.display = 'none';
            } else {
                c.style.display = 'block';
                if(mode === 'logs') this.updateConsole();
                if(mode === 'source') this.viewSource();
                this.enterConsoleFocus();
            }
        },
        viewSource: function() {
            var html = document.documentElement.outerHTML.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            var c = document.getElementById('tp-c');
            c.innerHTML = '<div style="color:#FFD700;background:#222;border-bottom:2px solid #FFD700;padding:10px;margin:-10px -10px 10px -10px;font-weight:bold;">PAGE SOURCE</div>' + 
                          '<div style="color:#0ff;font-size:10px;line-height:1.4;">' + html + '</div>';
        },
        enterConsoleFocus: function() { var c = document.getElementById('tp-c'); c.classList.add('focused'); c.focus(); this.toast("Scroll / Back to Exit"); },
        exitConsoleFocus: function() { 
            var c = document.getElementById('tp-c'); c.classList.remove('focused'); 
            this.setMode('none'); // Close window on back
        },
        updateConsole: function() {
            if(this.contentMode !== 'logs') return;
            var c = document.getElementById('tp-c');
            var header = '<div style="color:#FFD700;background:#222;border-bottom:2px solid #FFD700;padding:10px;margin:-10px -10px 10px -10px;font-weight:bold;">CONSOLE LOGS</div>';
            var entries = logs.map(function(l){ 
                var color = l.type === 'ERR' ? '#f00' : (l.type === 'INF' ? '#0f0' : '#fff');
                return '<div style="margin:5px 0;line-height:1.3;"><span style="color:#888;font-size:10px;">' + l.t + '</span> ' +
                       '<span style="color:' + color + ';font-weight:bold;">[' + l.type + ']</span> ' +
                       '<span style="color:#aaa;">' + l.msg.replace(/</g,'&lt;') + '</span></div>'; 
            }).join('');
            c.innerHTML = header + entries;
        },
        nav: function(d) {
            if(this.focused !== 'sidebar') return;
            if(this.contentMode !== 'none') {
                var c = document.getElementById('tp-c');
                if(d==='u') c.scrollTop -= 40; if(d==='d') c.scrollTop += 40; return;
            }
            if(d==='u') this.idx--; if(d==='d') this.idx++;
            if(this.idx < 0) this.idx = this.items.length - 1; if(this.idx >= this.items.length) this.idx = 0;
            this.upd();
        },
        exe: function() { if(this.focused === 'sidebar' && this.contentMode === 'none') this.items[this.idx].fn(); },
        upd: function() { var els = document.querySelectorAll('.tp-i'); for(var i=0; i<els.length; i++) els[i].className = (i===this.idx) ? 'tp-i active' : 'tp-i'; },
        toast: function(m) { var t = document.getElementById('tp-toast'); t.innerText = m; t.style.opacity = 1; setTimeout(function(){ t.style.opacity=0; }, 3000); }
    };

    var Input = {
        mouse: false, x: window.innerWidth/2, y: window.innerHeight/2, cursor: null,
        init: function() {
            setInterval(function() {
                if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
                    ["ColorF0Red","ColorF1Green","ColorF2Yellow","ColorF3Blue","MediaPlay","MediaPause"].forEach(function(k){ try { tizen.tvinputdevice.registerKey(k); } catch(e){} });
                }
            }, 2000);
            document.addEventListener('keydown', this.key.bind(this), true);
            setInterval(this.loop.bind(this), 50);
            // Initialize first focusable element on page load
            setTimeout(function() {
                var focusables = Array.prototype.slice.call(document.querySelectorAll('a, button, input, textarea, select, [tabindex], .tp-input, .tp-btn, .tp-rescued-card, .tp-nav-item'))
                    .filter(function(el){ return el && (el.tabIndex >= 0 || (el.className && (el.className.indexOf('tp-input') > -1 || el.className.indexOf('tp-btn') > -1 || el.className.indexOf('tp-rescued-card') > -1 || el.className.indexOf('tp-nav-item') > -1))); });
                if (focusables.length > 0 && !document.activeElement) { focusables[0].focus(); }
            }, 500);
        },
        key: function(e) {
            var k = e.keyCode;
            if (UI.focused === 'sidebar') {
                if (k===38) UI.nav('u'); if (k===40) UI.nav('d');
                if ([10009, 27, 37].indexOf(k) > -1) {
                    if (UI.contentMode !== 'none') UI.exitConsoleFocus(); 
                    else UI.toggleFocus(); 
                    e.preventDefault(); e.stopPropagation(); return;
                }
                if (k===13) UI.exe(); if (k===406) UI.toggleFocus(); e.preventDefault(); e.stopPropagation(); return;
            }
            if (k===406) { UI.toggleFocus(); e.preventDefault(); return; } 
            if (k===403) { window.location.reload(); e.preventDefault(); return; } 
            if (k===404) { this.toggleMouse(); e.preventDefault(); return; } 
            if (k===405) { window.location.href = Config.homeUrl; e.preventDefault(); return; } 

            // D-pad focus navigation (linear) to avoid scroll
            if ([37,38,39,40].indexOf(k) > -1 && !this.mouse) {
                // Broader selector to catch all interactive elements including hidden/generated ones
                var focusables = Array.prototype.slice.call(document.querySelectorAll('a, button, input, textarea, select, [tabindex], .tp-input, .tp-btn, .tp-rescued-card, .tp-nav-item'))
                    .filter(function(el){ 
                        if (!el) return false;
                        // Accept elements with tabIndex >= 0 or known clickable classes
                        if (el.tabIndex >= 0) return true;
                        if (el.className && (el.className.indexOf('tp-input') > -1 || el.className.indexOf('tp-btn') > -1 || el.className.indexOf('tp-rescued-card') > -1 || el.className.indexOf('tp-nav-item') > -1)) return true;
                        return false;
                    });
                // Clear old focus outlines
                for(var j=0; j<focusables.length; j++) focusables[j].style.outline='';
                var idx = focusables.indexOf(document.activeElement);
                var isTextInput = (document.activeElement && ((document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'button' && document.activeElement.type !== 'submit') || document.activeElement.tagName === 'TEXTAREA' || (document.activeElement.className && document.activeElement.className.indexOf('tp-input') > -1)));
                
                // On text inputs: Up/Down move focus, Left/Right allow text editing. Back/Esc blurs.
                if (isTextInput) {
                    if (k === 10009 || k === 27) { document.activeElement.blur(); e.preventDefault(); e.stopPropagation(); return; }
                    if (k === 38 || k === 40) {
                        if (idx === -1 && focusables.length) idx = 0;
                        if (k === 38) idx = Math.max(0, idx - 1);
                        if (k === 40) idx = Math.min(focusables.length - 1, idx + 1);
                        if (focusables[idx]) { focusables[idx].focus(); focusables[idx].style.outline='3px solid #FF6600'; }
                        e.preventDefault(); e.stopPropagation(); return;
                    }
                    // Left/Right allowed on text input for normal editing
                    return;
                }
                
                // On other elements: all D-pad moves focus
                if (idx === -1 && focusables.length) idx = 0;
                if (k===37 || k===38) idx = Math.max(0, idx-1);
                if (k===39 || k===40) idx = Math.min(focusables.length-1, idx+1);
                if (focusables[idx]) { focusables[idx].focus(); focusables[idx].style.outline='3px solid #FF6600'; }
                e.preventDefault(); e.stopPropagation(); return;
            }

            if (this.mouse) {
                if (k===37) this.x-=25; if (k===38) this.y-=25; if (k===39) this.x+=25; if (k===40) this.y+=25;
                if (k===13) this.click(); this.draw();
                if ([37,38,39,40,13].indexOf(k) > -1) { e.preventDefault(); e.stopPropagation(); }
            }
        },
        loop: function() {
            if (!this.mouse) return;
            var h = window.innerHeight;
            if (this.y > h-60) window.scrollBy(0, 20); if (this.y < 60) window.scrollBy(0, -20);
            this.x = Math.max(0, Math.min(window.innerWidth, this.x)); this.y = Math.max(0, Math.min(h, this.y));
            this.draw();
        },
        toggleMouse: function() {
            this.mouse = !this.mouse;
            if (!this.cursor) { var c = document.createElement('div'); c.style.cssText='position:fixed;width:20px;height:20px;background:red;border:2px solid #fff;border-radius:50%;z-index:2147483647;pointer-events:none;display:none'; document.body.appendChild(c); this.cursor = c; }
            this.cursor.style.display = this.mouse ? 'block' : 'none'; if (this.mouse) { this.x=window.innerWidth/2; this.y=window.innerHeight/2; } this.draw();
            UI.toast(this.mouse ? "Mouse ON" : "Mouse OFF");
        },
        draw: function() { if (this.cursor) { this.cursor.style.left = (this.x-10)+'px'; this.cursor.style.top = (this.y-10)+'px'; } },
        click: function() { var el = document.elementFromPoint(this.x, this.y); if(el) { el.click(); el.focus(); } },
        toggleAspect: function() { UI.toast("Aspect Toggle"); var v = document.querySelector('video'); if(v) v.style.objectFit = (v.style.objectFit === 'cover') ? 'contain' : 'cover'; }
    };

    window.TP = { ui: UI, input: Input };
    var loaded = Config.load(); Config.apply();
    var ready = function() { 
        // Ensure viewport is locked before any rendering
        if (window.TizenUtils && window.TizenUtils.lockViewport) {
            window.TizenUtils.lockViewport();
        }
        UI.init(); 
        Input.init(); 
        if(loaded) { 
            UI.toast("TizenPortal 0501"); 
        } else { 
            UI.toast("No Config"); 
            tpHud('No payload found'); 
        } 
    };
    if (document.body) ready(); else document.addEventListener('DOMContentLoaded', ready);
})();