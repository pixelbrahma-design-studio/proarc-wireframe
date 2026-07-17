/* =========================================================
   PROARC Wireframe — Client Edit Mode
   Lets someone click into any text on the page and edit it.
   Clicking Save writes the changes to a shared Firebase Realtime
   Database, so anyone opening the same page on any device/browser
   sees the latest saved content. Falls back to this browser's own
   storage if Firebase can't be reached. Drop this file next to any
   wireframe page and add:
     <script src="edit-mode.js" defer></script>
   right before </body>.
   ========================================================= */
(function () {
  'use strict';

  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyCZeaQ_Vuly35Gj9MGmgWWwMGG3rx82UOw",
    authDomain: "proarc-wireframe.firebaseapp.com",
    databaseURL: "https://proarc-wireframe-default-rtdb.firebaseio.com",
    projectId: "proarc-wireframe",
    storageBucket: "proarc-wireframe.firebasestorage.app",
    messagingSenderId: "468165231065",
    appId: "1:468165231065:web:689c279b0cb4c4cf0799c8"
  };
  var FIREBASE_SDK_VERSION = '10.12.2';

  var STORAGE_PREFIX = 'proarc-wf-draft:';
  var pageKey = STORAGE_PREFIX + (location.pathname.split('/').pop() || 'index');
  var dbPath = 'pages/' + (location.pathname.split('/').pop() || 'index').replace(/[.#$/\[\]]/g, '_');
  var editMode = false;
  var toolbarEl, bannerEl, statusEl, toggleBtn, saveBtn;
  var db = null; // set once Firebase has loaded and initialized successfully

  var EDITABLE_SELECTOR = [
    'h1', 'h2', 'h3', 'h4', 'p', 'li', 'b',
    '.tag', '.num', '.opt', '.status', '.title-overlay', '.big-num',
    '.foot-logo', '.logo-block', '.btn', '.pkg-card',
    '.nav-links a', '.foot-col a', '.foot-bottom span',
    'td', '.placeholder'
  ].join(',');

  var SKIP_SELECTOR = '#wf-ui, .section-label, .section-note, .warn';

  function injectStyles() {
    var css =
      '#wf-ui{font-family:Arial,Helvetica,sans-serif;}' +
      '#wf-banner{position:relative;background:#111111;color:#FFFFFF;' +
      'font-size:12px;line-height:1.5;padding:10px 16px;display:flex;flex-wrap:wrap;justify-content:space-between;' +
      'gap:10px;align-items:center;}' +
      '#wf-banner button{background:transparent;border:1px solid #FFFFFF;color:#FFFFFF;font-size:11px;' +
      'padding:6px 10px;cursor:pointer;text-transform:uppercase;letter-spacing:.03em;flex:none;}' +
      '#wf-banner button:hover{background:#FFFFFF;color:#111111;}' +
      '#wf-toolbar{position:fixed;bottom:14px;right:14px;left:14px;z-index:99999;background:#FFFFFF;' +
      'border:1px solid #111111;box-shadow:0 4px 18px rgba(0,0,0,.18);padding:10px;' +
      'display:flex;gap:8px;align-items:center;flex-wrap:wrap;max-width:280px;margin-left:auto;}' +
      '@media (max-width:520px){#wf-toolbar{max-width:none;left:14px;right:14px;}' +
      '#wf-toolbar button{flex:1 1 auto;}}' +
      '#wf-toolbar button{font-family:inherit;font-size:11px;letter-spacing:.03em;text-transform:uppercase;' +
      'border:1px solid #111111;background:#FFFFFF;color:#111111;padding:9px 12px;cursor:pointer;}' +
      '#wf-toolbar button.primary{background:#111111;color:#FFFFFF;}' +
      '#wf-toolbar button.on{background:#B0AA8F;border-color:#B0AA8F;color:#FFFFFF;}' +
      '#wf-toolbar button.save.dirty{background:#111111;border-color:#111111;color:#FFFFFF;}' +
      '#wf-toolbar button:hover{opacity:.85;}' +
      '#wf-status{font-size:10px;color:#8C8C8C;width:100%;line-height:1.4;}' +
      '.wf-editable[contenteditable="true"]{outline:1px dashed transparent;outline-offset:2px;cursor:text;}' +
      '.wf-editable[contenteditable="true"]:hover{outline-color:#B0AA8F;}' +
      '.wf-editable[contenteditable="true"]:focus{outline:2px solid #B0AA8F;background:#FFFDF6;}';
    var style = document.createElement('style');
    style.id = 'wf-ui-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function pageLabel() {
    var parts = document.title.split('—');
    return (parts[1] || document.title).trim();
  }

  function buildUI() {
    var wrap = document.createElement('div');
    wrap.id = 'wf-ui';

    bannerEl = document.createElement('div');
    bannerEl.id = 'wf-banner';
    var msg = document.createElement('span');
    msg.innerHTML = 'Editable draft — <b>' + pageLabel() + '</b>. Turn on <b>Edit Mode</b> (bottom-right), click any text to change it, then hit <b>Save</b> — anyone opening this page afterwards will see your changes.';
    var dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.textContent = 'Got it';
    dismiss.addEventListener('click', function () { bannerEl.remove(); });
    bannerEl.appendChild(msg);
    bannerEl.appendChild(dismiss);

    toolbarEl = document.createElement('div');
    toolbarEl.id = 'wf-toolbar';

    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'primary';
    toggleBtn.textContent = 'Edit Mode: Off';
    toggleBtn.addEventListener('click', function () { setEditMode(!editMode); });

    saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'save';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', function () {
      saveDraft();
      setDirty(false);
    });

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', function () {
      if (confirm('Discard the saved changes on this page for everyone and reload the original?')) {
        discardDraft();
        location.reload();
      }
    });

    statusEl = document.createElement('div');
    statusEl.id = 'wf-status';
    statusEl.textContent = 'Not editing — click "Edit Mode" to start.';

    toolbarEl.appendChild(toggleBtn);
    toolbarEl.appendChild(saveBtn);
    toolbarEl.appendChild(resetBtn);
    toolbarEl.appendChild(statusEl);

    wrap.appendChild(bannerEl);
    wrap.appendChild(toolbarEl);
    // Insert as the FIRST element in body (not appended at the end) so the
    // in-flow banner pushes the real header down instead of covering it.
    // #wf-toolbar is position:fixed, so its place in the DOM doesn't affect
    // where it renders — it still floats bottom-right regardless of nesting.
    document.body.insertBefore(wrap, document.body.firstChild);
  }

  function markEditables() {
    var seen = [];
    document.querySelectorAll(EDITABLE_SELECTOR).forEach(function (el) {
      if (el.closest(SKIP_SELECTOR)) return;
      // A page-hero placeholder with a .title-overlay inside it mixes real
      // page copy (the title) with instructional wireframe notes (the rest
      // of the placeholder text). Don't make the whole box one editable
      // region — that lets selecting/retyping the title wipe out the notes
      // too. Skip the placeholder itself so .title-overlay gets its own
      // separate editable region instead, further down this same pass.
      if (el.matches('.placeholder') && el.querySelector('.title-overlay')) return;
      var nested = seen.some(function (s) { return s !== el && s.contains(el); });
      if (nested) return;
      el.classList.add('wf-editable');
      seen.push(el);
    });
  }

  function setEditMode(on) {
    editMode = on;
    document.querySelectorAll('.wf-editable').forEach(function (el) {
      el.setAttribute('contenteditable', on ? 'true' : 'false');
    });
    toggleBtn.textContent = 'Edit Mode: ' + (on ? 'On' : 'Off');
    toggleBtn.classList.toggle('on', on);
    statusEl.textContent = on
      ? 'Editing on — click any highlighted text to change it. Links won’t navigate while editing.'
      : 'Not editing — click "Edit Mode" to start.';
  }

  // While editing, clicking a link should place the cursor, not navigate.
  document.addEventListener('click', function (e) {
    if (!editMode) return;
    var a = e.target.closest('a');
    if (a && !a.closest('#wf-ui')) e.preventDefault();
  }, true);

  var dirty = false;
  function setDirty(on) {
    dirty = on;
    if (saveBtn) saveBtn.classList.toggle('dirty', on);
  }

  document.addEventListener('input', function (e) {
    if (!editMode) return;
    if (e.target.closest && e.target.closest('#wf-ui')) return;
    setDirty(true);
    if (statusEl) statusEl.textContent = 'Unsaved changes — click "Save" to keep them.';
  }, true);

  // Warn before leaving/refreshing with edits that haven't been saved yet.
  window.addEventListener('beforeunload', function (e) {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });

  function cleanClone(root) {
    var ui = root.querySelector('#wf-ui');
    if (ui) ui.remove();
    root.querySelectorAll('[contenteditable]').forEach(function (n) { n.removeAttribute('contenteditable'); });
    root.querySelectorAll('.wf-editable').forEach(function (n) { n.classList.remove('wf-editable'); });
    return root;
  }

  function saveDraft() {
    var html = cleanClone(document.body.cloneNode(true)).innerHTML;
    // Always keep a local copy too, as an offline fallback.
    try { localStorage.setItem(pageKey, html); } catch (e) { /* ignore quota/private-mode errors */ }

    if (!db) {
      if (statusEl) statusEl.textContent = 'Saved to this browser only — cloud sync is unavailable right now.';
      return;
    }
    db.ref(dbPath).set({ html: html, savedAt: firebase.database.ServerValue.TIMESTAMP })
      .then(function () {
        if (statusEl) statusEl.textContent = 'Saved at ' + new Date().toLocaleTimeString() + ' — visible to anyone opening this page.';
      })
      .catch(function (err) {
        console.error('Firebase save failed:', err);
        if (statusEl) statusEl.textContent = 'Cloud save failed — kept a copy in this browser only. Check your connection and try again.';
      });
  }

  function discardDraft() {
    setDirty(false);
    try { localStorage.removeItem(pageKey); } catch (e) { /* ignore */ }
    if (db) db.ref(dbPath).remove().catch(function (err) { console.error('Firebase remove failed:', err); });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function initFirebase() {
    var base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_SDK_VERSION + '/';
    return loadScript(base + 'firebase-app-compat.js')
      .then(function () { return loadScript(base + 'firebase-database-compat.js'); })
      .then(function () {
        firebase.initializeApp(FIREBASE_CONFIG);
        db = firebase.database();
      });
  }

  // Try the shared cloud copy first (so everyone sees the same content);
  // fall back to this browser's own local copy if Firebase is unreachable.
  function fetchSavedHtml() {
    return initFirebase()
      .then(function () { return db.ref(dbPath).once('value'); })
      .then(function (snap) {
        var val = snap.val();
        return val && val.html ? { html: val.html, source: 'cloud' } : null;
      })
      .catch(function (err) {
        console.error('Firebase unavailable, falling back to local storage:', err);
        db = null;
        var local = null;
        try { local = localStorage.getItem(pageKey); } catch (e) { /* ignore */ }
        return local ? { html: local, source: 'local' } : null;
      });
  }

  function init() {
    injectStyles();
    fetchSavedHtml().then(function (result) {
      if (result) document.body.innerHTML = result.html;
      buildUI();
      markEditables();
      if (result && result.source === 'cloud') {
        statusEl.textContent = 'Showing the latest saved version.';
      } else if (result && result.source === 'local') {
        statusEl.textContent = 'Cloud sync unavailable — showing a version saved in this browser only.';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
