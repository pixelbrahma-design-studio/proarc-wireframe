/* =========================================================
   PROARC Wireframe — Password Gate
   A simple full-screen password prompt shown before the page
   content. Meant to keep casual/uninvited visitors out of a
   draft link — this is NOT real security (the password lives in
   this file, visible to anyone who views the page source), so
   don't use it to protect anything sensitive.

   Place as the FIRST thing inside <body>, before any other
   content, so it covers the page before anything else renders:
     <body>
     <script src="auth-gate.js"></script>
     <header>...
   ========================================================= */
(function () {
  'use strict';

  var AUTH_KEY = 'proarc-wf-auth';
  var PASSWORD = 'Ajman#Skyline2026!';

  if (localStorage.getItem(AUTH_KEY) === '1') return;

  function showGate() {
    var style = document.createElement('style');
    style.textContent =
      '#wf-gate{position:fixed;inset:0;z-index:999999;background:#FFFFFF;display:flex;' +
      'align-items:center;justify-content:center;font-family:Arial,Helvetica,sans-serif;padding:20px;}' +
      '.wf-gate-box{border:1px solid #111111;padding:36px 32px;max-width:320px;width:100%;text-align:center;box-sizing:border-box;}' +
      '.wf-gate-logo{border:1px solid #D9D9D9;display:inline-block;padding:8px 14px;font-weight:700;font-size:16px;margin-bottom:18px;}' +
      '.wf-gate-box p{font-size:13px;color:#333333;margin-bottom:18px;line-height:1.6;}' +
      '#wf-gate-input{width:100%;border:1px solid #D9D9D9;padding:10px 12px;font-size:13px;margin-bottom:12px;box-sizing:border-box;font-family:inherit;}' +
      '#wf-gate-submit{width:100%;border:1px solid #111111;background:#111111;color:#FFFFFF;' +
      'padding:10px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;font-family:inherit;}' +
      '#wf-gate-submit:hover{opacity:.85;}' +
      '#wf-gate-error{font-size:11px;color:#B33A3A;margin-top:10px;min-height:14px;}';
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.id = 'wf-gate';
    overlay.innerHTML =
      '<div class="wf-gate-box">' +
      '<div class="wf-gate-logo">PROARC</div>' +
      '<p>This wireframe draft is password protected.<br>Enter the password to continue.</p>' +
      '<input type="password" id="wf-gate-input" placeholder="Password" autocomplete="off">' +
      '<button type="button" id="wf-gate-submit">Enter</button>' +
      '<div id="wf-gate-error"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = document.getElementById('wf-gate-input');
    var errorEl = document.getElementById('wf-gate-error');

    function tryUnlock() {
      if (input.value === PASSWORD) {
        localStorage.setItem(AUTH_KEY, '1');
        overlay.remove();
        style.remove();
      } else {
        errorEl.textContent = 'Incorrect password — try again.';
        input.value = '';
        input.focus();
      }
    }

    document.getElementById('wf-gate-submit').addEventListener('click', tryUnlock);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryUnlock(); });
    input.focus();
  }

  if (document.body) {
    showGate();
  } else {
    document.addEventListener('DOMContentLoaded', showGate);
  }
})();
