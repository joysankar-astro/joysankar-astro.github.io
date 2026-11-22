// Reading progress as a light curve along the bottom of the window. Time runs
// left to right with the scroll position: a tidal disruption event rises fast
// and declines as t^-5/3, with simulated data points appearing as you read.
(function () {
  var BAR = 46; // px

  var bar = document.createElement("div");
  bar.className = "lcbar";
  bar.setAttribute("aria-hidden", "true");
  var canvas = document.createElement("canvas");
  bar.appendChild(canvas);
  document.body.appendChild(bar);
  var ctx = canvas.getContext("2d");

  // seeded random numbers, so the "data" look the same on every visit
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(6.2832 * r()); }

  var N = 600;
  function tde(p) {
    var tp = 0.08;
    if (p < tp) return 0.03 + 0.97 * Math.pow(p / tp, 2);
    return Math.pow((p + 0.04) / (tp + 0.04), -5 / 3);
  }
  var model = [];
  // plotted in log flux (like magnitudes), so the long decline stays visible
  var LMIN = Math.log10(tde(1));
  for (var i = 0; i <= N; i++) model.push(Math.max(0, (Math.log10(tde(i / N)) - LMIN) / -LMIN));
  var r = rng(3), data = [];
  for (var p = 0.004; p < 1; p += 0.008 + r() * 0.012) {
    var err = 0.025 + 0.035 * r();
    data.push({ p: p, v: Math.max(0, Math.min(1, model[Math.round(p * N)] + gauss(r) * err * 0.8)), e: err });
  }

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  var W, dpr, queued = false;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = bar.clientWidth;
    canvas.width = W * dpr; canvas.height = BAR * dpr;
    canvas.style.width = W + "px"; canvas.style.height = BAR + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    queued = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var prog = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    var green = cssVar("--green"), orange = cssVar("--orange"), faint = cssVar("--faint"), rule = cssVar("--rule");

    var small = W < 600;
    var left = small ? 12 : 120, right = small ? 64 : 120;
    var x0 = left, x1 = W - right, top = 8, bottom = BAR - 8;
    function X(q) { return x0 + q * (x1 - x0); }
    function Y(v) { return bottom - v * (bottom - top); }

    ctx.clearRect(0, 0, W, BAR);

    ctx.font = "11px ui-monospace, Menlo, Consolas, monospace";
    ctx.textBaseline = "middle";
    if (!small) {
      ctx.fillStyle = orange; ctx.fillText("TDE", 16, BAR / 2 - 7);
      ctx.fillStyle = faint; ctx.fillText("L ∝ t⁻⁵/³", 16, BAR / 2 + 8);
    }

    // baseline
    ctx.strokeStyle = rule; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, bottom + 0.5); ctx.lineTo(x1, bottom + 0.5); ctx.stroke();

    // still to come: faint dotted model
    var k = Math.floor(prog * N);
    ctx.setLineDash([2, 4]); ctx.strokeStyle = rule;
    ctx.beginPath();
    for (var i = k; i <= N; i++) { if (i === k) ctx.moveTo(X(i / N), Y(model[i])); else ctx.lineTo(X(i / N), Y(model[i])); }
    ctx.stroke(); ctx.setLineDash([]);

    // already read: data points with error bars, then the model line
    data.forEach(function (d) {
      if (d.p > prog) return;
      ctx.strokeStyle = faint; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(d.p), Y(Math.max(0, d.v - d.e))); ctx.lineTo(X(d.p), Y(Math.min(1, d.v + d.e))); ctx.stroke();
      ctx.fillStyle = green;
      ctx.beginPath(); ctx.arc(X(d.p), Y(d.v), 1.6, 0, 6.2832); ctx.fill();
    });
    ctx.strokeStyle = green; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (i = 0; i <= k; i++) { if (i === 0) ctx.moveTo(X(0), Y(model[0])); else ctx.lineTo(X(i / N), Y(model[i])); }
    ctx.stroke();

    // where you are now
    var mx = X(prog), my = Y(model[Math.round(prog * N)]);
    var g = ctx.createRadialGradient(mx, my, 0, mx, my, 11);
    g.addColorStop(0, orange); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.45; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(mx, my, 11, 0, 6.2832); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = orange;
    ctx.beginPath(); ctx.arc(mx, my, 3.2, 0, 6.2832); ctx.fill();

    ctx.fillStyle = faint;
    ctx.textAlign = "right";
    ctx.fillText("+" + Math.round(prog * 365) + " d", W - 14, BAR / 2);
    ctx.textAlign = "left";
  }

  function queue() { if (!queued) { queued = true; requestAnimationFrame(draw); } }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", resize);
  if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
  resize();
})();
