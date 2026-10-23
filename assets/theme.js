// Light/dark toggle. The choice is a per-viewer convenience, so storage failures are ignored.
(function () {
  var root = document.documentElement;
  var btn = document.querySelector(".theme");
  if (!btn) return;

  function current() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function label() { btn.textContent = current() === "dark" ? "light" : "dark"; }

  btn.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    label();
  });
  label();
})();
