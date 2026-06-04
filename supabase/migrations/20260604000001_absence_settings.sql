-- ============================================================================
-- SkelloLike — Paramètres avancés des types d'absence
-- Activer/désactiver, demandable par l'employé, indemnisation, ordre d'affichage.
-- ============================================================================

alter table public.absence_types
  add column if not exists is_active boolean not null default true,
  add column if not exists can_be_requested boolean not null default false,
  -- 'employer' : indemnisée par l'employeur, 'third_party' : par un tiers, 'none'.
  add column if not exists paid_by text not null default 'employer',
  add column if not exists sort_order integer not null default 0;

-- Étend le seed des types par défaut avec la liste standard FR (réutilisable).
create or replace function public.seed_default_absence_types(target_org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.absence_types
    (org_id, name, color, affects_counter, can_be_requested, paid_by, sort_order)
  select target_org, t.name, t.color, t.affects, t.requestable, t.paid, t.ord
  from (values
    -- Indemnisées par l'employeur
    ('Congés payés',                 '#059669', true,  true,  'employer', 10),
    ('RTT',                          '#0EA5E9', true,  true,  'employer', 20),
    ('Absence autorisée rémunérée',  '#94A3B8', false, false, 'employer', 30),
    ('Absence pour examens médicaux','#A78BFA', true,  true,  'employer', 40),
    ('Chômage technique',            '#F59E0B', true,  false, 'employer', 50),
    ('Congé d''ancienneté',          '#10B981', true,  true,  'employer', 60),
    ('Congé de deuil',               '#64748B', true,  true,  'employer', 70),
    ('Congé événementiel',           '#8B5CF6', true,  true,  'employer', 80),
    ('Congé mariage / PACS',         '#EC4899', true,  true,  'employer', 90),
    ('Congé naissance',              '#F472B6', true,  true,  'employer', 100),
    ('École - CFA',                  '#0EA5E9', true,  true,  'employer', 110),
    ('Formation',                    '#6366F1', true,  true,  'employer', 120),
    ('Jour férié',                   '#EF4444', true,  false, 'employer', 130),
    ('Récupération JF',              '#FB923C', true,  false, 'employer', 140),
    ('Repos compensateur',           '#14B8A6', false, true,  'employer', 150),
    ('Télétravail',                  '#22C55E', true,  true,  'employer', 160),
    -- Indemnisées par un tiers
    ('Maladie',                      '#EF4444', false, false, 'third_party', 200),
    ('Accident du travail',          '#F59E0B', false, false, 'third_party', 210),
    ('Maternité / Paternité',        '#F472B6', false, false, 'third_party', 220),
    -- Non indemnisées
    ('Congé sans solde',             '#94A3B8', false, true,  'none', 300),
    ('Absence injustifiée',          '#DC2626', false, false, 'none', 310)
  ) as t(name, color, affects, requestable, paid, ord)
  where not exists (
    select 1 from public.absence_types a
    where a.org_id = target_org and a.name = t.name
  );
end;
$$;

-- Backfill : crée les nouveaux types pour les organisations existantes.
do $$
declare o record;
begin
  for o in select id from public.organizations loop
    perform public.seed_default_absence_types(o.id);
  end loop;
end;
$$;
