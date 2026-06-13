-- ============================================================================
-- SkelloLike — Pointage (badgeuse)
-- Table des pointages + code PIN par employé pour la badgeuse kiosque.
-- ============================================================================

-- Code PIN à 4 chiffres pour le pointage (unique par établissement via app).
alter table public.employees
  add column if not exists pin_code text;

create table if not exists public.timeclocks (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  clock_in    timestamptz not null default now(),
  clock_out   timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_timeclocks_employee on public.timeclocks (employee_id);
create index if not exists idx_timeclocks_location on public.timeclocks (location_id);
create index if not exists idx_timeclocks_in on public.timeclocks (clock_in);

alter table public.timeclocks enable row level security;

-- Lecture : membres de l'org. Gestion (régularisation) : managers.
create policy "timeclocks_select_member"
  on public.timeclocks for select
  using (public.is_org_member(org_id));

create policy "timeclocks_manage_manager"
  on public.timeclocks for all
  using (public.is_org_manager(org_id))
  with check (public.is_org_manager(org_id));
