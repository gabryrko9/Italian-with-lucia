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
