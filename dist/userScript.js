(function() {
    // 0. IGNORE LAUNCHER
    if (window.location.hostname.includes('github.io')) return;

    // --- CONSOLE INTERCEPTOR ---
    const logs = [];
    const MAX_LOGS = 50;
    const originalLog = console.log;
    const originalErr = console.error;
    const originalWarn = console.warn;

    function pushLog(type, args) {
        try {
            const msg = Array.from(args).map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            logs.unshift(`[${type}] ${msg}`);
            if (logs.length > MAX_LOGS) logs.pop();
            updateConsoleUI();
        } catch(e) {}
    }
    
    console.log = function() { pushLog('INFO', arguments); originalLog.apply(console, arguments); };
    console.error = function() { pushLog('ERR', arguments); originalErr.apply(console, arguments); };
    console.warn = function() { pushLog('WARN', arguments); originalWarn.apply(console, arguments); };

    console.log("[TP] Injector Active.");

    // --- 1. PAYLOAD & UA SPOOFING ---
    let homeUrl = 'https://alexnolan.github.io/tizenportal/dist/index.html';
    
    try {
        const raw = window.name;
        if (raw && raw.includes('tp_payload')) {
            const data = JSON.parse(raw);
            console.log("[TP] Config Loaded.");
            
            // A) UA SPOOFING (Must try ASAP)
            if (data.userAgent) {
                console.log("[TP] Spoofing UA: " + data.userAgent);
                try {
                    Object.defineProperty(navigator, 'userAgent', { get: () => data.userAgent });
                } catch(e) { console.error("UA Spoof Failed", e); }
            }

            // B) CSS
            if (data.css) { 
                const s = document.createElement('style'); 
                s.textContent = data.css; 
                document.head.appendChild(s); 
            }
            
            // C) JS
            if (data.js) { 
                try { new Function(data.js)(); } 
                catch(e) { console.error("JS Payload Error", e); } 
            }
            
            if (data.home) homeUrl = data.home;
        }
    } catch (e) { console.error("Config Load Failed", e); }

    // --- 2. VIRTUAL MOUSE (The Green Button) ---
    let mouseMode = false;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursor = null;

    function toggleMouse() {
        mouseMode = !mouseMode;
        if (mouseMode) {
            if (!cursor) {
                cursor = document.createElement('div');
                cursor.id = 'tp-cursor';
                cursor.style.cssText = 'position:fixed; width:24px; height:24px; background:rgba(255,0,0,0.8); border:2px solid white; border-radius:50%; z-index:2147483647; pointer-events:none; transition: top 0.05s, left 0.05s; box-shadow: 0 0 10px black;';
                document.body.appendChild(cursor);
            }
            cursor.style.display = 'block';
            updateCursor();
            console.log("[TP] Mouse Mode ON");
            
            // Show toast
            const toast = document.createElement('div');
            toast.innerText = "MOUSE MODE ON";
            toast.style.cssText = "position:fixed; top:20px; right:20px; background:green; color:white; padding:10px; z-index:999999; font-weight:bold;";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);

        } else {
            if (cursor) cursor.style.display = 'none';
            console.log("[TP] Mouse Mode OFF");
        }
    }

    function updateCursor() {
        if(!cursor) return;
        cursor.style.left = (mouseX - 12) + 'px';
        cursor.style.top = (mouseY - 12) + 'px';
    }

    // --- 3. INPUT HANDLING ---
    let hudTimer;
    
    document.addEventListener('keydown', (e) => {
        const k = e.keyCode;
        const hud = document.getElementById('tp-hud');
        const isHudOpen = hud && hud.style.display === 'flex';

        // MOUSE MODE LOGIC (Overrides everything if active)
        if (mouseMode) {
            const step = 25; // Speed
            let moved = false;
            
            if (k === 37) { mouseX -= step; moved = true; } // Left
            if (k === 38) { mouseY -= step; moved = true; } // Up
            if (k === 39) { mouseX += step; moved = true; } // Right
            if (k === 40) { mouseY += step; moved = true; } // Down
            
            if (moved) {
                mouseX = Math.max(0, Math.min(window.innerWidth, mouseX));
                mouseY = Math.max(0, Math.min(window.innerHeight, mouseY));
                updateCursor();
                e.preventDefault(); e.stopPropagation();
                return;
            }

            if (k === 13) { // Enter = Click
                cursor.style.transform = "scale(0.8)";
                setTimeout(()=>cursor.style.transform="scale(1)", 100);
                
                const elem = document.elementFromPoint(mouseX, mouseY);
                if (elem) {
                    console.log("Clicking:", elem);
                    elem.click();
                    elem.focus();
                }
                e.preventDefault(); e.stopPropagation();
                return;
            }
            
            // Allow Green/Red/Blue to pass through
        }

        // GLOBAL SHORTCUTS
        if (k === 10009 || k === 27) { // Back
            if (!hudTimer) hudTimer = setTimeout(toggleHUD, 1000); 
        }
        if (k === 406) { // BLUE = Toggle HUD
            e.preventDefault(); toggleHUD();
        }
        if (k === 403) { // RED = Reload
            e.preventDefault(); window.location.reload();
        }
        if (k === 404) { // GREEN = Mouse Toggle
            e.preventDefault(); toggleMouse();
        }

        // HUD NAVIGATION
        if (isHudOpen) {
            e.stopImmediatePropagation();
            // Allow default navigation within HUD
        }
    }, true);

    document.addEventListener('keyup', (e) => {
        if (e.keyCode === 10009 || e.key === 'Escape') {
            clearTimeout(hudTimer); hudTimer = null;
            
            const hud = document.getElementById('tp-hud');
            if (hud && hud.style.display === 'flex') {
                toggleHUD();
            } else if (!mouseMode) {
                if (window.location.pathname !== '/' && !window.location.href.includes('github.io')) {
                    window.history.back();
                }
            }
        }
    });

    // --- 4. HUD UI ---
    function injectHUD() {
        const css = `
            #tp-hud { font-family: "Consolas", monospace; position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 2147483647; color: #fff; display: none; flex-direction: column; padding: 30px; }
            #tp-header { display: flex; justify-content: space-between; border-bottom: 2px solid #444; margin-bottom: 20px; padding-bottom: 10px; }
            #tp-title { color: #FFD700; font-weight: bold; font-size: 20px; }
            #tp-tabs { display: flex; gap: 10px; }
            .tp-tab { padding: 5px 15px; cursor: pointer; background: #222; color: #888; border: 1px solid #444; }
            .tp-tab.active { background: #FFD700; color: #000; border-color: #FFD700; font-weight: bold; }
            #tp-content { flex: 1; overflow: hidden; position: relative; border: 1px solid #333; background: #111; padding: 10px; }
            .tp-panel { display: none; height: 100%; overflow-y: auto; font-size: 14px; white-space: pre-wrap; word-break: break-all; }
            .tp-panel.active { display: block; }
            .tp-log-row { padding: 4px; border-bottom: 1px solid #222; }
            .tp-err { color: #ff5555; background: rgba(50,0,0,0.5); }
            .tp-warn { color: #ffaa00; }
            #tp-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            #tp-controls button { background: #333; color: white; border: 1px solid #555; padding: 15px; font-size: 18px; cursor: pointer; }
            #tp-controls button:focus { background: #FFD700; color: black; outline: 3px solid white; transform: scale(1.02); }
        `;
        const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

        const html = `
            <div id="tp-hud">
                <div id="tp-header">
                    <div id="tp-title">TizenPortal v0.1</div>
                    <div id="tp-tabs">
                        <div class="tp-tab active" id="tab-btn-menu">MENU</div>
                        <div class="tp-tab" id="tab-btn-console">CONSOLE</div>
                        <div class="tp-tab" id="tab-btn-info">INFO</div>
                    </div>
                </div>
                <div id="tp-content">
                    <div id="panel-menu" class="tp-panel active">
                        <div id="tp-controls">
                            <button id="btn-exit">🏠 Exit to Portal</button>
                            <button id="btn-reload">🔄 Reload App</button>
                            <button onclick="document.body.style.zoom=1.0">🔍 Zoom 100%</button>
                            <button onclick="document.body.style.zoom=1.25">🔍 Zoom 125%</button>
                            <button onclick="document.body.style.zoom=0.8">🔍 Zoom 80%</button>
                            <button onclick="document.getElementById('tp-hud').style.display='none'">❌ Close HUD</button>
                        </div>
                        <div style="margin-top: 20px; color: #666; font-size: 14px; text-align: center; line-height: 1.6;">
                            <b>Shortcuts:</b><br>
                            🔴 RED: Reload Page<br>
                            🟢 GREEN: Toggle Virtual Mouse<br>
                            🔵 BLUE: Toggle this HUD
                        </div>
                    </div>
                    <div id="panel-console" class="tp-panel"></div>
                    <div id="panel-info" class="tp-panel"></div>
                </div>
            </div>
        `;
        const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d);

        document.getElementById('btn-exit').onclick = () => window.location.href = homeUrl;
        document.getElementById('btn-reload').onclick = () => window.location.reload();

        const tabs = ['menu', 'console', 'info'];
        tabs.forEach(t => {
            document.getElementById('tab-btn-'+t).onclick = () => switchTab(t);
        });
    }

    function switchTab(name) {
        document.querySelectorAll('.tp-tab').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.tp-panel').forEach(x => x.classList.remove('active'));
        document.getElementById('tab-btn-'+name).classList.add('active');
        document.getElementById('panel-'+name).classList.add('active');
        if (name === 'info') updateInfo();
        if (name === 'menu') setTimeout(() => document.getElementById('btn-exit').focus(), 100);
    }

    function updateConsoleUI() {
        const c = document.getElementById('panel-console');
        if (!c) return;
        c.innerHTML = logs.map(l => {
            let cl = 'tp-log-row';
            if (l.includes('[ERR]')) cl += ' tp-err';
            if (l.includes('[WARN]')) cl += ' tp-warn';
            return `<div class="${cl}">${l.replace(/</g,'&lt;')}</div>`;
        }).join('');
    }

    function updateInfo() {
        const i = document.getElementById('panel-info');
        if (!i) return;
        i.innerHTML = `
            <b>Current URL:</b> ${window.location.href}<br>
            <b>Res:</b> ${window.innerWidth} x ${window.innerHeight}<br>
            <b>User Agent:</b> ${navigator.userAgent}<br>
            <b>Memory:</b> ${window.performance && window.performance.memory ? Math.round(window.performance.memory.usedJSHeapSize/1024/1024)+' MB' : 'N/A'}
        `;
    }

    function toggleHUD() {
        const hud = document.getElementById('tp-hud');
        if (!hud) return;
        const show = (hud.style.display === 'none');
        hud.style.display = show ? 'flex' : 'none';
        if (show) {
            updateInfo();
            updateConsoleUI();
            switchTab('menu');
        } else {
            const t = document.querySelector('.card, .item, [tabindex="0"], button, input');
            if (t) t.focus();
        }
    }

    injectHUD();
})();