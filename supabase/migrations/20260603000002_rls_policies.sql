-- ============================================================================
-- SkelloLike — Row Level Security (RLS)
-- Isolation multi-tenant : un utilisateur ne voit que les données des
-- organisations auxquelles il appartient (via la table memberships).
-- ============================================================================

-- ============================================================================
-- FONCTIONS HELPER
-- ============================================================================

-- Liste des organisations auxquelles l'utilisateur courant appartient.
create or replace function public.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id
  from public.memberships
  where user_id = auth.uid();
$$;

-- Vrai si l'utilisateur courant est membre de l'organisation donnée.
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and org_id = target_org
  );
$$;

-- Vrai si l'utilisateur a l'un des rôles donnés dans l'organisation.
create or replace function public.has_org_role(target_org uuid, roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and org_id = target_org
      and role = any(roles)
  );
$$;

-- Rôles de gestion (peuvent créer/modifier les données RH et planning).
create or replace function public.is_org_manager(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_org_role(
    target_org,
    array['org_owner', 'org_admin', 'location_manager', 'team_manager']::public.app_role[]
  );
$$;

-- ============================================================================
-- ACTIVATION RLS
-- ============================================================================

alter table public.organizations      enable row level security;
alter table public.locations           enable row level security;
alter table public.teams               enable row level security;
alter table public.profiles            enable row level security;
alter table public.memberships         enable row level security;
alter table public.employees           enable row level security;
alter table public.employee_teams      enable row level security;
alter table public.positions           enable row level security;
alter table public.employee_positions  enable row level security;
alter table public.contracts           enable row level security;
alter table public.schedules           enable row level security;
alter table public.shifts              enable row level security;
alter table public.schedule_templates  enable row level security;
alter table public.template_shifts     enable row level security;
alter table public.absence_types       enable row level security;
alter table public.absence_requests    enable row level security;
alter table public.leave_balances      enable row level security;

-- ============================================================================
-- PROFILES — chacun voit/édite son propre profil
-- ============================================================================

create policy "profiles_select_own_or_same_org"
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.memberships m1
      join public.memberships m2 on m1.org_id = m2.org_id
      where m1.user_id = auth.uid() and m2.user_id = profiles.id
    )
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

create policy "orgs_select_member"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "orgs_update_owner_admin"
  on public.organizations for update
  using (public.has_org_role(id, array['org_owner', 'org_admin']::public.app_role[]));

-- La création d'organisation passe par une Server Action dédiée (service role),
-- donc pas de policy insert ouverte ici.

-- ============================================================================
-- MEMBERSHIPS
-- ============================================================================

create policy "memberships_select_same_org"
  on public.memberships for select
  using (public.is_org_member(org_id));

create policy "memberships_manage_admin"
  on public.memberships for all
  using (public.has_org_role(org_id, array['org_owner', 'org_admin']::public.app_role[]))
  with check (public.has_org_role(org_id, array['org_owner', 'org_admin']::public.app_role[]));

-- ============================================================================
-- POLICIES GÉNÉRIQUES PAR org_id
-- (locations, employees, positions, absence_types)
-- ============================================================================

-- LOCATIONS
create policy "locations_select_member"
  on public.locations for select using (public.is_org_member(org_id));
create policy "locations_manage_manager"
  on public.locations for all
  using (public.has_org_role(org_id, array['org_owner', 'org_admin', 'location_manager']::public.app_role[]))
  with check (public.has_org_role(org_id, array['org_owner', 'org_admin', 'location_manager']::public.app_role[]));

-- EMPLOYEES
create policy "employees_select_member"
  on public.employees for select using (public.is_org_member(org_id));
create policy "employees_manage_manager"
  on public.employees for all
  using (public.is_org_manager(org_id))
  with check (public.is_org_manager(org_id));

-- POSITIONS
create policy "positions_select_member"
  on public.positions for select using (public.is_org_member(org_id));
create policy "positions_manage_manager"
  on public.positions for all
  using (public.is_org_manager(org_id))
  with check (public.is_org_manager(org_id));

-- ABSENCE_TYPES
create policy "absence_types_select_member"
  on public.absence_types for select using (public.is_org_member(org_id));
create policy "absence_types_manage_admin"
  on public.absence_types for all
  using (public.has_org_role(org_id, array['org_owner', 'org_admin']::public.app_role[]))
  with check (public.has_org_role(org_id, array['org_owner', 'org_admin']::public.app_role[]));

-- ============================================================================
-- POLICIES PAR APPARTENANCE INDIRECTE (via la location)
-- (teams, schedules, shifts, templates)
-- ============================================================================

