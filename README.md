# myweb_paper

Static academic homepage typeset like a journal preprint. Plain HTML and one stylesheet, no build step.

- `index.html` About, `research.html`, `publications.html`, `activity.html`, `software.html`, `404.html`
- `assets/paper.css` all styling (light/dark tokens on `:root`, print stylesheet included)
- `assets/theme.js` light/dark toggle
- `assets/img/` images copied from the joysankar-astro.github.io Hugo repo

Preview with `python3 -m http.server` in this folder. When content changes, also update the
"Last revised" date and the arXiv-style margin stamp on each page.
