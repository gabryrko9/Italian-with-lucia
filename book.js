/* Free-trial booking page: anyone can pick a free time, no account needed. */
(function () {
  const A = window.App, esc = A.esc, $ = (id) => document.getElementById(id);
  const show = (id) => ["view-setup", "view-app", "view-done"].forEach((v) => ($(v).hidden = v !== id));
  const sb = A.anon();
  if (!sb) { show("view-setup"); return; }
  show("view-app");

  let sel = null, picker = null, minutes = 30;
  const form = $("bk-form"), msg = $("bk-msg");
  const whenText = (iso) => A.dayLong(iso) + " at " + A.time(iso);
  const modeText = (m) => (m === "prague" ? "in person in Prague" : "online");

  async function init() {
    let horizon = 42;
    const info = await sb.rpc("booking_info");
    if (info.data) { minutes = info.data.trial_min || 30; horizon = info.data.horizon_days || 42; }
    picker = A.Booking.mount($("picker"), {
      sb, minutes, horizon, modes: ["online", "prague"],
      onSelect(s) {
        sel = s;
        form.hidden = !s;
        if (s) { msg.textContent = ""; $("pick-msg").textContent = ""; }
        if (s) {
          $("bk-summary").textContent = whenText(s.iso) + ", " + minutes + " minutes, " + modeText(s.mode) + ".";
          if (!form.dataset.seen) { form.dataset.seen = "1"; setTimeout(() => form.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60); }
        }
      }
    });
  }
  init();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!sel) return;
    const fd = new FormData(form);
    if (fd.get("website")) return;                       // honeypot: bots fill this in
    const name = (fd.get("name") || "").trim(), email = (fd.get("email") || "").trim();
    msg.className = "note bad";
    if (name.length < 2) { msg.textContent = "Please enter your name."; form.name.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = "Please enter a valid email address."; form.email.focus(); return; }
    if (!form.consent.checked) { msg.textContent = "Please tick the box so Lucia can store your details."; return; }
    const btn = $("bk-submit"); btn.disabled = true; msg.className = "note"; msg.textContent = "Booking…";
    const { data, error } = await sb.rpc("book_trial", {
      p_name: name, p_email: email, p_start: sel.iso, p_mode: sel.mode,
      p_level: fd.get("level") || null, p_goal: (fd.get("goal") || "").trim() || null, p_tz: A.tz || null
    });
    btn.disabled = false;
    if (error) {
      const text = A.errText(error);
      if (/taken|no longer available/i.test(text)) {      // someone else got the time: show fresh times
        picker.reload();
        $("pick-msg").textContent = text;
      } else { msg.className = "note bad"; msg.textContent = text; }
      return;
    }
    const lesson = { id: "trial-" + Date.parse(sel.iso), starts_at: sel.iso, duration_min: (data && data.duration_min) || minutes, kind: "trial", mode: sel.mode };
    $("done-box").innerHTML =
      "<h2>You're booked, " + esc(name.split(" ")[0]) + "!</h2>" +
      '<p class="when">' + esc(whenText(sel.iso)) + "</p>" +
      "<p>" + lesson.duration_min + "-minute free trial, " + modeText(sel.mode) + (A.tz ? " · times in " + esc(A.tz) : "") + ".</p>" +
      "<ul><li>" + (sel.mode === "online" ? "Lucia sends you the video link by email before the lesson." : "Lucia confirms the meeting place by email.") + " Keep an eye on <b>" + esc(email) + "</b> (and spam).</li>" +
      "<li>Need to move it? You can cancel or change a lesson up to 24 hours before. Just write to <a href=\"mailto:" + A.LUCIA + "\">" + A.LUCIA + "</a>.</li>" +
      '<li>After the trial, your lessons and package appear in your <a href="portal.html">student area</a>.</li></ul>' +
      '<p style="margin-top:1.1rem"><a class="btn btn-ink" download="italian-with-lucia-trial.ics" href="' + A.icsFor(lesson) + '">Add to my calendar</a></p>';
    show("view-done");
    $("done-box").focus();
    window.scrollTo(0, 0);
  });
  A.reload = () => {};
})();
