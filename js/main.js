/* Danan Foods — shared behaviour */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky header ---------- */
  var header = document.getElementById("siteHeader");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("menuToggle");
  var drawer = document.getElementById("mobileNav");

  function setMenu(open) {
    if (!toggle || !drawer) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("is-locked", open);
  }

  if (toggle && drawer) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && drawer.classList.contains("is-open")) setMenu(false);
    });
  }

  /* ---------- Marquee: duplicate the group so the -50% loop is seamless ---------- */
  var track = document.querySelector(".marquee__track");
  if (track) {
    var group = track.querySelector(".marquee__group");
    if (group) {
      var groupWidth = group.getBoundingClientRect().width;
      var copies = groupWidth > 0 ? Math.ceil((window.innerWidth * 2) / groupWidth) : 2;
      copies = Math.max(2, copies % 2 === 0 ? copies : copies + 1);
      for (var i = 1; i < copies; i++) {
        var clone = group.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      }
    }
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (revealEls.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var siblings = Array.prototype.slice.call(el.parentNode.children).filter(function (n) {
            return n.classList && n.classList.contains("reveal");
          });
          var order = siblings.indexOf(el);
          el.style.transitionDelay = Math.min(order, 4) * 90 + "ms";
          el.classList.add("is-visible");
          observer.unobserve(el);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

      revealEls.forEach(function (el) { observer.observe(el); });
    }
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Enquiry forms (no backend: composes an email) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-inquiry]"), function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form__status");
      var data = new FormData(form);
      var lines = [];
      data.forEach(function (value, key) {
        if (key === "bot-field") return;
        lines.push(key.replace(/([A-Z])/g, " $1").replace(/^./, function (c) { return c.toUpperCase(); }) + ": " + value);
      });
      var subject = encodeURIComponent("Website enquiry — " + (data.get("name") || "Danan Foods"));
      var body = encodeURIComponent(lines.join("\n"));
      if (status) status.textContent = "Opening your email app…";
      window.location.href = "mailto:info@dananfoods.com?subject=" + subject + "&body=" + body;
      if (status) status.textContent = "If nothing opened, email info@dananfoods.com or call +92 370 0829927.";
      form.reset();
    });
  });

  /* ---------- Page loader ---------- */
  var loader = document.getElementById("pageLoader");
  if (loader) {
    var startedAt = Date.now();
    var dismiss = function () {
      loader.classList.add("is-done");
      loader.setAttribute("aria-hidden", "true");
      document.documentElement.classList.add("is-loaded");
      document.dispatchEvent(new Event("danan:ready"));
    };
    var finish = function () {
      /* long enough to read as a deliberate beat, short enough to never feel slow */
      setTimeout(dismiss, Math.max(0, 620 - (Date.now() - startedAt)));
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish);
  }

  /* ---------- Mark the current page in the nav ---------- */
  var here = (window.location.pathname.split("/").pop() || "index.html");
  if (here === "") here = "index.html";
  document.querySelectorAll(".nav__link, .mobile-nav__link").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href === here) link.setAttribute("aria-current", "page");
  });

})();
