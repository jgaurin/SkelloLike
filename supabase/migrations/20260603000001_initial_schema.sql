-- ============================================================================
-- SkelloLike — Schéma initial Phase 1
-- Multi-tenant : organization > location > team > employee
-- ============================================================================

-- Extensions ---------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Rôle d'un membre au sein d'une organisation.
create type public.app_role as enum (
  'org_owner',
  'org_admin',
  'location_manager',
  'team_manager',
  'employee'
);

-- Plan d'abonnement de l'organisation.
create type public.org_plan as enum (
  'trial',
  'starter',
  'growth',
  'enterprise'
);

-- Type de contrat.
create type public.contract_type as enum (
  'cdi',
  'cdd',
  'interim',
  'extra',
  'apprenticeship',
  'internship'
);

-- Statut d'un employé.
create type public.employee_status as enum (
  'active',
  'inactive',
  'archived'
);

-- Statut d'un shift (créneau de planning).
create type public.shift_status as enum (
  'draft',
  'published',
  'confirmed',
  'cancelled'
);

-- Statut d'un planning hebdomadaire.
create type public.schedule_status as enum (
  'draft',
  'published'
);

-- Statut d'une demande d'absence.
create type public.absence_status as enum (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

-- ============================================================================
-- TABLES MULTI-TENANT
-- ============================================================================

-- Organisation (entreprise cliente) ----------------------------------------
create table public.organizations (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  plan          public.org_plan not null default 'trial',
  trial_ends_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Établissement / site ------------------------------------------------------
create table public.locations (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null,
  address     text,
  postal_code text,
  city        text,
  country     text not null default 'FR',
  timezone    text not null default 'Europe/Paris',
  sector      text,
  color       text not null default '#7C3AED',
  day_start_hour smallint not null default 0, -- heure de début de journée (ex: 6 pour la restauration)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_locations_org on public.locations (org_id);

-- Équipe / service ----------------------------------------------------------
create table public.teams (
  id          uuid primary key default uuid_generate_v4(),
  location_id uuid not null references public.locations (id) on delete cascade,
  name        text not null,
  color       text not null default '#7C3AED',
  created_at  timestamptz not null default now()
);

create index idx_teams_location on public.teams (location_id);

-- ============================================================================
-- UTILISATEURS & RH
-- ============================================================================

-- Profil applicatif lié à un compte auth.users -----------------------------
-- Un même utilisateur peut appartenir à plusieurs organisations via memberships.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name  text,
  email      text not null,
  phone      text,
  avatar_url text,
  locale     text not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Appartenance d'un utilisateur à une organisation, avec son rôle ----------
create table public.memberships (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.app_role not null default 'employee',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index idx_memberships_user on public.memberships (user_id);
create index idx_memberships_org on public.memberships (org_id);

-- Employé (fiche RH) --------------------------------------------------------
-- Peut être rattaché à un compte (user_id) ou non (employé sans accès appli).
create table public.employees (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid references public.profiles (id) on delete set null,
  first_name      text not null,
  last_name       text not null,
  email           text,
  phone           text,
  avatar_url      text,
  employee_number text,
  status          public.employee_status not null default 'active',
  hire_date       date,
  exit_date       date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_employees_org on public.employees (org_id);
create index idx_employees_user on public.employees (user_id);

-- Rattachement employé <-> équipe (many-to-many) ---------------------------
create table public.employee_teams (
  employee_id uuid not null references public.employees (id) on delete cascade,
  team_id     uuid not null references public.teams (id) on delete cascade,
  primary key (employee_id, team_id)
);

-- Poste / qualification -----------------------------------------------------
create table public.positions (
  id           uuid primary key default uuid_generate_v4(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  name         text not null,
  color        text not null default '#7C3AED',
  default_rate numeric(10, 2),
  created_at   timestamptz not null default now()
);

create index idx_positions_org on public.positions (org_id);

-- Rattachement employé <-> poste (many-to-many) ----------------------------
create table public.employee_positions (
  employee_id uuid not null references public.employees (id) on delete cascade,
  position_id uuid not null references public.positions (id) on delete cascade,
  primary key (employee_id, position_id)
);

-- Contrat -------------------------------------------------------------------
create table public.contracts (
  id           uuid primary key default uuid_generate_v4(),
  employee_id  uuid not null references public.employees (id) on delete cascade,
  type         public.contract_type not null,
  start_date   date not null,
  end_date     date,
  weekly_hours numeric(5, 2) not null default 35,
  hourly_rate  numeric(10, 2),
  position_id  uuid references public.positions (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Un CDD/extra/intérim/stage doit avoir une date de fin.
  constraint chk_contract_end_date check (
    type = 'cdi' or end_date is not null
  )
);

create index idx_contracts_employee on public.contracts (employee_id);

-- ============================================================================
-- PLANNING
-- ============================================================================

-- Planning hebdomadaire (un par semaine et par établissement) --------------
create table public.schedules (
  id           uuid primary key default uuid_generate_v4(),
  location_id  uuid not null references public.locations (id) on delete cascade,
  week_start   date not null, -- toujours un lundi
  status       public.schedule_status not null default 'draft',
  published_at timestamptz,
  published_by uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (location_id, week_start)
);

create index idx_schedules_location on public.schedules (location_id);

-- Shift (créneau de travail) ------------------------------------------------
create table public.shifts (
  id             uuid primary key default uuid_generate_v4(),
  schedule_id    uuid not null references public.schedules (id) on delete cascade,
  employee_id    uuid references public.employees (id) on delete set null,
  position_id    uuid references public.positions (id) on delete set null,
  shift_date     date not null,
  start_time     time not null,
  end_time       time not null,
  break_minutes  smallint not null default 0,
  note_manager   text,
  note_employee  text,
  status         public.shift_status not null default 'draft',
  color          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_shifts_schedule on public.shifts (schedule_id);
create index idx_shifts_employee on public.shifts (employee_id);
create index idx_shifts_date on public.shifts (shift_date);

-- Modèle de planning --------------------------------------------------------
create table public.schedule_templates (
  id          uuid primary key default uuid_generate_v4(),
  location_id uuid not null references public.locations (id) on delete cascade,
  name        text not null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.template_shifts (
  id          uuid primary key default uuid_generate_v4(),
  template_id uuid not null references public.schedule_templates (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = lundi
  position_id uuid references public.positions (id) on delete set null,
  employee_id uuid references public.employees (id) on delete set null,
  start_time  time not null,
  end_time    time not null,
  break_minutes smallint not null default 0
);

create index idx_template_shifts_template on public.template_shifts (template_id);

-- ============================================================================
-- ABSENCES & CONGÉS
-- ============================================================================

-- Type d'absence (configurable par organisation) ---------------------------
create table public.absence_types (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  color           text not null default '#94A3B8',
  affects_counter boolean not null default true, -- décompte d'un solde
  created_at      timestamptz not null default now()
);

create index idx_absence_types_org on public.absence_types (org_id);

-- Demande d'absence ---------------------------------------------------------
create table public.absence_requests (
  id          uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  type_id     uuid not null references public.absence_types (id) on delete restrict,
  start_date  date not null,
  end_date    date not null,
  status      public.absence_status not null default 'pending',
  comment     text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint chk_absence_dates check (end_date >= start_date)
);

create index idx_absence_requests_employee on public.absence_requests (employee_id);

-- Solde de congés par employé / type / année -------------------------------
create table public.leave_balances (
  id          uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  type_id     uuid not null references public.absence_types (id) on delete cascade,
  year        smallint not null,
  acquired    numeric(6, 2) not null default 0,
  taken       numeric(6, 2) not null default 0,
  adjusted    numeric(6, 2) not null default 0,
  unique (employee_id, type_id, year)
);

-- ============================================================================
-- TRIGGERS — updated_at automatique
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Applique le trigger updated_at à toutes les tables qui ont la colonne.
do $$
declare
  t text;
begin
  foreach t in array array[
    'organizations', 'locations', 'profiles', 'employees',
    'contracts', 'schedules', 'shifts', 'absence_requests'
  ]
  loop
    execute format(
      'create trigger trg_%1$s_updated_at
         before update on public.%1$s
         for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end;
$$;
