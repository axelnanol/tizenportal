(function() {
    if (window.location.hostname.indexOf('github.io') > -1) return;

    var logs = [];
    var tpHud = function(msg){
        try {
            var h = document.getElementById('tp-diag');
            if(!h){
                h = document.createElement('div'); h.id='tp-diag';
                h.style.cssText='position:fixed;top:0;right:0;background:#222;color:#0f0;padding:10px;font-size:12px;font-family:monospace;z-index:2147483647;border-left:2px solid #0f0;border-bottom:2px solid #0f0;pointer-events:none;max-width:300px;word-break:break-all;transition:opacity 0.5s;';
                document.body.appendChild(h);
            }
            h.textContent = '[TP] ' + msg;
            h.style.opacity = '1';
            h.style.display = 'block';
            // Clear any existing timeout
            if (h._fadeTimer) clearTimeout(h._fadeTimer);
            // Fade after 3s, hide after 5s
            h._fadeTimer = setTimeout(function(){ 
                try { 
                    if(h) { 
                        h.style.opacity='0'; 
                        setTimeout(function(){ if(h) h.style.display='none'; }, 500);
                    } 
                } catch(e){} 
            }, 5000);
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
        focused: 'main', // 'main' or 'addressbar'
        idx: 0, contentMode: 'none',
        items: [
            { l: "🏠", title: "Home", fn: function(){ window.location.href = Config.homeUrl; }, c:"#FFD700" },
            { l: "⬅️", title: "Back", fn: function(){ window.history.back(); }, c:"#0f0" },
            { l: "➡️", title: "Forward", fn: function(){ window.history.forward(); }, c:"#0f0" },
            { l: "🔄", title: "Reload", fn: function(){ window.location.reload(); }, c:"#fff" },
            { l: "🖱️", title: "Mouse", fn: function(){ Input.toggleMouse(); }, c:"#fff" },
            { l: "�", title: "Forms", fn: function(){ BlueMenu.toggle(); }, c:"#1e90ff" },
            { l: "📜", title: "Logs", fn: function(){ UI.toggleMode('logs'); }, c:"#0ff" },
            { l: "🔍", title: "Source", fn: function(){ UI.toggleMode('source'); }, c:"#0ff" }
        ],
        init: function() {
            var css = "" +
                "#tp-bar { position:fixed; top:0; left:0; right:0; height:50px; background:#111; border-bottom:3px solid #FFD700; z-index:2147483646 !important; font-family:sans-serif; display:flex; align-items:center; padding:0 10px; gap:5px; box-shadow:0 5px 20px rgba(0,0,0,0.8); }" +
                ".tp-bar-btn { min-width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; border:2px solid transparent; border-radius:4px; font-size:20px; transition:all 0.1s; flex-shrink:0; position:relative; }" +
                ".tp-bar-btn:focus, .tp-bar-btn.active { border-color:#FFD700; background:#333; outline:none; }" +
                ".tp-bar-btn:hover::after, .tp-bar-btn:focus::after { content:attr(title); position:absolute; top:100%; left:50%; transform:translateX(-50%); background:#000; color:#FFD700; padding:4px 8px; border-radius:4px; font-size:12px; white-space:nowrap; margin-top:5px; border:1px solid #FFD700; z-index:10000; }" +
                "#tp-url { flex:1; height:40px; background:#222; color:#fff; border:2px solid #444; border-radius:4px; padding:0 10px; font-size:14px; font-family:monospace; outline:none; }" +
                "#tp-url:focus { border-color:#FFD700; background:#000; }" +
                "#tp-content { position:fixed; top:50px; left:0; right:0; bottom:0; background:#000; color:#0f0; font-family:monospace; font-size:11px; padding:10px; overflow-y:auto; white-space:pre-wrap; word-break:break-all; display:none; z-index:2147483645 !important; }" +
                "#tp-content.active { display:block; }" +
                ".tp-t { position:fixed; top:60px; left:50%; transform:translateX(-50%); background:#222; color:#fff; padding:10px; border:1px solid #FFD700; opacity:0; transition:opacity 0.5s; z-index:2147483647 !important; pointer-events:none; }";
            
            var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
            
            var bar = document.createElement('div'); bar.id='tp-bar';
            
            var self = this;
            this.items.forEach(function(item, i) {
                var btn = document.createElement('div');
                btn.className='tp-bar-btn';
                btn.innerText=item.l;
                btn.title=item.title;
                btn.style.color=item.c;
                btn.tabIndex=0;
                btn.onclick = function() { self.idx=i; self.upd(); item.fn(); };
                btn.onkeydown = function(e) {
                    if(e.keyCode === 13) { self.idx=i; item.fn(); e.preventDefault(); }
                    if(e.keyCode === 37 && i > 0) { self.idx=i-1; self.upd(); document.querySelectorAll('.tp-bar-btn')[self.idx].focus(); e.preventDefault(); }
                    if(e.keyCode === 39 && i < self.items.length-1) { self.idx=i+1; self.upd(); document.querySelectorAll('.tp-bar-btn')[self.idx].focus(); e.preventDefault(); }
                    if(e.keyCode === 39 && i === self.items.length-1) { document.getElementById('tp-url').focus(); e.preventDefault(); }
                    if(e.keyCode === 10009 || e.keyCode === 27) { self.toggleFocus(); e.preventDefault(); }
                };
                bar.appendChild(btn);
            });
            
            var url = document.createElement('input');
            url.id='tp-url';
            url.type='text';
            url.value=window.location.href;
            url.tabIndex=0;
            url.onkeydown = function(e) {
                if(e.keyCode === 13) { window.location.href = url.value; e.preventDefault(); }
                if(e.keyCode === 37 && url.selectionStart === 0) { 
                    var btns = document.querySelectorAll('.tp-bar-btn');
                    if(btns.length) { self.idx = btns.length-1; self.upd(); btns[self.idx].focus(); }
                    e.preventDefault(); 
                }
                if(e.keyCode === 10009 || e.keyCode === 27) { url.blur(); self.toggleFocus(); e.preventDefault(); }
            };
            bar.appendChild(url);
            
            var content = document.createElement('div');
            content.id='tp-content';
            content.tabIndex=0;
            content.onkeydown = function(e) {
                if(e.keyCode === 38) { content.scrollTop -= 40; e.preventDefault(); }
                if(e.keyCode === 40) { content.scrollTop += 40; e.preventDefault(); }
                if(e.keyCode === 10009 || e.keyCode === 27) { self.setMode('none'); e.preventDefault(); }
            };
            
            var t = document.createElement('div'); t.className='tp-t'; t.id='tp-toast';
            
            document.body.appendChild(bar);
            document.body.appendChild(content);
            document.body.appendChild(t);
        },
        toggleFocus: function() { 
            this.focused = (this.focused === 'main') ? 'addressbar' : 'main';
            var btns = document.querySelectorAll('.tp-bar-btn');
            if(this.focused === 'addressbar') {
                if(btns.length) btns[0].focus();
                this.toast("Address Bar - Use ←→ to navigate");
            } else {
                document.body.focus();
            }
            this.upd();
        },
        toggleMode: function(mode) {
            if (this.contentMode === mode) {
                this.setMode('none');
            } else {
                this.setMode(mode);
            }
        },
        setMode: function(mode) {
            this.contentMode = mode;
            var c = document.getElementById('tp-content');
            
            if (mode === 'none') {
                c.classList.remove('active');
            } else {
                c.classList.add('active');
                if(mode === 'logs') this.updateConsole();
                if(mode === 'source') this.viewSource();
                c.focus();
                this.toast("↑↓ Scroll / Back to Exit");
            }
        },
        viewSource: function() {
            var html = document.documentElement.outerHTML.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            var c = document.getElementById('tp-content');
            c.innerHTML = '<div style="color:#FFD700;background:#222;border-bottom:2px solid #FFD700;padding:10px;margin:-10px -10px 10px -10px;font-weight:bold;">PAGE SOURCE</div>' + 
                          '<div style="color:#0ff;font-size:10px;line-height:1.4;">' + html + '</div>';
        },
        updateConsole: function() {
            if(this.contentMode !== 'logs') return;
            var c = document.getElementById('tp-content');
            var header = '<div style="color:#FFD700;background:#222;border-bottom:2px solid #FFD700;padding:10px;margin:-10px -10px 10px -10px;font-weight:bold;">CONSOLE LOGS</div>';
            var entries = logs.map(function(l){ 
                var color = l.type === 'ERR' ? '#f00' : (l.type === 'INF' ? '#0f0' : '#fff');
                return '<div style="margin:5px 0;line-height:1.3;"><span style="color:#888;font-size:10px;">' + l.t + '</span> ' +
                       '<span style="color:' + color + ';font-weight:bold;">[' + l.type + ']</span> ' +
                       '<span style="color:#aaa;">' + l.msg.replace(/</g,'&lt;') + '</span></div>'; 
            }).join('');
            c.innerHTML = header + entries;
        },
        upd: function() { 
            var btns = document.querySelectorAll('.tp-bar-btn'); 
            for(var i=0; i<btns.length; i++) btns[i].className = (i===this.idx) ? 'tp-bar-btn active' : 'tp-bar-btn'; 
        },
        toast: function(m) { var t = document.getElementById('tp-toast'); t.innerText = m; t.style.opacity = 1; setTimeout(function(){ t.style.opacity=0; }, 3000); }
    };

    // Generic Blue Menu - Form sidebar triggered by Blue button
    var BlueMenu = {
        active: false,
        forms: [],
        selectedIdx: 0,
        
        init: function() {
            var css = "" +
                "#tp-blue-menu { position:fixed; right:0; top:50px; bottom:0; width:350px; background:#1a3a52; border-left:3px solid #1e90ff; z-index:2147483644; display:none; flex-direction:column; box-shadow:-10px 0 30px rgba(0,0,0,0.7); font-family:sans-serif; }" +
                "#tp-blue-menu.active { display:flex; }" +
                "#tp-blue-header { background:#0f2847; color:#1e90ff; padding:15px; border-bottom:2px solid #1e90ff; font-weight:bold; font-size:16px; }" +
                "#tp-blue-list { flex-shrink:0; overflow-y:auto; max-height:40%; border-bottom:1px solid #0f2847; }" +
                ".tp-blue-item { padding:12px 15px; color:#aaa; cursor:pointer; border-bottom:1px solid #0f2847; font-size:14px; }" +
                ".tp-blue-item:focus, .tp-blue-item.active { color:#1e90ff; background:#0f2847; outline:3px solid #1e90ff; font-weight:bold; }" +
                "#tp-blue-content { flex:1; overflow-y:auto; padding:15px; }" +
                ".tp-blue-input { width:100%; padding:10px; margin-bottom:12px; background:#0f2847; color:#fff; border:1px solid #1e90ff; border-radius:4px; font-size:14px; }" +
                ".tp-blue-input:focus { border-color:#FFD700; outline:none; }" +
                ".tp-blue-label { display:block; color:#1e90ff; font-size:12px; margin-bottom:5px; font-weight:bold; }" +
                ".tp-blue-btn { width:100%; padding:10px; background:#1e90ff; color:#fff; border:none; border-radius:4px; font-size:14px; cursor:pointer; margin-top:10px; }" +
                ".tp-blue-btn:focus { outline:3px solid #FFD700; }" +
                ".tp-form-hidden { opacity:0.001 !important; pointer-events:none !important; position:absolute !important; left:-9999px !important; }";
            
            var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
            
            var menu = document.createElement('div');
            menu.id = 'tp-blue-menu';
            menu.innerHTML = '<div id="tp-blue-header">📝 Forms</div><div id="tp-blue-list"></div><div id="tp-blue-content"></div>';
            document.body.appendChild(menu);
        },
        
        toggle: function() {
            this.active = !this.active;
            var menu = document.getElementById('tp-blue-menu');
            if (this.active) {
                this.detectForms();
                this.hideOriginalForms();
                this.renderList();
                menu.classList.add('active');
                var firstItem = document.querySelector('.tp-blue-item');
                if (firstItem) firstItem.focus();
                UI.toast("Forms Menu - ↑↓ Navigate / Back to Close");
            } else {
                menu.classList.remove('active');
                document.body.focus();
            }
        },
        
        detectForms: function() {
            this.forms = [];
            var processed = {};
            
            // 1. Find all <form> elements and group their inputs
            var formEls = document.querySelectorAll('form');
            for (var f = 0; f < formEls.length; f++) {
                var formEl = formEls[f];
                if (formEl.offsetParent === null) continue; // Skip hidden forms
                
                var inputs = formEl.querySelectorAll('input, textarea, select, button');
                var visInputs = [];
                for (var i = 0; i < inputs.length; i++) {
                    var inp = inputs[i];
                    // Skip already processed or TP elements
                    if (inp.className && inp.className.indexOf('tp-') > -1) continue;
                    if (inp.offsetParent !== null || inp.type === 'hidden') visInputs.push(inp);
                    processed[inp] = true;
                }
                
                if (visInputs.length > 0) {
                    var formName = formEl.id || formEl.name || formEl.getAttribute('aria-label') || formEl.getAttribute('role') || '';
                    // Try to detect form purpose
                    var hasPassword = formEl.querySelector('input[type="password"]');
                    var hasSearch = formEl.querySelector('input[type="search"], input[placeholder*="search" i]');
                    var icon = hasPassword ? '🔐' : (hasSearch ? '🔍' : '📋');
                    var label = formName || (hasPassword ? 'Login' : (hasSearch ? 'Search' : 'Form ' + (this.forms.length + 1)));
                    
                    this.forms.push({
                        category: icon + ' ' + label,
                        inputs: visInputs,
                        formEl: formEl,
                        type: 'form'
                    });
                }
            }
            
            // 2. Find orphan inputs (not in any form) - group as "Page Controls"
            var allInputs = document.querySelectorAll('input, textarea, select');
            var orphans = [];
            for (var j = 0; j < allInputs.length; j++) {
                var el = allInputs[j];
                if (processed[el]) continue;
                if (el.className && el.className.indexOf('tp-') > -1) continue;
                if (el.offsetParent === null) continue;
                // Skip inputs inside tp-lifeboat rescued cards (ABS action buttons etc)
                if (el.closest && el.closest('.tp-rescued-card, #tp-lifeboat, #tp-bar, #tp-blue-menu')) continue;
                orphans.push(el);
                processed[el] = true;
            }
            if (orphans.length > 0) {
                this.forms.push({
                    category: '⚙️ Page Controls',
                    inputs: orphans,
                    formEl: null,
                    type: 'orphan'
                });
            }
            
            // 3. Find standalone buttons (not in forms, not in rescued cards)
            var buttons = document.querySelectorAll('button:not(.tp-bar-btn):not(.tp-blue-btn)');
            var standaloneButtons = [];
            for (var k = 0; k < buttons.length; k++) {
                var btn = buttons[k];
                if (processed[btn]) continue;
                if (btn.offsetParent === null) continue;
                if (btn.closest && btn.closest('form, .tp-rescued-card, #tp-lifeboat, #tp-bar, #tp-blue-menu')) continue;
                if (btn.textContent.trim().length === 0 || btn.textContent.trim().length > 40) continue;
                standaloneButtons.push(btn);
            }
            if (standaloneButtons.length > 0) {
                this.forms.push({
                    category: '🔘 Actions',
                    inputs: standaloneButtons,
                    formEl: null,
                    type: 'buttons'
                });
            }
            
            console.log('[TP BlueMenu] Detected ' + this.forms.length + ' form groups');
        },
        
        hideOriginalForms: function() {
            // Hide original form elements but NOT rescued cards or TP UI
            for (var f = 0; f < this.forms.length; f++) {
                var form = this.forms[f];
                if (form.formEl) {
                    form.formEl.classList.add('tp-form-hidden');
                } else {
                    // For orphans, hide each input individually
                    for (var i = 0; i < form.inputs.length; i++) {
                        var inp = form.inputs[i];
                        if (!inp.closest || !inp.closest('.tp-rescued-card, #tp-lifeboat')) {
                            inp.classList.add('tp-form-hidden');
                        }
                    }
                }
            }
        },
        
        renderList: function() {
            var self = this;
            var list = document.getElementById('tp-blue-list');
            list.innerHTML = '';
            
            if (this.forms.length === 0) {
                list.innerHTML = '<div style="padding:15px;color:#888;">No forms detected on this page</div>';
                return;
            }
            
            for (var i = 0; i < this.forms.length; i++) {
                var form = this.forms[i];
                var item = document.createElement('div');
                item.className = 'tp-blue-item' + (i === 0 ? ' active' : '');
                item.innerText = form.category + ' (' + form.inputs.length + ')';
                item.tabIndex = 0;
                (function(idx) {
                    item.onclick = function() { self.selectForm(idx); };
                    item.onkeydown = function(e) {
                        if (e.keyCode === 13) { self.selectForm(idx); e.preventDefault(); }
                        if (e.keyCode === 38 && idx > 0) { self.selectForm(idx-1); e.preventDefault(); }
                        if (e.keyCode === 40 && idx < self.forms.length-1) { self.selectForm(idx+1); e.preventDefault(); }
                        if (e.keyCode === 10009 || e.keyCode === 27) { self.toggle(); e.preventDefault(); e.stopPropagation(); }
                    };
                })(i);
                list.appendChild(item);
            }
            
            this.selectForm(0);
        },
        
        selectForm: function(idx) {
            if (idx < 0 || idx >= this.forms.length) return;
            this.selectedIdx = idx;
            
            var items = document.querySelectorAll('.tp-blue-item');
            for (var i = 0; i < items.length; i++) {
                items[i].className = (i === idx) ? 'tp-blue-item active' : 'tp-blue-item';
                if (i === idx) items[i].focus();
            }
            
            this.renderFormContent(this.forms[idx]);
        },
        
        renderFormContent: function(form) {
            var self = this;
            var content = document.getElementById('tp-blue-content');
            content.innerHTML = '';
            
            for (var i = 0; i < form.inputs.length; i++) {
                var orig = form.inputs[i];
                var wrapper = document.createElement('div');
                wrapper.style.marginBottom = '15px';
                var tagName = orig.tagName.toLowerCase();
                
                // Handle buttons
                if (tagName === 'button' || (tagName === 'input' && (orig.type === 'submit' || orig.type === 'button'))) {
                    var btn = document.createElement('button');
                    btn.className = 'tp-blue-btn';
                    btn.innerText = orig.textContent.trim() || orig.value || 'Submit';
                    btn.tabIndex = 0;
                    (function(o) {
                        btn.onclick = function() { o.click(); };
                        btn.onkeydown = function(e) {
                            if (e.keyCode === 13) { o.click(); e.preventDefault(); }
                            if (e.keyCode === 10009 || e.keyCode === 27) { self.toggle(); e.preventDefault(); }
                            if (e.keyCode === 38 || e.keyCode === 40) {
                                var els = Array.prototype.slice.call(content.querySelectorAll('.tp-blue-input, .tp-blue-btn'));
                                var idx = els.indexOf(btn);
                                if (e.keyCode === 38 && idx > 0) els[idx-1].focus();
                                if (e.keyCode === 40 && idx < els.length-1) els[idx+1].focus();
                                e.preventDefault();
                            }
                        };
                    })(orig);
                    wrapper.appendChild(btn);
                } 
                // Handle select/dropdown
                else if (tagName === 'select') {
                    var label = document.createElement('label');
                    label.className = 'tp-blue-label';
                    label.innerText = orig.name || orig.id || 'Select';
                    wrapper.appendChild(label);
                    
                    var select = document.createElement('select');
                    select.className = 'tp-blue-input';
                    select.tabIndex = 0;
                    for (var j = 0; j < orig.options.length; j++) {
                        var opt = document.createElement('option');
                        opt.value = orig.options[j].value;
                        opt.innerText = orig.options[j].text;
                        if (orig.options[j].selected) opt.selected = true;
                        select.appendChild(opt);
                    }
                    (function(o, s) {
                        s.onchange = function() { o.value = s.value; o.dispatchEvent(new Event('change')); };
                        s.onkeydown = function(e) {
                            if (e.keyCode === 10009 || e.keyCode === 27) { s.blur(); e.preventDefault(); }
                        };
                    })(orig, select);
                    wrapper.appendChild(select);
                } 
                // Handle text inputs, textareas, etc
                else {
                    var label = document.createElement('label');
                    label.className = 'tp-blue-label';
                    label.innerText = orig.placeholder || orig.name || orig.id || orig.type || 'Input';
                    wrapper.appendChild(label);
                    
                    var input = document.createElement(tagName === 'textarea' ? 'textarea' : 'input');
                    if (tagName !== 'textarea') input.type = orig.type === 'password' ? 'password' : 'text';
                    input.className = 'tp-blue-input';
                    input.placeholder = orig.placeholder || '';
                    input.value = orig.value || '';
                    input.tabIndex = 0;
                    if (tagName === 'textarea') { input.style.minHeight = '80px'; input.style.resize = 'vertical'; }
                    (function(o, inp, formEl) {
                        inp.oninput = function() { o.value = inp.value; o.dispatchEvent(new Event('input')); };
                        inp.onkeydown = function(e) {
                            if (e.keyCode === 13 && tagName !== 'textarea') { 
                                o.dispatchEvent(new Event('change')); 
                                // Find submit button in form
                                if (formEl) { 
                                    var s = formEl.querySelector('button[type="submit"], input[type="submit"], button:not([type])'); 
                                    if (s) {
                                        s.click();
                                    } else {
                                        // No button found - submit form directly and trigger Enter on original input
                                        formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                                        var enterEvent = new KeyboardEvent('keydown', { keyCode: 13, which: 13, bubbles: true });
                                        o.dispatchEvent(enterEvent);
                                    }
                                }
                            }
                            if (e.keyCode === 10009 || e.keyCode === 27) { inp.blur(); }
                            if (e.keyCode === 38 || e.keyCode === 40) {
                                var inputs = Array.prototype.slice.call(content.querySelectorAll('.tp-blue-input, .tp-blue-btn'));
                                var idx = inputs.indexOf(inp);
                                if (e.keyCode === 38 && idx > 0) inputs[idx-1].focus();
                                if (e.keyCode === 40 && idx < inputs.length-1) inputs[idx+1].focus();
                                e.preventDefault();
                            }
                        };
                    })(orig, input, form.formEl);
                    wrapper.appendChild(input);
                }
                
                content.appendChild(wrapper);
            }
            
            // Check if form has text inputs but no buttons - add Submit button
            var hasTextInputs = content.querySelector('input.tp-blue-input, textarea.tp-blue-input');
            var hasButtons = content.querySelector('.tp-blue-btn');
            if (hasTextInputs && !hasButtons && form.formEl) {
                var submitWrapper = document.createElement('div');
                submitWrapper.style.marginTop = '20px';
                var submitBtn = document.createElement('button');
                submitBtn.className = 'tp-blue-btn';
                submitBtn.innerText = '🔍 Submit';
                submitBtn.tabIndex = 0;
                (function(formEl) {
                    submitBtn.onclick = function() {
                        // Try to find a submit button in original form
                        var origSubmit = formEl.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
                        if (origSubmit) {
                            origSubmit.click();
                        } else {
                            // Submit the form directly
                            formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                            // Also try triggering Enter on the original input
                            var origInput = formEl.querySelector('input');
                            if (origInput) {
                                var enterEvent = new KeyboardEvent('keydown', { keyCode: 13, which: 13, bubbles: true });
                                origInput.dispatchEvent(enterEvent);
                            }
                        }
                    };
                    submitBtn.onkeydown = function(e) {
                        if (e.keyCode === 13) { submitBtn.click(); e.preventDefault(); }
                        if (e.keyCode === 10009 || e.keyCode === 27) { self.toggle(); e.preventDefault(); }
                        if (e.keyCode === 38) {
                            var els = Array.prototype.slice.call(content.querySelectorAll('.tp-blue-input, .tp-blue-btn'));
                            var idx = els.indexOf(submitBtn);
                            if (idx > 0) els[idx-1].focus();
                            e.preventDefault();
                        }
                    };
                })(form.formEl);
                submitWrapper.appendChild(submitBtn);
                content.appendChild(submitWrapper);
            }
            
            // Focus first input in content
            var firstInput = content.querySelector('.tp-blue-input, .tp-blue-btn');
            if (firstInput) setTimeout(function() { firstInput.focus(); }, 100);
        }
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
            
            // Blue button toggles BlueMenu (form sidebar)
            if (k===406) { 
                BlueMenu.toggle();
                e.preventDefault(); return; 
            } 
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
        click: function() { var el = document.elementFromPoint(this.x, this.y); if(el) { el.click(); el.focus(); } }
    };

    window.TP = { ui: UI, input: Input };
    var loaded = Config.load(); 
    var applied = Config.apply();
    var ready = function() { 
        // Ensure viewport is locked before any rendering
        if (window.TizenUtils && window.TizenUtils.lockViewport) {
            try { TizenUtils.lockViewport(); } catch(e) { console.error('lockViewport failed', e); }
        }
        UI.init(); 
        BlueMenu.init();
        Input.init(); 
        if(loaded && applied) { 
            UI.toast("TizenPortal 0566 - Ready"); 
        } else if(loaded && !applied) {
            UI.toast("Config Loaded - Apply Failed");
            tpHud('Payload loaded but apply failed');
        } else { 
            UI.toast("No Config"); 
            tpHud('No payload found'); 
        } 
    };
    if (document.body) ready(); else document.addEventListener('DOMContentLoaded', ready);
})();