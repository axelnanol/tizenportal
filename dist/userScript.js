(function() {
    // 0. IGNORE LAUNCHER
    if (window.location.hostname.includes('github.io')) return;

    // ==========================================
    // MODULE: LOGGER (Console Interceptor)
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
    // MODULE: CONFIG (Payload Decoder)
    // ==========================================
    class Config {
        constructor() {
            this.payload = null;
            this.homeUrl = 'https://alexnolan.github.io/tizenportal/dist/index.html';
            this.load();
        }

        load() {
            try {
                // 1. Try URL Param (?tp=BASE64)
                const match = window.location.href.match(/[?&]tp=([^&]+)/);
                if (match && match[1]) {
                    const json = atob(match[1]);
                    this.payload = JSON.parse(json);
                    
                    // Scrub URL
                    const cleanUrl = window.location.href.replace(/[?&]tp=[^&]+/, '');
                    window.history.replaceState({}, document.title, cleanUrl);
                    console.log("[TP] Config loaded from URL.");
                    return;
                }
                
                // 2. Fallback: window.name (Legacy)
                if (window.name && window.name.includes('tp_payload')) {
                    this.payload = JSON.parse(window.name);
                    console.log("[TP] Config loaded from window.name.");
                }
            } catch (e) {
                console.error("Config Load Error:", e);
            }
        }

        apply() {
            if (!this.payload) return false;

            // Apply User Agent
            if (this.payload.ua) {
                try { Object.defineProperty(navigator, 'userAgent', { get: () => this.payload.ua }); } catch(e){}
            }
            // Apply CSS
            if (this.payload.css) {
                const s = document.createElement('style');
                s.textContent = this.payload.css;
                document.head.appendChild(s);
            }
            // Apply JS
            if (this.payload.js) {
                try { new Function(this.payload.js)(); } catch(e) { console.error("Payload JS Error", e); }
            }
            return true;
        }
    }

    // ==========================================
    // MODULE: INPUT (Virtual Mouse & Keys)
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
            document.addEventListener('keydown', (e) => this.handleKeyDown(e), true);
            document.addEventListener('keyup', (e) => this.handleKeyUp(e), true);
        }

        handleKeyDown(e) {
            const k = e.keyCode;

            // 1. Mouse Toggle (Green: 404)
            if (k === 404) { 
                this.toggleMouse(); 
                e.preventDefault(); 
                return; 
            }

            // 2. Mouse Movement
            if (this.mouseMode) {
                const step = 25;
                if (k === 37) this.x -= step;
                if (k === 38) this.y -= step;
                if (k === 39) this.x += step;
                if (k === 40) this.y += step;
                if (k === 13) this.click(); // Enter

                this.updateCursor();
                e.preventDefault(); e.stopPropagation();
                return;
            }

            // 3. System Shortcuts
            if (k === 406) { window.TP.hud.toggle(); e.preventDefault(); } // Blue
            if (k === 403) { window.location.reload(); e.preventDefault(); } // Red
            if (k === 10009 || k === 27) { // Back (Long Press Logic handled in HUD)
                 window.TP.hud.handleBackPress(true);
            }
        }

        handleKeyUp(e) {
            if (e.keyCode === 10009 || e.key === 'Escape') {
                window.TP.hud.handleBackPress(false);
            }
        }

        toggleMouse() {
            this.mouseMode = !this.mouseMode;
            if (!this.cursor) {
                this.cursor = document.createElement('div');
                this.cursor.style.cssText = 'position:fixed;width:24px;height:24px;background:rgba(255,0,0,0.8);border:2px solid #fff;border-radius:50%;z-index:2147483647;pointer-events:none;display:none;box-shadow:0 0 10px #000;transition:transform 0.1s;';
                document.body.appendChild(this.cursor);
            }
            this.cursor.style.display = this.mouseMode ? 'block' : 'none';
            this.updateCursor();
            window.TP.ui.toast(this.mouseMode ? "Mouse Mode ON" : "Mouse Mode OFF", "#0055aa");
        }

        updateCursor() {
            // Clamp
            this.x = Math.max(0, Math.min(window.innerWidth, this.x));
            this.y = Math.max(0, Math.min(window.innerHeight, this.y));
            if (this.cursor) {
                this.cursor.style.left = (this.x - 12) + 'px';
                this.cursor.style.top = (this.y - 12) + 'px';
            }
        }

        click() {
            const el = document.elementFromPoint(this.x, this.y);
            if (el) { el.click(); el.focus(); }
            if (this.cursor) {
                this.cursor.style.transform = "scale(0.8)";
                setTimeout(() => this.cursor.style.transform = "scale(1)", 100);
            }
        }
    }

    // ==========================================
    // MODULE: UI (Toast & Utilities)
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

    // ==========================================
    // MODULE: HUD (Debug Overlay)
    // ==========================================
    class HUD {
        constructor() {
            this.visible = false;
            this.backTimer = null;
            this.render();
        }

        render() {
            const css = `
                #tp-hud { font-family: "Consolas", monospace; position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 2147483647; color: #fff; display: none; flex-direction: column; padding: 30px; }
                #tp-header { display: flex; justify-content: space-between; border-bottom: 2px solid #444; margin-bottom: 20px; padding-bottom: 10px; }
                #tp-tabs { display: flex; gap: 10px; }
                .tp-tab { padding: 5px 15px; cursor: pointer; background: #222; color: #888; border: 1px solid #444; }
                .tp-tab.active { background: #FFD700; color: #000; font-weight: bold; }
                #tp-content { flex: 1; overflow: hidden; position: relative; border: 1px solid #333; background: #111; padding: 10px; }
                .tp-panel { display: none; height: 100%; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
                .tp-panel.active { display: block; }
                .tp-err { color: #ff5555; background: rgba(50,0,0,0.5); }
                #tp-controls button { width: 100%; padding: 15px; margin-bottom: 10px; background: #333; color: white; border: 1px solid #555; text-align: left; font-size: 16px; }
                #tp-controls button:focus { background: #FFD700; color: black; }
            `;
            const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

            const html = `
                <div id="tp-hud">
                    <div id="tp-header">
                        <div style="font-weight:bold; color:#FFD700; font-size:20px;">TizenPortal v0.1.4</div>
                        <div id="tp-tabs">
                            <div class="tp-tab active" data-tab="menu">MENU</div>
                            <div class="tp-tab" data-tab="console">CONSOLE</div>
                            <div class="tp-tab" data-tab="info">INFO</div>
                        </div>
                    </div>
                    <div id="tp-content">
                        <div id="panel-menu" class="tp-panel active">
                            <div id="tp-controls">
                                <button id="btn-tp-exit">🏠 Exit to Portal</button>
                                <button id="btn-tp-reload">🔄 Reload App</button>
                                <button id="btn-tp-close">❌ Close HUD</button>
                            </div>
                            <div style="margin-top:20px; color:#666; text-align:center;">
                                RED: Reload | GREEN: Mouse | BLUE: HUD
                            </div>
                        </div>
                        <div id="panel-console" class="tp-panel"></div>
                        <div id="panel-info" class="tp-panel"></div>
                    </div>
                </div>`;
            
            const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d);

            // Bindings
            document.querySelectorAll('.tp-tab').forEach(t => t.onclick = (e) => this.switchTab(e.target.dataset.tab));
            document.getElementById('btn-tp-exit').onclick = () => window.location.href = window.TP.config.homeUrl;
            document.getElementById('btn-tp-reload').onclick = () => window.location.reload();
            document.getElementById('btn-tp-close').onclick = () => this.toggle();
        }

        switchTab(name) {
            document.querySelectorAll('.tp-tab').forEach(x => x.classList.remove('active'));
            document.querySelectorAll('.tp-panel').forEach(x => x.classList.remove('active'));
            document.querySelector(`.tp-tab[data-tab="${name}"]`).classList.add('active');
            document.getElementById('panel-' + name).classList.add('active');
            
            if (name === 'console') this.updateConsole();
            if (name === 'info') this.updateInfo();
        }

        toggle() {
            const el = document.getElementById('tp-hud');
            this.visible = !this.visible;
            el.style.display = this.visible ? 'flex' : 'none';
            
            if (this.visible) {
                this.updateInfo();
                this.updateConsole();
                this.switchTab('menu');
                setTimeout(() => document.getElementById('btn-tp-reload').focus(), 100);
            } else {
                // Return focus to app
                const t = document.querySelector('.card, .item, [tabindex="0"], button, input');
                if (t) t.focus();
            }
        }

        updateConsole() {
            const el = document.getElementById('panel-console');
            if (el && window.TP.logger) {
                el.innerHTML = window.TP.logger.getLogs().map(l => 
                    `<div style="border-bottom:1px solid #222; padding:4px;" class="${l.includes('[ERR]')?'tp-err':''}">${l.replace(/</g,'&lt;')}</div>`
                ).join('');
            }
        }

        updateInfo() {
            const el = document.getElementById('panel-info');
            if (el) {
                el.innerHTML = `
                    <b>URL:</b> ${window.location.href}<br>
                    <b>Res:</b> ${window.innerWidth} x ${window.innerHeight}<br>
                    <b>UA:</b> ${navigator.userAgent}<br>
                    <b>Mem:</b> ${window.performance?.memory ? Math.round(window.performance.memory.usedJSHeapSize/1024/1024)+' MB' : 'N/A'}
                `;
            }
        }

        handleBackPress(isDown) {
            if (isDown) {
                if (!this.backTimer) this.backTimer = setTimeout(() => this.toggle(), 1000);
            } else {
                clearTimeout(this.backTimer); 
                this.backTimer = null;
                if (this.visible) this.toggle();
                else if (!window.TP.input.mouseMode) {
                     // Default Back behavior
                     if (window.location.pathname !== '/' && !window.location.href.includes('github.io')) window.history.back();
                }
            }
        }
    }

    // ==========================================
    // MAIN APP
    // ==========================================
    window.TP = {
        logger: new Logger(),
        config: new Config(),
        ui: new UI(),
        // Input/HUD init delayed slightly to ensure DOM ready
    };

    // Boot
    console.log("[TP] Booting Modules...");
    
    // Apply Config immediately
    const success = window.TP.config.apply();
    window.TP.ui.toast(success ? "Injected via URL" : "No Config Found", success ? "#008800" : "#aa6600");

    // Init UI/Input when body exists
    const onReady = () => {
        window.TP.hud = new HUD();
        window.TP.input = new InputManager();
    };

    if (document.body) onReady();
    else document.addEventListener('DOMContentLoaded', onReady);

})();