-- Helper : org_id d'une location.
create or replace function public.location_org_id(loc uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.locations where id = loc;
$$;

-- TEAMS
create policy "teams_select_member"
  on public.teams for select
  using (public.is_org_member(public.location_org_id(location_id)));
create policy "teams_manage_manager"
  on public.teams for all
  using (public.is_org_manager(public.location_org_id(location_id)))
  with check (public.is_org_manager(public.location_org_id(location_id)));

-- SCHEDULES
create policy "schedules_select_member"
  on public.schedules for select
  using (public.is_org_member(public.location_org_id(location_id)));
create policy "schedules_manage_manager"
  on public.schedules for all
  using (public.is_org_manager(public.location_org_id(location_id)))
  with check (public.is_org_manager(public.location_org_id(location_id)));

-- SCHEDULE_TEMPLATES
create policy "templates_select_member"
  on public.schedule_templates for select
  using (public.is_org_member(public.location_org_id(location_id)));
create policy "templates_manage_manager"
  on public.schedule_templates for all
  using (public.is_org_manager(public.location_org_id(location_id)))
  with check (public.is_org_manager(public.location_org_id(location_id)));

-- ============================================================================
-- POLICIES PAR APPARTENANCE INDIRECTE (via schedule -> location)
-- ============================================================================

-- Helper : org_id d'un schedule.
create or replace function public.schedule_org_id(sched uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select public.location_org_id(location_id)
  from public.schedules where id = sched;
$$;

-- SHIFTS
create policy "shifts_select_member"
  on public.shifts for select
  using (public.is_org_member(public.schedule_org_id(schedule_id)));
create policy "shifts_manage_manager"
  on public.shifts for all
  using (public.is_org_manager(public.schedule_org_id(schedule_id)))
  with check (public.is_org_manager(public.schedule_org_id(schedule_id)));

-- TEMPLATE_SHIFTS
create policy "template_shifts_all"
  on public.template_shifts for all
  using (
    public.is_org_member((
      select public.location_org_id(location_id)
      from public.schedule_templates where id = template_id
    ))
  )
  with check (
    public.is_org_manager((
      select public.location_org_id(location_id)
      from public.schedule_templates where id = template_id
    ))
  );

-- ============================================================================
-- POLICIES PAR APPARTENANCE INDIRECTE (via employee -> org)
-- (contracts, absence_requests, leave_balances, employee_teams, employee_positions)
-- ============================================================================

-- Helper : org_id d'un employé.
create or replace function public.employee_org_id(emp uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.employees where id = emp;
$$;

-- CONTRACTS
create policy "contracts_select_member"
  on public.contracts for select
  using (public.is_org_member(public.employee_org_id(employee_id)));
create policy "contracts_manage_admin"
  on public.contracts for all
  using (public.has_org_role(public.employee_org_id(employee_id),
    array['org_owner', 'org_admin']::public.app_role[]))
  with check (public.has_org_role(public.employee_org_id(employee_id),
    array['org_owner', 'org_admin']::public.app_role[]));

-- ABSENCE_REQUESTS : un employé voit/crée les siennes, le manager gère toutes.
create policy "absence_requests_select"
  on public.absence_requests for select
  using (
    public.is_org_manager(public.employee_org_id(employee_id))
    or exists (
      select 1 from public.employees e
      where e.id = absence_requests.employee_id and e.user_id = auth.uid()
    )
  );

create policy "absence_requests_insert_own_or_manager"
  on public.absence_requests for insert
  with check (
    public.is_org_manager(public.employee_org_id(employee_id))
    or exists (
      select 1 from public.employees e
      where e.id = absence_requests.employee_id and e.user_id = auth.uid()
    )
  );

create policy "absence_requests_update_manager"
  on public.absence_requests for update
  using (public.is_org_manager(public.employee_org_id(employee_id)))
  with check (public.is_org_manager(public.employee_org_id(employee_id)));

-- LEAVE_BALANCES
create policy "leave_balances_select"
  on public.leave_balances for select
  using (
    public.is_org_manager(public.employee_org_id(employee_id))
    or exists (
      select 1 from public.employees e
      where e.id = leave_balances.employee_id and e.user_id = auth.uid()
    )
  );
create policy "leave_balances_manage_admin"
  on public.leave_balances for all
  using (public.has_org_role(public.employee_org_id(employee_id),
    array['org_owner', 'org_admin']::public.app_role[]))
  with check (public.has_org_role(public.employee_org_id(employee_id),
    array['org_owner', 'org_admin']::public.app_role[]));

-- EMPLOYEE_TEAMS
create policy "employee_teams_select"
  on public.employee_teams for select
  using (public.is_org_member(public.employee_org_id(employee_id)));
create policy "employee_teams_manage"
  on public.employee_teams for all
  using (public.is_org_manager(public.employee_org_id(employee_id)))
  with check (public.is_org_manager(public.employee_org_id(employee_id)));

-- EMPLOYEE_POSITIONS
create policy "employee_positions_select"
  on public.employee_positions for select
  using (public.is_org_member(public.employee_org_id(employee_id)));
create policy "employee_positions_manage"
  on public.employee_positions for all
  using (public.is_org_manager(public.employee_org_id(employee_id)))
  with check (public.is_org_manager(public.employee_org_id(employee_id)));
