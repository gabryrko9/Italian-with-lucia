/* Shared helpers for portal.html (students) and admin.html (Lucia). */
(function () {
  const P = window.PORTAL || {};
  const App = (window.App = {});
  const $ = (id) => document.getElementById(id);

  App.LUCIA = "lucia.scollo2000@gmail.com";
  App.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (o) => new Intl.DateTimeFormat("en-GB", o);
  App.day = (iso) => fmt({ weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
  App.dayLong = (iso) => fmt({ weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
  App.dayYear = (iso) => fmt({ day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  App.time = (iso) => fmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
  App.tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").replace("_", " ");
  App.toInput = (iso) => {
    const d = new Date(iso), p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
  };
  App.HOUR = 3600 * 1000;
  App.STATUS = { scheduled: "Booked", done: "Done", cancelled: "Cancelled", missed: "Missed" };
  App.KIND = { trial: "Free trial", private: "Private lesson", group: "Group lesson" };
  App.MODE = { online: "Online", prague: "In Prague" };

  /* Package balance. "Done" and "missed" lessons are used up, "booked" lessons are
     reserved, cancelled lessons give the credit back. */
  App.balance = (pkg, lessons) => {
    let used = 0, booked = 0;
    lessons.forEach((l) => {
      if (l.package_id !== pkg.id) return;
      if (l.status === "done" || l.status === "missed") used++;
      else if (l.status === "scheduled") booked++;
    });
    return { used, booked, left: pkg.lessons_total - used - booked, total: pkg.lessons_total };
  };
  App.dots = (b) => {
    let h = "";
    for (let i = 0; i < b.total; i++) h += '<i class="' + (i < b.used ? "d-used" : i < b.used + b.booked ? "d-booked" : "d-left") + '"></i>';
    return '<span class="dots" role="img" aria-label="' + b.used + " taken, " + b.booked + " booked, " + b.left + ' left">' + h + "</span>";
  };

  let toastTimer;
  App.toast = (msg, bad) => {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast show" + (bad ? " bad" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.className = "toast"), 4500);
  };
  App.errText = (e) => (e && e.message) || "Something went wrong. Please try again.";

  /* Page lifecycle: setup notice, login screen, then the app. */
  App.start = function (render) {
    const show = (id) => ["view-setup", "view-login", "view-app"].forEach((v) => $(v) && ($(v).hidden = v !== id));
    const out = $("signout");
    if (!P.url || !P.key || !window.supabase) { show("view-setup"); return; }
    const sb = (App.sb = window.supabase.createClient(P.url, P.key, { auth: { persistSession: true, detectSessionInUrl: true } }));

    const form = $("login-form"), msg = $("login-msg");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("login-email").value.trim().toLowerCase();
      if (!email) return;
      const btn = form.querySelector("button");
      btn.disabled = true;
      msg.className = "note"; msg.textContent = "Sending…";
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true } });
      btn.disabled = false;
      if (error) { msg.className = "note bad"; msg.textContent = App.errText(error); return; }
      msg.className = "note ok";
      msg.textContent = "Check your inbox: we sent a sign-in link to " + email + ". It can take a minute. Look in spam too.";
    });

    out.addEventListener("click", async () => { await sb.auth.signOut(); });

    let current = null;
    const apply = async (session) => {
      const user = session && session.user;
      if (!user) { current = null; out.hidden = true; show("view-login"); return; }
      if (current === user.id) return;
      current = user.id;
      out.hidden = false;
      if (location.hash.indexOf("access_token") > -1) history.replaceState(null, "", location.pathname);
      show("view-app");
      try { await render(user); } catch (e) { $("view-app").innerHTML = '<div class="wrap"><p class="note bad">' + App.esc(App.errText(e)) + "</p></div>"; }
    };
    sb.auth.onAuthStateChange((_ev, session) => { setTimeout(() => apply(session), 0); });
    sb.auth.getSession().then(({ data }) => apply(data.session));
  };
})();
