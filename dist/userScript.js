(function() {
    // 0. IGNORE LAUNCHER
    if (window.location.hostname.includes('github.io')) return;

    // ==========================================
    // MODULE: LOGGER
    // ==========================================
    class Logger {
        constructor() {
            this.logs = [];
            this.MAX_LOGS = 50;
            this.originalLog = console.log;
            this.originalErr = console.error;
            this.originalWarn = console.warn;
            this.init();
        }
        init() {
            console.log = (...args) => { this.push('INFO', args); this.originalLog.apply(console, args); };
            console.error = (...args) => { this.push('ERR', args); this.originalErr.apply(console, args); };
            console.warn = (...args) => { this.push('WARN', args); this.originalWarn.apply(console, args); };
            this.originalLog("[TP] Logger Attached.");
        }
        push(type, args) {
            try {
                const msg = Array.from(args).map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
                this.logs.unshift(`[${type}] ${msg}`);
                if (this.logs.length > this.MAX_LOGS) this.logs.pop();
                if (window.TP && window.TP.hud) window.TP.hud.updateConsole();
            } catch (e) {}
        }
        getLogs() { return this.logs; }
    }

    // ==========================================
    // MODULE: CONFIG
    // ==========================================
    class Config {
        constructor() {
            this.payload = null;
            this.homeUrl = 'https://alexnolan.github.io/tizenportal/dist/index.html';
            this.load();
        }
        load() {
            try {
                // 1. URL Param
                const match = window.location.href.match(/[?&]tp=([^&]+)/);
                if (match && match[1]) {
                    const json = atob(match[1]);
                    this.payload = JSON.parse(json);
                    sessionStorage.setItem('tp_payload_backup', json); // Persist
                    const cleanUrl = window.location.href.replace(/[?&]tp=[^&]+/, '');
                    window.history.replaceState({}, document.title, cleanUrl);
                    console.log("[TP] Config loaded from URL.");
                    return;
                }
                // 2. Session Backup
                const backup = sessionStorage.getItem('tp_payload_backup');
                if (backup) {
                    this.payload = JSON.parse(backup);
                    console.log("[TP] Config restored from SessionStorage.");
                    return;
                }
                // 3. Legacy window.name
                if (window.name && window.name.includes('tp_payload')) {
                    this.payload = JSON.parse(window.name);
                }
            } catch (e) { console.error("Config Load Error:", e); }
        }
        apply() {
            if (!this.payload) return false;
            if (this.payload.ua) {
                try { Object.defineProperty(navigator, 'userAgent', { get: () => this.payload.ua }); } catch(e){}
            }
            if (this.payload.css) {
                const s = document.createElement('style');
                s.textContent = this.payload.css;
                document.head.appendChild(s);
            }
            if (this.payload.js) {
                try { new Function(this.payload.js)(); } catch(e) { console.error("Payload JS Error", e); }
            }
            return true;
        }
    }

    // ==========================================
    // MODULE: INPUT (Strict Clamping & Yellow Home)
    // ==========================================
    class InputManager {
        constructor() {
            this.mouseMode = false;
            this.cursor = null;
            this.x = window.innerWidth / 2;
            this.y = window.innerHeight / 2;
            this.init();
        }

        init() {
            // Register Keys
            if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
                const keys = ["ColorF0Red", "ColorF1Green", "ColorF2Yellow", "ColorF3Blue"];
                keys.forEach(k => { try { tizen.tvinputdevice.registerKey(k); } catch(e){} });
            }

            document.addEventListener('keydown', (e) => this.handleKeyDown(e), true);
            document.addEventListener('keyup', (e) => this.handleKeyUp(e), true);

            // Scroll Loop (50ms)
            setInterval(() => this.scrollLoop(), 50); 
        }

        handleKeyDown(e) {
            const k = e.keyCode;

            // --- GLOBAL SHORTCUTS ---
            // Green (404) = Mouse Toggle
            if (k === 404) { this.toggleMouse(); e.preventDefault(); return; }
            // Blue (406) = HUD
            if (k === 406) { window.TP.hud.toggle(); e.preventDefault(); return; }
            // Red (403) = Reload
            if (k === 403) { window.location.reload(); e.preventDefault(); return; }
            // Yellow (405) = EXIT TO LAUNCHER
            if (k === 405) { window.location.href = window.TP.config.homeUrl; e.preventDefault(); return; }
            
            // Back (10009/Esc)
            if (k === 10009 || k === 27) { window.TP.hud.handleBackPress(true); }

            // --- MOUSE MODE ---
            if (this.mouseMode) {
                const step = 25;
                if (k === 37) this.x -= step;
                if (k === 38) this.y -= step;
                if (k === 39) this.x += step;
                if (k === 40) this.y += step;
                if (k === 13) this.click();

                // Update Visuals (Clamp happens inside here)
                this.updateCursorVisuals();

                // Block default arrows/enter
                if ([37,38,39,40,13].includes(k)) {
                    e.preventDefault(); e.stopPropagation();
                }
            }
        }

        handleKeyUp(e) {
            if (e.keyCode === 10009 || e.key === 'Escape') {
                window.TP.hud.handleBackPress(false);
            }
        }

        scrollLoop() {
            if (!this.mouseMode) return;
            
            const h = window.innerHeight;
            const margin = 60; 
            const speed = 20;

            if (this.y >= h - margin) window.scrollBy(0, speed);
            else if (this.y <= margin) window.scrollBy(0, -speed);
            
            // Re-clamp in case scroll changed relative position or we drifted
            this.clampCursor();
            this.updateCursorVisuals();
        }

        toggleMouse() {
            this.mouseMode = !this.mouseMode;
            if (!this.cursor) {
                this.cursor = document.createElement('div');
                this.cursor.style.cssText = 'position:fixed;width:24px;height:24px;background:rgba(255,0,0,0.8);border:2px solid #fff;border-radius:50%;z-index:2147483647;pointer-events:none;display:none;box-shadow:0 0 10px #000;transition:transform 0.1s;';
                document.body.appendChild(this.cursor);
            }
            this.cursor.style.display = this.mouseMode ? 'block' : 'none';
            
            // Center cursor on enable
            if(this.mouseMode) {
                this.x = window.innerWidth/2;
                this.y = window.innerHeight/2;
            }
            this.updateCursorVisuals();
            window.TP.ui.toast(this.mouseMode ? "Mouse Mode ON" : "Mouse Mode OFF", "#0055aa");
        }

        clampCursor() {
             // Strict Clamping: 0 to Max Dimensions
             this.x = Math.max(0, Math.min(window.innerWidth, this.x));
             this.y = Math.max(0, Math.min(window.innerHeight, this.y));
        }

        updateCursorVisuals() {
            this.clampCursor(); // Ensure valid before drawing
            if (this.cursor) {
                // Offset by 12px so coordinates represent the CENTER of the dot
                this.cursor.style.left = (this.x - 12) + 'px';
                this.cursor.style.top = (this.y - 12) + 'px';
            }
        }

        click() {
            const el = document.elementFromPoint(this.x, this.y);
            if (el) { el.click(); el.focus(); }
            if (this.cursor) {
                this.cursor.style.transform = "scale(0.8)";
                setTimeout(() => this.cursor.style.transform = "scale(1)", 150);
            }
        }
    }

    // ==========================================
    // MODULE: UI & HUD
    // ==========================================
    class UI {
        toast(msg, color) {
            const d = document.createElement('div');
            d.innerHTML = `<strong>TizenPortal:</strong> ${msg}`;
            d.style.cssText = `position:fixed;top:0;left:0;right:0;background:${color};color:#fff;padding:15px;font-size:20px;z-index:2147483647;text-align:center;font-family:sans-serif;box-shadow:0 5px 15px rgba(0,0,0,0.5);`;
            document.body.appendChild(d);
            setTimeout(() => d.remove(), 4000);
        }
    }

    class HUD {
        constructor() {
            this.visible = false;
            this.backTimer = null;
            this.render();
        }
        render() {
            const css = `
                #tp-hud { font-family: monospace; position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 2147483647; color: #fff; display: none; flex-direction: column; padding: 30px; }
                #tp-header { display: flex; justify-content: space-between; border-bottom: 2px solid #444; margin-bottom: 20px; padding-bottom: 10px; }
                #tp-tabs { display: flex; gap: 10px; }
                .tp-tab { padding: 5px 15px; cursor: pointer; background: #222; color: #888; border: 1px solid #444; }
                .tp-tab.active { background: #FFD700; color: #000; font-weight: bold; }
                #tp-content { flex: 1; overflow: hidden; position: relative; border: 1px solid #333; background: #111; padding: 10px; }
                .tp-panel { display: none; height: 100%; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
                .tp-panel.active { display: block; }
                #tp-controls button { width: 100%; padding: 15px; margin-bottom: 10px; background: #333; color: white; border: 1px solid #555; text-align: left; font-size: 16px; }
                #tp-controls button:focus { background: #FFD700; color: black; }
            `;
            const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
            const d = document.createElement('div');
            d.innerHTML = `
                <div id="tp-hud">
                    <div id="tp-header">
                        <div style="font-weight:bold;color:#FFD700;">TizenPortal v0.1.7</div>
                        <div id="tp-tabs">
                            <div class="tp-tab active" onclick="window.TP.hud.switch('menu')">MENU</div>
                            <div class="tp-tab" onclick="window.TP.hud.switch('console')">CONSOLE</div>
                        </div>
                    </div>
                    <div id="tp-content">
                        <div id="panel-menu" class="tp-panel active">
                            <div id="tp-controls">
                                <button onclick="window.location.href=window.TP.config.homeUrl">🏠 Exit to Launcher (Yellow)</button>
                                <button onclick="window.location.reload()">🔄 Reload (Red)</button>
                                <button onclick="window.TP.hud.toggle()">❌ Close HUD (Blue)</button>
                            </div>
                            <div style="margin-top:20px; color:#aaa; font-size:14px; line-height:1.6;">
                                🔴 Red: Reload Page<br>
                                🟢 Green: Toggle Mouse<br>
                                🟡 Yellow: Back to Launcher<br>
                                🔵 Blue: Toggle HUD
                            </div>
                        </div>
                        <div id="panel-console" class="tp-panel"></div>
                    </div>
                </div>`;
            document.body.appendChild(d);
        }
        switch(n) {
            document.querySelectorAll('.tp-tab').forEach(x => x.classList.remove('active'));
            document.querySelectorAll('.tp-panel').forEach(x => x.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById('panel-'+n).classList.add('active');
            if(n==='console') this.updateConsole();
        }
        toggle() {
            this.visible = !this.visible;
            document.getElementById('tp-hud').style.display = this.visible ? 'flex' : 'none';
            if (this.visible) {
                this.updateConsole();
                this.switch('menu');
                setTimeout(()=>document.querySelector('#tp-controls button').focus(), 100);
            }
        }
        updateConsole() {
            const el = document.getElementById('panel-console');
            if (el && window.TP.logger) {
                el.innerHTML = window.TP.logger.getLogs().map(l => `<div style="border-bottom:1px solid #222;">${l.replace(/</g,'&lt;')}</div>`).join('');
            }
        }
        handleBackPress(isDown) {
            if(isDown) { if(!this.backTimer) this.backTimer=setTimeout(()=>this.toggle(), 1000); }
            else { 
                clearTimeout(this.backTimer); 
                this.backTimer=null; 
                if(this.visible) this.toggle(); 
                else if(!window.TP.input.mouseMode) {
                    if(window.location.pathname!=='/') window.history.back();
                }
            }
        }
    }

    // ==========================================
    // MAIN BOOTSTRAP
    // ==========================================
    window.TP = {
        logger: new Logger(),
        config: new Config(),
        ui: new UI(),
    };
    
    // Apply Config & Show Result
    const success = window.TP.config.apply();
    if(success) window.TP.ui.toast("TizenPortal Active", "#008800");

    const onReady = () => {
        window.TP.hud = new HUD();
        window.TP.input = new InputManager();
    };
    if (document.body) onReady(); else document.addEventListener('DOMContentLoaded', onReady);
})();