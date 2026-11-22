// Night-sky header: twinkling stars with the occasional transient, plus a live
// Warsaw sidereal time and Moon phase. Also fades sections in on scroll.
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WARSAW_LON = 21.0122; // degrees east

  // ---------- sidereal time and Moon phase ----------

  function julianDate(d) { return d.getTime() / 86400000 + 2440587.5; }

  function lst(d) {
    var jd = julianDate(d);
    var gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0);
    var deg = ((gmst + WARSAW_LON) % 360 + 360) % 360;
    var h = deg / 15, hh = Math.floor(h), mm = Math.floor((h - hh) * 60), ss = Math.floor(((h - hh) * 60 - mm) * 60);
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return p(hh) + ":" + p(mm) + ":" + p(ss);
  }

  function moon(d) {
    // age in synodic months since the new moon of 2000-01-06 18:14 UT
    var age = ((julianDate(d) - 2451550.26) / 29.530588853) % 1;
    if (age < 0) age += 1;
    var illum = Math.round((1 - Math.cos(2 * Math.PI * age)) / 2 * 100);
    var names = ["new", "waxing crescent", "first quarter", "waxing gibbous", "full", "waning gibbous", "last quarter", "waning crescent"];
    return names[Math.round(age * 8) % 8] + ", " + illum + "% lit";
  }

  var lstEl = document.getElementById("lst"), moonEl = document.getElementById("moon");
  function tick() {
    var now = new Date();
    if (lstEl) lstEl.textContent = lst(now);
    if (moonEl) moonEl.textContent = moon(now);
  }
  tick();
  setInterval(tick, 1000);

  // ---------- starfield ----------

  var canvas = document.getElementById("sky");
  var counter = document.getElementById("ntr");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var stars = [], transients = [], W = 0, H = 0, dpr = 1, found = 0, nextAt = 0, visible = true;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(W * H / 1800);
    stars = [];
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() < 0.08 ? 1.3 + Math.random() * 0.6 : 0.4 + Math.random() * 0.7,
        a: 0.35 + Math.random() * 0.6,
        f: 0.5 + Math.random() * 1.8,   // twinkle frequency
        ph: Math.random() * 6.28,
        warm: Math.random() < 0.15       // a few orange-ish stars
      });
    }
    if (reduce) draw(0);
  }

  function spawn(t) {
    transients.push({ x: 0.05 * W + Math.random() * 0.9 * W, y: 0.08 * H + Math.random() * 0.84 * H, t0: t, peak: 2.2 + Math.random() * 2 });
    found++;
    if (counter) counter.textContent = found;
  }

  // brightness of a transient: fast rise, slow exponential decline, like a supernova light curve
  function lightCurve(dt) {
    if (dt < 0.7) return dt / 0.7;
    return Math.exp(-(dt - 0.7) / 2.2);
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = reduce ? s.a : s.a * (0.65 + 0.35 * Math.sin(t * s.f + s.ph));
      ctx.fillStyle = s.warm ? "rgba(255,196,150," + a + ")" : "rgba(235,240,255," + a + ")";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    for (var j = transients.length - 1; j >= 0; j--) {
      var tr = transients[j], dt = t - tr.t0, b = lightCurve(dt);
      if (dt > 9) { transients.splice(j, 1); continue; }
      var R = 3 + tr.peak * 5 * b;
      var g = ctx.createRadialGradient(tr.x, tr.y, 0, tr.x, tr.y, R * 3);
      g.addColorStop(0, "rgba(255,255,255," + b + ")");
      g.addColorStop(0.25, "rgba(255,190,120," + 0.8 * b + ")");
      g.addColorStop(1, "rgba(242,120,50,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(tr.x, tr.y, R * 3, 0, 6.283); ctx.fill();
      // faint expanding shell
      ctx.strokeStyle = "rgba(159,216,181," + 0.35 * Math.max(0, 1 - dt / 5) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(tr.x, tr.y, 6 + dt * 9, 0, 6.283); ctx.stroke();
    }
    drawObservatory(t);
  }

  // ---------- observatory: the telescope slews to each new transient ----------

  var aim = -Math.PI / 2 - 0.5; // current pointing angle, radians from +x (screen, y down)

  function domeGeom() {
    var small = W < 700;
    var R = small ? 22 : 36;
    var x = W - (small ? 40 : Math.max(90, (W - 780) / 4));
    var bh = R * 0.95;
    return { R: R, x: x, y: H - 10 - bh, bh: bh };
  }

  function drawObservatory(t) {
    var g = domeGeom(), R = g.R, cx = g.x, cy = g.y;

    // where to point: the newest transient, or a slow idle sweep across the sky
    var target = transients.length ? transients[transients.length - 1] : null;
    var want = target ? Math.atan2(target.y - cy, target.x - cx) : -Math.PI / 2 + 0.6 * Math.sin(t / 7);
    want = Math.max(-Math.PI + 0.15, Math.min(-0.15, want)); // telescopes do not point below the horizon
    if (reduce) aim = want; else aim += (want - aim) * 0.035;

    var tracking = target && Math.abs(want - aim) < 0.02 && (t - target.t0) < 6;
    if (tracking) {
      ctx.strokeStyle = "rgba(242,163,107,0.22)";
      ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(target.x, target.y); ctx.stroke();
      ctx.setLineDash([]);
    }

    // ground
    ctx.fillStyle = "#04060a";
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, H - 6);
    ctx.quadraticCurveTo(W * 0.35, H - 16, W * 0.62, H - 8);
    ctx.quadraticCurveTo(W * 0.85, H - 2, W, H - 12);
    ctx.lineTo(W, H);
    ctx.fill();

    var ux = Math.cos(aim), uy = Math.sin(aim);

    // telescope tube, drawn first so the dome hides its lower end
    ctx.lineCap = "round";
    ctx.strokeStyle = "#3a4a5e";
    ctx.lineWidth = R * 0.26;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + ux * R * 1.45, cy + uy * R * 1.45); ctx.stroke();
    ctx.strokeStyle = "#9fd8b5";
    ctx.lineWidth = R * 0.26;
    ctx.beginPath(); ctx.moveTo(cx + ux * R * 1.38, cy + uy * R * 1.38); ctx.lineTo(cx + ux * R * 1.45, cy + uy * R * 1.45); ctx.stroke();

    // building
    ctx.fillStyle = "#1d2633";
    ctx.fillRect(cx - R, cy, 2 * R, g.bh + 10);
    ctx.fillStyle = "#121921";
    ctx.fillRect(cx - R * 0.22, cy + g.bh * 0.35, R * 0.44, g.bh * 0.65 + 10); // door

    // dome with a slit that turns with the telescope
    var dg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy);
    dg.addColorStop(0, "#5a6b80");
    dg.addColorStop(1, "#243040");
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 0); ctx.closePath(); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 0); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = "#06090e";
    ctx.lineWidth = R * 0.42;
    ctx.lineCap = "butt";
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + ux * R * 1.2, cy + uy * R * 1.2); ctx.stroke();
    ctx.strokeStyle = "#3a4a5e";
    ctx.lineWidth = R * 0.26;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + ux * R * 1.2, cy + uy * R * 1.2); ctx.stroke();
    ctx.restore();

    // small red light on the building, as on a real dome at night
    var blink = reduce ? 0.8 : (Math.sin(t * 2.4) > 0.6 ? 1 : 0.25);
    ctx.fillStyle = "rgba(255,70,50," + blink + ")";
    ctx.beginPath(); ctx.arc(cx + R * 0.62, cy + g.bh * 0.3, 1.6, 0, 6.283); ctx.fill();
  }

  function loop(ms) {
    var t = ms / 1000;
    if (visible) {
      if (t > nextAt) { spawn(t); nextAt = t + 2.5 + Math.random() * 3.5; }
      draw(t);
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  resize();
  if (reduce) {
    var info = counter && counter.parentNode;
    if (info) info.style.display = "none";
  } else {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(canvas);
    }
    nextAt = 1.2;
    requestAnimationFrame(loop);
  }

  // ---------- fade sections in on scroll ----------

  if (reduce || !("IntersectionObserver" in window)) return;
  var page = document.querySelectorAll(".page")[1];
  if (!page) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  Array.prototype.forEach.call(page.children, function (el) {
    if (el.tagName === "NAV") return;
    el.classList.add("reveal");
    io.observe(el);
  });
})();
