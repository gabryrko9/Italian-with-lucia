-- ==========================================================
-- OPTIONAL: email alerts and lesson reminders
-- Run AFTER supabase-setup.sql, in Supabase: SQL Editor > New query > paste > Run.
--
-- What it does
--   1. Emails Lucia every time a new trial or lesson is booked on the website.
--   2. (After the domain is verified in Resend, see GUIDA-AREA-STUDENTI.md)
--      emails the student a confirmation, and a reminder 24 hours before each lesson.
--
-- Before running: create a free account at resend.com, make an API key, and paste it below
-- where it says PASTE_YOUR_RESEND_KEY_HERE. Until you verify a domain in Resend, Resend only
-- delivers to the email you registered with, which is exactly what step 1 needs.
-- Emails are sent by the database itself (pg_net), so no server is needed.
-- If sending ever fails, bookings still work: failures are ignored on purpose.
-- ==========================================================

create extension if not exists pg_net;

alter table public.lessons add column if not exists reminded_at timestamptz;

create table public.email_config (
  id boolean primary key default true check (id),
  resend_key text,
  from_email text not null default 'Italian with Lucia <onboarding@resend.dev>',
  lucia_email text not null default 'lucia.scollo2000@gmail.com',
  site_url text not null default 'https://italianwithlucia.com/',
  send_to_students boolean not null default false
);
insert into public.email_config (resend_key) values ('PASTE_YOUR_RESEND_KEY_HERE');
alter table public.email_config enable row level security;      -- no policies: nobody reads the key through the API
revoke all on public.email_config from anon, authenticated;

create or replace function public._esc(t text) returns text language sql immutable as
$$ select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;') $$;

create or replace function public._send_email(p_to text, p_subject text, p_html text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare c public.email_config;
begin
  select * into c from public.email_config;
  if c.resend_key is null or c.resend_key = '' or c.resend_key = 'PASTE_YOUR_RESEND_KEY_HERE' then return; end if;
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || c.resend_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object('from', c.from_email, 'to', jsonb_build_array(p_to), 'subject', p_subject, 'html', p_html)
  );
exception when others then
  raise warning 'email not sent: %', sqlerrm;                   -- never block a booking
end;
$$;

-- time as a person reads it: in the student's own time zone when we know it, else Prague
create or replace function public._when(p_ts timestamptz, p_tz text)
returns text language plpgsql stable as
$$
declare z text := coalesce(nullif(p_tz, ''), 'Europe/Prague');
begin
  begin
    return to_char(p_ts at time zone z, 'FMDay DD FMMonth YYYY "at" HH24:MI') || ' (' || z || ')';
  exception when others then
    return to_char(p_ts at time zone 'Europe/Prague', 'FMDay DD FMMonth YYYY "at" HH24:MI') || ' (Europe/Prague)';
  end;
end;
$$;

-- 1) new booking -> email Lucia (and the student, once enabled)
create or replace function public.notify_new_booking()
returns trigger
language plpgsql security definer set search_path = public, extensions
as $$
declare
  c public.email_config;
  s public.students;
  kind text;
begin
  if new.booked_by not in ('trial', 'student') then return new; end if;
  select * into c from public.email_config;
  select * into s from public.students where id = new.student_id;
  kind := case when new.kind = 'trial' then 'free trial' else 'lesson' end;

  perform public._send_email(c.lucia_email,
    'New ' || kind || ': ' || s.full_name || ', ' || to_char(new.starts_at at time zone 'Europe/Prague', 'FMDay DD FMMonth HH24:MI'),
    '<p><b>' || public._esc(s.full_name) || '</b> booked a ' || kind || ' on the website.</p>' ||
    '<p>' || to_char(new.starts_at at time zone 'Europe/Prague', 'FMDay DD FMMonth YYYY "at" HH24:MI') || ' Prague time · ' || new.duration_min || ' min · ' ||
      case when new.mode = 'online' then 'online' else 'in Prague' end || '</p>' ||
    '<p>Email: ' || public._esc(s.email) || '<br>Level: ' || public._esc(coalesce(s.level, 'not set')) ||
      '<br>Time zone: ' || public._esc(coalesce(s.tz, 'unknown')) || '<br>Goal: ' || public._esc(coalesce(s.goal, '-')) || '</p>' ||
    case when new.kind = 'trial' then '<p><b>Send them the video link</b> (or the meeting place) by email.</p>' else '' end ||
    '<p><a href="' || c.site_url || 'admin.html">Open your admin panel</a></p>');

  if c.send_to_students then
    perform public._send_email(s.email,
      'Your Italian ' || kind || ' with Lucia is booked',
      '<p>Ciao ' || public._esc(split_part(s.full_name, ' ', 1)) || ',</p>' ||
      '<p>Your ' || kind || ' is booked for <b>' || public._when(new.starts_at, s.tz) || '</b> (' || new.duration_min || ' minutes, ' ||
        case when new.mode = 'online' then 'online' else 'in Prague' end || ').</p>' ||
      '<p>' || case when new.mode = 'online' then 'Lucia will send you the video link before the lesson.' else 'Lucia will confirm the meeting place.' end || '</p>' ||
      '<p>You can move or cancel up to 24 hours before in your <a href="' || c.site_url || 'portal.html">student area</a>.</p><p>A presto,<br>Lucia</p>');
  end if;
  return new;
end;
$$;

drop trigger if exists lessons_notify on public.lessons;
create trigger lessons_notify after insert on public.lessons
  for each row execute function public.notify_new_booking();

-- 2) reminder 24 hours before (students only, needs send_to_students = true)
create or replace function public.send_lesson_reminders()
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  c public.email_config;
  r record;
  n int := 0;
begin
  select * into c from public.email_config;
  if not c.send_to_students then return 0; end if;
  for r in
    select l.id, l.starts_at, l.duration_min, l.mode, s.full_name, s.email, s.tz
    from public.lessons l join public.students s on s.id = l.student_id
    where l.status = 'scheduled' and l.reminded_at is null
      and l.starts_at between now() + interval '23 hours' and now() + interval '25 hours'
  loop
    perform public._send_email(r.email, 'Reminder: your Italian lesson tomorrow',
      '<p>Ciao ' || public._esc(split_part(r.full_name, ' ', 1)) || ',</p><p>A reminder of your lesson with Lucia on <b>' || public._when(r.starts_at, r.tz) ||
      '</b> (' || r.duration_min || ' minutes, ' || case when r.mode = 'online' then 'online' else 'in Prague' end || ').</p>' ||
      '<p>Need to change it? Move or cancel before it is less than 24 hours away in your <a href="' || c.site_url || 'portal.html">student area</a>, or write to Lucia.</p><p>A presto!</p>');
    update public.lessons set reminded_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function public._esc(text), public._send_email(text, text, text), public._when(timestamptz, text),
  public.notify_new_booking(), public.send_lesson_reminders() from public, anon, authenticated;

-- run the reminder check every 30 minutes (needs the pg_cron extension)
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('lesson-reminders', '*/30 * * * *', 'select public.send_lesson_reminders()');
exception when others then
  raise notice 'Reminders are not scheduled yet: enable pg_cron (Database > Extensions) and run this file again. (%)', sqlerrm;
end $$;
