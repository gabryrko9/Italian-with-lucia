-- ==========================================================
-- Italian with Lucia: lesson packages paid online + "Lucia only" slots
-- Run ONCE in Supabase, AFTER 1-setup.sql:
--   SQL Editor > New query > paste this file > Run.
--
-- What it adds:
--   1. Each weekly window can be "students can book" (default) or "Lucia only".
--      Students and visitors never see Lucia-only windows; Lucia can still
--      put lessons there from her panel.
--   2. package_plans: the packages students can buy by card (prices here).
--   3. payments: one row per Stripe payment, so a payment can never create
--      two packages. Only the server (Edge Functions) writes here.
-- ==========================================================

-- ---------- 1. Lucia-only windows ----------

alter table public.availability add column if not exists student_bookable boolean not null default true;

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

  -- inside one of Lucia's weekly windows that students may book, on the step grid, for the right place
  if not exists (
    select 1 from public.availability a
    where a.weekday = extract(isodow from loc)::int
      and a.student_bookable
      and (a.mode = 'both' or a.mode = p_mode)
      and m_start >= (extract(hour from a.start_time) * 60 + extract(minute from a.start_time))
      and m_end   <= (extract(hour from a.end_time) * 60 + extract(minute from a.end_time))
      and (m_start - (extract(hour from a.start_time) * 60 + extract(minute from a.start_time)))::int % s.step_min = 0
  ) then return false; end if;

  if exists (select 1 from public.time_off t where loc::date between t.starts_on and t.ends_on) then return false; end if;

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
             where weekday = extract(isodow from d)::int and student_bookable and (mode = 'both' or mode = p_mode)
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

revoke all on function public._slot_ok(timestamptz, int, text, uuid) from public, anon, authenticated;
revoke all on function public.free_slots(date, date, int, text) from public;
grant execute on function public.free_slots(date, date, int, text) to anon, authenticated;

-- ---------- 2. Packages students can buy ----------

create table if not exists public.package_plans (
  code text primary key check (code ~ '^[a-z0-9-]{2,30}$'),
  title text not null,
  lessons int not null check (lessons between 1 and 100),
  price_eur numeric(8,2) not null check (price_eur > 0),
  active boolean not null default true,
  sort int not null default 0
);

insert into public.package_plans (code, title, lessons, price_eur, sort) values
  ('p5',  '5 lessons',  5,  150, 1),
  ('p10', '10 lessons', 10, 270, 2),
  ('p20', '20 lessons', 20, 500, 3)
on conflict (code) do nothing;

alter table public.package_plans enable row level security;
drop policy if exists package_plans_read on public.package_plans;
-- everyone sees the active plans; Lucia sees all of them through package_plans_admin
create policy package_plans_read on public.package_plans for select to anon, authenticated using (active);
drop policy if exists package_plans_admin on public.package_plans;
create policy package_plans_admin on public.package_plans for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.package_plans from anon, authenticated;
grant select on public.package_plans to anon, authenticated;
grant insert, update, delete on public.package_plans to authenticated;

-- ---------- 3. Payments (written only by the Edge Functions) ----------

alter table public.packages add column if not exists source text not null default 'lucia' check (source in ('lucia', 'stripe'));

create table if not exists public.payments (
  stripe_session_id text primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  plan_code text not null,
  amount_eur numeric(8,2) not null,
  package_id uuid references public.packages(id) on delete set null,
  receipt_email text,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;
drop policy if exists payments_admin_read on public.payments;
create policy payments_admin_read on public.payments for select to authenticated using (public.is_admin());
drop policy if exists payments_own_read on public.payments;
create policy payments_own_read on public.payments for select to authenticated using (public.owns_student(student_id));
revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

-- Called by the stripe-webhook Edge Function (service role only).
-- Creates the package once per Stripe payment, even if Stripe sends the event twice.
create or replace function public.record_stripe_payment(p_session text, p_student uuid, p_plan text, p_amount numeric, p_email text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  pl public.package_plans;
  pk uuid;
begin
  perform pg_advisory_xact_lock(hashtext('stripe:' || p_session));
  select package_id into pk from public.payments where stripe_session_id = p_session;
  if found then return pk; end if;

  select * into pl from public.package_plans where code = p_plan;
  if not found then raise exception 'Unknown plan %', p_plan; end if;

  insert into public.packages (student_id, title, lessons_total, price_eur, paid, source)
  values (p_student, pl.title || ' (paid online)', pl.lessons, p_amount, true, 'stripe')
  returning id into pk;

  insert into public.payments (stripe_session_id, student_id, plan_code, amount_eur, package_id, receipt_email)
  values (p_session, p_student, p_plan, p_amount, pk, p_email);
  return pk;
end;
$$;

revoke all on function public.record_stripe_payment(text, uuid, text, numeric, text) from public, anon, authenticated;
grant execute on function public.record_stripe_payment(text, uuid, text, numeric, text) to service_role;
