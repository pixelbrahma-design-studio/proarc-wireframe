# Proarc Website Wireframe

Low-fidelity, real-content wireframe for the Proarc website (7 pages) — [index.html](index.html) is the package landing page linking to all of them.

## Hosting it for the client (GitHub Pages)

1. Push this folder to a GitHub repo.
2. In the repo, go to **Settings → Pages**, set Source to your default branch, root folder.
3. GitHub gives you a URL like `https://<username>.github.io/<repo>/` — send that link to the client. `index.html` is the entry point.

## How the client edits content

Every page (except `index.html`) loads [edit-mode.js](edit-mode.js), which adds a small toolbar (bottom-right):

1. **Edit Mode: Off/On** — turn it on, then click any headline, paragraph, list item, button label, nav link, or footer detail to edit it in place. Links won't navigate while Edit Mode is on, so clicking is safe.
2. **Save** — writes the current edits to the browser (`localStorage`). Nothing is saved until this is clicked; the status line says "Unsaved changes" until then, and the browser will warn before leaving the page if there's anything unsaved.
3. Refreshing (or closing and reopening) that page in the **same browser** automatically restores whatever was last saved — no download, no file to send.
4. **Reset** — clears the saved draft and reloads the original page, in case they want to start over.

There's no backend or database involved, and nothing is exported or sent anywhere. Saved changes live only in `localStorage` **on the device/browser they were made in** — they won't appear if the page is opened on a different device, a different browser, or in incognito/private mode, and they're lost if that browser's site data is cleared. **Cross-device sync (everyone always sees the latest edits, from any device) needs a small cloud database and isn't wired up yet** — see the note at the bottom of this file.

## Password protection

All 8 pages load [auth-gate.js](auth-gate.js), which shows a full-screen password prompt (current password: `pixelbrahma123`) before revealing the page. Once entered correctly on a device/browser, it's remembered there (`localStorage`) and won't ask again.

**This is a soft gate, not real security** — the password is plain text in `auth-gate.js`, visible to anyone who views the page source. It's meant to keep casual/uninvited visitors out of a draft link, not to protect sensitive information. To change the password, edit the `PASSWORD` value in `auth-gate.js`.

## Files

- `index.html` — wireframe package index (not editable, just links to the 7 pages)
- `home.html`, `about.html`, `services.html`, `projects.html`, `case-studies.html`, `careers.html`, `contact.html` — the wireframe pages
- `styles.css` — shared styling for all pages
- `edit-mode.js` — the in-browser edit toolbar (save-to-`localStorage`), shared by all 7 wireframe pages
- `auth-gate.js` — the password prompt, shared by all 8 pages

## Planned: cross-device sync

Right now edits only persist in the browser they were saved in (see above). To make edits visible from any device — e.g. so the site owner sees a client's changes without the client sending anything — needs a small free cloud database (e.g. Firebase Realtime Database) wired into `edit-mode.js` in place of `localStorage`. Not implemented yet.
