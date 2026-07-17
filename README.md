# Proarc Website Wireframe

Low-fidelity, real-content wireframe for the Proarc website (7 pages) — [index.html](index.html) is the package landing page linking to all of them.

## Hosting it for the client (GitHub Pages)

1. Push this folder to a GitHub repo.
2. In the repo, go to **Settings → Pages**, set Source to your default branch, root folder.
3. GitHub gives you a URL like `https://<username>.github.io/<repo>/` — send that link to the client. `index.html` is the entry point.

## How the client edits content

Every page (except `index.html`) loads [edit-mode.js](edit-mode.js), which adds a small toolbar (bottom-right):

1. **Edit Mode: Off/On** — turn it on, then click any headline, paragraph, list item, button label, nav link, or footer detail to edit it in place. Links won't navigate while Edit Mode is on, so clicking is safe.
2. Edits **autosave to the browser** (`localStorage`) as they type, debounced ~400ms after the last keystroke.
3. Refreshing (or closing and reopening) that page in the **same browser** automatically restores the saved changes — no save button, no download.
4. **Reset** — clears the saved draft and reloads the original page, in case they want to start over.

There's no backend or database involved, and nothing is exported or sent anywhere. Saved changes live only in `localStorage` **on the device/browser they were made in** — they won't appear if the page is opened on a different device, a different browser, or in incognito/private mode, and they're lost if that browser's site data is cleared. If you need to see or collect a client's edits from your own computer, you'd need a small backend (not included here) — ask if you want that added.

## Files

- `index.html` — wireframe package index (not editable, just links to the 7 pages)
- `home.html`, `about.html`, `services.html`, `projects.html`, `case-studies.html`, `careers.html`, `contact.html` — the wireframe pages
- `styles.css` — shared styling for all pages
- `edit-mode.js` — the in-browser edit toolbar (autosaves to `localStorage`), shared by all 7 wireframe pages
