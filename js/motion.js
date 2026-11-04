/* Danan Foods — scroll motion (GSAP + ScrollTrigger)
   Kept deliberately quiet, per the ui-ux-pro-max animation guidance:
   one key entrance per view, no parallax and no scroll-jacking, and
   nothing at all when the visitor has asked for reduced motion. */
(function () {
  "use strict";

  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  try {
    gsap.registerPlugin(ScrollTrigger);
  } catch (err) {
    return;
  }

  document.documentElement.classList.add("has-gsap");
  gsap.defaults({ ease: "power2.out", duration: 0.85 });

  /* ---------- 1. Hero — the one entrance per view ---------- */
  var hero = document.querySelector(".hero__inner");
  if (hero) {
    var eyebrow = hero.querySelector(".hero__eyebrow");
    var title = hero.querySelector("h1");
    var sub = hero.querySelector(".hero__sub");
    var actions = hero.querySelector(".hero__actions");
    var facts = hero.querySelectorAll(".hero__facts > *");
    var beats = [eyebrow, title, sub, actions];

    gsap.set(beats, { y: 22, autoAlpha: 0 });
    gsap.set(facts, { y: 16, autoAlpha: 0 });

    gsap.timeline({ delay: 0.1, defaults: { duration: 0.9 } })
      .to(eyebrow, { y: 0, autoAlpha: 1 })
      .to(title, { y: 0, autoAlpha: 1 }, "-=0.74")
      .to(sub, { y: 0, autoAlpha: 1 }, "-=0.72")
      .to(actions, { y: 0, autoAlpha: 1 }, "-=0.68")
      .to(facts, { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.09 }, "-=0.55");
  }

  /* ---------- 2. Section reveals ---------- */
  var items = gsap.utils.toArray(".reveal");
  var line = function () { return window.innerHeight * 0.88; };

  function show(el) {
    if (el.classList.contains("is-shown")) return;
    el.classList.add("is-shown");
    gsap.to(el, { y: 0, autoAlpha: 1, duration: 0.85, overwrite: true });
  }

  if (items.length) {
    gsap.set(items, { y: 26, autoAlpha: 0 });

    items.forEach(function (el, i) {
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () { show(el); }
      });

      /* Rows that are on screen at load come in together rather than one by one. */
      if (el.getBoundingClientRect().top < line()) {
        gsap.delayedCall(0.05 + Math.min(i, 3) * 0.05, show, [el]);
      }
    });

    /* Safety sweep: a deep link or a fast jump must never leave a section
       invisible, so anything above the trigger line is revealed too. */
    var queued = false;
    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        items.forEach(function (el) {
          if (!el.classList.contains("is-shown") && el.getBoundingClientRect().top < line()) show(el);
        });
      });
    }, { passive: true });
  }

  /* ---------- 3. Stats count up once, when the band is in view ---------- */
  gsap.utils.toArray(".stat__value").forEach(function (el) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return;

    var target = parseInt(node.nodeValue, 10);
    if (!target) return;

    var counter = { value: 0 };
    node.nodeValue = "0";

    var run = function () {
      gsap.to(counter, {
        value: target,
        duration: 1.2,
        ease: "power1.out",
        onUpdate: function () {
          node.nodeValue = String(Math.round(counter.value));
        },
        onComplete: function () {
          node.nodeValue = String(target);
        }
      });
    };

    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: run
    });

    if (el.getBoundingClientRect().top < line()) gsap.delayedCall(0.3, run);
  });

  /* Lazy-loaded images change section heights; keep triggers honest. */
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });
})();
