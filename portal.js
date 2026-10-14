/* Student area: a student sees only their own lessons (enforced by the database). */
(function () {
  const A = window.App, esc = A.esc;
  const root = document.getElementById("view-app");
  const P = window.PORTAL || {};

  const bookHref = P.booking || "mailto:" + A.LUCIA + "?subject=" + encodeURIComponent("Book my next lesson");
  const bookAttrs = P.booking ? ' target="_blank" rel="noopener"' : "";
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
    const now = Date.now();
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
          ? '<button class="btn btn-quiet btn-sm" data-ask="' + l.id + '" type="button">Cancel lesson</button>'
          : '<span class="pill pill-warn">Less than 24h away</span> <a href="' + writeHref(l) + '">Write to Lucia</a>';
      }
      return (
        '<article class="item" id="l-' + l.id + '"><div class="ln"><div>' +
        '<div class="l-when">' + when + "</div>" +
        '<div class="l-meta">' + [A.KIND[l.kind], A.MODE[l.mode], l.duration_min + " min", pkTitle(l.package_id)].filter(Boolean).map(esc).join(" · ") + "</div></div>" +
        '<div class="btns">' + (withCancel ? action : '<span class="pill pill-' + l.status + '">' + (l.status === "scheduled" ? "Awaiting confirmation" : A.STATUS[l.status]) + "</span>") + "</div></div>" +
        (l.notes ? '<div class="l-notes"><b>From Lucia</b>' + esc(l.notes) + "</div>" : "") +
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
      h += '<div class="empty"><b>No lesson booked yet.</b><p style="margin-top:.4rem">Book your next lesson and it shows up here.</p>' +
        '<p style="margin-top:1rem"><a class="btn btn-ink" href="' + esc(bookHref) + '"' + bookAttrs + ">Book a lesson</a></p></div>";
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
        '<p class="note">You can cancel up to 24 hours before a lesson. After that the lesson counts as taken. To change a lesson that is less than 24 hours away, write to Lucia.</p>' +
        '<p style="margin-top:1rem"><a class="btn btn-ink btn-sm" href="' + esc(bookHref) + '"' + bookAttrs + ">Book another lesson</a></p>";
    } else {
      h += '<div class="empty">Nothing booked at the moment.</div>';
    }
    h += "</section>";

    // history
    h += '<section class="wrap ap-sec"><h2>Past lessons <small>' + history.length + "</small></h2>";
    h += history.length
      ? '<div class="list">' + history.map((l) => lessonCard(l, false)).join("") + "</div>"
      : '<div class="empty">Your finished lessons and Lucia\'s homework will appear here.</div>';
    h += "</section>";

    root.innerHTML = h;
  }

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
