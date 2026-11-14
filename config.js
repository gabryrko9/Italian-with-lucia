/* ==========================================================
   Italian with Lucia: settings
   Fill these in once (see GUIDA-AREA-STUDENTI.md).
   While "url" and "key" are empty, the website hides the
   student area completely, so nothing looks broken.
   ========================================================== */
window.PORTAL = {
  // Supabase > Project Settings > API > Project URL
  url: "https://fzorpizjmwonsgeomcwc.supabase.co",
  // Supabase > Project Settings > API > "anon public" key (it is safe to publish)
  key: "sb_publishable_fNjOTQ9gpw5RTpls9zCq5Q_Pkhi3UFB",
  // Optional: Lucia's Google Calendar appointment page, e.g. "https://calendar.app.google/xxxx"
  // While empty, "book a lesson" opens an email to Lucia.
  booking: "",
  // true = students can buy lesson packages by card in their area (needs Stripe, see _supabase/GUIDA.md)
  payments: false,
  // Optional: your Google Business Profile links. While empty, the "Find us on Google" block stays hidden.
  //   profile: the link of your Google Maps listing (Share > Copy link)
  //   review:  the "Ask for reviews" link (Google Business Profile > Get more reviews)
  // Optional: Cloudflare Web Analytics token (Cloudflare > Web Analytics > the site > "Manage site":
  // copy only the value after "token" in the JS snippet). While empty, nothing is counted.
  analytics: "09a43be5a40b40cc85b7d73fa37d74a5",
  google: { profile: "https://maps.app.goo.gl/mP7VrprirfnPiXVZ7", review: "https://g.page/r/CW8qh9uZ9dPwEBM/review" }
};
