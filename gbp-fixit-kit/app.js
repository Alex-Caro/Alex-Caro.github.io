(function () {
  "use strict";
  try {
    var yr = document.getElementById("yr");
    if (yr) { yr.textContent = String(new Date().getFullYear()); }
    var links = document.querySelectorAll('a[target="_blank"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.protocol !== "https:") { a.removeAttribute("href"); continue; }
      a.setAttribute("rel", "noopener noreferrer");
    }
  } catch (e) {
    /* Page is fully usable without this script; fail quietly. */
  }
})();
