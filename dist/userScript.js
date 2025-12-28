(function() {
    // 0. IGNORE LAUNCHER
    if (window.location.hostname.includes('github.io')) return;

    // --- UTILS: TOAST ---
    function showBootToast(msg, color) {
        const d = document.createElement('div');
        d.innerHTML = `<strong>TizenPortal:</strong> ${msg}`;
        d.style.cssText = `position: fixed; top: 0; left: 0; right: 0; background: ${color}; color: white; padding: 15px; font-size: 20px; z-index: 2147483647; text-align: center; font-family: sans-serif; box-shadow: 0 5px 15px rgba(0,0,0,0.5);`;
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 4000);
    }

    // --- CONSOLE INTERCEPTOR ---
    const logs = [];
    const MAX_LOGS = 50;
    const originalLog = console.log;
    const originalErr = console.error;

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

    console.log("[TP] Injector Starting...");

    // --- 1. PAYLOAD LOADER ---
    let homeUrl = 'https://alexnolan.github.io/tizenportal/dist/index.html';
    let payloadFound = false;

    try {
        const raw = window.name;
        if (raw && raw.trim().startsWith('{') && raw.includes('tp_payload')) {
            const data = JSON.parse(raw);
            console.log("[TP] Config Loaded.");
            payloadFound = true;
            
            if (data.userAgent) {
                try { Object.defineProperty(navigator, 'userAgent', { get: () => data.userAgent }); } catch(e) {}
            }
            if (data.css) { 
                const s = document.createElement('style'); s.textContent = data.css; document.head.appendChild(s); 
            }
            if (data.js) { 
                try { new Function(data.js)(); } catch(e) { console.error("JS Error", e); } 
            }
            if (data.home) homeUrl = data.home;

            showBootToast("Injected Successfully", "#00aa00");
        } else {
            console.log("[TP] No Payload found.");
            showBootToast("Script Active (No Config)", "#aa5500");
        }
    } catch (e) { 
        console.error("Config Load Failed", e);
        showBootToast("Injection Error", "#aa0000");
    }

    // --- 2. VIRTUAL MOUSE & INPUT ---
    let mouseMode = false;
    let mouseX = window.innerWidth/2;
    let mouseY = window.innerHeight/2;
    let cursor = null;
    let hudTimer;

    function toggleMouse() {
        mouseMode = !mouseMode;
        if (mouseMode) {
            if (!cursor) {
                cursor = document.createElement('div');
                cursor.style.cssText = 'position:fixed; width:24px; height:24px; background:rgba(255,0,0,0.8); border:2px solid white; border-radius:50%; z-index:2147483647; pointer-events:none; display:none; box-shadow: 0 0 10px black;';
                document.body.appendChild(cursor);
            }
            cursor.style.display = 'block';
            updateCursor();
            showBootToast("Mouse Mode ON", "#0055aa");
        } else {
            if (cursor) cursor.style.display = 'none';
        }
    }

    function updateCursor() {
        if(!cursor) return;
        cursor.style.left = (mouseX - 12) + 'px';
        cursor.style.top = (mouseY - 12) + 'px';
    }

    document.addEventListener('keydown', (e) => {
        const k = e.keyCode;
        
        // MOUSE MODE
        if (k === 404) { toggleMouse(); e.preventDefault(); return; } // Green Button

        if (mouseMode) {
            const step = 20;
            if (k===37) mouseX -= step;
            if (k===38) mouseY -= step;
            if (k===39) mouseX += step;
            if (k===40) mouseY += step;
            
            mouseX = Math.max(0, Math.min(window.innerWidth, mouseX));
            mouseY = Math.max(0, Math.min(window.innerHeight, mouseY));
            updateCursor();

            if (k === 13) { // Enter = Click
                const el = document.elementFromPoint(mouseX, mouseY);
                if(el) { el.click(); el.focus(); }
                cursor.style.transform = "scale(0.8)"; setTimeout(()=>cursor.style.transform="scale(1)", 100);
            }
            e.preventDefault(); e.stopPropagation();
            return;
        }

        // HUD SHORTCUTS
        if (k === 406) { toggleHUD(); e.preventDefault(); } // Blue
        if (k === 403) { window.location.reload(); e.preventDefault(); } // Red
        if (k === 10009 || k === 27) { // Back
            if (!hudTimer) hudTimer = setTimeout(toggleHUD, 1000); 
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

    // --- 3. HUD UI ---
    function injectHUD() {
        const css = `
            #tp-hud { font-family: monospace; position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 2147483647; color: #fff; display: none; flex-direction: column; padding: 20px; }
            #tp-tabs { display: flex; gap: 10px; margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 5px; }
            .tp-tab { padding: 5px 15px; cursor: pointer; background: #222; color: #888; border: 1px solid #444; }
            .tp-tab.active { background: #FFD700; color: #000; font-weight: bold; }
            #tp-content { flex: 1; overflow-y: auto; background: #111; padding: 10px; font-size: 14px; white-space: pre-wrap; word-break: break-all; }
            .tp-panel { display: none; } .tp-panel.active { display: block; }
            #tp-controls button { width: 100%; padding: 15px; margin-bottom: 10px; background: #333; color: white; border: 1px solid #555; text-align: left; font-size: 16px; }
            #tp-controls button:focus { background: #FFD700; color: black; }
        `;
        const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
        const d = document.createElement('div'); 
        d.innerHTML = `
            <div id="tp-hud">
                <div id="tp-tabs">
                    <div class="tp-tab active" onclick="tpTab('menu')">MENU</div>
                    <div class="tp-tab" onclick="tpTab('console')">CONSOLE</div>
                </div>
                <div id="tp-content">
                    <div id="panel-menu" class="tp-panel active">
                        <div id="tp-controls">
                            <button onclick="window.location.href='${homeUrl}'">🏠 Exit to Portal</button>
                            <button onclick="window.location.reload()">🔄 Reload</button>
                            <button onclick="document.getElementById('tp-hud').style.display='none'">❌ Close</button>
                        </div>
                    </div>
                    <div id="panel-console" class="tp-panel"></div>
                </div>
            </div>`;
        document.body.appendChild(d);
        
        window.tpTab = function(n) {
            document.querySelectorAll('.tp-tab').forEach(t=>t.classList.remove('active'));
            document.querySelectorAll('.tp-panel').forEach(p=>p.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById('panel-'+n).classList.add('active');
            if(n==='console') updateConsoleUI();
        };
    }

    function updateConsoleUI() {
        const c = document.getElementById('panel-console');
        if(c) c.innerHTML = logs.map(l => `<div>${l.replace(/</g,'&lt;')}</div>`).join('');
    }

    function toggleHUD() {
        const hud = document.getElementById('tp-hud');
        if(!hud) return;
        const show = (hud.style.display === 'none');
        hud.style.display = show ? 'flex' : 'none';
        if(show) { updateConsoleUI(); setTimeout(()=>document.querySelector('#tp-controls button').focus(), 100); }
    }

    injectHUD();
})();