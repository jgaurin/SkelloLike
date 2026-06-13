-- ============================================================================
-- SkelloLike — Multi-sites : rattachement employé ↔ établissements
-- Un employé a un établissement principal et peut travailler sur d'autres
-- (prêt inter-sites, comme Skello).
-- ============================================================================

create table if not exists public.employee_locations (
  employee_id uuid not null references public.employees (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  is_primary  boolean not null default false,
  primary key (employee_id, location_id)
);

create index if not exists idx_emp_loc_location on public.employee_locations (location_id);
create index if not exists idx_emp_loc_employee on public.employee_locations (employee_id);

-- Un seul établissement principal par employé.
create unique index if not exists uniq_emp_primary_location
  on public.employee_locations (employee_id)
  where is_primary;

alter table public.employee_locations enable row level security;

-- Helper : org d'un établissement (déjà défini dans la migration RLS initiale).
-- On réutilise location_org_id / is_org_member / is_org_manager.

create policy "emp_loc_select_member"
  on public.employee_locations for select
  using (public.is_org_member(public.location_org_id(location_id)));

create policy "emp_loc_manage_manager"
  on public.employee_locations for all
  using (public.is_org_manager(public.location_org_id(location_id)))
  with check (public.is_org_manager(public.location_org_id(location_id)));

-- Backfill : rattache chaque employé existant au 1er établissement de son org
-- comme établissement principal.
insert into public.employee_locations (employee_id, location_id, is_primary)
select e.id, l.id, true
from public.employees e
join lateral (
  select id from public.locations
  where org_id = e.org_id
  order by created_at
  limit 1
) l on true
on conflict (employee_id, location_id) do nothing;
