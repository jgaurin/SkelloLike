-- ============================================================================
-- SkelloLike — Types d'absence par défaut
-- Crée un jeu de types standard pour chaque nouvelle organisation, et
-- backfille les organisations existantes.
-- ============================================================================

-- Insère les types par défaut pour une organisation donnée (si absents).
create or replace function public.seed_default_absence_types(target_org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.absence_types (org_id, name, color, affects_counter)
  select target_org, t.name, t.color, t.affects_counter
  from (values
    ('Congés payés',        '#059669', true),
    ('RTT',                 '#0EA5E9', true),
    ('Maladie',             '#EF4444', false),
    ('Congé sans solde',    '#64748B', false),
    ('Congé exceptionnel',  '#8B5CF6', false),
    ('Accident du travail', '#F59E0B', false)
  ) as t(name, color, affects_counter)
  where not exists (
    select 1 from public.absence_types a
    where a.org_id = target_org and a.name = t.name
  );
end;
$$;

-- Trigger : à la création d'une organisation, on crée ses types par défaut.
create or replace function public.handle_new_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_absence_types(new.id);
  return new;
end;
$$;

create trigger on_org_created
  after insert on public.organizations
  for each row execute function public.handle_new_org();

-- Backfill des organisations déjà existantes.
do $$
declare
  o record;
begin
  for o in select id from public.organizations loop
    perform public.seed_default_absence_types(o.id);
  end loop;
end;
$$;
