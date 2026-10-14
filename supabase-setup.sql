-- ==========================================================
-- Italian with Lucia: student area database
-- Run ONCE in Supabase: SQL Editor > New query > paste > Run.
--
-- Who can do what:
--   * Lucia (email in the "admins" table): read and write everything.
--   * A student: read ONLY their own student row, packages and lessons
--     (matched by the verified email of the signed-in user).
--     Students cannot insert or edit anything. The only thing they can do
--     is cancel an upcoming lesson, through cancel_my_lesson(), which
--     refuses to cancel less than 24 hours before the start.
--   * Anyone not signed in: nothing, except two safe public actions: seeing
--     which time slots are free, and booking the free trial (see BOOKING below).
-- ==========================================================

-- ---------- Tables ----------

create table public.admins (
  email text primary key check (email = lower(email))
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique check (email = lower(email)),
  level text,
  created_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  lessons_total int not null check (lessons_total > 0),
  price_eur numeric(8,2),
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, student_id)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  package_id uuid,
  starts_at timestamptz not null,
  duration_min int not null default 60 check (duration_min between 15 and 240),
  kind text not null default 'private' check (kind in ('trial', 'private', 'group')),
  mode text not null default 'online' check (mode in ('online', 'prague')),
  status text not null default 'scheduled' check (status in ('scheduled', 'done', 'cancelled', 'missed')),
  notes text,
  created_at timestamptz not null default now(),
  -- a lesson can only use a package that belongs to the same student
  foreign key (package_id, student_id) references public.packages (id, student_id)
);

create index lessons_student_idx on public.lessons (student_id, starts_at);
create index lessons_starts_idx on public.lessons (starts_at);
create index packages_student_idx on public.packages (student_id);

-- ---------- Helper functions ----------

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.owns_student(sid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.students s
    where s.id = sid
      and s.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- The 24-hour rule lives here, in the database, so it cannot be bypassed.
create or replace function public.cancel_my_lesson(p_lesson_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  l public.lessons;
begin
  select * into l from public.lessons where id = p_lesson_id;

  if not found or not public.owns_student(l.student_id) then
    raise exception 'Lesson not found.';
  end if;

  if l.status <> 'scheduled' then
    raise exception 'Only upcoming lessons can be cancelled.';
  end if;

  if l.starts_at - now() < interval '24 hours' then
    raise exception 'Lessons can only be cancelled up to 24 hours before they start. Please write to Lucia.';
  end if;

  update public.lessons set status = 'cancelled' where id = p_lesson_id;
end;
$$;

-- ---------- Row level security ----------

alter table public.admins   enable row level security;   -- no policies: nobody reads it through the API
alter table public.students enable row level security;
alter table public.packages enable row level security;
alter table public.lessons  enable row level security;

create policy students_select on public.students for select to authenticated
  using (public.is_admin() or email = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy students_insert on public.students for insert to authenticated
  with check (public.is_admin());
create policy students_update on public.students for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy students_delete on public.students for delete to authenticated
  using (public.is_admin());

create policy packages_select on public.packages for select to authenticated
  using (public.is_admin() or public.owns_student(student_id));
create policy packages_insert on public.packages for insert to authenticated
  with check (public.is_admin());
create policy packages_update on public.packages for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy packages_delete on public.packages for delete to authenticated
  using (public.is_admin());

create policy lessons_select on public.lessons for select to authenticated
  using (public.is_admin() or public.owns_student(student_id));
create policy lessons_insert on public.lessons for insert to authenticated
  with check (public.is_admin());
create policy lessons_update on public.lessons for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy lessons_delete on public.lessons for delete to authenticated
  using (public.is_admin());

-- ---------- Privileges ----------

revoke all on public.admins, public.students, public.packages, public.lessons from anon, authenticated;
grant select, insert, update, delete on public.students, public.packages, public.lessons to authenticated;

revoke all on function public.is_admin()            from public, anon;
revoke all on function public.owns_student(uuid)    from public, anon;
revoke all on function public.cancel_my_lesson(uuid) from public, anon;
grant execute on function public.is_admin()            to authenticated;
grant execute on function public.owns_student(uuid)    to authenticated;
grant execute on function public.cancel_my_lesson(uuid) to authenticated;

-- ---------- Lucia is the administrator ----------
-- To add another administrator later, run:
--   insert into public.admins (email) values ('another.person@example.com');

insert into public.admins (email) values ('lucia.scollo2000@gmail.com')
on conflict do nothing;

-- ==========================================================
-- BOOKING (added in v5): Lucia's weekly hours, free slots,
-- free-trial booking without an account, students book and move lessons.
-- All times of the weekly hours are Prague time (Europe/Prague).
-- ==========================================================

alter table public.students add column goal text;
alter table public.students add column tz text;
alter table public.students add column source text not null default 'lucia' check (source in ('lucia', 'site'));
alter table public.lessons  add column booked_by text not null default 'lucia' check (booked_by in ('lucia', 'student', 'trial'));

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 1 and 7),          -- 1 = Monday ... 7 = Sunday
  start_time time not null,
  end_time time not null,
  mode text not null default 'both' check (mode in ('both', 'online', 'prague')),
  check (end_time > start_time)
);

create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null,
  ends_on date not null,
  note text,
  check (ends_on >= starts_on)
);

