/* =========================================================
   PROARC Wireframe — Client Edit Mode
   Lets a client click into any text on the page, edit it,
   and export a standalone HTML file with their changes baked
   in. No backend — edits autosave to this browser only until
   exported. Drop this file next to any wireframe page and add:
     <script src="edit-mode.js" defer></script>
   right before </body>.
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_PREFIX = 'proarc-wf-draft:';
  var pageKey = STORAGE_PREFIX + (location.pathname.split('/').pop() || 'index');
  var editMode = false;
  var toolbarEl, bannerEl, statusEl, toggleBtn;

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
      '#wf-banner{position:fixed;top:0;left:0;right:0;z-index:99998;background:#111111;color:#FFFFFF;' +
      'font-size:12px;line-height:1.5;padding:10px 20px;display:flex;justify-content:space-between;' +
      'gap:16px;align-items:center;}' +
      '#wf-banner button{background:transparent;border:1px solid #FFFFFF;color:#FFFFFF;font-size:11px;' +
      'padding:6px 10px;cursor:pointer;text-transform:uppercase;letter-spacing:.03em;flex:none;}' +
      '#wf-banner button:hover{background:#FFFFFF;color:#111111;}' +
      '#wf-toolbar{position:fixed;bottom:20px;right:20px;z-index:99999;background:#FFFFFF;' +
      'border:1px solid #111111;box-shadow:0 4px 18px rgba(0,0,0,.18);padding:10px;' +
      'display:flex;gap:8px;align-items:center;flex-wrap:wrap;max-width:260px;}' +
      '#wf-toolbar button{font-family:inherit;font-size:11px;letter-spacing:.03em;text-transform:uppercase;' +
      'border:1px solid #111111;background:#FFFFFF;color:#111111;padding:9px 12px;cursor:pointer;}' +
      '#wf-toolbar button.primary{background:#111111;color:#FFFFFF;}' +
      '#wf-toolbar button.on{background:#B0AA8F;border-color:#B0AA8F;color:#FFFFFF;}' +
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
    msg.innerHTML = 'Editable draft — <b>' + pageLabel() + '</b>. Turn on <b>Edit Mode</b> (bottom-right) to click and change any text, then <b>Export Page</b> to download your changes and send the file back.';
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

    var exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.textContent = 'Export Page';
    exportBtn.addEventListener('click', exportPage);

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', function () {
      if (confirm('Discard your edits on this page and reload the original?')) {
        localStorage.removeItem(pageKey);
        location.reload();
      }
    });

    statusEl = document.createElement('div');
    statusEl.id = 'wf-status';
    statusEl.textContent = 'Not editing — click "Edit Mode" to start.';

    toolbarEl.appendChild(toggleBtn);
    toolbarEl.appendChild(exportBtn);
    toolbarEl.appendChild(resetBtn);
    toolbarEl.appendChild(statusEl);

    wrap.appendChild(bannerEl);
    wrap.appendChild(toolbarEl);
    document.body.appendChild(wrap);
  }

  function markEditables() {
    var seen = [];
    document.querySelectorAll(EDITABLE_SELECTOR).forEach(function (el) {
      if (el.closest(SKIP_SELECTOR)) return;
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

  var saveTimer;
  document.addEventListener('input', function (e) {
    if (!editMode) return;
    if (e.target.closest && e.target.closest('#wf-ui')) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 400);
  }, true);

  function cleanClone(root) {
    var ui = root.querySelector('#wf-ui');
    if (ui) ui.remove();
    root.querySelectorAll('[contenteditable]').forEach(function (n) { n.removeAttribute('contenteditable'); });
    root.querySelectorAll('.wf-editable').forEach(function (n) { n.classList.remove('wf-editable'); });
    return root;
  }

  function saveDraft() {
    var clone = cleanClone(document.body.cloneNode(true));
    localStorage.setItem(pageKey, clone.innerHTML);
    if (statusEl) {
      statusEl.textContent = 'Draft saved to this browser at ' + new Date().toLocaleTimeString() + '. Click Export when done.';
    }
  }

  function restoreDraft() {
    var saved = localStorage.getItem(pageKey);
    if (!saved) return false;
    document.body.innerHTML = saved;
    return true;
  }

  function exportPage() {
    var clone = cleanClone(document.documentElement.cloneNode(true));
    clone.querySelectorAll('style#wf-ui-style').forEach(function (n) { n.remove(); });
    clone.querySelectorAll('script[src*="edit-mode.js"]').forEach(function (n) { n.remove(); });

    var html = '<!DOCTYPE html>\n' + clone.outerHTML;
    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var base = (location.pathname.split('/').pop() || 'page').replace('.html', '');
    var link = document.createElement('a');
    link.href = url;
    link.download = base + '-client-edits.html';
    // Append inside #wf-ui, not document.body — the edit-mode link-blocker
    // (see the capture-phase click listener above) ignores clicks inside
    // #wf-ui, so this synthetic click still triggers the download even
    // while Edit Mode is on.
    document.getElementById('wf-ui').appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    if (statusEl) statusEl.textContent = 'Exported "' + link.download + '" — send this file back to update the site.';
  }

  function init() {
    injectStyles();
    var restored = restoreDraft();
    buildUI();
    markEditables();
    if (restored) statusEl.textContent = 'Restored your last saved draft on this browser.';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
