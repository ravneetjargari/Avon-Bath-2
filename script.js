(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("menu");

  /* Header turns solid after scrolling past the top of the hero */
  function onScroll() {
    header.classList.toggle("is-solid", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu */
  function setMenu(open) {
    header.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () {
    setMenu(!header.classList.contains("menu-open"));
  });
  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("menu-open")) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia("(min-width:821px)").addEventListener("change", function () {
    setMenu(false);
  });

  /* Hero slides: load each configured image; show a placeholder note if none exist.
     Only slides whose image loads take part in the cross-fade. */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero__slide"));
  var note = document.getElementById("heroPlaceholder");
  var loaded = [];
  var pending = slides.length;

  function finishLoading() {
    if (--pending > 0) return;
    if (!loaded.length) {
      note.hidden = false;
      return;
    }
    slides.forEach(function (s) { s.classList.remove("is-active"); });
    loaded[0].classList.add("is-active");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (loaded.length > 1 && !reduce) {
      var i = 0;
      setInterval(function () {
        loaded[i].classList.remove("is-active");
        i = (i + 1) % loaded.length;
        loaded[i].classList.add("is-active");
      }, 7000);
    }
  }

  slides.forEach(function (slide) {
    var img = new Image();
    img.onload = function () {
      slide.style.backgroundImage = 'url("' + slide.dataset.src + '")';
      if (slide.dataset.pos) slide.style.backgroundPosition = slide.dataset.pos;
      loaded.push(slide);
      finishLoading();
    };
    img.onerror = finishLoading;
    img.src = slide.dataset.src;
  });

  /* Image slots: show a tonal tile with a label until a real photo loads */
  document.querySelectorAll(".ph").forEach(function (box) {
    var img = box.querySelector("img");
    if (!img) return;
    function ok() { box.classList.add("has-img"); box.classList.remove("is-missing"); }
    function bad() { box.classList.add("is-missing"); box.classList.remove("has-img"); }
    if (img.complete) { img.naturalWidth ? ok() : bad(); }
    img.addEventListener("load", ok);
    img.addEventListener("error", bad);
  });
/* Brand logo slots: show the logo when the file exists, otherwise the name and file hint */
document.querySelectorAll(".brand-tile").forEach(function (tile) {
  var img = tile.querySelector("img");
  function ok() { tile.classList.add("has-img"); }
  if (img.complete && img.naturalWidth) ok();
  img.addEventListener("load", ok);
});

  /* Category and trade links pre-select the enquiry type */
  var typeSelect = document.getElementById("f-type");
  document.querySelectorAll("[data-inquiry]").forEach(function (a) {
    a.addEventListener("click", function () {
      var want = a.getAttribute("data-inquiry");
      Array.prototype.forEach.call(typeSelect.options, function (o) {
        if (o.textContent.trim() === want || o.value === want) typeSelect.value = o.value || o.textContent;
      });
    });
  });

  /* Scroll reveal */
  var targets = document.querySelectorAll(".section__head, .cat, .brands__list, .why__copy, .why__media, .trade__inner, .reviews, .showroom__copy, .showroom__map, .contact__intro, .form");
  targets.forEach(function (el) { el.classList.add("reveal"); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("in"); });
  }

  /* Enquiry form */
  var form = document.getElementById("enquiry");
  var status = form.querySelector(".form__status");

  function fieldError(input) {
    var v = input.value.trim();
    if (input.required && !v) return "This field is required.";
    if (input.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
    if (input.type === "tel" && v && v.replace(/\D/g, "").length < 7) return "Enter a valid phone number.";
    return "";
  }
  function showError(input) {
    var msg = fieldError(input);
    var wrap = input.closest(".field");
    wrap.classList.toggle("invalid", !!msg);
    wrap.querySelector(".err").textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }
  form.querySelectorAll("input,select,textarea").forEach(function (el) {
    el.addEventListener("blur", function () { showError(el); });
    el.addEventListener("input", function () { if (el.closest(".field").classList.contains("invalid")) showError(el); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.className = "form__status";
    status.textContent = "";
    var firstBad = null;
    form.querySelectorAll("input,select,textarea").forEach(function (el) {
      if (!showError(el) && !firstBad) firstBad = el;
    });
    if (firstBad) { firstBad.focus(); return; }

    var endpoint = form.dataset.endpoint;
    if (!endpoint) {
      status.classList.add("bad");
      status.textContent = "Online enquiries aren't switched on yet. Please call us at 403-925-6900.";
      return;
    }
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    status.textContent = "Sending…";
    fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form)
    }).then(function (r) {
      if (!r.ok) throw new Error("bad response");
      form.reset();
      status.classList.add("ok");
      status.textContent = "Thank you. We'll be in touch soon.";
    }).catch(function () {
      status.classList.add("bad");
      status.textContent = "Something went wrong. Please call us at 403-925-6900.";
    }).then(function () { btn.disabled = false; });
  });

  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();
