/* ============================================================
   Italian with Lucia — script.js
   ============================================================ */

/* ---------- 1. Currency toggle ----------
   Base prices live in HTML as data-eur attributes.
   To update exchange rates, edit ONLY the numbers below.       */
const RATES = {
  EUR: { rate: 1,    symbol: "€",  locale: "en-IE", decimals: 0 },
  CZK: { rate: 25,   symbol: "Kč", locale: "cs-CZ", decimals: 0 },  // 1 EUR ≈ 25 CZK (indicative)
  USD: { rate: 1.15, symbol: "$",  locale: "en-US", decimals: 0 }   // 1 EUR ≈ 1.15 USD (indicative)
};

function formatMoney(eur, currency) {
  const { rate, symbol } = RATES[currency];
  let value = eur * rate;
  // Round CZK to a friendly number, keep one decimal for small EUR/USD amounts
  if (currency === "CZK") value = Math.round(value / 5) * 5;
  const hasDecimals = value % 1 !== 0 && currency !== "CZK";
  const formatted = hasDecimals ? value.toFixed(2) : Math.round(value).toString();
  return currency === "CZK" ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

function applyCurrency(currency) {
  document.querySelectorAll("[data-eur]").forEach(el => {
    el.textContent = formatMoney(parseFloat(el.dataset.eur), currency);
  });
  document.querySelectorAll(".currency-btn").forEach(btn => {
    const active = btn.dataset.currency === currency;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

document.querySelectorAll(".currency-btn").forEach(btn => {
  btn.addEventListener("click", () => applyCurrency(btn.dataset.currency));
});

/* ---------- 2. Mobile navigation ---------- */
const toggle = document.querySelector(".nav-toggle");
const menu = document.querySelector(".nav-menu");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  menu.querySelectorAll("a").forEach(link =>
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

/* ---------- 3. Scroll reveal (respects reduced motion) ---------- */
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReduced && "IntersectionObserver" in window) {
  const targets = document.querySelectorAll(".section h2, .card, .price-card, blockquote, .where-card");
  targets.forEach(t => t.classList.add("reveal"));

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(t => io.observe(t));
}
