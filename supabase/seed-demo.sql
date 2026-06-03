-- ============================================================================
-- SkelloLike — Données de démo (réexécutable / idempotent)
-- Injecte postes, employés, contrats et shifts dans la PREMIÈRE organisation
-- trouvée (celle de l'utilisateur courant en dev).
--
-- Exécution : docker exec -i supabase_db_SkelloLike psql -U postgres < supabase/seed-demo.sql
-- ou via le script npm : npm run db:seed-demo
-- ============================================================================

do $$
declare
  v_org   uuid;
  v_loc   uuid;
  v_team  uuid;
  v_monday date := date_trunc('week', current_date)::date; -- lundi courant
  v_sched uuid;

  -- postes
  p_serveur   uuid;
  p_cuisine   uuid;
  p_caisse    uuid;
  p_manager   uuid;
  p_plonge    uuid;

  -- employés
  e_dupont    uuid;
  e_martin    uuid;
  e_bernard   uuid;
  e_petit     uuid;
  e_durand    uuid;
  e_leroy     uuid;
begin
  -- Première org + premier établissement.
  select id into v_org from organizations order by created_at limit 1;
  if v_org is null then
    raise notice 'Aucune organisation. Crée un compte + onboarding avant de seeder.';
    return;
  end if;

  select id into v_loc from locations where org_id = v_org order by created_at limit 1;
  if v_loc is null then
    insert into locations (org_id, name, city, sector)
    values (v_org, 'Restaurant Démo', 'Paris', 'Restauration')
    returning id into v_loc;
  end if;

  -- Équipe (optionnelle).
  select id into v_team from teams where location_id = v_loc limit 1;
  if v_team is null then
    insert into teams (location_id, name, color)
    values (v_loc, 'Salle', '#059669') returning id into v_team;
  end if;

  -- ----- POSTES (couleurs métier) -----
  insert into positions (org_id, name, color, default_rate) values
    (v_org, 'Serveur',   '#059669', 12.50),
    (v_org, 'Cuisinier', '#EF4444', 14.00),
    (v_org, 'Caissier',  '#0EA5E9', 12.00),
    (v_org, 'Manager',   '#8B5CF6', 18.00),
    (v_org, 'Plongeur',  '#F59E0B', 11.80)
  on conflict do nothing;

  select id into p_serveur from positions where org_id = v_org and name = 'Serveur' limit 1;
  select id into p_cuisine from positions where org_id = v_org and name = 'Cuisinier' limit 1;
  select id into p_caisse  from positions where org_id = v_org and name = 'Caissier' limit 1;
  select id into p_manager from positions where org_id = v_org and name = 'Manager' limit 1;
  select id into p_plonge  from positions where org_id = v_org and name = 'Plongeur' limit 1;

  -- ----- EMPLOYÉS (avec matricule pour l'idempotence) -----
  insert into employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date) values
    (v_org, 'Camille', 'Dupont',  'camille.dupont@demo.fr',  '0601020304', 'EMP-001', 'active', '2024-01-15'),
    (v_org, 'Lucas',   'Martin',  'lucas.martin@demo.fr',    '0602030405', 'EMP-002', 'active', '2024-03-01'),
    (v_org, 'Sarah',   'Bernard', 'sarah.bernard@demo.fr',   '0603040506', 'EMP-003', 'active', '2023-09-10'),
    (v_org, 'Hugo',    'Petit',   'hugo.petit@demo.fr',      '0604050607', 'EMP-004', 'active', '2024-06-20'),
    (v_org, 'Emma',    'Durand',  'emma.durand@demo.fr',     '0605060708', 'EMP-005', 'active', '2022-11-05'),
    (v_org, 'Nathan',  'Leroy',   'nathan.leroy@demo.fr',    '0606070809', 'EMP-006', 'active', '2025-02-12')
  on conflict do nothing;

  select id into e_dupont  from employees where org_id = v_org and employee_number = 'EMP-001';
  select id into e_martin  from employees where org_id = v_org and employee_number = 'EMP-002';
  select id into e_bernard from employees where org_id = v_org and employee_number = 'EMP-003';
  select id into e_petit   from employees where org_id = v_org and employee_number = 'EMP-004';
  select id into e_durand  from employees where org_id = v_org and employee_number = 'EMP-005';
  select id into e_leroy   from employees where org_id = v_org and employee_number = 'EMP-006';

  -- ----- CONTRATS (1 par employé si absent) -----
  insert into contracts (employee_id, type, start_date, weekly_hours, hourly_rate, position_id)
  select e_dupont, 'cdi', '2024-01-15', 35, 12.50, p_serveur
  where not exists (select 1 from contracts where employee_id = e_dupont);
  insert into contracts (employee_id, type, start_date, weekly_hours, hourly_rate, position_id)
  select e_martin, 'cdi', '2024-03-01', 39, 14.00, p_cuisine
  where not exists (select 1 from contracts where employee_id = e_martin);
  insert into contracts (employee_id, type, start_date, weekly_hours, hourly_rate, position_id)
  select e_bernard, 'cdi', '2023-09-10', 35, 18.00, p_manager
  where not exists (select 1 from contracts where employee_id = e_bernard);
  insert into contracts (employee_id, type, start_date, end_date, weekly_hours, hourly_rate, position_id)
  select e_petit, 'cdd', '2024-06-20', '2026-12-31', 20, 12.00, p_caisse
  where not exists (select 1 from contracts where employee_id = e_petit);
  insert into contracts (employee_id, type, start_date, weekly_hours, hourly_rate, position_id)
  select e_durand, 'cdi', '2022-11-05', 35, 12.50, p_serveur
  where not exists (select 1 from contracts where employee_id = e_durand);
  insert into contracts (employee_id, type, start_date, end_date, weekly_hours, hourly_rate, position_id)
  select e_leroy, 'apprenticeship', '2025-02-12', '2027-02-11', 28, 9.50, p_plonge
  where not exists (select 1 from contracts where employee_id = e_leroy);

  -- ----- POSTES OCCUPABLES -----
  insert into employee_positions (employee_id, position_id) values
    (e_dupont, p_serveur), (e_dupont, p_caisse),
    (e_martin, p_cuisine), (e_martin, p_plonge),
    (e_bernard, p_manager), (e_bernard, p_serveur),
    (e_petit, p_caisse), (e_petit, p_serveur),
    (e_durand, p_serveur),
    (e_leroy, p_plonge), (e_leroy, p_cuisine)
  on conflict do nothing;

  -- ----- PLANNING de la semaine courante + shifts -----
  select id into v_sched from schedules where location_id = v_loc and week_start = v_monday;
  if v_sched is null then
    insert into schedules (location_id, week_start, status)
    values (v_loc, v_monday, 'draft') returning id into v_sched;
  end if;

  -- On ne recrée les shifts démo que si le planning est quasi vide.
  if (select count(*) from shifts where schedule_id = v_sched) < 3 then
    insert into shifts (schedule_id, employee_id, position_id, shift_date, start_time, end_time, break_minutes, status) values
      -- Lundi
      (v_sched, e_dupont,  p_serveur, v_monday,                 '11:00', '15:00', 0,  'draft'),
      (v_sched, e_martin,  p_cuisine, v_monday,                 '10:00', '15:00', 30, 'draft'),
      (v_sched, e_bernard, p_manager, v_monday,                 '09:00', '17:00', 60, 'draft'),
      -- Mardi
      (v_sched, e_dupont,  p_serveur, v_monday + 1,             '18:00', '23:00', 0,  'draft'),
      (v_sched, e_durand,  p_serveur, v_monday + 1,             '11:00', '15:00', 0,  'draft'),
      (v_sched, e_leroy,   p_plonge,  v_monday + 1,             '18:00', '23:00', 0,  'draft'),
      -- Mercredi
      (v_sched, e_martin,  p_cuisine, v_monday + 2,             '10:00', '15:00', 30, 'draft'),
      (v_sched, e_petit,   p_caisse,  v_monday + 2,             '12:00', '19:00', 30, 'draft'),
      -- Jeudi
      (v_sched, e_bernard, p_manager, v_monday + 3,             '09:00', '17:00', 60, 'draft'),
      (v_sched, e_dupont,  p_serveur, v_monday + 3,             '18:00', '23:00', 0,  'draft'),
      (v_sched, e_martin,  p_cuisine, v_monday + 3,             '18:00', '23:30', 30, 'draft'),
      -- Vendredi
      (v_sched, e_durand,  p_serveur, v_monday + 4,             '18:00', '23:30', 0,  'draft'),
      (v_sched, e_petit,   p_caisse,  v_monday + 4,             '18:00', '23:00', 0,  'draft'),
      (v_sched, e_leroy,   p_plonge,  v_monday + 4,             '18:00', '23:30', 0,  'draft'),
      -- Samedi
      (v_sched, e_dupont,  p_serveur, v_monday + 5,             '11:00', '16:00', 30, 'draft'),
      (v_sched, e_durand,  p_serveur, v_monday + 5,             '18:00', '23:30', 0,  'draft'),
      (v_sched, e_martin,  p_cuisine, v_monday + 5,             '10:00', '23:00', 60, 'draft'),
      (v_sched, e_bernard, p_manager, v_monday + 5,             '11:00', '20:00', 60, 'draft');
  end if;

  raise notice 'Seed démo OK pour org %, planning semaine du %.', v_org, v_monday;
end;
$$;
