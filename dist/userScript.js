(function() {
    // 0. IGNORE LAUNCHER
    if (window.location.hostname.includes('github.io')) return;

    // ==========================================
    // MODULE: LOGGER
    // ==========================================
    class Logger {
        constructor() {
            this.logs = [];
            this.init();
        }
        init() {
            const push = (t, a) => {
                const m = Array.from(a).map(o => (typeof o==='object'?JSON.stringify(o):String(o))).join(' ');
                this.logs.unshift(`[${t}] ${m}`);
                if(this.logs.length>50) this.logs.pop();
                if(window.TP?.ui) window.TP.ui.updateConsole();
            };
            console.log=(...a)=>push('INFO',a);
            console.error=(...a)=>push('ERR',a);
            console.warn=(...a)=>push('WARN',a);
        }
    }

    // ==========================================
    // MODULE: CONFIG
    // ==========================================
    class Config {
        constructor() {
            this.homeUrl = 'https://alexnolan.github.io/tizenportal/dist/index.html';
            this.load();
        }
        load() {
            // URL Param Strategy
            const m = window.location.href.match(/[?&]tp=([^&]+)/);
            if (m && m[1]) {
                const j = atob(m[1]);
                this.payload = JSON.parse(j);
                sessionStorage.setItem('tp_conf', j);
                window.history.replaceState({}, document.title, window.location.href.replace(/[?&]tp=[^&]+/, ''));
                return;
            }
            // Storage Strategy
            const s = sessionStorage.getItem('tp_conf');
            if (s) this.payload = JSON.parse(s);
        }
        apply() {
            if (!this.payload) return false;
            if (this.payload.ua) try{Object.defineProperty(navigator,'userAgent',{get:()=>this.payload.ua});}catch(e){}
            if (this.payload.css) { const s=document.createElement('style'); s.textContent=this.payload.css; document.head.appendChild(s); }
            if (this.payload.js) try{new Function(this.payload.js)();}catch(e){}
            return true;
        }
    }

    // ==========================================
    // MODULE: UI (THE SIDEKICK)
    // ==========================================
    class UI {
        constructor() {
            this.open = false;
            this.focusIndex = 0;
            this.items = [
                { label: "🏠 Exit to Home", action: () => window.location.href = window.TP.config.homeUrl, color: "#FFD700" },
                { label: "🔄 Reload App", action: () => window.location.reload(), color: "#fff" },
                { label: "🖱️ Toggle Mouse", action: () => window.TP.input.toggleMouse(), color: "#fff" },
                { label: "📐 Aspect Ratio", action: () => window.TP.input.toggleAspect(), color: "#fff" },
                { label: "📜 Toggle Logs", action: () => this.toggleConsole(), color: "#aaa" }
            ];
            this.render();
        }

        render() {
            const css = `
                #tp-sidebar { 
                    position: fixed; top: 0; right: -300px; width: 280px; bottom: 0; 
                    background: #111; border-left: 2px solid #333; z-index: 2147483647; 
                    transition: right 0.2s; font-family: "Segoe UI", sans-serif; display: flex; flex-direction: column;
                }
                #tp-sidebar.open { right: 0; box-shadow: -10px 0 30px rgba(0,0,0,0.8); }
                .tp-head { padding: 20px; background: #222; font-weight: bold; color: #FFD700; border-bottom: 1px solid #333; }
                .tp-list { flex: 1; padding: 10px; overflow-y: auto; }
                .tp-item { 
                    padding: 15px; margin-bottom: 5px; color: #fff; cursor: pointer; border-radius: 4px; border: 1px solid transparent; 
                    font-size: 16px; display: flex; align-items: center; gap: 10px;
                }
                .tp-item.active { background: #FFD700; color: #000; font-weight: bold; transform: scale(1.02); }
                #tp-console { 
                    height: 30%; background: #000; border-top: 1px solid #444; color: #0f0; 
                    font-family: monospace; font-size: 12px; overflow-y: auto; padding: 10px; display: none;
                }
                .tp-toast { 
                    position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
                    background: #222; color: #fff; padding: 10px 20px; border-radius: 5px; 
                    border: 1px solid #FFD700; opacity: 0; transition: opacity 0.5s; pointer-events: none; z-index: 2147483647;
                }
            `;
            const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

            const h = document.createElement('div'); h.id = 'tp-sidebar';
            h.innerHTML = `
                <div class="tp-head">TizenPortal v0.1.8</div>
                <div class="tp-list" id="tp-menu-list"></div>
                <div id="tp-console"></div>
            `;
            document.body.appendChild(h);

            // Populate Items
            const l = document.getElementById('tp-menu-list');
            this.items.forEach((item, i) => {
                const el = document.createElement('div');
                el.className = 'tp-item';
                el.innerText = item.label;
                el.style.color = item.color;
                el.onclick = () => { this.focusIndex = i; this.updateFocus(); item.action(); };
                l.appendChild(el);
            });
            
            // Toast
            const t = document.createElement('div'); t.className = 'tp-toast'; t.id = 'tp-toast';
            document.body.appendChild(t);
        }

        toggle() {
            this.open = !this.open;
            const el = document.getElementById('tp-sidebar');
            if (this.open) {
                el.classList.add('open');
                this.updateFocus();
            } else {
                el.classList.remove('open');
                // Return focus to app
                const t = document.querySelector('.card, .item, [tabindex="0"], button, input');
                if (t) t.focus();
            }
        }

        navigate(dir) {
            if (!this.open) return;
            if (dir === 'up') this.focusIndex--;
            if (dir === 'down') this.focusIndex++;
            
            // Wrap
            if (this.focusIndex < 0) this.focusIndex = this.items.length - 1;
            if (this.focusIndex >= this.items.length) this.focusIndex = 0;
            this.updateFocus();
        }

        execute() {
            if (!this.open) return;
            this.items[this.focusIndex].action();
            // Flash effect
            const el = document.querySelectorAll('.tp-item')[this.focusIndex];
            el.style.backgroundColor = "#fff";
            setTimeout(() => this.updateFocus(), 100);
        }

        updateFocus() {
            document.querySelectorAll('.tp-item').forEach((el, i) => {
                if (i === this.focusIndex) el.classList.add('active');
                else {
                    el.classList.remove('active');
                    el.style.backgroundColor = ""; // Clear flash
                }
            });
        }

        toggleConsole() {
            const c = document.getElementById('tp-console');
            c.style.display = (c.style.display === 'none' || c.style.display === '') ? 'block' : 'none';
            this.updateConsole();
        }

        updateConsole() {
            const c = document.getElementById('tp-console');
            if (c && c.style.display === 'block' && window.TP.logger) {
                c.innerHTML = window.TP.logger.logs.map(l => `<div>${l.replace(/</g,'&lt;')}</div>`).join('');
            }
        }

        toast(msg) {
            const t = document.getElementById('tp-toast');
            t.innerText = msg;
            t.style.opacity = 1;
            setTimeout(() => t.style.opacity = 0, 3000);
        }
    }

    // ==========================================
    // MODULE: INPUT
    // ==========================================
    class InputManager {
        constructor() {
            this.mouseMode = false;
            this.cursor = null;
            this.x = window.innerWidth/2; this.y = window.innerHeight/2;
            this.aspects = ['contain', 'cover', 'fill']; this.aspIdx=0;
            this.init();
        }
        init() {
            // Aggressive Key Registration
            const reg = () => {
                if(window.tizen && tizen.tvinputdevice) {
                    ["ColorF0Red","ColorF1Green","ColorF2Yellow","ColorF3Blue"].forEach(k=>{
                        try{tizen.tvinputdevice.registerKey(k);}catch(e){}
                    });
                }
            };
            reg();
            window.addEventListener('focus', reg); // Re-register on window focus

            document.addEventListener('keydown', (e) => this.onKey(e), true);
            setInterval(() => this.scrollLoop(), 50);
        }

        onKey(e) {
            const k = e.keyCode;
            
            // --- 1. SIDEBAR NAV (If Open) ---
            if (window.TP.ui.open) {
                if (k === 38) window.TP.ui.navigate('up');   // Up
                if (k === 40) window.TP.ui.navigate('down'); // Down
                if (k === 13) window.TP.ui.execute();        // Enter
                if (k === 37 || k === 10009 || k === 27 || k === 406) window.TP.ui.toggle(); // Left/Back/Blue = Close
                
                e.preventDefault(); e.stopPropagation();
                return;
            }

            // --- 2. GLOBAL SHORTCUTS ---
            if (k === 406) { window.TP.ui.toggle(); e.preventDefault(); return; } // Blue
            if (k === 403) { window.location.reload(); e.preventDefault(); return; } // Red
            if (k === 404) { this.toggleMouse(); e.preventDefault(); return; } // Green
            if (k === 405) { window.location.href = window.TP.config.homeUrl; e.preventDefault(); return; } // Yellow

            // --- 3. MOUSE MODE ---
            if (this.mouseMode) {
                if (k===37) this.x-=25; if (k===38) this.y-=25;
                if (k===39) this.x+=25; if (k===40) this.y+=25;
                if (k===13) this.click();
                this.updateCursor();
                if([37,38,39,40,13].includes(k)) { e.preventDefault(); e.stopPropagation(); }
            }
        }

        scrollLoop() {
            if(!this.mouseMode) return;
            const h = window.innerHeight;
            if(this.y > h-60) window.scrollBy(0, 20);
            if(this.y < 60) window.scrollBy(0, -20);
            this.x = Math.max(0, Math.min(window.innerWidth, this.x));
            this.y = Math.max(0, Math.min(h, this.y));
            this.updateCursor();
        }

        toggleMouse() {
            this.mouseMode = !this.mouseMode;
            if(!this.cursor) {
                this.cursor=document.createElement('div');
                this.cursor.style.cssText='position:fixed;width:20px;height:20px;background:rgba(255,0,0,0.8);border:2px solid #fff;border-radius:50%;z-index:2147483647;pointer-events:none;display:none;';
                document.body.appendChild(this.cursor);
            }
            this.cursor.style.display = this.mouseMode?'block':'none';
            if(this.mouseMode) { this.x=window.innerWidth/2; this.y=window.innerHeight/2; }
            this.updateCursor();
            window.TP.ui.toast(this.mouseMode?"Mouse Mode ON":"Mouse Mode OFF");
        }

        updateCursor() { if(this.cursor){this.cursor.style.left=(this.x-10)+'px';this.cursor.style.top=(this.y-10)+'px';} }

        click() {
            const el = document.elementFromPoint(this.x,this.y);
            if(el) { el.click(); el.focus(); }
            if(this.cursor) { this.cursor.style.transform='scale(0.5)'; setTimeout(()=>this.cursor.style.transform='scale(1)',100); }
        }
        
        toggleAspect() {
            this.aspIdx = (this.aspIdx+1)%this.aspects.length;
            const m = this.aspects[this.aspIdx];
            let s = document.getElementById('tp-asp');
            if(!s){s=document.createElement('style');s.id='tp-asp';document.head.appendChild(s);}
            s.textContent = m==='contain'?'':`video{object-fit:${m} !important;}`;
            window.TP.ui.toast("Aspect: "+m.toUpperCase());
        }
    }

    // BOOT
    window.TP = { logger: new Logger(), config: new Config() };
    if(window.TP.config.apply()) {
        const onReady = () => { window.TP.ui = new UI(); window.TP.input = new InputManager(); window.TP.ui.toast("TizenPortal Active"); };
        if(document.body) onReady(); else document.addEventListener('DOMContentLoaded', onReady);
    }
})();