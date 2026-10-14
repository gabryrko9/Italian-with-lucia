/* ==========================================================
   Italian with Lucia: settings
   Fill these in once (see GUIDA-AREA-STUDENTI.md).
   While "url" and "key" are empty, the website hides the
   student area completely, so nothing looks broken.
   ========================================================== */
window.PORTAL = {
  // Supabase > Project Settings > API > Project URL
  url: "",
  // Supabase > Project Settings > API > "anon public" key (it is safe to publish)
  key: "",
  // Optional: Lucia's Google Calendar appointment page, e.g. "https://calendar.app.google/xxxx"
  // While empty, "book a lesson" opens an email to Lucia.
  booking: "",
  // Optional: your Google Business Profile links. While empty, the "Find us on Google" block stays hidden.
  //   profile: the link of your Google Maps listing (Share > Copy link)
  //   review:  the "Ask for reviews" link (Google Business Profile > Get more reviews)
  google: { profile: "https://maps.app.goo.gl/mP7VrprirfnPiXVZ7", review: "https://g.page/r/CW8qh9uZ9dPwEBM/review" }
};
