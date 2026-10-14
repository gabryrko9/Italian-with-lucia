/* Lucia's admin panel. Only emails listed in the "admins" table can use it
   (enforced by the database, not by this page). */
(function () {
  const A = window.App, esc = A.esc;
  const root = document.getElementById("view-app");
  const dlg = document.getElementById("dlg");
  let isAdmin = false;
  let S = { students: [], packages: [], lessons: [], avail: [], off: [], settings: null };

  const PRESETS = [
    { t: "5 lessons", n: 5, p: 150 },
    { t: "10 lessons", n: 10, p: 270 },
    { t: "20 lessons", n: 20, p: 500 },
    { t: "Group course (12 lessons)", n: 12, p: 216 },
    { t: "Single lesson", n: 1, p: 30 }
  ];

  async function fetchAll(table, order) {
    let out = [], from = 0;
    for (;;) {
      const { data, error } = await A.sb.from(table).select("*").order(order).range(from, from + 999);
      if (error) throw error;
      out = out.concat(data);
      if (data.length < 1000) return out;
      from += 1000;
    }
  }
  async function load() {
    const [students, packages, lessons, avail, off, set] = await Promise.all([
      fetchAll("students", "full_name"), fetchAll("packages", "created_at"), fetchAll("lessons", "starts_at"),
      A.sb.from("availability").select("*").order("start_time"), A.sb.from("time_off").select("*").order("starts_on"), A.sb.from("booking_settings").select("*")
    ]);
    // the booking tables arrive with the booking update; an older database simply has none yet
    S = { students, packages, lessons, avail: avail.data || [], off: off.data || [], settings: (set.data || [])[0] || null, hasBooking: !avail.error };
  }
  const student = (id) => S.students.find((s) => s.id === id);
  const pkgsOf = (sid) => S.packages.filter((p) => p.student_id === sid);
  const lessonsOf = (sid) => S.lessons.filter((l) => l.student_id === sid);
  const nameOf = (id) => (student(id) ? student(id).full_name : "?");
  const run = async (promise, okMsg) => {
    const { error } = await promise;
    if (error) { A.toast(A.errText(error), true); return false; }
    if (okMsg) A.toast(okMsg);
    return true;
  };
  const refresh = async () => { await load(); route(); };

  /* ---------- pages ---------- */
  function shell(active, inner) {
    return '<div class="wrap"><nav class="tabs" aria-label="Sections">' +
      '<a href="#overview"' + (active === "overview" ? ' aria-current="page"' : "") + ">Overview</a>" +
      '<a href="#students"' + (active === "students" ? ' aria-current="page"' : "") + ">Students</a>" +
      '<a href="#availability"' + (active === "availability" ? ' aria-current="page"' : "") + ">My hours</a></nav></div>" + inner;
  }

  function lessonLine(l, opts) {
    opts = opts || {};
    return '<article class="item"><div class="ln"><div>' +
      '<div class="l-when">' + (opts.date ? A.day(l.starts_at) + ", " : "") + A.time(l.starts_at) + " · " +
      '<a href="#student/' + l.student_id + '">' + esc(nameOf(l.student_id)) + "</a></div>" +
      '<div class="l-meta">' + [A.KIND[l.kind], A.MODE[l.mode], l.duration_min + " min"].map(esc).join(" · ") + "</div></div>" +
      '<div class="btns">' + (opts.close
        ? '<button class="btn btn-ok btn-sm" data-set="done" data-id="' + l.id + '" type="button">Done</button>' +
          '<button class="btn btn-quiet btn-sm" data-set="missed" data-id="' + l.id + '" type="button">Missed</button>' +
          '<button class="btn btn-quiet btn-sm" data-set="cancelled" data-id="' + l.id + '" type="button">Cancelled</button>'
        : '<button class="btn btn-quiet btn-sm" data-edit="' + l.id + '" type="button">Edit</button>') +
      "</div></div></article>";
  }

  function overview() {
    const now = Date.now();
    const end = (l) => new Date(l.starts_at).getTime() + l.duration_min * 60000;
    const toClose = S.lessons.filter((l) => l.status === "scheduled" && end(l) < now);
    const soon = S.lessons.filter((l) => l.status === "scheduled" && end(l) >= now && new Date(l.starts_at).getTime() < now + 30 * 24 * A.HOUR);
    const today = soon.filter((l) => new Date(l.starts_at).toDateString() === new Date().toDateString());

    // credit alerts: look at each student's most recent package
    const alerts = [];
    S.students.forEach((s) => {
      const ps = pkgsOf(s.id);
      if (!ps.length) return;
      const p = ps[ps.length - 1], b = A.balance(p, S.lessons);
      if (b.left <= 1) alerts.push({ s, p, b });
      else if (!p.paid) alerts.push({ s, p, b, unpaidOnly: true });
    });

    let h = '<div class="wrap ap-top"><h1>Overview</h1><p>' + soon.length + " lessons in the next 30 days · " + today.length + " today · " + S.students.length + " students.</p>" +
      '<p class="tzhint">Times in ' + esc(A.tz) + "</p></div>";

    const recent = S.lessons.filter((l) => l.booked_by && l.booked_by !== "lucia" && l.status === "scheduled" && new Date(l.created_at).getTime() > now - 7 * 24 * A.HOUR)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    if (recent.length) {
      h += '<section class="ap-sec"><div class="wrap"><h2>Booked online <small>' + recent.length + '</small></h2><p class="note" style="margin:-.4rem 0 .8rem">New bookings from the last 7 days, made by students and by new people on the website.</p><div class="list">' +
        recent.map((l) => {
          const st = student(l.student_id) || {};
          return '<article class="item"><div class="ln"><div><div class="l-when">' + A.day(l.starts_at) + ", " + A.time(l.starts_at) + " · " +
            '<a href="#student/' + l.student_id + '">' + esc(st.full_name || "?") + "</a> " + (l.kind === "trial" ? '<span class="pill pill-new">New trial</span>' : "") + "</div>" +
            '<div class="l-meta">' + [A.KIND[l.kind], A.MODE[l.mode], l.duration_min + " min", st.level, st.tz, st.email].filter(Boolean).map(esc).join(" · ") + "</div>" +
            (st.goal && l.kind === "trial" ? '<div class="l-meta">Goal: ' + esc(st.goal) + "</div>" : "") +
            "</div></div></article>";
        }).join("") + "</div></div></section>";
    }

    if (toClose.length) {
      h += '<section class="ap-sec"><div class="wrap"><h2>To close <small>' + toClose.length + "</small></h2>" +
        '<p class="note" style="margin:-.4rem 0 .8rem">These lessons have happened. Mark them so the package balance stays right.</p><div class="list">' +
        toClose.slice().reverse().map((l) => lessonLine(l, { date: true, close: true })).join("") + "</div></div></section>";
    }

    h += '<section class="ap-sec"><div class="wrap"><h2>Next 30 days</h2>';
    if (soon.length) {
      let last = "";
      soon.forEach((l) => {
        const d = A.dayLong(l.starts_at);
        if (d !== last) { h += '<div class="daygroup">' + d + (new Date(l.starts_at).toDateString() === new Date().toDateString() ? " (today)" : "") + '</div>'; last = d; }
        h += '<div class="list" style="margin-bottom:.5rem">' + lessonLine(l) + "</div>";
      });
    } else h += '<div class="empty">No lessons booked in the next 30 days.</div>';
    h += "</div></section>";

    h += '<section class="ap-sec"><div class="wrap"><h2>Credit and payments <small>' + alerts.length + "</small></h2>";
    if (alerts.length) {
      h += '<div class="list">' + alerts.map((a) => '<a class="item is-link" href="#student/' + a.s.id + '"><div class="ln"><div><div class="l-when">' + esc(a.s.full_name) + '</div><div class="l-meta">' + esc(a.p.title) + " · " + a.b.left + " left to book</div></div><div class=\"btns\">" +
        (a.b.left <= 0 && !a.unpaidOnly ? '<span class="pill pill-warn">No credit left</span>' : a.b.left === 1 && !a.unpaidOnly ? '<span class="pill pill-warn">1 left</span>' : "") +
        (a.p.paid ? "" : '<span class="pill pill-missed">Unpaid</span>') + "</div></div></a>").join("") + "</div>";
    } else h += '<div class="empty">Everyone has credit and is paid.</div>';
    h += "</div></section>";
    return shell("overview", h);
  }

  function studentsPage() {
    const nextOf = (sid) => S.lessons.find((l) => l.student_id === sid && l.status === "scheduled" && new Date(l.starts_at).getTime() > Date.now());
    let h = '<div class="wrap ap-top"><h1>Students</h1></div><section class="ap-sec"><div class="wrap">' +
      '<details class="add" id="add-student"><summary>Add a student</summary><form class="f" id="f-student">' +
      '<div class="f-row"><label>Full name<input name="full_name" required></label><label>Email (the one they sign in with)<input name="email" type="email" required></label>' +
      '<label>Level<select name="level"><option value="">Not set</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option></select></label></div>' +
      '<div><button class="btn btn-ink" type="submit">Add student</button></div></form></details>' +
      '<input class="search" id="search" type="search" placeholder="Search by name or email" aria-label="Search students" style="margin-bottom:1rem">' +
      '<div class="list" id="student-list"></div></div></section>';
    setTimeout(() => {
      const draw = () => {
        const q = document.getElementById("search").value.trim().toLowerCase();
        const rows = S.students.filter((s) => !q || (s.full_name + " " + s.email).toLowerCase().indexOf(q) > -1);
        document.getElementById("student-list").innerHTML = rows.length ? rows.map((s) => {
          const ps = pkgsOf(s.id), p = ps[ps.length - 1], b = p && A.balance(p, S.lessons), n = nextOf(s.id);
          return '<a class="item is-link" href="#student/' + s.id + '"><div class="ln"><div><div class="l-when">' + esc(s.full_name) + (s.level ? " · " + esc(s.level) : "") + '</div><div class="l-meta">' + esc(s.email) +
            "</div></div><div class=\"l-meta\">" + (b ? b.left + " left" : "no package") + (n ? " · next " + A.day(n.starts_at) + " " + A.time(n.starts_at) : "") + "</div></div></a>";
        }).join("") : '<div class="empty">' + (S.students.length ? "No match." : "No students yet. Add the first one above.") + "</div>";
      };
      document.getElementById("search").addEventListener("input", draw); draw();
    }, 0);
    return shell("students", h);
  }


  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const hhmm = (t) => String(t).slice(0, 5);
  const WHERE = { both: "online or Prague", online: "online only", prague: "Prague only" };

  function availabilityPage() {
    if (!S.hasBooking || !S.settings) {
      return shell("availability", '<div class="wrap ap-top"><h1>My hours</h1><p>The booking update is not in your database yet. Run the latest <b>supabase-setup.sql</b> (see GUIDA-AREA-STUDENTI.md).</p></div>');
    }
    const st = S.settings;
    let h = '<div class="wrap ap-top"><h1>My hours</h1><p>Students can book only inside these windows. Times are Prague time (Europe/Prague).</p></div>';
    h += '<section class="ap-sec"><div class="wrap"><h2>Weekly hours</h2><div class="card"><div class="wk">';
    DAYS.forEach((d, i) => {
      const ws = S.avail.filter((a) => a.weekday === i + 1).sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
      h += '<div class="wk-day"><b>' + d + '</b><div class="wk-wins">' + (ws.length ? ws.map((a) =>
        '<span class="win">' + hhmm(a.start_time) + "–" + hhmm(a.end_time) + (a.mode !== "both" ? " <small>" + WHERE[a.mode] + "</small>" : "") +
        '<button type="button" data-delwin="' + a.id + '" aria-label="Remove ' + d + " " + hhmm(a.start_time) + '">×</button></span>').join("") : '<span class="l-meta" style="padding-top:.45rem">Not available</span>') + "</div></div>";
    });
    h += '</div></div>' +
      '<details class="add" style="margin-top:1rem"><summary>Add a window</summary><form class="f" id="f-win"><div class="f-row">' +
      '<label>Day<select name="weekday">' + DAYS.map((d, i) => '<option value="' + (i + 1) + '">' + d + "</option>").join("") + "</select></label>" +
      '<label>From<input name="from" type="time" step="900" required value="09:00"></label><label>To<input name="to" type="time" step="900" required value="12:00"></label>' +
      '<label>Where<select name="mode"><option value="both">Online or Prague</option><option value="online">Online only</option><option value="prague">Prague only</option></select></label></div>' +
      '<div><button class="btn btn-ink" type="submit">Add window</button></div></form></details></div></section>';

    h += '<section class="ap-sec"><div class="wrap"><h2>Days off <small>' + S.off.length + "</small></h2>" +
      (S.off.length ? '<div class="list" style="margin-bottom:1rem">' + S.off.map((o) => '<article class="item"><div class="ln"><div><div class="l-when">' + A.dayYear(o.starts_on + "T12:00:00") + (o.ends_on !== o.starts_on ? " to " + A.dayYear(o.ends_on + "T12:00:00") : "") + '</div><div class="l-meta">' + esc(o.note || "") + '</div></div><div class="btns"><button class="btn btn-quiet btn-sm" data-deloff="' + o.id + '" type="button">Remove</button></div></div></article>').join("") + "</div>" : '<div class="empty" style="margin-bottom:1rem">No days off. Add holidays here and nobody can book those days.</div>') +
      '<details class="add"><summary>Add days off</summary><form class="f" id="f-off"><div class="f-row"><label>From<input name="from" type="date" required></label><label>To (same day if one day)<input name="to" type="date"></label>' +
      '<label>Note<input name="note" maxlength="80" placeholder="Holiday, exam…"></label></div><div><button class="btn btn-ink" type="submit">Add days off</button></div></form></details></div></section>';

    h += '<section class="ap-sec"><div class="wrap"><h2>Booking rules</h2><form class="f card" id="f-set" style="max-width:44rem"><div class="f-row">' +
      '<label>Minimum notice (hours)<input name="min_notice_hours" type="number" min="0" max="168" value="' + st.min_notice_hours + '"></label>' +
      '<label>How far ahead (days)<input name="horizon_days" type="number" min="1" max="180" value="' + st.horizon_days + '"></label>' +
      '<label>Start times every<select name="step_min">' + [15, 30, 60].map((n) => '<option value="' + n + '"' + (st.step_min === n ? " selected" : "") + ">" + n + " min</option>").join("") + "</select></label></div>" +
      '<div class="f-row"><label>Lesson length (min)<input name="private_min" type="number" min="15" max="240" value="' + st.private_min + '"></label>' +
      '<label>Free trial length (min)<input name="trial_min" type="number" min="15" max="120" value="' + st.trial_min + '"></label>' +
      '<label>Break between lessons (min)<input name="buffer_min" type="number" min="0" max="120" value="' + st.buffer_min + '"></label></div>' +
      '<label>Max free-trial bookings per hour (protects against spam)<input name="trial_limit_per_hour" type="number" min="1" max="100" value="' + st.trial_limit_per_hour + '"></label>' +
      '<div class="btns"><button class="btn btn-ink" type="submit">Save rules</button><a class="btn btn-quiet" href="book.html" target="_blank" rel="noopener">See what visitors see</a></div></form></div></section>';
    return shell("availability", h);
  }

  function lessonFormFields(l, pkgs) {
    l = l || {};
    return '<div class="f-row"><label>Date and time<input name="starts" type="datetime-local" required value="' + (l.starts_at ? A.toInput(l.starts_at) : "") + '"></label>' +
      '<label>Minutes<input name="duration" type="number" min="15" max="240" step="5" required value="' + (l.duration_min || 60) + '"></label></div>' +
      '<div class="f-row"><label>Type<select name="kind">' + Object.keys(A.KIND).map((k) => '<option value="' + k + '"' + ((l.kind || "private") === k ? " selected" : "") + ">" + A.KIND[k] + "</option>").join("") + "</select></label>" +
      '<label>Where<select name="mode">' + Object.keys(A.MODE).map((k) => '<option value="' + k + '"' + ((l.mode || "online") === k ? " selected" : "") + ">" + A.MODE[k] + "</option>").join("") + "</select></label>" +
      '<label>Package<select name="package_id"><option value="">None (trial or single)</option>' + pkgs.map((p) => {
        const b = A.balance(p, S.lessons);
        return '<option value="' + p.id + '"' + (l.package_id === p.id ? " selected" : "") + ">" + esc(p.title) + " (" + b.left + " left)</option>";
      }).join("") + "</select></label></div>";
  }
  const notesField = (v) => '<label>Notes and homework (the student can read this)<textarea name="notes" placeholder="Homework, what you covered, links…">' + esc(v || "") + "</textarea></label>";

  function studentPage(id) {
    const s = student(id);
    if (!s) return shell("students", '<div class="wrap ap-top"><h1>Not found</h1><p><a href="#students">Back to students</a></p></div>');
    const ps = pkgsOf(id), ls = lessonsOf(id).slice().reverse();
    let h = '<div class="wrap ap-top"><a class="back" href="#students">← All students</a><h1>' + esc(s.full_name) + "</h1><p>" + esc(s.email) + (s.level ? " · " + esc(s.level) : "") + (s.tz ? " · " + esc(s.tz) : "") + (s.source === "site" ? " · from the website" : "") + "</p>" +
      (s.goal ? '<p class="note"><b>Goal:</b> ' + esc(s.goal) + "</p>" : "") + "</div>";

    // packages
    h += '<section class="ap-sec"><div class="wrap"><h2>Packages</h2>' +
      '<details class="add"><summary>Add a package</summary><form class="f" id="f-package"><div class="f-row">' +
      '<label>Preset<select id="preset">' + PRESETS.map((p, i) => '<option value="' + i + '">' + esc(p.t) + "</option>").join("") + '<option value="x">Custom</option></select></label>' +
      '<label>Name<input name="title" required value="' + esc(PRESETS[0].t) + '"></label>' +
      '<label>Lessons<input name="total" type="number" min="1" max="100" required value="' + PRESETS[0].n + '"></label>' +
      '<label>Price (EUR)<input name="price" type="number" min="0" step="0.5" value="' + PRESETS[0].p + '"></label></div>' +
      '<label style="grid-template-columns:auto 1fr;align-items:center;gap:.6rem"><input type="checkbox" name="paid" style="width:1.3rem;min-height:0"> Already paid</label>' +
      '<div><button class="btn btn-ink" type="submit">Add package</button></div></form></details>';
    h += ps.length ? '<div class="grid grid-2">' + ps.slice().reverse().map((p) => {
      const b = A.balance(p, S.lessons);
      return '<article class="card"><div class="ln"><h3>' + esc(p.title) + '</h3><span class="pill ' + (p.paid ? "pill-done" : "pill-missed") + '">' + (p.paid ? "Paid" : "Unpaid") + "</span></div>" +
        '<div style="margin:.6rem 0"><span class="pk-left">' + b.left + '</span> <b>to book</b></div>' + A.dots(b) +
        '<p class="pk-nums">' + b.used + " taken · " + b.booked + " booked · " + b.total + " total" + (p.price_eur != null ? " · €" + p.price_eur : "") + "</p>" +
        '<div class="btns" style="margin-top:.8rem"><button class="btn btn-quiet btn-sm" data-paid="' + p.id + '" type="button">Mark ' + (p.paid ? "unpaid" : "paid") + "</button>" +
        '<button class="btn btn-quiet btn-sm" data-delpkg="' + p.id + '" type="button">Delete</button></div></article>';
    }).join("") + "</div>" : '<div class="empty">No package yet.</div>';
    h += "</div></section>";

    // lessons
    const openPkgs = ps.filter((p) => A.balance(p, S.lessons).left > 0);
    h += '<section class="ap-sec"><div class="wrap"><h2>Lessons <small>' + ls.length + "</small></h2>" +
      '<details class="add"><summary>Add lessons</summary><form class="f" id="f-lesson">' + lessonFormFields(null, ps) +
      '<label>Repeat weekly (how many lessons in total)<input name="repeat" type="number" min="1" max="20" value="1"></label>' + notesField("") +
      '<div><button class="btn btn-ink" type="submit">Add</button></div></form></details>';
    h += ls.length ? '<div class="list">' + ls.map((l) => {
      const pk = ps.find((p) => p.id === l.package_id);
      return '<article class="item"><div class="ln"><div><div class="l-when">' + A.dayYear(l.starts_at) + ", " + A.time(l.starts_at) + ' <span class="pill pill-' + l.status + '">' + A.STATUS[l.status] + "</span></div>" +
        '<div class="l-meta">' + [A.KIND[l.kind], A.MODE[l.mode], l.duration_min + " min", pk && pk.title].filter(Boolean).map(esc).join(" · ") + "</div></div>" +
        '<div class="btns">' + (l.status === "scheduled" ? '<button class="btn btn-ok btn-sm" data-set="done" data-id="' + l.id + '" type="button">Done</button>' : "") +
        '<button class="btn btn-quiet btn-sm" data-edit="' + l.id + '" type="button">Edit</button></div></div>' +
        (l.notes ? '<div class="l-notes"><b>Notes</b>' + esc(l.notes) + "</div>" : "") + "</article>";
    }).join("") + "</div>" : '<div class="empty">No lessons yet.</div>';
    h += "</div></section>";

    // student details
    h += '<section class="ap-sec"><div class="wrap"><h2>Details</h2><form class="f card" id="f-edit-student" style="max-width:40rem">' +
      '<div class="f-row"><label>Full name<input name="full_name" required value="' + esc(s.full_name) + '"></label>' +
      '<label>Email<input name="email" type="email" required value="' + esc(s.email) + '"></label>' +
      '<label>Level<select name="level"><option value="">Not set</option>' + ["A1", "A2", "B1", "B2", "C1"].map((v) => "<option" + (s.level === v ? " selected" : "") + ">" + v + "</option>").join("") + "</select></label></div>" +
      '<div class="btns"><button class="btn btn-ink" type="submit">Save</button><button class="btn btn-quiet" type="button" id="del-student">Delete student…</button></div></form></div></section>';
    return shell("students", h);
  }

  /* ---------- routing ---------- */
  function route() {
    const hash = location.hash.replace(/^#/, "") || "overview";
    const m = hash.match(/^student\/(.+)$/);
    root.innerHTML = m ? studentPage(m[1]) : hash === "students" ? studentsPage() : hash === "availability" ? availabilityPage() : overview();
    bindForms(m && m[1]);
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", () => { if (isAdmin) route(); });

  /* ---------- forms ---------- */
  function lessonPayload(fd, sid) {
    return {
      student_id: sid,
      starts_at: new Date(fd.get("starts")).toISOString(),
      duration_min: parseInt(fd.get("duration"), 10),
      kind: fd.get("kind"), mode: fd.get("mode"),
      package_id: fd.get("package_id") || null,
      notes: (fd.get("notes") || "").trim() || null
    };
  }
  function bindForms(sid) {
    const $ = (id) => document.getElementById(id);
    if ($("f-student")) $("f-student").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const row = { full_name: fd.get("full_name").trim(), email: fd.get("email").trim().toLowerCase(), level: fd.get("level") || null };
      if (await run(A.sb.from("students").insert(row), "Student added.")) await refresh();
    });
    if ($("f-edit-student")) {
      $("f-edit-student").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        if (await run(A.sb.from("students").update({ full_name: fd.get("full_name").trim(), email: fd.get("email").trim().toLowerCase(), level: fd.get("level") || null }).eq("id", sid), "Saved.")) await refresh();
      });
      $("del-student").addEventListener("click", (e) => {
        const b = e.target;
        b.outerHTML = '<span>Delete this student with all packages and lessons?</span> <button class="btn btn-danger" id="del-yes" type="button">Yes, delete everything</button>';
        $("del-yes").addEventListener("click", async () => {
          if (await run(A.sb.from("students").delete().eq("id", sid), "Student deleted.")) { location.hash = "#students"; await load(); route(); }
        });
      });
    }
    if ($("f-package")) {
      const f = $("f-package");
      $("preset").addEventListener("change", (e) => {
        const p = PRESETS[e.target.value];
        if (p) { f.title.value = p.t; f.total.value = p.n; f.price.value = p.p; }
      });
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const row = { student_id: sid, title: f.title.value.trim(), lessons_total: parseInt(f.total.value, 10), price_eur: f.price.value === "" ? null : parseFloat(f.price.value), paid: f.paid.checked };
        if (await run(A.sb.from("packages").insert(row), "Package added.")) await refresh();
      });
    }
    if ($("f-win")) $("f-win").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      if (f.to.value <= f.from.value) { A.toast("The end time must be after the start time.", true); return; }
      if (await run(A.sb.from("availability").insert({ weekday: parseInt(f.weekday.value, 10), start_time: f.from.value, end_time: f.to.value, mode: f.mode.value }), "Window added.")) await refresh();
    });
    if ($("f-off")) $("f-off").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, to = f.to.value || f.from.value;
      if (to < f.from.value) { A.toast("The last day must not be before the first day.", true); return; }
      if (await run(A.sb.from("time_off").insert({ starts_on: f.from.value, ends_on: to, note: f.note.value.trim() || null }), "Days off added.")) await refresh();
    });
    if ($("f-set")) $("f-set").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, n = (k) => parseInt(f[k].value, 10);
      const row = { min_notice_hours: n("min_notice_hours"), horizon_days: n("horizon_days"), step_min: n("step_min"), private_min: n("private_min"), trial_min: n("trial_min"), buffer_min: n("buffer_min"), trial_limit_per_hour: n("trial_limit_per_hour") };
      if (await run(A.sb.from("booking_settings").update(row).eq("id", true), "Rules saved.")) await refresh();
    });
    if ($("f-lesson")) $("f-lesson").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target), base = lessonPayload(fd, sid), n = Math.min(20, Math.max(1, parseInt(fd.get("repeat"), 10) || 1));
      const rows = [];
      for (let i = 0; i < n; i++) {
        const d = new Date(fd.get("starts")); d.setDate(d.getDate() + 7 * i);
        rows.push(Object.assign({}, base, { starts_at: d.toISOString() }));
      }
      if (await run(A.sb.from("lessons").insert(rows), n > 1 ? n + " lessons added." : "Lesson added.")) await refresh();
    });
  }

  /* ---------- clicks: status buttons, paid, package delete, edit dialog ---------- */
  root.addEventListener("click", async (e) => {
    const dw = e.target.closest("[data-delwin]"), dof = e.target.closest("[data-deloff]");
    if (dw) { if (await run(A.sb.from("availability").delete().eq("id", dw.dataset.delwin), "Window removed.")) await refresh(); return; }
    if (dof) { if (await run(A.sb.from("time_off").delete().eq("id", dof.dataset.deloff), "Removed.")) await refresh(); return; }
    const set = e.target.closest("[data-set]"), paid = e.target.closest("[data-paid]"), dp = e.target.closest("[data-delpkg]"), ed = e.target.closest("[data-edit]");
    if (set) { set.disabled = true; if (await run(A.sb.from("lessons").update({ status: set.dataset.set }).eq("id", set.dataset.id), "Marked " + A.STATUS[set.dataset.set].toLowerCase() + ".")) await refresh(); else set.disabled = false; }
    else if (paid) { const p = S.packages.find((x) => x.id === paid.dataset.paid); if (await run(A.sb.from("packages").update({ paid: !p.paid }).eq("id", p.id), "Updated.")) await refresh(); }
    else if (dp) {
      if (dp.dataset.sure !== "1") { dp.dataset.sure = "1"; dp.textContent = "Sure? Delete"; dp.classList.add("btn-danger"); return; }
      if (await run(A.sb.from("packages").delete().eq("id", dp.dataset.delpkg), "Package deleted.")) await refresh();
    }
    else if (ed) openEdit(ed.dataset.edit);
  });

  function openEdit(id) {
    const l = S.lessons.find((x) => x.id === id);
    if (!l) return;
    dlg.innerHTML = '<h3>Edit lesson · ' + esc(nameOf(l.student_id)) + '</h3><form class="f" id="f-edit-lesson">' + lessonFormFields(l, pkgsOf(l.student_id)) +
      '<label>Status<select name="status">' + Object.keys(A.STATUS).map((k) => '<option value="' + k + '"' + (l.status === k ? " selected" : "") + ">" + A.STATUS[k] + "</option>").join("") + "</select></label>" +
      notesField(l.notes) + '<div class="btns"><button class="btn btn-ink" type="submit">Save</button><button class="btn btn-quiet" type="button" id="dlg-close">Close</button>' +
      '<button class="btn btn-quiet" type="button" id="dlg-del">Delete lesson</button></div></form>';
    dlg.showModal();
    document.getElementById("dlg-close").addEventListener("click", () => dlg.close());
    document.getElementById("dlg-del").addEventListener("click", async (ev) => {
      if (ev.target.dataset.sure !== "1") { ev.target.dataset.sure = "1"; ev.target.textContent = "Sure? Delete"; ev.target.classList.add("btn-danger"); return; }
      if (await run(A.sb.from("lessons").delete().eq("id", id), "Lesson deleted.")) { dlg.close(); await refresh(); }
    });
    document.getElementById("f-edit-lesson").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target), row = lessonPayload(fd, l.student_id); row.status = fd.get("status"); delete row.student_id;
      if (await run(A.sb.from("lessons").update(row).eq("id", id), "Saved.")) { dlg.close(); await refresh(); }
    });
  }

  /* ---------- start ---------- */
  async function render() {
    const { data, error } = await A.sb.rpc("is_admin");
    if (error) throw error;
    if (!data) {
      root.innerHTML = '<div class="wrap ap-top"><h1>No access</h1><p>This email is not an administrator. Students sign in at <a href="portal.html">portal.html</a>.</p></div>';
      return;
    }
    isAdmin = true;
    await load();
    route();
  }
  A.start(render);
})();
