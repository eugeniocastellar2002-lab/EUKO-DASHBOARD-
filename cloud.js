/* EUKO · Nube (Firebase): ingreso con Google y sincronización entre dispositivos.
   Se carga en index.html (login) y en admin.html (panel). Si algo falla, el panel sigue funcionando en modo local.
   Los datos del panel (clientes, movimientos, tareas, metas y presupuestos) se guardan en Firestore bajo users/<tu uid>.
   Los soportes (fotos JPG/PNG y PDF) se guardan en Firestore en trozos (users/<uid>/files/<id>), así que no hace falta Firebase Storage ni plan de pago.
   La protección real está en las reglas de Firestore (solo tu cuenta de Google puede leer y escribir). */
(function () {
  'use strict';
  var FB = {
    apiKey: "AIzaSyAAIjMQ66vJeN6Dn3g2K7q6mtYmprYHKTQ",
    authDomain: "eukooficialgroup.firebaseapp.com",
    projectId: "eukooficialgroup",
    storageBucket: "eukooficialgroup.firebasestorage.app",
    messagingSenderId: "201859489284",
    appId: "1:201859489284:web:1c03dcad5a97620282df51"
  };
  var ALLOWED = 'euko.oficial@gmail.com';
  var BASE = (window.EUKO_FB_BASE || 'https://www.gstatic.com/firebasejs/10.12.2/');
  var CHUNK = 250000;              // caracteres por documento (el límite de Firestore es ~1 MB)
  var KEY = 'euko-cloud';

  /* ---------- carga del SDK ---------- */
  var sdkP = null;
  function load() {
    if (!sdkP) {
      sdkP = Promise.all([
        import(BASE + 'firebase-app.js'),
        import(BASE + 'firebase-auth.js'),
        import(BASE + 'firebase-firestore.js')
      ]).then(function (m) {
        var app = m[0].initializeApp(FB), A = m[1], F = m[2];
        var auth = A.initializeAuth(app, { persistence: [A.browserSessionPersistence], popupRedirectResolver: A.browserPopupRedirectResolver });
        return { app: app, A: A, F: F, auth: auth, db: F.getFirestore(app) };
      });
      sdkP.catch(function () { sdkP = null; });
    }
    return sdkP;
  }
  function lower(s) { return String(s || '').toLowerCase(); }

  /* ---------- ingreso con Google ---------- */
  function signInGoogle() {
    return load().then(function (s) {
      var p = new s.A.GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      return s.A.signInWithPopup(s.auth, p).then(function (r) {
        var u = r.user;
        if (!u || lower(u.email) !== ALLOWED || u.emailVerified === false) {
          return s.A.signOut(s.auth).then(function () { var e = new Error('unauthorized'); e.code = 'euko/unauthorized'; throw e; });
        }
        return { uid: u.uid, email: u.email, name: u.displayName || u.email };
      });
    });
  }
  function signOut() { return load().then(function (s) { return s.A.signOut(s.auth); }).catch(function () {}); }
  function waitUser(s) {
    return new Promise(function (res) {
      var un = s.A.onAuthStateChanged(s.auth, function (u) { un(); res(u); });
    });
  }

  /* ---------- estado local de la sincronización ---------- */
  function st() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function setSt(o) { var c = st(); for (var k in o) c[k] = o[k]; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  var DEVICE = (function () {
    try { var d = localStorage.getItem('euko-device'); if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem('euko-device', d); } return d; }
    catch (e) { return 'x' + Math.random().toString(36).slice(2, 6); }
  })();

  var api = null, S = null, ctx = null, timer = 0, pushing = false, seq = 0, unsub = null;
  function status(s, msg) { if (api && api.status) api.status(s, msg || ''); }

  /* ---------- soportes (archivos) ---------- */
  var FCHUNK = 600000, fp = null;   // caracteres base64 por documento
  function fdoc(id) { return S.F.doc(S.db, 'users', ctx.uid, 'files', id); }
  function fchunk(id, i) { return S.F.doc(S.db, 'users', ctx.uid, 'files', id, 'c', String(i)); }
  function toB64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1] || ''); };
      r.onerror = function () { rej(r.error); };
      r.readAsDataURL(blob);
    });
  }
  function fromB64(b64, mime) {
    var bin = atob(b64), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: mime });
  }
  function cloudHas(id) { return S.F.getDoc(fdoc(id)).then(function (m) { return m.exists() ? m.data() : null; }); }
  function upload(m, blob) {
    return toB64(blob).then(function (b64) {
      var n = Math.max(1, Math.ceil(b64.length / FCHUNK)), b = S.F.writeBatch(S.db), i;
      for (i = 0; i < n; i++) b.set(fchunk(m.id, i), { s: b64.slice(i * FCHUNK, (i + 1) * FCHUNK) });
      b.set(fdoc(m.id), { n: n, mime: m.mime, size: blob.size, name: m.name || '' });
      return b.commit();
    });
  }
  function download(m, d) {
    var jobs = [], i;
    for (i = 0; i < d.n; i++) jobs.push(S.F.getDoc(fchunk(m.id, i)));
    return Promise.all(jobs).then(function (cs) {
      var parts = [];
      for (i = 0; i < cs.length; i++) { if (!cs[i].exists()) throw new Error('incompleto'); parts.push(cs[i].data().s); }
      return api.fput(m.id, fromB64(parts.join(''), d.mime || m.mime));
    });
  }
  function removeCloud(id) {
    return cloudHas(id).then(function (d) {
      var b = S.F.writeBatch(S.db), i;
      if (d) for (i = 0; i < d.n; i++) b.delete(fchunk(id, i));
      b.delete(fdoc(id));
      return b.commit();
    });
  }
  /* Sube los soportes que solo están aquí, baja los que solo están en la nube y borra de la nube los quitados. */
  function syncFiles() {
    if (fp) return fp;
    if (!ctx || !ctx.ok || !ctx.linked || !api.fget || !api.fput) return Promise.resolve(false);
    var metas = (api.getState().files || []), ids = {}, up = (st().up || []).slice(), upSet = {}, got = false;
    metas.forEach(function (m) { ids[m.id] = 1; });
    up.forEach(function (id) { upSet[id] = 1; });
    var chain = Promise.resolve();
    metas.forEach(function (m) {
      if (upSet[m.id]) {
        chain = chain.then(function () {   // ya subido: si falta aquí el archivo, bajarlo
          return api.fget(m.id).then(function (b) {
            if (b) return;
            return cloudHas(m.id).then(function (d) { if (d) return download(m, d).then(function () { got = true; }); });
          }).catch(function () {});
        });
        return;
      }
      chain = chain.then(function () {
        return api.fget(m.id).then(function (blob) {
          return cloudHas(m.id).then(function (d) {
            if (d) { up.push(m.id); if (!blob) return download(m, d).then(function () { got = true; }); return; }
            if (blob) return upload(m, blob).then(function () { up.push(m.id); });
          });
        }).catch(function () {});
      });
    });
    up.slice().forEach(function (id) {
      if (ids[id]) return;
      chain = chain.then(function () {
        return removeCloud(id).then(function () { up.splice(up.indexOf(id), 1); }).catch(function () {});
      });
    });
    fp = chain.then(function () { setSt({ up: up }); fp = null; if (got && api.filesReady) api.filesReady(); return true; },
      function () { fp = null; return false; });
    return fp;
  }

  /* ---------- leer y escribir en la nube ---------- */
  function readCloud() {
    var ref = S.F.doc(S.db, 'users', ctx.uid);
    return S.F.getDoc(ref).then(function (m) {
      if (!m.exists()) return null;
      var d = m.data(), n = +d.n || 0, jobs = [];
      for (var i = 0; i < n; i++) jobs.push(S.F.getDoc(S.F.doc(S.db, 'users', ctx.uid, 'chunks', String(i))));
      return Promise.all(jobs).then(function (cs) {
        var parts = [];
        for (var j = 0; j < cs.length; j++) { if (!cs[j].exists()) throw new Error('Datos incompletos en la nube'); parts.push(cs[j].data().s); }
        return { rev: +d.rev || 0, device: d.device || '', n: n, json: parts.join('') };
      });
    });
  }
  function pull(cloud) {
    var o; try { o = JSON.parse(cloud.json); } catch (e) { throw new Error('Los datos de la nube no son válidos'); }
    api.apply(o);
    ctx.n = cloud.n;
    setSt({ rev: cloud.rev, dirty: false, uid: ctx.uid, linked: true });
    if (ctx.linked) syncFiles();
  }
  function push() {
    if (!ctx || !ctx.ok || !ctx.linked) return Promise.resolve();
    if (pushing) return Promise.resolve();
    pushing = true;
    return syncFiles().catch(function () {}).then(doPush);
  }
  function doPush() {
    var mySeq = seq, json = JSON.stringify(api.getState()), chunks = [], i;
    for (i = 0; i < json.length; i += CHUNK) chunks.push(json.slice(i, i + CHUNK));
    if (!chunks.length) chunks.push('{}');
    var rev = Date.now(), b = S.F.writeBatch(S.db), oldN = ctx.n || 0;
    chunks.forEach(function (s, k) { b.set(S.F.doc(S.db, 'users', ctx.uid, 'chunks', String(k)), { s: s }); });
    for (i = chunks.length; i < oldN; i++) b.delete(S.F.doc(S.db, 'users', ctx.uid, 'chunks', String(i)));
    b.set(S.F.doc(S.db, 'users', ctx.uid), { rev: rev, n: chunks.length, device: DEVICE, email: ctx.email, v: 1 });
    return b.commit().then(function () {
      ctx.n = chunks.length;
      setSt({ rev: rev, uid: ctx.uid, linked: true, dirty: mySeq !== seq });
      pushing = false;
      if (mySeq !== seq) { schedule(300); status('pending'); } else status('synced');
    }).catch(function (e) {
      pushing = false;
      status('error', (e && e.code === 'permission-denied') ? 'La nube rechazó el acceso (revisa las reglas de Firestore)' : 'Sin conexión: se subirá cuando vuelva');
    });
  }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(push, ms); }
  function changed() {
    if (!ctx || !ctx.ok || !ctx.linked) return;
    seq++; setSt({ dirty: true }); status('pending'); schedule(1500);
  }

  /* ---------- arranque ---------- */
  function subscribe() {
    if (unsub) return;
    unsub = S.F.onSnapshot(S.F.doc(S.db, 'users', ctx.uid), function (snap) {
      if (!snap.exists()) return;
      var d = snap.data(), c = st();
      if (d.device === DEVICE || (+d.rev || 0) <= (c.rev || 0) || c.dirty || pushing) return;
      readCloud().then(function (cloud) {
        if (!cloud || cloud.rev <= (st().rev || 0) || st().dirty) return;
        pull(cloud); status('synced'); if (api.notify) api.notify('Datos actualizados desde otro dispositivo');
      }).catch(function () {});
    }, function () {});
  }
  function start(a) {
    api = a; status('connecting');
    return load().then(function (s) {
      S = s;
      return waitUser(s);
    }).then(function (u) {
      if (!u || lower(u.email) !== ALLOWED) { status('off', 'login'); return false; }
      ctx = { ok: true, uid: u.uid, email: u.email, linked: false, n: 0 };
      var c = st(), linked = c.uid === u.uid && c.linked;
      return readCloud().then(function (cloud) {
        if (cloud) ctx.n = cloud.n;
        var fin = function () { ctx.linked = true; subscribe(); window.addEventListener('online', function () { if (st().dirty) schedule(500); else syncFiles(); }); syncFiles(); return true; };
        if (!linked) {
          if (!cloud) { ctx.linked = true; setSt({ linked: true, uid: u.uid, rev: 0, dirty: false }); return api.hasData() ? push().then(fin) : fin(); }
          if (!api.hasData()) { pull(cloud); return fin(); }
          return api.choose('first').then(function (ch) {
            if (ch === 'cloud') { pull(cloud); return fin(); }
            if (ch === 'local') { ctx.linked = true; setSt({ linked: true, uid: u.uid, rev: 0, dirty: true }); return push().then(fin); }
            ctx.ok = false; status('off', 'cancel'); return false;
          });
        }
        if (cloud && cloud.rev > (c.rev || 0)) {
          if (c.dirty) {
            return api.choose('conflict').then(function (ch) {
              if (ch === 'cloud') { pull(cloud); return fin(); }
              if (ch === 'local') { ctx.linked = true; return push().then(fin); }
              ctx.ok = false; status('off', 'cancel'); return false;
            });
          }
          pull(cloud); return fin();
        }
        if (c.dirty) { ctx.linked = true; return push().then(fin); }
        return fin();
      });
    }).then(function (ok) { if (ok) status('synced'); return ok; })
      .catch(function (e) { status('error', 'No se pudo conectar con la nube'); return false; });
  }
  function syncNow() {
    if (!ctx || !ctx.ok) return start(api);
    return readCloud().then(function (cloud) {
      if (cloud && cloud.rev > (st().rev || 0) && !st().dirty) { pull(cloud); status('synced'); return; }
      setSt({ dirty: true }); seq++; return push();
    }).catch(function () { status('error', 'Sin conexión'); });
  }
  function flush() { if (ctx && ctx.ok && ctx.linked && st().dirty && !pushing) { clearTimeout(timer); push(); } }
  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
  window.addEventListener('pagehide', flush);

  window.EUKOCloud = { allowed: ALLOWED, signInGoogle: signInGoogle, signOut: signOut, start: start, changed: changed, syncNow: syncNow };
})();
