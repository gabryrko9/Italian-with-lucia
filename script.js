/* ==========================================================
   Italian with Lucia: script.js
   ========================================================== */

/* ---------- 0. Lesson booking link ----------
   After the free trial, students book each lesson in Lucia's Google
   Calendar appointment page. Its link goes in config.js ("booking").
   While it is empty, the button opens a pre-filled email to Lucia. */
const BOOKING_URL = (window.PORTAL && window.PORTAL.booking) || "";
const lessonBtn = document.getElementById("lesson-book");
if (BOOKING_URL && lessonBtn) {
  lessonBtn.href = BOOKING_URL;
  lessonBtn.target = "_blank";
  lessonBtn.rel = "noopener";
  lessonBtn.textContent = "Choose your next lesson";
  document.getElementById("booknow-text").textContent =
    "Choose your next lesson in Lucia's Google Calendar. You get a confirmation email and reminders, and Lucia sees every booking in her calendar.";
}

/* ---------- 1. Currency switch ----------
   Prices are written once, in EUR, as data-eur="..." in index.html.
   Update the indicative exchange rates here when you want. */
const CURRENCIES = {
  EUR: { rate: 1,    symbol: "€",  after: false },
  CZK: { rate: 25,   symbol: "Kč", after: true  },  // 1 EUR ≈ 25 CZK
  USD: { rate: 1.15, symbol: "$",  after: false }   // 1 EUR ≈ 1.15 USD
};

function money(eur, code) {
  const c = CURRENCIES[code];
  let v = eur * c.rate;
  v = code === "CZK" ? Math.round(v / 5) * 5 : Math.round(v);
  const n = v.toLocaleString("en-US").replace(/,/g, code === "CZK" ? " " : ",");
  return c.after ? n + " " + c.symbol : c.symbol + n;
}

