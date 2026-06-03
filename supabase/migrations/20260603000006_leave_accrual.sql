-- ============================================================================
-- SkelloLike — Acquisition automatique des congés
-- Chaque type d'absence peut acquérir un nombre de jours par mois travaillé.
-- L'acquis se calcule automatiquement depuis la date d'entrée de l'employé,
-- borné à la période de référence en cours (par défaut année civile).
-- ============================================================================

alter table public.absence_types
  -- Jours acquis par mois travaillé (ex : 2.5 pour les CP en jours ouvrables).
  add column if not exists monthly_accrual numeric(5, 2) not null default 0,
  -- Plafond annuel d'acquisition (ex : 30). 0 = pas de plafond.
  add column if not exists annual_cap numeric(6, 2) not null default 0,
  -- Mois de début de la période de référence (1 = janvier, 6 = juin…).
  add column if not exists period_start_month smallint not null default 1;

-- Valeurs par défaut "standard FR" pour les types existants.
-- CP : 2,5 j/mois, plafond 30, période juin (mois 6).
update public.absence_types
set monthly_accrual = 2.5, annual_cap = 30, period_start_month = 6
where name = 'Congés payés';

-- RTT : 1 j/mois, plafond 12, année civile.
update public.absence_types
set monthly_accrual = 1, annual_cap = 12, period_start_month = 1
where name = 'RTT';
