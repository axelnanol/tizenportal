(function() {
    if (window.location.hostname.includes('github.io')) return;

    // --- LOGGER ---
    class Logger {
        constructor() { this.logs=[]; this.init(); }
        init() {
            const p = (t,a) => {
                const m = Array.from(a).map(o=>typeof o==='object'?JSON.stringify(o):String(o)).join(' ');
                this.logs.unshift(`[${t}] ${m}`);
                if(this.logs.length>60) this.logs.pop();
                if(window.TP?.ui) window.TP.ui.updateConsole();
            };
            console.log=(...a)=>p('INF',a); console.error=(...a)=>p('ERR',a); console.warn=(...a)=>p('WRN',a);
        }
    }

    // --- CONFIG ---
    class Config {
        constructor() { this.payload = null; this.homeUrl = 'https://alexnolan.github.io/tizenportal/dist/index.html'; }
        load() {
            try {
                // 1. URL Param
                const m = window.location.href.match(/[?&]tp=([^&]+)/);
                if (m && m[1]) {
                    const j = atob(m[1]);
                    this.payload = JSON.parse(j);
                    sessionStorage.setItem('tp_conf', j);
                    window.history.replaceState({}, document.title, window.location.href.replace(/[?&]tp=[^&]+/, ''));
                    console.log("[TP] Config loaded via URL");
                    return true;
                }
                // 2. Storage
                const s = sessionStorage.getItem('tp_conf');
                if (s) {
                    this.payload = JSON.parse(s);
                    console.log("[TP] Config loaded via Storage");
                    return true;
                }
            } catch(e) { console.error("Config Load Fail:", e); }
            return false;
        }

        apply() {
            if (!this.payload) return false;
            
            // Safe UA Spoof
            if (this.payload.ua) {
                try {
                    Object.defineProperty(navigator, 'userAgent', { get: () => this.payload.ua });
                    console.log("[TP] UA Spoofed");
                } catch(e) { console.error("UA Spoof Fail (Ignored)", e); }
            }

            // CSS
            if (this.payload.css) {
                try {
                    const s = document.createElement('style');
                    s.textContent = this.payload.css;
                    document.head.appendChild(s);
                } catch(e) { console.error("CSS Fail", e); }
            }

            // JS
            if (this.payload.js) {
                try { new Function(this.payload.js)(); } catch(e) { console.error("JS Payload Fail", e); }
            }
            return true;
        }
    }

    // --- UI (SIDEBAR) ---
    class UI {
        constructor() {
            this.open = false;
            this.focusIndex = 0;
            this.items = [
                { l: "🏠 Exit to Home", fn: ()=>window.location.href=window.TP.config.homeUrl, c:"#FFD700" },
                { l: "🔄 Reload", fn: ()=>window.location.reload(), c:"#fff" },
                { l: "🖱️ Toggle Mouse", fn: ()=>window.TP.input.toggleMouse(), c:"#fff" },
                { l: "📐 Aspect Ratio", fn: ()=>window.TP.input.toggleAspect(), c:"#fff" },
                { l: "📜 Logs", fn: ()=>this.toggleConsole(), c:"#aaa" }
            ];
            this.render();
        }
        render() {
            const css = `
                #tp-bar { position:fixed; top:0; right:-300px; width:280px; bottom:0; background:#111; border-left:2px solid #333; z-index:2147483647; transition:right 0.2s; font-family:sans-serif; display:flex; flex-direction:column; }
                #tp-bar.open { right:0; box-shadow:-10px 0 50px rgba(0,0,0,0.8); }
                .tp-h { padding:15px; background:#222; color:#FFD700; font-weight:bold; border-bottom:1px solid #333; }
                .tp-list { flex:1; padding:10px; overflow-y:auto; }
                .tp-i { padding:15px; margin-bottom:5px; color:#fff; cursor:pointer; font-size:16px; border-radius:4px; }
                .tp-i.active { background:#FFD700; color:#000; font-weight:bold; }
                #tp-con { height:30%; background:#000; color:#0f0; font-family:monospace; font-size:11px; padding:10px; overflow-y:auto; display:none; border-top:1px solid #444; }
                .tp-toast { position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#222; color:#fff; padding:10px 20px; border-radius:5px; border:1px solid #FFD700; opacity:0; transition:opacity 0.5s; z-index:2147483647; pointer-events:none; }
            `;
            const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
            const d = document.createElement('div'); d.id='tp-bar';
            d.innerHTML = `<div class="tp-h">TizenPortal v0.1.10</div><div class="tp-list" id="tp-l"></div><div id="tp-con"></div>`;
            document.body.appendChild(d);
            
            const l = document.getElementById('tp-l');
            this.items.forEach((item,i) => {
                const el=document.createElement('div'); el.className='tp-i'; el.innerText=item.l; el.style.color=item.c;
                el.onclick=()=>{this.focusIndex=i; this.upd(); item.fn();};
                l.appendChild(el);
            });
            const t = document.createElement('div'); t.className='tp-toast'; t.id='tp-t'; document.body.appendChild(t);
        }
        toggle() { this.open=!this.open; document.getElementById('tp-bar').classList.toggle('open', this.open); this.upd(); }
        nav(d) {
            if(!this.open) return;
            if(d==='u') this.focusIndex--; if(d==='d') this.focusIndex++;
            if(this.focusIndex<0) this.focusIndex=this.items.length-1;
            if(this.focusIndex>=this.items.length) this.focusIndex=0;
            this.upd();
        }
        exe() { if(this.open) { this.items[this.focusIndex].fn(); const el=document.querySelectorAll('.tp-i')[this.focusIndex]; el.style.background='#fff'; setTimeout(()=>this.upd(),100); } }
        upd() {
            document.querySelectorAll('.tp-i').forEach((el,i)=>{
                el.className = i===this.focusIndex ? 'tp-i active' : 'tp-i';
                el.style.background = i===this.focusIndex ? '#FFD700' : ''; 
            });
        }
        toggleConsole() { const c=document.getElementById('tp-con'); c.style.display=c.style.display==='block'?'none':'block'; this.updateConsole(); }
        updateConsole() {
            const c=document.getElementById('tp-con');
            if(c && c.style.display==='block' && window.TP.logger) {
                c.innerHTML=window.TP.logger.logs.map(l=>`<div>${l.replace(/</g,'&lt;')}</div>`).join('');
            }
        }
        toast(m, c="#FFD700") { const t=document.getElementById('tp-t'); t.innerText=m; t.style.borderColor=c; t.style.opacity=1; setTimeout(()=>t.style.opacity=0,3000); }
    }

    // --- INPUT ---
    class Input {
        constructor() {
            this.mouse=false; this.x=window.innerWidth/2; this.y=window.innerHeight/2; this.aspIdx=0;
            this.init();
        }
        init() {
            const reg = ()=>{ if(window.tizen&&tizen.tvinputdevice) ["ColorF0Red","ColorF1Green","ColorF2Yellow","ColorF3Blue"].forEach(k=>{try{tizen.tvinputdevice.registerKey(k)}catch(e){}}); };
            reg(); window.addEventListener('focus', reg);
            document.addEventListener('keydown', e=>this.key(e), true);
            setInterval(()=>this.loop(), 50);
        }
        key(e) {
            const k=e.keyCode;
            // Sidebar
            if(window.TP.ui.open) {
                if(k===38) window.TP.ui.nav('u'); if(k===40) window.TP.ui.nav('d');
                if(k===13) window.TP.ui.exe();
                if([37,406,10009,27].includes(k)) window.TP.ui.toggle();
                e.preventDefault(); e.stopPropagation(); return;
            }
            // Global
            if(k===406) { window.TP.ui.toggle(); e.preventDefault(); return; } // Blue
            if(k===403) { window.location.reload(); e.preventDefault(); return; } // Red
            if(k===404) { this.toggleMouse(); e.preventDefault(); return; } // Green
            if(k===405) { window.location.href=window.TP.config.homeUrl; e.preventDefault(); return; } // Yellow

            // Mouse
            if(this.mouse) {
                if(k===37) this.x-=25; if(k===38) this.y-=25;
                if(k===39) this.x+=25; if(k===40) this.y+=25;
                if(k===13) this.click();
                this.draw();
                if([37,38,39,40,13].includes(k)) { e.preventDefault(); e.stopPropagation(); }
            }
        }
        loop() {
            if(!this.mouse) return;
            const h=window.innerHeight;
            if(this.y>h-60) window.scrollBy(0,20);
            if(this.y<60) window.scrollBy(0,-20);
            this.x=Math.max(0,Math.min(window.innerWidth,this.x));
            this.y=Math.max(0,Math.min(h,this.y));
            this.draw();
        }
        toggleMouse() {
            this.mouse=!this.mouse;
            if(!this.cur) { this.cur=document.createElement('div'); this.cur.style.cssText='position:fixed;width:20px;height:20px;background:rgba(255,0,0,0.8);border:2px solid #fff;border-radius:50%;z-index:2147483647;pointer-events:none;display:none;'; document.body.appendChild(this.cur); }
            this.cur.style.display=this.mouse?'block':'none';
            if(this.mouse){ this.x=window.innerWidth/2; this.y=window.innerHeight/2; }
            this.draw();
            window.TP.ui.toast(this.mouse?"Mouse ON":"Mouse OFF");
        }
        draw() { if(this.cur){ this.cur.style.left=(this.x-10)+'px'; this.cur.style.top=(this.y-10)+'px'; } }
        click() { const el=document.elementFromPoint(this.x,this.y); if(el){el.click(); el.focus();} if(this.cur){this.cur.style.transform='scale(0.5)'; setTimeout(()=>this.cur.style.transform='scale(1)',100);} }
        toggleAspect() {
            const m = ['contain','cover','fill'];
            this.aspIdx=(this.aspIdx+1)%m.length;
            let s=document.getElementById('tp-asp'); if(!s){s=document.createElement('style');s.id='tp-asp';document.head.appendChild(s);}
            s.textContent=m[this.aspIdx]==='contain'?'':`video{object-fit:${m[this.aspIdx]} !important;}`;
            window.TP.ui.toast("Aspect: "+m[this.aspIdx].toUpperCase());
        }
    }

    // --- BOOT ---
    window.TP = { logger: new Logger(), config: new Config() };
    
    // Init UI/Input when body is ready
    const onReady = () => {
        window.TP.ui = new UI(); 
        window.TP.input = new Input();
        
        // Attempt Config Apply
        if(window.TP.config.load()) {
            if(window.TP.config.apply()) window.TP.ui.toast("TizenPortal Active", "#008800");
            else window.TP.ui.toast("Config Error", "#aa0000");
        } else {
            window.TP.ui.toast("No Config Found", "#aa5500");
        }
    };
    if(document.body) onReady(); else document.addEventListener('DOMContentLoaded', onReady);
})();