function setCurrency(code) {
  document.querySelectorAll("[data-eur]").forEach(function (el) {
    el.textContent = money(parseFloat(el.dataset.eur), code);
  });
  document.querySelectorAll(".cur").forEach(function (b) {
    const on = b.dataset.currency === code;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

document.querySelectorAll(".cur").forEach(function (b) {
  b.addEventListener("click", function () { setCurrency(b.dataset.currency); });
});

/* ---------- 2. Tap-to-translate bubbles ---------- */
document.querySelectorAll(".phrase").forEach(function (b) {
  b.addEventListener("click", function () { b.classList.toggle("is-en"); });
});

/* ---------- 3. Video: load YouTube only when played ---------- */
const box = document.getElementById("video-box");
if (box) {
  const play = box.querySelector(".video-play");
  play.addEventListener("click", function () {
    const f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + box.dataset.id + "?autoplay=1&rel=0&modestbranding=1";
    f.title = "Lucia introduces herself";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    box.replaceChildren(f);
  });
}

/* ---------- 4. Level finder ---------- */
const LEVELS = {
  beginner:     { name: "Beginner (A1–A2)", text: "You build your base with plenty of speaking from day one. The Beginner group or private lessons both fit.", subject: "Beginner" },
  intermediate: { name: "Intermediate (B1)", text: "You can already talk, so the work is accuracy and range: past tenses, vocabulary and fluent conversation.", subject: "Intermediate" },
  advanced:     { name: "Advanced (B2–C1)", text: "You are fluent, so the work is nuance, idioms and register, with precise feedback.", subject: "Advanced" }
};
const resultBox = document.getElementById("level-result");
document.querySelectorAll('input[name="lvl"]').forEach(function (r) {
  r.addEventListener("change", function () {
    const l = LEVELS[r.value];
    document.getElementById("level-title").textContent = l.name;
    document.getElementById("level-text").textContent = l.text;
    const body = "Hi Lucia,\n\nI'd like to reserve a place in the January " + l.subject + " group.\n\nMy time zone: \nPreferred days and times: \n\nThanks!";
    document.getElementById("level-reserve").href =
      "mailto:lucia.scollo2000@gmail.com?subject=" + encodeURIComponent("Group course - " + l.subject) + "&body=" + encodeURIComponent(body);
    resultBox.hidden = false;
  });
});

/* ---------- 5. Copy the email address ---------- */
const copyBtn = document.getElementById("copy-mail");
if (copyBtn) {
  copyBtn.addEventListener("click", function () {
    const email = copyBtn.dataset.email;
    const done = function () {
      const old = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      document.getElementById("copy-status").textContent = "Email address copied";
      setTimeout(function () { copyBtn.textContent = old; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(done, function () { window.prompt("Copy this address:", email); });
    } else {
      window.prompt("Copy this address:", email);
    }
  });
}

/* ---------- 6. Student area link: shown only when config.js is filled in ---------- */
if (window.PORTAL && window.PORTAL.url && window.PORTAL.key) {
  document.querySelectorAll("[data-portal]").forEach(function (el) { el.hidden = false; });
}

/* ---------- 7. Reviews reel ----------
   Two rows drift sideways on their own, one to the left and one to the right.
   They stop while someone hovers, touches, scrolls, focuses or presses pause,
   and they never move for people who asked for reduced motion. Without
   JavaScript the rows are simply swipeable. */
(function () {
  const reel = document.querySelector(".reel");
  if (!reel) return;
  const SPEED = 34; // pixels per second
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rows = Array.prototype.slice.call(reel.querySelectorAll(".reel-row"));
  const toggle = document.getElementById("reel-toggle");
  let userPaused = false, hovering = false, focused = false, inView = true, last = 0;

  const state = rows.map(function (row, i) {
    const track = row.querySelector(".reel-track");
    if (!reduce) {
      Array.prototype.slice.call(track.children).forEach(function (c) {
        const n = c.cloneNode(true);
        n.setAttribute("aria-hidden", "true");
        n.setAttribute("inert", "");
        track.appendChild(n);
      });
    }
    return { row: row, track: track, dir: i % 2 === 0 ? 1 : -1, pos: 0, hold: 0, half: 0 };
  });

  function half(s) { return reduce ? Infinity : s.track.scrollWidth / 2; }
  function measure() {
    state.forEach(function (s) {
      s.half = half(s);
      if (!reduce) { s.pos = s.half * (s.dir > 0 ? 0.02 : 0.55); s.row.scrollLeft = s.pos; }
    });
  }
  function wrap(s) {
    if (reduce) return;
    if (s.pos >= s.half) s.pos -= s.half;
    if (s.pos <= 0) s.pos += s.half;
  }
  const holdFor = function (s, ms) { s.hold = performance.now() + ms; };

  state.forEach(function (s) {
    const grab = function () { holdFor(s, 3500); };
    ["pointerdown", "touchstart", "wheel", "keydown"].forEach(function (ev) { s.row.addEventListener(ev, grab, { passive: true }); });
    s.row.addEventListener("scroll", function () {
      if (performance.now() < s.hold) { s.pos = s.row.scrollLeft; if (!reduce && (s.pos >= s.half || s.pos <= 0)) { wrap(s); s.row.scrollLeft = s.pos; } }
    }, { passive: true });
  });

  function nudge(sign) {
    state.forEach(function (s) {
      holdFor(s, 3500);
      const card = s.track.firstElementChild;
      const step = (card ? card.getBoundingClientRect().width + 18 : 300) * 2 * sign;
      s.row.scrollBy({ left: step, behavior: reduce ? "auto" : "smooth" });
    });
  }
  document.getElementById("reel-prev").addEventListener("click", function () { nudge(-1); });
  document.getElementById("reel-next").addEventListener("click", function () { nudge(1); });
  if (toggle) toggle.addEventListener("click", function () {
    userPaused = !userPaused;
    toggle.setAttribute("aria-pressed", String(userPaused));
    toggle.setAttribute("aria-label", userPaused ? "Play the moving reviews" : "Pause the moving reviews");
  });

  if (window.matchMedia("(hover: hover)").matches) {
    reel.addEventListener("mouseenter", function () { hovering = true; });
    reel.addEventListener("mouseleave", function () { hovering = false; });
  }
  reel.addEventListener("focusin", function () { focused = true; });
  reel.addEventListener("focusout", function () { focused = false; });

  if (reduce) return;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }).observe(reel);
  }
  function tick(t) {
    requestAnimationFrame(tick);
    const dt = Math.min(64, t - (last || t)) / 1000;
    last = t;
    if (!inView || userPaused || hovering || focused || document.hidden) return;
    state.forEach(function (s) {
      if (performance.now() < s.hold) return;
      s.pos += s.dir * SPEED * dt;
      wrap(s);
      s.row.scrollLeft = s.pos;
    });
  }
  const go = function () { measure(); requestAnimationFrame(tick); };
  if (document.readyState === "complete") go(); else window.addEventListener("load", go);
  window.addEventListener("resize", function () { state.forEach(function (s) { s.half = half(s); }); });
})();

/* ---------- 8. Google Business Profile links (shown only when set in config.js) ---------- */
(function () {
  const g = (window.PORTAL && window.PORTAL.google) || {};
  if (!g.profile && !g.review) return;
  const box = document.querySelector("[data-gbp]");
  if (!box) return;
  box.querySelectorAll("[data-gbp-link]").forEach(function (a) {
    const url = g[a.dataset.gbpLink];
    if (url) a.href = url; else a.hidden = true;
  });
  box.hidden = false;
})();
