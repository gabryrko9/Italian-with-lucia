/* ==========================================================
   Italian with Lucia: home.js (homepage only)
   Currency switch, level finder, counters, student-area link,
   Google Business block and visit statistics.
   ========================================================== */

/* ---------- 1. Currency switch ----------
   Prices are written once, in EUR, as data-eur="..." in index.html.
   Update the indicative exchange rates here when you want. */
var CURRENCIES = {
  EUR: { rate: 1,    symbol: "€",  after: false },
  CZK: { rate: 25,   symbol: "Kč", after: true  },  // 1 EUR ≈ 25 CZK
  USD: { rate: 1.15, symbol: "$",  after: false }   // 1 EUR ≈ 1.15 USD
};
function money(eur, code) {
  var c = CURRENCIES[code];
  var v = eur * c.rate;
  v = code === "CZK" ? Math.round(v / 5) * 5 : Math.round(v);
  var n = v.toLocaleString("en-US").replace(/,/g, code === "CZK" ? " " : ",");
  return c.after ? n + " " + c.symbol : c.symbol + n;
}
function setCurrency(code) {
  document.querySelectorAll("[data-eur]").forEach(function (el) {
    el.textContent = money(parseFloat(el.dataset.eur), code);
  });
  document.querySelectorAll(".cur").forEach(function (b) {
    var on = b.dataset.currency === code;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
document.querySelectorAll(".cur").forEach(function (b) {
  b.addEventListener("click", function () { setCurrency(b.dataset.currency); });
});

/* ---------- 2. Level finder ---------- */
var LEVELS = {
  beginner:     { name: "Beginner (A1–A2)", text: "You build your base with plenty of speaking from day one. The Beginner group or private lessons both fit.", cta: "Reserve a place in the January group" },
  intermediate: { name: "Intermediate (B1)", text: "You can already talk, so the work is accuracy and range: past tenses, vocabulary and fluent conversation. This group opens as soon as three people sign up.", cta: "Join the waiting list" },
  advanced:     { name: "Advanced (B2–C1)", text: "You are fluent, so the work is nuance, idioms and register, with precise feedback. This group opens as soon as three people sign up.", cta: "Join the waiting list" }
};
var result = document.getElementById("level-result");
document.querySelectorAll(".opt").forEach(function (b) {
  b.addEventListener("click", function () {
    document.querySelectorAll(".opt").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
    var key = b.dataset.lvl, l = LEVELS[key];
    document.getElementById("level-title").textContent = l.name;
    document.getElementById("level-text").textContent = l.text;
    var reserve = document.getElementById("level-reserve");
    reserve.textContent = l.cta;
    reserve.href = "italian-group-course.html?level=" + key + "#reserve";
    result.hidden = false;
    result.classList.remove("pop-in"); void result.offsetWidth; result.classList.add("pop-in");
  });
});

/* ---------- 3. Counters in the hero (2,000+ hours, 150+ students) ---------- */
(function () {
  var els = document.querySelectorAll("[data-count]");
  if (!els.length) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  els.forEach(function (el) { el.textContent = "0"; });
  var t0 = performance.now() + 700, dur = 1600;
  function tick(now) {
    var k = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
    els.forEach(function (el) {
      el.textContent = Math.round(parseFloat(el.dataset.count) * e).toLocaleString("en-US");
    });
    if (k < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ---------- 4. Student area link: shown only when config.js is filled in ---------- */
if (window.PORTAL && window.PORTAL.url && window.PORTAL.key) {
  document.querySelectorAll("[data-portal]").forEach(function (el) { el.hidden = false; });
}
var BOOKING_URL = (window.PORTAL && window.PORTAL.booking) || "";
var lessonBtn = document.getElementById("lesson-book");
if (lessonBtn && window.PORTAL && window.PORTAL.url && window.PORTAL.key) {
  lessonBtn.href = "portal.html";
} else if (lessonBtn && BOOKING_URL) {
  lessonBtn.href = BOOKING_URL;
  lessonBtn.target = "_blank";
  lessonBtn.rel = "noopener";
}

/* ---------- 5. Google Business Profile block ---------- */
(function () {
  var g = window.PORTAL && window.PORTAL.google;
  var box = document.querySelector("[data-gbp]");
  if (!box || !g || (!g.profile && !g.review)) return;
  box.querySelectorAll("[data-gbp-link]").forEach(function (a) {
    var url = g[a.dataset.gbpLink];
    if (url) a.href = url; else a.hidden = true;
  });
  box.hidden = false;
})();

/* ---------- 6. Visit statistics (Cloudflare Web Analytics) ---------- */
(function () {
  var token = window.PORTAL && window.PORTAL.analytics;
  if (!token) return;
  var s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: token }));
  document.head.appendChild(s);
})();
