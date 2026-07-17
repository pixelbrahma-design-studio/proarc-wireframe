# Proarc Website Wireframe

Low-fidelity, real-content wireframe for the Proarc website (7 pages) — [index.html](index.html) is the package landing page linking to all of them.

## Hosting it for the client (GitHub Pages)

1. Push this folder to a GitHub repo.
2. In the repo, go to **Settings → Pages**, set Source to your default branch, root folder.
3. GitHub gives you a URL like `https://<username>.github.io/<repo>/` — send that link to the client. `index.html` is the entry point.

## How the client edits content

Every page (except `index.html`) loads [edit-mode.js](edit-mode.js), which adds a small toolbar (bottom-right):

1. **Edit Mode: Off/On** — turn it on, then click any headline, paragraph, list item, button label, nav link, or footer detail to edit it in place. Links won't navigate while Edit Mode is on, so clicking is safe.
2. **Save** — writes the current edits to a shared Firebase Realtime Database. Nothing is saved until this is clicked; the status line says "Unsaved changes" until then, and the browser will warn before leaving the page if there's anything unsaved.
3. **Anyone opening that page afterwards — any device, any browser — sees the saved changes**, fetched from Firebase on page load.
4. **Reset** — deletes the saved version from Firebase (for everyone) and reloads the original page.

If Firebase can't be reached (offline, blocked, etc.), it falls back to saving in that browser's own `localStorage` only, and says so in the status line.

### Firebase setup (already done, for reference)

- Project: `proarc-wireframe` on [console.firebase.google.com](https://console.firebase.google.com), Realtime Database, region as chosen at creation.
- Config lives directly in `edit-mode.js` (`FIREBASE_CONFIG`) — this is a public client key, safe to have in the JS source, not a secret.
- Data is stored at `pages/<filename>` (e.g. `pages/home_html`) as `{ html, savedAt }`.
- **Database rules are currently in "test mode," which stops allowing reads/writes ~30 days after creation.** Before that happens, go to the Realtime Database → **Rules** tab and set:
  ```json
  { "rules": { ".read": true, ".write": true } }
  ```
  then **Publish**. Note this makes the database fully open (anyone with the project's `databaseURL` could read/write it directly, bypassing the site) — acceptable for this kind of low-stakes wireframe content, but worth knowing.

## Password protection

All 8 pages load [auth-gate.js](auth-gate.js), which shows a full-screen password prompt (current password: `pixelbrahma123`) before revealing the page. Once entered correctly on a device/browser, it's remembered there (`localStorage`) and won't ask again.

**This is a soft gate, not real security** — the password is plain text in `auth-gate.js`, visible to anyone who views the page source. It's meant to keep casual/uninvited visitors out of a draft link, not to protect sensitive information. To change the password, edit the `PASSWORD` value in `auth-gate.js`.

## Files

- `index.html` — wireframe package index (not editable, just links to the 7 pages)
- `home.html`, `about.html`, `services.html`, `projects.html`, `case-studies.html`, `careers.html`, `contact.html` — the wireframe pages
- `styles.css` — shared styling for all pages
- `edit-mode.js` — the in-browser edit toolbar, saves to Firebase (falls back to `localStorage` if offline), shared by all 7 wireframe pages
- `auth-gate.js` — the password prompt, shared by all 8 pages
