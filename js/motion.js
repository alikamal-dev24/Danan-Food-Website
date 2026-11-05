/* Danan Foods — motion layer (GSAP + ScrollTrigger)
   Restrained on purpose, per the ui-ux-pro-max animation guidance: one key
   entrance per view, no parallax or scroll-jacking, and nothing at all when
   the visitor has asked for reduced motion. */
(function () {
  "use strict";

  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  try {
    gsap.registerPlugin(ScrollTrigger);
  } catch (err) {
    return;
  }

  var docEl = document.documentElement;
  docEl.classList.add("has-gsap");
  gsap.defaults({ ease: "power3.out", duration: 0.9 });

  /* ---------- helpers ---------- */

  /* Wrap every word so the headline can rise out of its own line box.
     <em> and other inline children are cloned, so the italic accent survives. */
  function splitWords(el) {
    if (!el || el.dataset.split === "on") return [];
    var words = [];
    var frag = document.createDocumentFragment();

    function addWord(text, wrapper) {
      var outer = document.createElement("span");
      var inner = document.createElement("span");
      outer.className = "split-word";
      inner.textContent = text;
      outer.appendChild(inner);
      if (wrapper) {
        var host = wrapper.cloneNode(false);
        host.appendChild(outer);
        frag.appendChild(host);
      } else {
        frag.appendChild(outer);
      }
      frag.appendChild(document.createTextNode(" "));
      words.push(inner);
    }

    Array.prototype.forEach.call(Array.prototype.slice.call(el.childNodes), function (node) {
      if (node.nodeType === 3) {
        node.nodeValue.split(/\s+/).filter(Boolean).forEach(function (w) { addWord(w, null); });
      } else if (node.nodeType === 1) {
        Array.prototype.forEach.call(node.childNodes, function (child) {
          if (child.nodeType !== 3) return;
          child.nodeValue.split(/\s+/).filter(Boolean).forEach(function (w) { addWord(w, node); });
        });
      }
    });

    el.innerHTML = "";
    el.appendChild(frag);
    el.dataset.split = "on";
    return words;
  }

  /* ---------- reading progress ---------- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  gsap.to(bar, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { trigger: docEl, start: "top top", end: "bottom bottom", scrub: 0.4 }
  });

  /* ---------- 1. first screen ---------- */
  function firstScreen() {
    var hero = document.querySelector(".hero__inner");
    if (hero) {
      var eyebrow = hero.querySelector(".hero__eyebrow");
      var title = hero.querySelector("h1");
      var sub = hero.querySelector(".hero__sub");
      var actions = hero.querySelector(".hero__actions");
      var facts = hero.querySelectorAll(".hero__facts > *");
      var words = splitWords(title);

      gsap.set([eyebrow, sub, actions], { y: 24, autoAlpha: 0 });
      gsap.set(actions.querySelectorAll(".btn"), { y: 14, autoAlpha: 0 });
      gsap.set(facts, { y: 18, autoAlpha: 0 });
      gsap.set(words, { yPercent: 112 });

      gsap.timeline({ defaults: { duration: 0.9 } })
        .to(eyebrow, { y: 0, autoAlpha: 1 })
        .to(words, { yPercent: 0, duration: 1, stagger: 0.055, ease: "power4.out" }, "-=0.7")
        .to(sub, { y: 0, autoAlpha: 1 }, "-=0.78")
        .to(actions, { y: 0, autoAlpha: 1 }, "-=0.72")
        .to(actions.querySelectorAll(".btn"), { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.07 }, "-=0.62")
        .to(facts, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08 }, "-=0.55");
      return;
    }

    /* Interior pages: the page-head headline gets the same treatment. */
    var head = document.querySelector(".page-head");
    if (head) {
      var h1 = head.querySelector("h1");
      var hWords = splitWords(h1);
      var rest = head.querySelectorAll(".breadcrumb, .page-head p");
      gsap.set(rest, { y: 18, autoAlpha: 0 });
      gsap.set(hWords, { yPercent: 112 });
      gsap.timeline({ defaults: { duration: 0.9 } })
        .to(head.querySelector(".breadcrumb"), { y: 0, autoAlpha: 1, duration: 0.6 })
        .to(hWords, { yPercent: 0, duration: 1, stagger: 0.045, ease: "power4.out" }, "-=0.35")
        .to(head.querySelectorAll("p"), { y: 0, autoAlpha: 1 }, "-=0.7");
    }
  }

  var started = false;
  function start() {
    if (started) return;
    started = true;
    firstScreen();
  }
  document.addEventListener("danan:ready", start);
  if (docEl.classList.contains("is-loaded")) start();
  setTimeout(start, 1400); /* in case the loader never fires */

  /* ---------- 2. section reveals, batched per row ---------- */
  var items = gsap.utils.toArray(".reveal");
  var line = function () { return window.innerHeight * 0.88; };

  function show(el) {
    if (el.classList.contains("is-shown")) return;
    el.classList.add("is-shown");
    gsap.to(el, { y: 0, autoAlpha: 1, duration: 0.85, overwrite: true });
  }

  if (items.length) {
    gsap.set(items, { y: 28, autoAlpha: 0 });

    /* Everything entering together is staggered as one row, so a card grid
       reads left to right instead of popping in all at once. */
    ScrollTrigger.batch(items, {
      start: "top 88%",
      once: true,
      onEnter: function (batch) {
        batch.forEach(function (el, i) {
          if (i === 0) { show(el); return; }
          gsap.delayedCall(i * 0.075, show, [el]);
        });
      }
    });

    items.forEach(function (el, i) {
      if (el.getBoundingClientRect().top < line()) {
        gsap.delayedCall(0.05 + Math.min(i, 3) * 0.06, show, [el]);
      }
    });

    /* A deep link or a fast jump must never leave a section invisible. */
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

  /* ---------- 3. section headings rise word by word ---------- */
  gsap.utils.toArray(".section-head h2, .split h2").forEach(function (h) {
    var words = splitWords(h);
    if (!words.length) return;
    gsap.set(words, { yPercent: 112 });
    gsap.to(words, {
      yPercent: 0,
      duration: 0.95,
      stagger: 0.04,
      ease: "power4.out",
      scrollTrigger: { trigger: h, start: "top 86%", once: true }
    });
  });

  /* ---------- 4. photography wipes open instead of just fading ---------- */
  gsap.utils.toArray("figure img, .product__media, .band__plate").forEach(function (el) {
    if (el.dataset.wipe === "on") return;
    el.dataset.wipe = "on";
    gsap.fromTo(el,
      { clipPath: "inset(0% 0% 18% 0%)", scale: 1.04 },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        duration: 1.15,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      }
    );
  });

  /* ---------- 5. stats count up once ---------- */
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
        onUpdate: function () { node.nodeValue = String(Math.round(counter.value)); },
        onComplete: function () { node.nodeValue = String(target); }
      });
    };

    ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: run });
    if (el.getBoundingClientRect().top < line()) gsap.delayedCall(0.4, run);
  });

  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });
})();