create table public.booking_settings (
  id boolean primary key default true check (id),                -- exactly one row
  min_notice_hours int not null default 12 check (min_notice_hours between 0 and 168),
  horizon_days int not null default 42 check (horizon_days between 1 and 180),
  step_min int not null default 30 check (step_min in (15, 30, 60)),
  buffer_min int not null default 15 check (buffer_min between 0 and 120),
  private_min int not null default 60 check (private_min between 15 and 240),
  trial_min int not null default 30 check (trial_min between 15 and 120),
  trial_limit_per_hour int not null default 6 check (trial_limit_per_hour between 1 and 100)
);
insert into public.booking_settings default values;

-- Lucia's usual week. She can change it in the admin panel.
insert into public.availability (weekday, start_time, end_time, mode) values
  (1, '09:00', '12:00', 'both'), (1, '14:00', '19:00', 'both'),
  (2, '09:00', '12:00', 'both'), (2, '14:00', '19:00', 'both'),
  (3, '09:00', '12:00', 'both'), (3, '14:00', '19:00', 'both'),
  (4, '09:00', '12:00', 'both'), (4, '14:00', '19:00', 'both'),
  (5, '09:00', '12:00', 'both');

-- ---------- internal: is this slot bookable? ----------

create or replace function public._slot_ok(p_start timestamptz, p_min int, p_mode text, p_exclude uuid default null)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  s public.booking_settings;
  loc timestamp;
  loc_end timestamp;
  m_start int;
  m_end int;
begin
  select * into s from public.booking_settings;
  if p_start < now() + make_interval(hours => s.min_notice_hours) then return false; end if;
  if p_start > now() + make_interval(days => s.horizon_days) then return false; end if;

  loc := p_start at time zone 'Europe/Prague';
  loc_end := (p_start + make_interval(mins => p_min)) at time zone 'Europe/Prague';
  if loc::date <> loc_end::date and loc_end::time <> time '00:00' then return false; end if;
  m_start := (extract(hour from loc::time) * 60 + extract(minute from loc::time))::int;
  m_end := m_start + p_min;

  -- inside one of Lucia's weekly windows, on the step grid, and for the right place
  if not exists (
    select 1 from public.availability a
    where a.weekday = extract(isodow from loc)::int
      and (a.mode = 'both' or a.mode = p_mode)
      and m_start >= (extract(hour from a.start_time) * 60 + extract(minute from a.start_time))
      and m_end   <= (extract(hour from a.end_time) * 60 + extract(minute from a.end_time))
      and (m_start - (extract(hour from a.start_time) * 60 + extract(minute from a.start_time)))::int % s.step_min = 0
  ) then return false; end if;

  -- not on a day off
  if exists (select 1 from public.time_off t where loc::date between t.starts_on and t.ends_on) then return false; end if;

  -- not overlapping another lesson (plus a short buffer)
  if exists (
    select 1 from public.lessons l
    where l.status = 'scheduled'
      and l.id is distinct from p_exclude
      and tstzrange(l.starts_at - make_interval(mins => s.buffer_min), l.starts_at + make_interval(mins => l.duration_min + s.buffer_min))
          && tstzrange(p_start, p_start + make_interval(mins => p_min))
  ) then return false; end if;

  return true;
