-- ============================================================================
-- SkelloLike — Règles & compteurs au niveau organisation
-- Convention collective, taux de charges, jours de référence, indemnités repas.
-- ============================================================================

alter table public.organizations
  -- Convention collective (libellé / IDCC).
  add column if not exists collective_agreement text,
  -- Taux de charges patronales (%) pour l'estimation de la masse salariale.
  add column if not exists payroll_charge_rate numeric(5, 2) not null default 43,
  -- Nombre de jours travaillés de référence par semaine.
  add column if not exists reference_days_per_week smallint not null default 5,
  -- Indemnisation des repas activée.
  add column if not exists meal_allowance_enabled boolean not null default false,
  -- Montant de l'indemnité repas (€) par repas.
  add column if not exists meal_allowance_amount numeric(8, 2) not null default 0;
