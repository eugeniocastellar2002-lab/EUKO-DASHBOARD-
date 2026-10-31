/* EUKO · Sesión del panel
   1) Protege el panel: si no hay sesión válida, vuelve al login.
   2) Cierra la sesión tras un tiempo sin actividad (con aviso previo).
   3) Agrega el botón de perfil con el nombre del usuario y "Cerrar sesión".
   Se carga en admin.html ANTES de index1.js. */
(function () {
  'use strict';

  /* ===== AJUSTES ===== */
  var CFG = {
    KEY: 'euko-auth',     // clave donde index.html guarda la sesión
    LOGIN: 'index.html',  // página de inicio de sesión
    IDLE_MIN: 15,         // minutos sin actividad antes de cerrar la sesión
    WARN_SEC: 60,         // segundos de aviso antes de cerrar
    MAX_HOURS: 8          // duración máxima de una sesión, haya actividad o no
  };

  /* ===== SESIÓN ===== */
  function read() {
    try {
      var s = JSON.parse(sessionStorage.getItem(CFG.KEY) || 'null');
      return s && typeof s === 'object' && s.t ? s : null;
    } catch (e) { return null; }
  }
  function write(s) { try { sessionStorage.setItem(CFG.KEY, JSON.stringify(s)); } catch (e) {} }
  function expired(s) {
    var now = Date.now();
    return now - s.t > CFG.MAX_HOURS * 3600e3 || now - (s.a || s.t) > CFG.IDLE_MIN * 60e3;
  }
  function leave(reason) {
    try { sessionStorage.removeItem(CFG.KEY); } catch (e) {}
    document.documentElement.style.display = 'none';
    location.replace(CFG.LOGIN + (reason ? '?s=' + reason : ''));
  }

  /* ===== GUARDIA: se ejecuta antes de dibujar el panel ===== */
  var ses = read();
  if (!ses) { leave(''); return; }
  if (expired(ses)) { leave('expirada'); return; }

  /* La página vuelve desde el historial (botón Atrás) después de cerrar sesión */
  addEventListener('pageshow', function (e) {
    var s = read();
    if (e.persisted && (!s || expired(s))) leave('');
  });

  /* ===== ACTIVIDAD E INACTIVIDAD ===== */
  var last = Date.now(), lastSave = 0, warnOpen = false;
  ses.a = last; write(ses); lastSave = last;

  function touch() {
    if (warnOpen) return;
    var n = Date.now(); last = n;
    if (n - lastSave > 5000) {
      lastSave = n;
      var s = read();
      if (s) { s.a = n; write(s); }
    }
  }
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(function (ev) {
    addEventListener(ev, touch, { passive: true, capture: true });
  });

  function tick() {
    var s = read();
    if (!s) { leave(''); return; }
    var now = Date.now();
    if (now - s.t > CFG.MAX_HOURS * 3600e3) { leave('expirada'); return; }
    var left = CFG.IDLE_MIN * 60e3 - (now - last);
    if (left <= 0) { leave('expirada'); return; }
    if (left <= CFG.WARN_SEC * 1000) showWarn(Math.ceil(left / 1000));
    else if (warnOpen) hideWarn();
  }
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });

  /* ===== ESTILOS ===== */
  var css = [
    '.pf-btn{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px 0 5px;border-radius:999px;',
    'background:var(--g1,rgba(255,255,255,.1));border:1px solid var(--gb,rgba(255,255,255,.17));',
    'color:var(--fg,#ecfbf6);font:600 13px var(--f-b,system-ui,sans-serif);cursor:pointer;',
    '-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);transition:transform .2s,background .2s}',
    '.pf-btn:hover{transform:translateY(-1px)}',
    '.pf-btn:focus-visible,.pf-item:focus-visible,.sw-btn:focus-visible{outline:2px solid var(--mint,#5bf0c1);outline-offset:2px}',
    '.pf-av{width:30px;height:30px;flex:none;border-radius:50%;display:grid;place-items:center;',
    'background:linear-gradient(135deg,var(--mint,#5bf0c1),var(--mint2,#1fc79a));color:var(--ink,#042a20);',
    'font:700 13px var(--f-d,system-ui,sans-serif)}',
    '.pf-nm{max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.pf-chev{width:14px;height:14px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:.7}',
    '@media(max-width:720px){.pf-nm,.pf-chev{display:none}.pf-btn{padding:0 5px}}',
    '.pf-menu{position:fixed;z-index:80;width:250px;max-width:calc(100vw - 24px);padding:8px;border-radius:18px;',
    'background:var(--bg2,#0a1a16);border:1px solid var(--line,rgba(255,255,255,.12));color:var(--fg,#ecfbf6);',
    'box-shadow:var(--shadow,0 24px 60px -24px rgba(0,0,0,.65));font-family:var(--f-b,system-ui,sans-serif);',
    'opacity:0;transform:translateY(-6px) scale(.98);pointer-events:none;transition:opacity .15s,transform .15s}',
    '.pf-menu.open{opacity:1;transform:none;pointer-events:auto}',
    '.pf-head{display:flex;gap:12px;align-items:center;padding:10px 10px 12px;border-bottom:1px solid var(--line,rgba(255,255,255,.12));margin-bottom:6px}',
    '.pf-head .pf-av{width:42px;height:42px;font-size:17px}',
    '.pf-who{min-width:0}',
    '.pf-who b{display:block;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.pf-who span{display:block;font-size:12px;color:var(--fg3,rgba(236,251,246,.55));margin-top:2px}',
    '.pf-item{display:flex;align-items:center;gap:10px;width:100%;padding:11px 10px;border:0;border-radius:12px;',
    'background:transparent;color:var(--bad,#ff8a94);font:600 14px var(--f-b,system-ui,sans-serif);cursor:pointer;text-align:left}',
    '.pf-item:hover{background:var(--mint-soft,rgba(91,240,193,.12))}',
    '.pf-item svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.sw-wrap{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;',
    'background:rgba(2,10,8,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
    '.sw-card{width:min(380px,100%);padding:24px;border-radius:22px;background:var(--bg2,#0a1a16);',
    'border:1px solid var(--line,rgba(255,255,255,.12));color:var(--fg,#ecfbf6);text-align:center;',
    'box-shadow:var(--shadow,0 24px 60px -24px rgba(0,0,0,.65));font-family:var(--f-b,system-ui,sans-serif)}',
    '.sw-card h2{margin:0 0 8px;font:700 18px var(--f-d,system-ui,sans-serif)}',
    '.sw-card p{margin:0 0 18px;font-size:14px;line-height:1.5;color:var(--fg2,rgba(236,251,246,.72))}',
    '.sw-card p b{color:var(--fg,#ecfbf6);font-variant-numeric:tabular-nums}',
    '.sw-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}',
    '.sw-btn{padding:11px 18px;border-radius:999px;border:1px solid var(--line,rgba(255,255,255,.2));',
    'background:transparent;color:var(--fg,#ecfbf6);font:600 14px var(--f-b,system-ui,sans-serif);cursor:pointer}',
    '.sw-btn.pri{border:0;background:linear-gradient(135deg,var(--mint,#5bf0c1),var(--mint2,#1fc79a));color:var(--ink,#042a20)}'
  ].join('');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ===== AVISO DE INACTIVIDAD ===== */
  var warnEl = null, warnSecs = null, prevFocus = null;
  function showWarn(sec) {
    if (!warnOpen) {
      warnOpen = true;
      prevFocus = document.activeElement;
      warnEl = document.createElement('div');
      warnEl.className = 'sw-wrap';
      warnEl.innerHTML =
        '<div class="sw-card" role="alertdialog" aria-modal="true" aria-labelledby="sw-t" aria-describedby="sw-d">' +
        '<h2 id="sw-t">¿Sigues ahí?</h2>' +
        '<p id="sw-d">Por seguridad, tu sesión se cerrará en <b id="sw-s"></b> s por inactividad.</p>' +
        '<div class="sw-row"><button type="button" class="sw-btn" id="sw-out">Cerrar sesión</button>' +
        '<button type="button" class="sw-btn pri" id="sw-stay">Seguir conectado</button></div></div>';
      document.body.appendChild(warnEl);
      warnSecs = warnEl.querySelector('#sw-s');
      warnEl.querySelector('#sw-stay').addEventListener('click', stay);
      warnEl.querySelector('#sw-out').addEventListener('click', logout);
      warnEl.querySelector('#sw-stay').focus();
    }
    if (warnSecs) warnSecs.textContent = sec;
  }
  function hideWarn() {
    warnOpen = false;
    if (warnEl) { warnEl.remove(); warnEl = null; }
    if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} }
  }
  function stay() {
    hideWarn();
    last = Date.now(); lastSave = last;
    var s = read();
    if (s) { s.a = last; write(s); }
  }

  function logout() { leave('salio'); }

  /* ===== BOTÓN DE PERFIL ===== */
  function buildProfile() {
    var top = document.querySelector('.top');
    if (!top || document.getElementById('profilebtn')) return;

    var name = String(ses.name || 'Usuario').trim() || 'Usuario';
    var ini = name.charAt(0).toUpperCase();
    var since = new Date(ses.t);
    var hh = String(since.getHours()).padStart(2, '0') + ':' + String(since.getMinutes()).padStart(2, '0');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'profilebtn';
    btn.className = 'pf-btn';
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Mi perfil: ' + name);
    var av = document.createElement('span'); av.className = 'pf-av'; av.textContent = ini;
    var nm = document.createElement('span'); nm.className = 'pf-nm'; nm.textContent = name;
    btn.appendChild(av); btn.appendChild(nm);
    btn.insertAdjacentHTML('beforeend', '<svg class="pf-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>');
    top.appendChild(btn);

    var menu = document.createElement('div');
    menu.className = 'pf-menu';
    menu.setAttribute('role', 'menu');
    var head = document.createElement('div'); head.className = 'pf-head';
    var av2 = document.createElement('span'); av2.className = 'pf-av'; av2.textContent = ini;
    var who = document.createElement('div'); who.className = 'pf-who';
    var b = document.createElement('b'); b.textContent = name;
    var r = document.createElement('span'); r.textContent = 'Administrador';
    var d = document.createElement('span'); d.textContent = 'Sesión iniciada a las ' + hh;
    who.appendChild(b); who.appendChild(r); who.appendChild(d);
    head.appendChild(av2); head.appendChild(who);
    var out = document.createElement('button');
    out.type = 'button'; out.className = 'pf-item'; out.setAttribute('role', 'menuitem');
    out.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="m16 8 4 4-4 4"/><path d="M20 12H9"/></svg><span>Cerrar sesión</span>';
    menu.appendChild(head); menu.appendChild(out);
    document.body.appendChild(menu);

    function place() {
      var rc = btn.getBoundingClientRect();
      menu.style.top = (rc.bottom + 8) + 'px';
      menu.style.right = Math.max(12, innerWidth - rc.right) + 'px';
    }
    function open() { place(); menu.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); out.focus(); }
    function close(focusBtn) {
      menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.contains('open') ? close(false) : open();
    });
    out.addEventListener('click', logout);
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && e.target !== btn) close(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) close(true);
    });
    addEventListener('resize', function () { if (menu.classList.contains('open')) place(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildProfile);
  else buildProfile();
})();