end;
$$;

-- ---------- public: list free slots ----------

create or replace function public.free_slots(p_from date, p_to date, p_minutes int, p_mode text)
returns table (slot_start timestamptz)
language plpgsql stable security definer set search_path = public
as $$
declare
  s public.booking_settings;
  d date;
  a public.availability;
  t time;
  cand timestamptz;
begin
  if p_mode not in ('online', 'prague') then raise exception 'Unknown lesson type.'; end if;
  if p_minutes < 15 or p_minutes > 240 then raise exception 'Unknown lesson length.'; end if;
  if p_to < p_from or p_to - p_from > 62 then raise exception 'Date range too large.'; end if;
  select * into s from public.booking_settings;

  for d in select generate_series(p_from, p_to, interval '1 day')::date loop
    for a in select * from public.availability
             where weekday = extract(isodow from d)::int and (mode = 'both' or mode = p_mode)
             order by start_time loop
      t := a.start_time;
      while (extract(hour from t) * 60 + extract(minute from t)) + p_minutes
            <= (extract(hour from a.end_time) * 60 + extract(minute from a.end_time)) loop
        cand := (d + t) at time zone 'Europe/Prague';
        if public._slot_ok(cand, p_minutes, p_mode) then
          slot_start := cand; return next;
        end if;
        t := t + make_interval(mins => s.step_min);
        exit when t = time '00:00';
      end loop;
    end loop;
  end loop;
end;
$$;

create or replace function public.booking_info()
returns json
language sql stable security definer set search_path = public
as $$
  select json_build_object('private_min', private_min, 'trial_min', trial_min, 'min_notice_hours', min_notice_hours, 'horizon_days', horizon_days)
  from public.booking_settings;
$$;

-- ---------- public: book the free trial (no account needed) ----------

create or replace function public.book_trial(
  p_name text, p_email text, p_start timestamptz, p_mode text,
  p_level text default null, p_goal text default null, p_tz text default null)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  s public.booking_settings;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_name text := trim(coalesce(p_name, ''));
  sid uuid;
  lid uuid;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'Please enter your name.'; end if;
  if char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Please enter a valid email address.'; end if;
  if p_mode not in ('online', 'prague') then raise exception 'Please choose online or in Prague.'; end if;
  if p_level is not null and p_level not in ('A1', 'A2', 'B1', 'B2', 'C1', 'not sure') then raise exception 'Unknown level.'; end if;
  if char_length(coalesce(p_goal, '')) > 500 or char_length(coalesce(p_tz, '')) > 64 then raise exception 'Text is too long.'; end if;

  perform pg_advisory_xact_lock(hashtext('lucia-booking'));
  select * into s from public.booking_settings;

  if (select count(*) from public.lessons where booked_by = 'trial' and created_at > now() - interval '1 hour') >= s.trial_limit_per_hour then
    raise exception 'Too many bookings right now. Please write to Lucia by email.';
  end if;

  select id into sid from public.students where email = v_email;
  if sid is not null and exists (
    select 1 from public.lessons where student_id = sid and kind = 'trial' and status in ('scheduled', 'done', 'missed')
  ) then
    raise exception 'A free trial is already booked or used for this email. Please write to Lucia.';
  end if;

  if not public._slot_ok(p_start, s.trial_min, p_mode) then
    raise exception 'Sorry, that time was just taken. Please pick another.';
  end if;

  if sid is null then
    insert into public.students (full_name, email, level, goal, tz, source)
    values (v_name, v_email, nullif(nullif(p_level, 'not sure'), ''), nullif(trim(coalesce(p_goal, '')), ''), nullif(trim(coalesce(p_tz, '')), ''), 'site')
    returning id into sid;
  end if;

  insert into public.lessons (student_id, starts_at, duration_min, kind, mode, status, booked_by)
  values (sid, p_start, s.trial_min, 'trial', p_mode, 'scheduled', 'trial')
  returning id into lid;

  return json_build_object('starts_at', p_start, 'duration_min', s.trial_min, 'mode', p_mode);
