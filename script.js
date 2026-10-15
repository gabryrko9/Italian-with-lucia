/* ==========================================================
   Italian with Lucia: script.js
   ========================================================== */

/* ---------- 0. Booking ----------
   Online booking (needs config.js url + key):
     * new people book their free trial on book.html, no account needed;
     * students book and move lessons in their student area.
   Without it, buttons fall back to Lucia's Google Calendar page ("booking" in config.js)
   or to a pre-filled email, so nothing is ever broken. */
const CS = document.documentElement.lang === "cs";          // Czech pages live in /cs/
const t = function (en, cs) { return CS ? cs : en; };
const ROOT = CS ? "../" : "";
const PORTAL_ON = !!(window.PORTAL && window.PORTAL.url && window.PORTAL.key);
const BOOKING_URL = (window.PORTAL && window.PORTAL.booking) || "";
const lessonBtn = document.getElementById("lesson-book");
if (PORTAL_ON) {
  document.querySelectorAll('a[href^="mailto:"][href*="subject=Free%20trial"], a[data-trial]').forEach(function (a) {
    a.href = ROOT + "book.html";
    a.removeAttribute("target");
    var txt = a.textContent.trim();
    if (CS) { if (!/^lekce zdarma$/i.test(txt)) a.textContent = "Rezervovat lekci zdarma"; }
    else if (/email lucia for a free trial/i.test(txt)) a.textContent = "Book your free trial";
    else if (/^free trial$/i.test(txt)) a.textContent = "Free trial";
    else if (/email lucia/i.test(txt)) a.textContent = "Book your free trial";
  });
  if (lessonBtn) {
    lessonBtn.href = ROOT + "portal.html";
    lessonBtn.removeAttribute("target");
    lessonBtn.textContent = t("Choose your next lesson", "Vybrat další lekci");
    document.getElementById("booknow-text").textContent = t(
      "Sign in to your student area, pick a free time and your lesson is booked. You can see your package, move a lesson or cancel it up to 24 hours before.",
      "Přihlaste se do studentské sekce, vyberte volný termín a lekce je zarezervovaná. Uvidíte svůj balíček a lekci můžete přesunout nebo zrušit nejpozději 24 hodin předem.");
  }
} else if (BOOKING_URL && lessonBtn) {
  lessonBtn.href = BOOKING_URL;
  lessonBtn.target = "_blank";
  lessonBtn.rel = "noopener";
  lessonBtn.textContent = t("Choose your next lesson", "Vybrat další lekci");
  document.getElementById("booknow-text").textContent = t(
    "Choose your next lesson in Lucia's Google Calendar. You get a confirmation email and reminders, and Lucia sees every booking in her calendar.",
    "Další lekci si vyberete v Luciině Google kalendáři. Dostanete potvrzení e-mailem i připomínky a Lucia vidí každou rezervaci ve svém kalendáři.");
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
if (CS && document.querySelector("[data-eur]")) setCurrency("CZK"); // Czech visitors see crowns first

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
    f.title = t("Lucia introduces herself", "Lucia se představuje");
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    box.replaceChildren(f);
  });
}

/* ---------- 4. Level finder ---------- */
const LEVELS = CS ? {
  beginner:     { name: "Začátečníci (A1–A2)", text: "Postavíte si základy a mluvit budete od první lekce. Hodí se skupina pro začátečníky i individuální lekce." },
  intermediate: { name: "Mírně pokročilí (B1)", text: "Domluvíte se, takže se zaměříte na přesnost a rozsah: minulé časy, slovní zásobu a plynulou konverzaci." },
  advanced:     { name: "Pokročilí (B2–C1)", text: "Mluvíte plynule, takže pracujete na nuancích, idiomech a stylu, s přesnou zpětnou vazbou." }
} : {
  beginner:     { name: "Beginner (A1–A2)", text: "You build your base with plenty of speaking from day one. The Beginner group or private lessons both fit." },
  intermediate: { name: "Intermediate (B1)", text: "You can already talk, so the work is accuracy and range: past tenses, vocabulary and fluent conversation." },
  advanced:     { name: "Advanced (B2–C1)", text: "You are fluent, so the work is nuance, idioms and register, with precise feedback." }
};
const resultBox = document.getElementById("level-result");
document.querySelectorAll('input[name="lvl"]').forEach(function (r) {
  r.addEventListener("change", function () {
    const l = LEVELS[r.value];
    document.getElementById("level-title").textContent = l.name;
    document.getElementById("level-text").textContent = l.text;
    document.getElementById("level-reserve").href =
      t("italian-group-course.html", "skupinovy-kurz-italstiny.html") + "?level=" + r.value + "#reserve";
    resultBox.hidden = false;
  });
});

/* ---------- 4b. Group course reservation form ----------
   Sends the form to Lucia's Gmail through FormSubmit (formsubmit.co) without
   leaving the page. Without JavaScript the form still posts normally and
   FormSubmit brings the visitor back here with ?sent=1. If sending fails,
   the visitor gets a pre-filled email to Lucia instead, so no request is lost. */
