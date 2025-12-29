(function() {
    if (window.location.hostname.indexOf('github.io') > -1) return;

    // --- ES5 LOGGING ---
    var logs = [];
    function log(type, args) {
        var msg = Array.prototype.slice.call(args).map(function(a){ return (typeof a==='object'?JSON.stringify(a):String(a)); }).join(' ');
        logs.unshift('['+type+'] '+msg); if (logs.length > 200) logs.pop();
        if (window.TP && window.TP.ui) window.TP.ui.updateConsole();
    }
    var origLog = console.log; console.log = function() { log('INF', arguments); origLog.apply(console, arguments); }; console.error = function() { log('ERR', arguments); };

    // --- CONFIG ---
    var Config = {
        payload: null, homeUrl: 'https://alexnolan.github.io/tizenportal/dist/index.html',
        load: function() {
            try {
                var m = window.location.href.match(/[?&]tp=([^&]+)/);
                if (m && m[1]) {
                    var j = atob(m[1]); this.payload = JSON.parse(j); sessionStorage.setItem('tp_conf', j);
                    window.history.replaceState({}, document.title, window.location.href.replace(/[?&]tp=[^&]+/, ''));
                    console.log("[TP] Loaded URL"); return true;
                }
                var s = sessionStorage.getItem('tp_conf'); if(s){this.payload=JSON.parse(s);console.log("[TP] Loaded Storage");return true;}
            } catch(e) { console.error("Conf Fail", e); } return false;
        },
        apply: function() {
            if (!this.payload) return false;
            if (this.payload.ua) { try { Object.defineProperty(navigator, 'userAgent', { get: function(){ return Config.payload.ua; } }); } catch(e){} }
            if (this.payload.css) { var s=document.createElement('style'); s.textContent=this.payload.css; document.head.appendChild(s); }
            if (this.payload.js) { try { new Function(this.payload.js)(); } catch(e){} }
            return true;
        }
    };

    // --- UI (SIDEBAR 022) ---
    var UI = {
        open: false, maximized: false, idx: 0, consoleFocused: false,
        items: [
            { l: "🏠 Exit Home", fn: function(){ window.location.href = Config.homeUrl; }, c:"#FFD700" },
            { l: "🔄 Reload", fn: function(){ window.location.reload(); }, c:"#fff" },
            { l: "🖱️ Mouse", fn: function(){ Input.toggleMouse(); }, c:"#fff" },
            { l: "📐 Aspect", fn: function(){ Input.toggleAspect(); }, c:"#fff" },
            { l: "🔲 Maximize", fn: function(){ UI.toggleMax(); }, c:"#0ff" },
            { l: "🔍 Source", fn: function(){ UI.viewSource(); }, c:"#0ff" },
            { l: "📜 Logs", fn: function(){ UI.toggleConsole(); }, c:"#aaa" }
        ],
        init: function() {
            var css = "" +
                "#tp-b { position:fixed; top:0; right:-300px; width:280px; bottom:0; background:#111; border-left:2px solid #333; z-index:2147483647; transition:right 0.2s, width 0.2s; font-family:sans-serif; display:flex; flex-direction:column; }" +
                "#tp-b.open { right:0; box-shadow:-10px 0 50px rgba(0,0,0,0.8); }" +
                "#tp-b.max { width: 95%; border-left: none; }" +
                ".tp-i { padding:12px; color:#fff; cursor:pointer; border-bottom:1px solid #222; font-size:16px; }" +
                ".tp-i.active { background:#FFD700; color:#000; font-weight:bold; }" +
                "#tp-c { flex:1; background:#000; color:#0f0; font-family:monospace; font-size:12px; padding:10px; overflow-y:auto; display:none; border-top:1px solid #444; white-space:pre-wrap; word-break:break-all; outline:none; }" +
                "#tp-c.focused { border: 2px solid #FFD700; background: #080808; }" +
                "#tp-b.max #tp-c { font-size: 14px; display: block; height: auto; }" +
                ".tp-t { position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#222; color:#fff; padding:10px; border:1px solid #FFD700; opacity:0; transition:opacity 0.5s; z-index:2147483647; pointer-events:none; }";
            
            var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
            var d = document.createElement('div'); d.id='tp-b';
            d.innerHTML = '<div style="padding:15px;background:#222;color:#FFD700;font-weight:bold">TizenPortal 028</div><div style="flex-shrink:0;overflow-y:auto;max-height:50%" id="tp-l"></div><div id="tp-c" tabindex="0"></div>';
            document.body.appendChild(d);

            var l = document.getElementById('tp-l');
            this.items.forEach(function(item, i) {
                var el = document.createElement('div'); el.className='tp-i'; el.innerText=item.l; el.style.color=item.c;
                el.onclick = function() { UI.idx=i; UI.upd(); item.fn(); }; l.appendChild(el);
            });
            var t = document.createElement('div'); t.className='tp-t'; t.id='tp-toast'; document.body.appendChild(t);
        },
        toggle: function() { this.open = !this.open; document.getElementById('tp-b').className = this.open ? (this.maximized ? 'open max' : 'open') : ''; this.upd(); },
        toggleMax: function() { this.maximized = !this.maximized; document.getElementById('tp-b').className = this.open ? (this.maximized ? 'open max' : 'open') : ''; if(this.maximized) document.getElementById('tp-c').style.display='block'; },
        
        toggleConsole: function() { 
            var c = document.getElementById('tp-c');
            c.style.display = (c.style.display==='block') ? 'none' : 'block';
            this.updateConsole();
            if(c.style.display === 'block') this.enterConsoleFocus();
        },
        viewSource: function() {
            var html = document.documentElement.outerHTML.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            var c = document.getElementById('tp-c'); c.style.display = 'block';
            c.innerHTML = '<div style="color:#0ff;border-bottom:1px solid #fff;margin-bottom:10px">--- SOURCE ---</div>' + html;
            if (!this.maximized) this.toggleMax();
            this.enterConsoleFocus();
        },
        enterConsoleFocus: function() { this.consoleFocused = true; var c = document.getElementById('tp-c'); c.classList.add('focused'); c.focus(); this.toast("Scroll with Arrows / Back to Exit"); },
        exitConsoleFocus: function() { this.consoleFocused = false; var c = document.getElementById('tp-c'); c.classList.remove('focused'); },
        updateConsole: function() {
            var c = document.getElementById('tp-c');
            if(c && c.style.display==='block' && c.innerHTML.indexOf('--- SOURCE') === -1) {
                c.innerHTML = logs.map(function(l){ return '<div>'+l.replace(/</g,'&lt;')+'</div>'; }).join('');
            }
        },
        nav: function(d) {
            if(!this.open) return;
            if(this.consoleFocused) {
                var c = document.getElementById('tp-c');
                if(d==='u') c.scrollTop -= 40; if(d==='d') c.scrollTop += 40; return;
            }
            if(d==='u') this.idx--; if(d==='d') this.idx++;
            if(this.idx < 0) this.idx = this.items.length - 1; if(this.idx >= this.items.length) this.idx = 0;
            this.upd();
        },
        exe: function() { if(this.open && !this.consoleFocused) this.items[this.idx].fn(); },
        upd: function() { var els = document.querySelectorAll('.tp-i'); for(var i=0; i<els.length; i++) els[i].className = (i===this.idx) ? 'tp-i active' : 'tp-i'; },
        toast: function(m) { var t = document.getElementById('tp-toast'); t.innerText = m; t.style.opacity = 1; setTimeout(function(){ t.style.opacity=0; }, 3000); }
    };

    // --- INPUT ---
    var Input = {
        mouse: false, x: window.innerWidth/2, y: window.innerHeight/2, cursor: null,
        init: function() {
            var attempts = 0;
            var regInterval = setInterval(function() {
                if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
                    ["ColorF0Red","ColorF1Green","ColorF2Yellow","ColorF3Blue","MediaPlay","MediaPause"].forEach(function(k){ try { tizen.tvinputdevice.registerKey(k); } catch(e){} });
                    attempts++; if(attempts > 5) clearInterval(regInterval);
                }
            }, 1000);
            document.addEventListener('keydown', this.key.bind(this), true);
            setInterval(this.loop.bind(this), 50);
        },
        key: function(e) {
            var k = e.keyCode;
            if (UI.open) {
                if (k===38) UI.nav('u'); if (k===40) UI.nav('d');
                if ([10009, 27, 37].indexOf(k) > -1) {
                    if (UI.consoleFocused) UI.exitConsoleFocus(); 
                    else UI.toggle(); 
                    e.preventDefault(); e.stopPropagation(); return;
                }
                if (k===13) UI.exe(); if (k===406) UI.toggle(); e.preventDefault(); e.stopPropagation(); return;
            }
            if (k===406) { UI.toggle(); e.preventDefault(); return; } // Blue
            if (k===403) { window.location.reload(); e.preventDefault(); return; } // Red
            if (k===404) { this.toggleMouse(); e.preventDefault(); return; } // Green
            if (k===405) { window.location.href = Config.homeUrl; e.preventDefault(); return; } // Yellow

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
    var ready = function() { UI.init(); Input.init(); if(loaded) UI.toast("TizenPortal 028"); else UI.toast("No Config"); };
    if (document.body) ready(); else document.addEventListener('DOMContentLoaded', ready);
})();