-- ============================================================================
-- SkelloLike — Taux de majoration pour la pré-paie
-- Heures de nuit, dimanche, jours fériés. Plage de nuit configurable.
-- Stocké au niveau organisation (paramétrable dans les réglages).
-- ============================================================================

alter table public.organizations
  -- Majoration des heures de nuit (% ex : 25).
  add column if not exists night_premium_rate numeric(5, 2) not null default 0,
  -- Plage de nuit : début et fin (heures, ex : 21 -> 6).
  add column if not exists night_start_hour smallint not null default 21,
  add column if not exists night_end_hour smallint not null default 6,
  -- Majoration du dimanche (% ex : 20).
  add column if not exists sunday_premium_rate numeric(5, 2) not null default 0,
  -- Majoration des jours fériés (% ex : 100).
  add column if not exists holiday_premium_rate numeric(5, 2) not null default 0;