(function () {
  const form = document.getElementById("reserve-form");
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const status = form.querySelector(".reserve-status");
  const btn = form.querySelector('button[type="submit"]');
  const lvl = params.get("level");
  if (lvl) {
    const o = form.querySelector('option[data-level="' + lvl + '"]');
    if (o) o.selected = true;
  }
  try {
    if (!form.elements.time_zone.value) form.elements.time_zone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch (e) { /* old browser: the visitor types it */ }

  const done = function () {
    form.innerHTML = "<div class=\"reserve-done\"><p class=\"reserve-done-title\">" +
      t("Thank you! Your reservation is on its way.", "Děkujeme! Přihláška je odeslaná.") + "</p><p>" +
      t("Lucia replies within 24 hours to confirm your level and the day and time of your group. Check your spam folder if you do not hear from her.",
        "Lucia odpoví do 24 hodin a potvrdí vaši úroveň a den a čas skupiny. Pokud odpověď nepřijde, podívejte se do složky se spamem.") + "</p></div>";
    form.scrollIntoView({ block: "center" });
  };
  if (params.get("sent")) { done(); return; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.elements._honey.value) return;
    const data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    delete data._next; delete data._honey;
    data._subject = t("Group course reservation", "Přihláška do skupinového kurzu") + ": " + data.level + " – " + data.name;
    data._replyto = data.email;
    btn.disabled = true;
    status.textContent = t("Sending…", "Odesílám…");
    const fail = function () {
      btn.disabled = false;
      const body = Object.keys(data).filter(function (k) { return k.charAt(0) !== "_"; })
        .map(function (k) { return k + ": " + data[k]; }).join("\n");
      const href = "mailto:lucia.scollo2000@gmail.com?subject=" + encodeURIComponent(data._subject) + "&body=" + encodeURIComponent(body);
      status.innerHTML = t("Sorry, the form could not be sent. ", "Formulář se nepodařilo odeslat. ") +
        "<a href=\"" + href + "\">" + t("Send the same details by email", "Pošlete stejné údaje e-mailem") + "</a>.";
    };
    fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); })
      .then(function (res) { if (String(res.success) === "true") done(); else fail(); })
      .catch(fail);
  });
})();

/* ---------- 5. Copy the email address ---------- */
const copyBtn = document.getElementById("copy-mail");
if (copyBtn) {
  copyBtn.addEventListener("click", function () {
    const email = copyBtn.dataset.email;
    const done = function () {
      const old = copyBtn.textContent;
      copyBtn.textContent = t("Copied!", "Zkopírováno!");
      document.getElementById("copy-status").textContent = t("Email address copied", "E-mailová adresa zkopírována");
      setTimeout(function () { copyBtn.textContent = old; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(done, function () { window.prompt(t("Copy this address:", "Zkopírujte adresu:"), email); });
    } else {
      window.prompt(t("Copy this address:", "Zkopírujte adresu:"), email);
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
    toggle.setAttribute("aria-label", userPaused ? t("Play the moving reviews", "Spustit posouvání recenzí") : t("Pause the moving reviews", "Zastavit posouvání recenzí"));
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

/* ---------- 9. Mobile menu, bottom dock, plan dots ---------- */
(function () {
  const btn = document.getElementById("menu-btn"), menu = document.getElementById("menu");
  if (btn && menu) {
    const set = function (open) {
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? t("Close menu", "Zavřít menu") : t("Open menu", "Otevřít menu"));
      document.body.classList.toggle("menu-open", open);
    };
    btn.addEventListener("click", function () { set(menu.hidden); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { set(false); btn.focus(); } });
    window.matchMedia("(min-width: 880px)").addEventListener("change", function (e) { if (e.matches) set(false); });
  }

  const dock = document.getElementById("dock");
  if (dock) {
    let past = false, atEnd = false;
    const update = function () { dock.classList.toggle("show", past && !atEnd); };
    window.addEventListener("scroll", function () { past = window.scrollY > 520; update(); }, { passive: true });
    if ("IntersectionObserver" in window) {
      const seen = new Set();
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) seen.add(en.target); else seen.delete(en.target); });
        atEnd = seen.size > 0; update();
      });
      document.querySelectorAll("#book, #reserve, .foot").forEach(function (el) { io.observe(el); });
    }
  }

  const plans = document.querySelector(".plans");
  if (plans) {
    const cards = plans.querySelectorAll(".plan");
    const dots = document.createElement("div");
    dots.className = "plans-dots";
    dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = Array.prototype.map.call(cards, function () { return "<i></i>"; }).join("") + "<span>" + t("Swipe to compare", "Posuňte pro porovnání") + "</span>";
    plans.insertAdjacentElement("afterend", dots);
    const mark = function () {
      const w = cards[0].getBoundingClientRect().width + 14;
      const i = Math.min(cards.length - 1, Math.round(plans.scrollLeft / w));
      dots.querySelectorAll("i").forEach(function (d, k) { d.classList.toggle("on", k === i); });
    };
    plans.addEventListener("scroll", mark, { passive: true });
    mark();
  }
})();

/* ---------- 10. Visit statistics (Cloudflare Web Analytics) ----------
   Cookie-free page counts, loaded only when "analytics" in config.js has a token. */
(function () {
  const token = window.PORTAL && window.PORTAL.analytics;
  if (!token) return;
  const s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: token }));
  document.head.appendChild(s);
})();
