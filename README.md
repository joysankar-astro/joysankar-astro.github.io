# myweb_simple

Single-page academic homepage. Plain HTML, one stylesheet (`assets/style.css`) and `assets/sky.js`
(night-sky header with twinkling stars and flaring transients, live Warsaw sidereal time and Moon phase,
sections fading in on scroll). Animations switch off when the visitor asks for reduced motion.
Dark mode follows the system setting. No build step.

To add a publication, copy one `<li>` in the right list (Refereed, Preprints, ATels and TNS reports) in `index.html`.

Preview with `python3 -m http.server` in this folder.

Bottom bar: `assets/lightcurve.js` draws a TDE light curve as a reading-progress bar; the data points are simulated, seeded so they look the same each visit.
