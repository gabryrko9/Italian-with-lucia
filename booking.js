/* Slot picker: shows Lucia's free times in the visitor's own time zone.
   Used by the free-trial page and by the student area. The database decides what is
   really bookable, so a stale page can never double-book a time. */
(function () {
  const A = window.App, esc = A.esc;
  const ymd = (d) => new Intl.DateTimeFormat("en-CA").format(d);          // day in the visitor's time zone
  const addDays = (s, n) => { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const MODE_LABEL = { online: "Online", prague: "In Prague" };

  A.Booking = {
    /* o: { sb, minutes, modes: ["online","prague"], horizon, onSelect(sel|null) }  ->  { reload, clear } */
    mount(el, o) {
      const st = { mode: o.modes[0], day: null, slots: [], sel: null, loading: true, err: "" };
      const horizon = Math.min(o.horizon || 42, 60);

      async function load() {
        st.loading = true; st.err = ""; st.sel = null; draw(); o.onSelect && o.onSelect(null);
        const from = A.pragueToday();
        const { data, error } = await o.sb.rpc("free_slots", { p_from: from, p_to: addDays(from, horizon - 1), p_minutes: o.minutes, p_mode: st.mode });
        st.loading = false;
        if (error) { st.err = A.errText(error); st.slots = []; }
        else st.slots = (data || []).map((r) => (typeof r === "string" ? r : r.slot_start)).filter(Boolean).sort();
        const days = Object.keys(group());
        if (!st.day || days.indexOf(st.day) < 0) st.day = days[0] || null;
        draw();
      }
      function group() {
        const g = {};
        st.slots.forEach((iso) => { (g[ymd(new Date(iso))] = g[ymd(new Date(iso))] || []).push(iso); });
        return g;
      }
      function draw() {
        const g = group(), days = Object.keys(g).sort();
        let h = "";
        if (o.modes.length > 1) {
          h += '<div class="seg" role="group" aria-label="Where do you want the lesson?">' +
            o.modes.map((m) => '<button type="button" data-mode="' + m + '" aria-pressed="' + (m === st.mode) + '">' + MODE_LABEL[m] + "</button>").join("") + "</div>";
        }
        if (st.loading) h += '<p class="note">Loading free times…</p>';
        else if (st.err) h += '<p class="note bad">' + esc(st.err) + "</p>";
        else if (!days.length) {
          h += '<div class="empty" style="margin-top:1rem"><b>No free times in the next ' + Math.round(horizon / 7) + ' weeks.</b><p style="margin-top:.4rem">Write to Lucia and she will find a time that works for you: <a href="mailto:' + A.LUCIA + '">' + A.LUCIA + "</a></p></div>";
        } else {
          h += '<div class="days" role="group" aria-label="Choose a day">' + days.map((d) => {
            const dt = new Date(g[d][0]);
            return '<button type="button" class="day" data-day="' + d + '" aria-pressed="' + (d === st.day) + '"><span><small>' +
              new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(dt) + "</small><b>" + dt.getDate() + "</b><small>" +
              new Intl.DateTimeFormat("en-GB", { month: "short" }).format(dt) + "</small></span></button>";
          }).join("") + "</div>";
          h += '<div class="slots" role="group" aria-label="Choose a time">' + (g[st.day] || []).map((iso) =>
            '<button type="button" class="slot" data-slot="' + iso + '" aria-pressed="' + (st.sel === iso) + '">' + A.time(iso) + "</button>").join("") + "</div>";
          h += '<p class="tzhint">Times are shown in your time zone' + (A.tz ? " (" + esc(A.tz) + ")" : "") + ".</p>";
        }
        el.innerHTML = h;
      }

      el.addEventListener("click", (e) => {
        const m = e.target.closest("[data-mode]"), d = e.target.closest("[data-day]"), s = e.target.closest("[data-slot]");
        if (m && m.dataset.mode !== st.mode) { st.mode = m.dataset.mode; st.day = null; load(); }
        else if (d) { st.day = d.dataset.day; st.sel = null; draw(); o.onSelect && o.onSelect(null); }
        else if (s) { st.sel = s.dataset.slot; draw(); o.onSelect && o.onSelect({ iso: st.sel, mode: st.mode }); }
      });
      load();
      return { reload: load, clear() { st.sel = null; draw(); } };
    }
  };
})();
