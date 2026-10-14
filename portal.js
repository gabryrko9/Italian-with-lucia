/* Student area: a student sees only their own lessons (enforced by the database). */
(function () {
  const A = window.App, esc = A.esc;
  const root = document.getElementById("view-app");
  const P = window.PORTAL || {};

  let info = { private_min: 60, horizon_days: 42 };
  let lastLessons = [];
  const writeHref = (l) => "mailto:" + A.LUCIA + "?subject=" + encodeURIComponent("Lesson on " + A.day(l.starts_at) + " " + A.time(l.starts_at));

  async function render(user) {
    const sb = A.sb;
    const [st, pk, ls] = await Promise.all([
      sb.from("students").select("*"),
      sb.from("packages").select("*").order("created_at"),
      sb.from("lessons").select("*").order("starts_at")
    ]);
    const err = st.error || pk.error || ls.error;
    if (err) throw err;
    const student = st.data[0];

    if (!student) {
      root.innerHTML =
        '<div class="wrap ap-top"><h1>Almost there</h1>' +
        "<p>You are signed in as <b>" + esc(user.email) + "</b>, but Lucia has no student account with this email yet.</p></div>" +
        '<div class="wrap ap-sec"><div class="empty"><p>Use the email address Lucia has for you, or write to her and she will add you.</p>' +
        '<p style="margin-top:1rem"><a class="btn btn-ink" href="mailto:' + A.LUCIA + '?subject=' + encodeURIComponent("Student area access") + '">Write to Lucia</a></p></div></div>';
      return;
    }

    const lessons = ls.data, packages = pk.data;
    lastLessons = lessons;
    const now = Date.now();
    const bi = await sb.rpc("booking_info");
    if (bi.data) info = bi.data;
    const credit = packages.reduce((n, p) => n + Math.max(A.balance(p, lessons).left, 0), 0);
    const bookBtn = (cls) => credit > 0
      ? '<button class="btn ' + (cls || "btn-ink") + '" data-open-book type="button">Book a lesson</button>'
      : '<span class="note">You have no lessons left to book. <a href="mailto:' + A.LUCIA + '?subject=' + encodeURIComponent("New lesson package") + '"><b>Write to Lucia</b></a> for a new package.</span>';
    const upcoming = lessons.filter((l) => l.status === "scheduled" && new Date(l.starts_at).getTime() + l.duration_min * 60000 > now);
    const history = lessons.filter((l) => upcoming.indexOf(l) < 0).reverse();
    const first = esc((student.full_name || "").split(" ")[0]);
    const pkTitle = (id) => { const p = packages.find((x) => x.id === id); return p ? p.title : ""; };

    const lessonCard = (l, withCancel) => {
      const when = (withCancel ? A.day(l.starts_at) : A.dayYear(l.starts_at)) + ", " + A.time(l.starts_at);
      const canCancel = new Date(l.starts_at).getTime() - now >= 24 * A.HOUR;
      let action = "";
      if (withCancel) {
        action = canCancel
          ? (l.kind !== "group" ? '<button class="btn btn-quiet btn-sm" data-move="' + l.id + '" type="button">Move</button> ' : "") +
            '<button class="btn btn-quiet btn-sm" data-ask="' + l.id + '" type="button">Cancel lesson</button>'
          : '<span class="pill pill-warn">Less than 24h away</span> <a href="' + writeHref(l) + '">Write to Lucia</a>';
      }
      return (
        '<article class="item" id="l-' + l.id + '"><div class="ln"><div>' +
        '<div class="l-when">' + when + "</div>" +
        '<div class="l-meta">' + [A.KIND[l.kind], A.MODE[l.mode], l.duration_min + " min", pkTitle(l.package_id)].filter(Boolean).map(esc).join(" · ") + "</div></div>" +
        '<div class="btns">' + (withCancel ? '<a class="btn btn-quiet btn-sm" download="italian-lesson.ics" href="' + A.icsFor(l) + '">Calendar</a> ' + action : '<span class="pill pill-' + l.status + '">' + (l.status === "scheduled" ? "Awaiting confirmation" : A.STATUS[l.status]) + "</span>") + "</div></div>" +
        (l.notes ? '<div class="l-notes"><b>From Lucia</b>' + esc(l.notes) + "</div>" : "") +
        (withCancel ? '<div class="picker picker-card" id="mv-' + l.id + '" hidden></div>' : "") +
        "</article>"
      );
    };

    let h = '<div class="wrap ap-top"><h1>Ciao, ' + first + "!</h1><p>Your lessons with Lucia, in one place.</p>" +
      '<p class="tzhint">Times are shown in your time zone' + (A.tz ? " (" + esc(A.tz) + ")" : "") + ".</p></div>";

    // next lesson
    h += '<section class="wrap ap-sec">';
    if (upcoming.length) {
      const n = upcoming[0];
      h += '<div class="card-next"><div class="meta">Your next lesson</div><div class="when">' + A.dayLong(n.starts_at) + " at " + A.time(n.starts_at) + "</div>" +
        '<div class="meta">' + [A.KIND[n.kind], A.MODE[n.mode], n.duration_min + " min"].map(esc).join(" · ") + "</div></div>";
    } else {
      h += '<div class="empty"><b>No lesson booked yet.</b><p style="margin-top:.4rem">' + (credit > 0 ? "Pick a time and it shows up here." : "After your free trial, Lucia adds your package here. Then you can book your lessons yourself.") + '</p>' +
        '<p style="margin-top:1rem">' + bookBtn() + "</p></div>";
    }
    h += "</section>";

    // packages
    h += '<section class="wrap ap-sec"><h2>My package</h2>';
    if (packages.length) {
      h += '<div class="grid grid-2">';
      packages.slice().reverse().forEach((p) => {
        const b = A.balance(p, lessons);
        h += '<article class="card"><div class="ln"><h3>' + esc(p.title) + '</h3>' +
          (p.paid ? "" : '<span class="pill pill-warn">Payment pending</span>') + "</div>" +
          '<div style="margin:.8rem 0"><span class="pk-left">' + Math.max(b.left, 0) + '</span> <b>to book</b></div>' +
          A.dots(b) + '<p class="pk-nums">' + b.used + " taken · " + b.booked + " booked · " + b.total + " in total</p></article>";
      });
      h += "</div>";
      if (packages.some((p) => A.balance(p, lessons).left <= 0)) {
        h += '<p style="margin-top:1rem">Need more lessons? <a href="mailto:' + A.LUCIA + '?subject=' + encodeURIComponent("New lesson package") + '"><b>Write to Lucia</b></a>.</p>';
      }
    } else {
      h += '<div class="empty">No package yet. After your free trial, Lucia adds your package here.</div>';
    }
    h += "</section>";

    // upcoming
    h += '<section class="wrap ap-sec"><h2>Upcoming <small>' + upcoming.length + "</small></h2>";
    if (upcoming.length) {
      h += '<div class="list">' + upcoming.map((l) => lessonCard(l, true)).join("") + "</div>" +
        '<p class="note">You can move or cancel a lesson up to 24 hours before it starts. After that the lesson counts as taken. To change a lesson that is less than 24 hours away, write to Lucia.</p>' +
        '<p style="margin-top:1rem">' + bookBtn("btn-ink btn-sm") + "</p>";
    } else {
      h += '<div class="empty">Nothing booked at the moment.</div>';
    }
    h += '<div class="picker" id="book-panel" hidden></div></section>';

    // history
    h += '<section class="wrap ap-sec"><h2>Past lessons <small>' + history.length + "</small></h2>";
    h += history.length
      ? '<div class="list">' + history.map((l) => lessonCard(l, false)).join("") + "</div>"
      : '<div class="empty">Your finished lessons and Lucia\'s homework will appear here.</div>';
    h += "</section>";

    root.innerHTML = h;
  }

  /* picker with a confirm button under it, used for new bookings and for moving a lesson */
  function openPicker(host, o) {
    host.hidden = false;
    host.innerHTML = '<h3 style="margin-bottom:.4rem">' + esc(o.title) + '</h3><div data-pk></div><div class="bk-summary" data-sum hidden></div>' +
      '<div class="btns" style="margin-top:.9rem"><button class="btn btn-ink" data-go type="button" hidden>' + esc(o.cta) + '</button><button class="btn btn-quiet" data-x type="button">Close</button></div>';
    const sum = host.querySelector("[data-sum]"), go = host.querySelector("[data-go]");
    let sel = null;
    A.Booking.mount(host.querySelector("[data-pk]"), {
      sb: A.sb, minutes: o.minutes, modes: o.modes, horizon: info.horizon_days,
      onSelect(s) { sel = s; sum.hidden = go.hidden = !s; if (s) sum.textContent = A.dayLong(s.iso) + " at " + A.time(s.iso) + (o.modes.length > 1 ? ", " + (s.mode === "prague" ? "in Prague" : "online") : "") + "."; }
    });
    host.querySelector("[data-x]").addEventListener("click", () => { host.hidden = true; host.innerHTML = ""; });
    go.addEventListener("click", async () => {
      go.disabled = true;
      const { error } = await o.run(sel);
      if (error) { A.toast(A.errText(error), true); go.disabled = false; return; }
      A.toast(o.done);
      A.reload();
    });
    host.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  root.addEventListener("click", (e) => {
    const ob = e.target.closest("[data-open-book]"), mv = e.target.closest("[data-move]");
    if (ob) {
      openPicker(document.getElementById("book-panel"), {
        title: "Choose a time", cta: "Book this time", minutes: info.private_min, modes: ["online", "prague"], done: "Lesson booked.",
        run: (s) => A.sb.rpc("book_my_lesson", { p_start: s.iso, p_mode: s.mode })
      });
    } else if (mv) {
      const id = mv.dataset.move, l = lastLessons.find((x) => x.id === id);
      openPicker(document.getElementById("mv-" + id), {
        title: "Move this lesson to…", cta: "Move to this time", minutes: l.duration_min, modes: [l.mode], done: "Lesson moved.",
        run: (s) => A.sb.rpc("reschedule_my_lesson", { p_lesson_id: id, p_start: s.iso })
      });
    }
  });

  // two-step cancel, no pop-up needed
  root.addEventListener("click", async (e) => {
    const ask = e.target.closest("[data-ask]");
    const yes = e.target.closest("[data-yes]");
    const no = e.target.closest("[data-no]");
    if (ask) {
      const id = ask.dataset.ask;
      ask.parentElement.innerHTML = '<span>Cancel this lesson?</span> <button class="btn btn-danger btn-sm" data-yes="' + id + '" type="button">Yes, cancel it</button> <button class="btn btn-quiet btn-sm" data-no type="button">Keep it</button>';
    } else if (no) {
      A.reload();
    } else if (yes) {
      yes.disabled = true;
      const { error } = await A.sb.rpc("cancel_my_lesson", { p_lesson_id: yes.dataset.yes });
      if (error) { A.toast(A.errText(error), true); }
      else A.toast("Lesson cancelled.");
      A.reload();
    }
  });

  A.reload = async () => { const { data } = await A.sb.auth.getUser(); if (data && data.user) { try { await render(data.user); } catch (e) { A.toast(A.errText(e), true); } } };
  A.start(render);
})();
