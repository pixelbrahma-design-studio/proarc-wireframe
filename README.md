# Proarc Website Wireframe

Low-fidelity, real-content wireframe for the Proarc website (7 pages) — [index.html](index.html) is the package landing page linking to all of them.

## Hosting it for the client (GitHub Pages)

1. Push this folder to a GitHub repo.
2. In the repo, go to **Settings → Pages**, set Source to your default branch, root folder.
3. GitHub gives you a URL like `https://<username>.github.io/<repo>/` — send that link to the client. `index.html` is the entry point.

## How the client edits content

Every page (except `index.html`) loads [edit-mode.js](edit-mode.js), which adds a small toolbar (bottom-right):

1. **Edit Mode: Off/On** — turn it on, then click any headline, paragraph, list item, button label, nav link, or footer detail to edit it in place. Links won't navigate while Edit Mode is on, so clicking is safe.
2. Edits **autosave to the client's browser** (`localStorage`) as they type — refreshing the page won't lose their work.
3. **Export Page** — downloads a standalone `<page>-client-edits.html` file with their changes baked in, and no editing UI left in it.
4. **Reset** — clears their draft and reloads the original page, in case they want to start over.

There's no backend or database involved — nothing is saved anywhere except the client's own browser until they click Export and send the file to you.

## Merging edits back in

When the client sends back an exported file (e.g. `home-client-edits.html`):

1. Diff it against the current page to see what changed.
2. Copy the updated content into the real page file (or replace the file outright and re-add the `<script src="edit-mode.js" defer>` tag before `</body>` if it's missing — Export strips it on purpose).
3. Commit and push — GitHub Pages redeploys automatically.

## Files

- `index.html` — wireframe package index (not editable, just links to the 7 pages)
- `home.html`, `about.html`, `services.html`, `projects.html`, `case-studies.html`, `careers.html`, `contact.html` — the wireframe pages
- `styles.css` — shared styling for all pages
- `edit-mode.js` — the client edit/export toolbar, shared by all 7 wireframe pages
