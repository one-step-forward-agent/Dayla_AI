// Applies the saved theme before the app renders (no flash). A file, not inline, for the CSP.
(function () {
  var mode = "system";
  try {
    mode = localStorage.getItem("dayla-theme") || "system";
  } catch (e) {}
  var dark = mode === "dark" || (mode !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  var root = document.documentElement;
  root.classList.add(dark ? "dark" : "light");
  root.style.colorScheme = dark ? "dark" : "light";
})();