end;
$$;

-- ---------- students: book, and move, their own lessons ----------

create or replace function public.book_my_lesson(p_start timestamptz, p_mode text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  s public.booking_settings;
  st public.students;
  pk uuid;
  lid uuid;
begin
  select * into st from public.students where email = lower(coalesce(auth.jwt() ->> 'email', ''));
  if not found then raise exception 'Student account not found.'; end if;
  if p_mode not in ('online', 'prague') then raise exception 'Please choose online or in Prague.'; end if;

  perform pg_advisory_xact_lock(hashtext('lucia-booking'));
  select * into s from public.booking_settings;

  select p.id into pk
  from public.packages p
  where p.student_id = st.id
    and p.lessons_total > (select count(*) from public.lessons l where l.package_id = p.id and l.status in ('scheduled', 'done', 'missed'))
  order by p.created_at
  limit 1;
  if pk is null then raise exception 'You have no lessons left to book. Please write to Lucia for a new package.'; end if;

  if not public._slot_ok(p_start, s.private_min, p_mode) then
    raise exception 'Sorry, that time is no longer available. Please pick another.';
  end if;

  insert into public.lessons (student_id, package_id, starts_at, duration_min, kind, mode, status, booked_by)
  values (st.id, pk, p_start, s.private_min, 'private', p_mode, 'scheduled', 'student')
  returning id into lid;
  return lid;
end;
$$;

create or replace function public.reschedule_my_lesson(p_lesson_id uuid, p_start timestamptz)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  l public.lessons;
begin
  select * into l from public.lessons where id = p_lesson_id;
  if not found or not public.owns_student(l.student_id) then raise exception 'Lesson not found.'; end if;
  if l.status <> 'scheduled' then raise exception 'Only upcoming lessons can be moved.'; end if;
  if l.kind = 'group' then raise exception 'Group lessons are scheduled by Lucia.'; end if;
  if l.starts_at - now() < interval '24 hours' then
    raise exception 'Lessons can only be moved up to 24 hours before they start. Please write to Lucia.';
  end if;

  perform pg_advisory_xact_lock(hashtext('lucia-booking'));
  if not public._slot_ok(p_start, l.duration_min, l.mode, l.id) then
    raise exception 'Sorry, that time is no longer available. Please pick another.';
  end if;

  update public.lessons set starts_at = p_start where id = p_lesson_id;
end;
$$;

-- ---------- Row level security and privileges for the new tables ----------

alter table public.availability     enable row level security;
alter table public.time_off         enable row level security;
alter table public.booking_settings enable row level security;

create policy availability_admin on public.availability for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy time_off_admin on public.time_off for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy booking_settings_admin on public.booking_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.availability, public.time_off, public.booking_settings from anon, authenticated;
grant select, insert, update, delete on public.availability, public.time_off to authenticated;
grant select, update on public.booking_settings to authenticated;

revoke all on function public._slot_ok(timestamptz, int, text, uuid) from public, anon, authenticated;
revoke all on function public.free_slots(date, date, int, text) from public;
revoke all on function public.booking_info() from public;
revoke all on function public.book_trial(text, text, timestamptz, text, text, text, text) from public;
revoke all on function public.book_my_lesson(timestamptz, text) from public, anon;
revoke all on function public.reschedule_my_lesson(uuid, timestamptz) from public, anon;
grant execute on function public.free_slots(date, date, int, text) to anon, authenticated;
grant execute on function public.booking_info() to anon, authenticated;
grant execute on function public.book_trial(text, text, timestamptz, text, text, text, text) to anon, authenticated;
grant execute on function public.book_my_lesson(timestamptz, text) to authenticated;
grant execute on function public.reschedule_my_lesson(uuid, timestamptz) to authenticated;
