// Theme toggle, code copy buttons and the table of contents highlight.
(function () {
  var root = document.documentElement;
  var live = document.getElementById("fk-live");

  function announce(msg) {
    if (!live) return;
    live.textContent = "";
    setTimeout(function () { live.textContent = msg; }, 50);
  }

  // Theme: the inline script in <head> sets data-theme before paint; this flips and stores it.
  document.querySelectorAll(".fk-theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  });

  // Code blocks: copy the code, show a check for 1.5s. In shell sessions (lines with a "$" prompt)
  // only the commands are copied: prompts and output are left out.
  // Chroma also reads lines starting with "#" or ">" as prompts; in these posts those are always output or comments.
  function dollarPrompt(line) {
    var gp = line.querySelector(".gp");
    return gp && gp.textContent.trim() === "$" ? gp : null;
  }

  function stripPrompt(line) {
    var gp = dollarPrompt(line);
    if (!gp) return line.textContent;
    // Chroma leaves the space after "$" outside the prompt span.
    var next = gp.nextSibling;
    if (next && next.nodeType === Node.TEXT_NODE) next.textContent = next.textContent.replace(/^ /, "");
    gp.remove();
    return line.textContent;
  }

  function commandsOnly(code) {
    var out = [];
    var continuing = false;
    code.querySelectorAll(".line").forEach(function (line) {
      var isCommand = !!dollarPrompt(line);
      var text = stripPrompt(line).replace(/\n$/, "");
      // Chroma marks the lines after a trailing "\" as output; keep them (and comments among them) with their command.
      if (!isCommand && !continuing) return;
      out.push(text);
      continuing = /\\\s*$/.test(text) || (!isCommand && /^\s*#/.test(text));
    });
    return out.join("\n");
  }

  document.querySelectorAll(".fk-code__copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var code = btn.closest(".fk-code").querySelector("pre code").cloneNode(true);
      var isSession = Array.prototype.some.call(code.querySelectorAll(".line"), dollarPrompt);
      var text = isSession ? commandsOnly(code) : code.textContent.replace(/\n$/, "");
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(text).then(function () {
        btn.setAttribute("data-copied", "");
        announce("Copied");
        setTimeout(function () { btn.removeAttribute("data-copied"); }, 1500);
      });
    });
  });

  // Diagrams: full screen view. The SVG itself moves into the dialog (no clone, so no duplicate ids)
  // and back again on close; the dialog carries .fk-diagram so the theme colours still apply.
  document.querySelectorAll("figure.fk-diagram").forEach(function (fig) {
    var canvas = fig.querySelector(".fk-diagram__canvas");
    var dialog = fig.querySelector(".fk-diagram__dialog");
    var target = dialog && dialog.querySelector(".fk-diagram__dialog-canvas");
    var expand = fig.querySelector(".fk-diagram__expand");
    if (!canvas || !target || !expand || typeof dialog.showModal !== "function") {
      if (expand) expand.hidden = true;
      return;
    }
    var svg, aspect;
    expand.addEventListener("click", function () {
      svg = canvas.querySelector("svg");
      if (!svg) return;
      aspect = svg.getAttribute("preserveAspectRatio");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      target.appendChild(svg);
      dialog.showModal();
    });
    dialog.querySelector(".fk-diagram__close").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", function () {
      if (!svg) return;
      if (aspect) svg.setAttribute("preserveAspectRatio", aspect); else svg.removeAttribute("preserveAspectRatio");
      canvas.appendChild(svg);
      svg = null;
      expand.focus();
    });
  });

  // Table of contents: mark the section currently in view.
  var toc = document.querySelector(".fk-toc");
  if (toc) {
    var links = {};
    toc.querySelectorAll("a[href^='#']").forEach(function (a) {
      links[decodeURIComponent(a.getAttribute("href").slice(1))] = a;
    });
    var headings = Array.prototype.filter.call(
      document.querySelectorAll(".fk-prose h2[id], .fk-prose h3[id], .fk-prose h4[id]"),
      function (h) { return links[h.id]; }
    );
    var current;
    function setCurrent(id) {
      if (current === id) return;
      if (current && links[current]) links[current].removeAttribute("aria-current");
      current = id;
      if (links[id]) links[id].setAttribute("aria-current", "location");
    }
    var pending = false;
    function update() {
      pending = false;
      var active;
      headings.forEach(function (h) {
        if (h.getBoundingClientRect().top <= window.innerHeight * 0.25) active = h;
      });
      setCurrent(active ? active.id : null);
    }
    window.addEventListener("scroll", function () {
      if (!pending) { pending = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }
})();
