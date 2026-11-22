# Joysankar Majumdar

Academic homepage, live at **https://joysankar-astro.github.io**

Single-page site in plain HTML with one stylesheet and two small scripts. There is no build step.

- `index.html` holds all the content.
- `assets/style.css` sets the layout and colours. Dark mode follows the system setting.
- `assets/sky.js` draws the night-sky header: twinkling stars, flaring transients and an observatory that slews to them. It also shows the live Warsaw sidereal time and Moon phase, and fades sections in on scroll.
- `assets/lightcurve.js` draws the reading-progress bar at the bottom, a TDE light curve. Its data points are simulated, and seeded so they look the same on every visit.

Animations switch off when a visitor asks for reduced motion.

## Updating

To add a publication, copy one `<li>` in the right list (Refereed, Preprints, or ATels and TNS reports) in `index.html`.

Preview locally with `python3 -m http.server` in this folder, then commit and push to `main`. GitHub Pages deploys it automatically.
