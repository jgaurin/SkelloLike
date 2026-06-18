-- ============================================================================
-- Ritem — Jeu de données démo « restaurant » complet (idempotent)
--
-- Crée (ou réutilise) une organisation restaurant « Le Comptoir Doré » avec
-- DEUX établissements (Bastille + Lyon), postes, équipes, employés, contrats,
-- plannings + shifts sur 3 semaines, pointages (timeclocks) réalistes,
-- absences et soldes de congés.
--
-- Rattache l'org au PREMIER owner trouvé (le compte admin créé au déploiement).
-- Rejouable : on repart d'une org propre nommée « Le Comptoir Doré ».
--
-- Exécution :
--   psql "<connexion>" -v ON_ERROR_STOP=1 -f supabase/seed-restaurant.sql
-- ============================================================================

do $$
declare
  v_owner   uuid;
  v_org     uuid;
  v_loc_a   uuid;  -- Bastille (Paris)
  v_loc_b   uuid;  -- Lyon
  v_monday  date := date_trunc('week', current_date)::date;

  -- postes
  p_manager uuid; p_chefcuis uuid; p_cuisinier uuid; p_chefrang uuid;
  p_serveur uuid; p_barman uuid; p_plongeur uuid;

  -- équipes
  t_salle_a uuid; t_cuisine_a uuid; t_salle_b uuid; t_cuisine_b uuid;

  -- types d'absence
  at_cp uuid; at_maladie uuid; at_sans uuid;

  -- employés établissement A (Bastille)
  e_lucas uuid; e_sarah uuid; e_hugo uuid; e_emma uuid; e_nathan uuid; e_chloe uuid;
  -- employés établissement B (Lyon)
  e_jules uuid; e_lea uuid; e_yanis uuid; e_manon uuid;

  v_sched uuid;
  v_week  date;
  d       date;
  v_emp   uuid;
  v_pos   uuid;
  v_in    timestamptz;
  v_out   timestamptz;
begin
  ------------------------------------------------------------------------------
  -- 0. Owner + nettoyage d'une éventuelle org démo précédente
  ------------------------------------------------------------------------------
  select user_id into v_owner
  from public.memberships where role = 'org_owner'
  order by created_at limit 1;

  if v_owner is null then
    raise exception 'Aucun org_owner trouvé. Crée d''abord un compte propriétaire.';
  end if;

  delete from public.organizations where name = 'Le Comptoir Doré';

  ------------------------------------------------------------------------------
  -- 1. Organisation + 2 établissements
  ------------------------------------------------------------------------------
  insert into public.organizations (name, slug, plan, trial_ends_at)
  values ('Le Comptoir Doré', 'comptoir-dore-'||substr(md5(random()::text),1,4),
          'trial', now() + interval '14 days')
  returning id into v_org;

  insert into public.memberships (org_id, user_id, role)
  values (v_org, v_owner, 'org_owner');

  insert into public.locations (org_id, name, address, postal_code, city, sector, color)
  values (v_org, 'Le Comptoir Doré — Bastille', '12 rue de la Roquette', '75011', 'Paris', 'Restauration', '#B45309')
  returning id into v_loc_a;

  insert into public.locations (org_id, name, address, postal_code, city, sector, color)
  values (v_org, 'Le Comptoir Doré — Lyon', '5 rue Mercière', '69002', 'Lyon', 'Restauration', '#0E7490')
  returning id into v_loc_b;

  ------------------------------------------------------------------------------
  -- 2. Postes (métiers restaurant)
  ------------------------------------------------------------------------------
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Manager',          '#7C3AED', 16.50) returning id into p_manager;
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Chef de cuisine',  '#DC2626', 18.00) returning id into p_chefcuis;
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Cuisinier',        '#EA580C', 13.50) returning id into p_cuisinier;
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Chef de rang',     '#0891B2', 13.00) returning id into p_chefrang;
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Serveur',          '#059669', 12.00) returning id into p_serveur;
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Barman',           '#D97706', 12.50) returning id into p_barman;
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Plongeur',         '#64748B', 11.88) returning id into p_plongeur;

  ------------------------------------------------------------------------------
  -- 3. Équipes (par établissement)
  ------------------------------------------------------------------------------
  insert into public.teams (location_id, name, color) values
    (v_loc_a, 'Salle Bastille',   '#059669') returning id into t_salle_a;
  insert into public.teams (location_id, name, color) values
    (v_loc_a, 'Cuisine Bastille', '#DC2626') returning id into t_cuisine_a;
  insert into public.teams (location_id, name, color) values
    (v_loc_b, 'Salle Lyon',       '#0891B2') returning id into t_salle_b;
  insert into public.teams (location_id, name, color) values
    (v_loc_b, 'Cuisine Lyon',     '#EA580C') returning id into t_cuisine_b;

  ------------------------------------------------------------------------------
  -- 4. Types d'absence (réutilise ceux par défaut si présents)
  ------------------------------------------------------------------------------
  select id into at_cp from public.absence_types where org_id = v_org and name ilike 'cong%pay%' limit 1;
  if at_cp is null then
    insert into public.absence_types (org_id, name, color, affects_counter)
    values (v_org, 'Congés payés', '#059669', true) returning id into at_cp;
  end if;
  insert into public.absence_types (org_id, name, color, affects_counter)
  values (v_org, 'Maladie', '#DC2626', false) returning id into at_maladie;
  insert into public.absence_types (org_id, name, color, affects_counter)
  values (v_org, 'Sans solde', '#94A3B8', false) returning id into at_sans;

  ------------------------------------------------------------------------------
  -- 5. Employés — Bastille (6)
  ------------------------------------------------------------------------------
  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date) values
    (v_org, 'Lucas',  'Moreau',   'lucas.moreau@comptoir-dore.fr',  '0611223344', 'CD-001', 'active', '2022-03-01') returning id into e_lucas;
  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date) values
    (v_org, 'Sarah',  'Benali',   'sarah.benali@comptoir-dore.fr',  '0622334455', 'CD-002', 'active', '2023-01-15') returning id into e_sarah;
  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date) values
    (v_org, 'Hugo',   'Lefevre',  'hugo.lefevre@comptoir-dore.fr',  '0633445566', 'CD-003', 'active', '2023-06-01') returning id into e_hugo;
  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date) values
    (v_org, 'Emma',   'Garcia',   'emma.garcia@comptoir-dore.fr',   '0644556677', 'CD-004', 'active', '2024-02-10') returning id into e_emma;
  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date) values
    (v_org, 'Nathan', 'Roussel',  'nathan.roussel@comptoir-dore.fr','0655667788', 'CD-005', 'active', '2024-09-01') returning id into e_nathan;
  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date) values
    (v_org, 'Chloé',  'Petit',    'chloe.petit@comptoir-dore.fr',   '0666778899', 'CD-006', 'active', '2025-01-06') returning id into e_chloe;

  -- Employés — Lyon (4)
  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date) values
    (v_org, 'Jules',  'Fontaine', 'jules.fontaine@comptoir-dore.fr','0677889900', 'CD-101', 'active', '2022-09-12') returning id into e_jules;
  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date) values
    (v_org, 'Léa',    'Dubois',   'lea.dubois@comptoir-dore.fr',    '0688990011', 'CD-102', 'active', '2023-04-03') returning id into e_lea;
  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date) values
    (v_org, 'Yanis',  'Khelif',   'yanis.khelif@comptoir-dore.fr',  '0699001122', 'CD-103', 'active', '2024-05-20') returning id into e_yanis;
  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date) values
    (v_org, 'Manon',  'Girard',   'manon.girard@comptoir-dore.fr',  '0610111213', 'CD-104', 'active', '2024-11-04') returning id into e_manon;

  ------------------------------------------------------------------------------
  -- 6. Rattachements établissement (employee_locations)
  ------------------------------------------------------------------------------
  insert into public.employee_locations (employee_id, location_id, is_primary) values
    (e_lucas, v_loc_a, true), (e_sarah, v_loc_a, true), (e_hugo, v_loc_a, true),
    (e_emma, v_loc_a, true),  (e_nathan, v_loc_a, true), (e_chloe, v_loc_a, true),
    (e_jules, v_loc_b, true), (e_lea, v_loc_b, true), (e_yanis, v_loc_b, true),
    (e_manon, v_loc_b, true);

  -- 7. Postes des employés (employee_positions)
  insert into public.employee_positions (employee_id, position_id) values
    (e_lucas, p_manager), (e_sarah, p_chefrang), (e_sarah, p_serveur),
    (e_hugo, p_chefcuis), (e_emma, p_serveur), (e_nathan, p_cuisinier),
    (e_chloe, p_plongeur), (e_chloe, p_serveur),
    (e_jules, p_manager), (e_jules, p_chefrang),
    (e_lea, p_serveur), (e_lea, p_barman),
    (e_yanis, p_cuisinier), (e_manon, p_serveur);

  -- 8. Équipes des employés (employee_teams)
  insert into public.employee_teams (employee_id, team_id) values
    (e_lucas, t_salle_a), (e_sarah, t_salle_a), (e_emma, t_salle_a), (e_chloe, t_salle_a),
    (e_hugo, t_cuisine_a), (e_nathan, t_cuisine_a),
    (e_jules, t_salle_b), (e_lea, t_salle_b), (e_manon, t_salle_b),
    (e_yanis, t_cuisine_b);

  ------------------------------------------------------------------------------
  -- 9. Contrats
  ------------------------------------------------------------------------------
  insert into public.contracts (employee_id, type, start_date, weekly_hours, hourly_rate, position_id) values
    (e_lucas, 'cdi', '2022-03-01', 39, 16.50, p_manager),
    (e_sarah, 'cdi', '2023-01-15', 35, 13.00, p_chefrang),
    (e_hugo,  'cdi', '2023-06-01', 39, 18.00, p_chefcuis),
    (e_emma,  'cdi', '2024-02-10', 35, 12.00, p_serveur),
    (e_nathan,'cdi', '2024-09-01', 35, 13.50, p_cuisinier),
    (e_jules, 'cdi', '2022-09-12', 39, 16.50, p_manager),
    (e_lea,   'cdi', '2023-04-03', 35, 12.50, p_serveur),
    (e_yanis, 'cdi', '2024-05-20', 35, 13.50, p_cuisinier);
  insert into public.contracts (employee_id, type, start_date, end_date, weekly_hours, hourly_rate, position_id) values
    (e_chloe, 'cdd',     '2025-01-06', current_date + 60, 24, 11.88, p_plongeur),
    (e_manon, 'apprenticeship', '2024-11-04', current_date + 300, 28, 11.00, p_serveur);

  ------------------------------------------------------------------------------
  -- 10. Plannings + shifts sur 3 semaines (S-1 passée, S0 courante, S+1 future)
  --     Bastille : service midi + soir ; Lyon : service soir.
  ------------------------------------------------------------------------------
  for v_week in
    select unnest(array[v_monday - 7, v_monday, v_monday + 7])
  loop
    -- ----- Établissement A : Bastille -----
    insert into public.schedules (location_id, week_start, status, published_at)
    values (v_loc_a, v_week,
            (case when v_week <= v_monday then 'published' else 'draft' end)::public.schedule_status,
            case when v_week <= v_monday then now() else null end)
    returning id into v_sched;

    -- mardi → dimanche (fermé le lundi)
    for d in select generate_series(v_week + 1, v_week + 6, interval '1 day')::date loop
      -- Service du midi (sauf dimanche)
      if extract(dow from d) <> 0 then
        insert into public.shifts (schedule_id, employee_id, position_id, shift_date, start_time, end_time, break_minutes, status) values
          (v_sched, e_lucas,  p_manager,   d, '10:00', '15:00', 0,  'published'),
          (v_sched, e_sarah,  p_chefrang,  d, '11:00', '15:30', 30, 'published'),
          (v_sched, e_emma,   p_serveur,   d, '11:30', '15:00', 0,  'published'),
          (v_sched, e_hugo,   p_chefcuis,  d, '09:30', '15:00', 30, 'published'),
          (v_sched, e_nathan, p_cuisinier, d, '10:00', '15:00', 30, 'published'),
          (v_sched, e_chloe,  p_plongeur,  d, '11:30', '15:00', 0,  'published');
      end if;
      -- Service du soir (mardi → samedi)
      if extract(dow from d) between 2 and 6 then
        insert into public.shifts (schedule_id, employee_id, position_id, shift_date, start_time, end_time, break_minutes, status) values
          (v_sched, e_lucas,  p_manager,   d, '18:30', '23:30', 0,  'published'),
          (v_sched, e_sarah,  p_chefrang,  d, '18:00', '23:30', 30, 'published'),
          (v_sched, e_emma,   p_serveur,   d, '18:30', '23:30', 0,  'published'),
          (v_sched, e_hugo,   p_chefcuis,  d, '17:30', '23:30', 30, 'published'),
          (v_sched, e_nathan, p_cuisinier, d, '18:00', '23:30', 30, 'published'),
          (v_sched, e_chloe,  p_plongeur,  d, '18:30', '23:30', 0,  'published');
      end if;
    end loop;

    -- ----- Établissement B : Lyon (service soir, mer → dim) -----
    insert into public.schedules (location_id, week_start, status, published_at)
    values (v_loc_b, v_week,
            (case when v_week <= v_monday then 'published' else 'draft' end)::public.schedule_status,
            case when v_week <= v_monday then now() else null end)
    returning id into v_sched;

    for d in select generate_series(v_week + 2, v_week + 6, interval '1 day')::date loop
      insert into public.shifts (schedule_id, employee_id, position_id, shift_date, start_time, end_time, break_minutes, status) values
        (v_sched, e_jules, p_manager,   d, '17:30', '23:30', 0,  'published'),
        (v_sched, e_lea,   p_serveur,   d, '18:00', '23:30', 30, 'published'),
        (v_sched, e_manon, p_serveur,   d, '18:30', '23:30', 0,  'published'),
        (v_sched, e_yanis, p_cuisinier, d, '17:00', '23:30', 30, 'published');
    end loop;
  end loop;

  ------------------------------------------------------------------------------
  -- 11. Pointages (timeclocks) — sur les jours passés de la semaine courante
  --     et la semaine précédente, pour les employés du midi (Bastille).
  --     Heures réelles ~ proches du planning, avec pauses.
  ------------------------------------------------------------------------------
  for d in select generate_series(v_monday - 6, least(current_date, v_monday + 6), interval '1 day')::date loop
    if d <= current_date and extract(dow from d) <> 0 and extract(dow from d) <> 1 then
      -- midi : Lucas, Sarah, Emma, Hugo, Nathan, Chloé
      foreach v_emp in array array[e_lucas, e_sarah, e_emma, e_hugo, e_nathan, e_chloe] loop
        v_in  := (d + time '10:02') + (floor(random()*8) || ' minutes')::interval;
        v_out := (d + time '15:05') + (floor(random()*15) || ' minutes')::interval;
        insert into public.timeclocks (org_id, location_id, employee_id, clock_in, clock_out, break_minutes)
        values (v_org, v_loc_a, v_emp, v_in, v_out, (array[0,20,30])[1 + floor(random()*3)]);
      end loop;
    end if;
  end loop;

  -- Un pointage EN COURS aujourd'hui (présent, pas encore parti) si on est en service
  insert into public.timeclocks (org_id, location_id, employee_id, clock_in, break_minutes)
  values (v_org, v_loc_a, e_emma, date_trunc('day', now()) + interval '18 hours 33 minutes', 0);

  ------------------------------------------------------------------------------
  -- 12. Absences (approuvées + en attente) + soldes de congés
  ------------------------------------------------------------------------------
  -- Soldes congés payés (année courante) pour tous
  insert into public.leave_balances (employee_id, type_id, year, acquired, taken, adjusted)
  select e.id, at_cp, extract(year from current_date)::smallint,
         25.0, (array[0,5,10,2.5])[1 + floor(random()*4)], 0
  from public.employees e where e.org_id = v_org;

  -- Congés approuvés (passé/à venir)
  insert into public.absence_requests (employee_id, type_id, start_date, end_date, status, comment, reviewed_by, reviewed_at) values
    (e_sarah, at_cp, v_monday + 12, v_monday + 18, 'approved', 'Vacances famille', v_owner, now() - interval '5 days'),
    (e_hugo,  at_cp, v_monday - 20, v_monday - 14, 'approved', 'Congé hiver', v_owner, now() - interval '30 days');
  -- Maladie passée
  insert into public.absence_requests (employee_id, type_id, start_date, end_date, status, comment, reviewed_by, reviewed_at) values
    (e_nathan, at_maladie, v_monday - 4, v_monday - 3, 'approved', 'Arrêt maladie', v_owner, now() - interval '6 days');
  -- Demandes EN ATTENTE (à valider par le manager)
  insert into public.absence_requests (employee_id, type_id, start_date, end_date, status, comment) values
    (e_emma,  at_cp, v_monday + 19, v_monday + 23, 'pending', 'Week-end prolongé'),
    (e_lea,   at_cp, v_monday + 26, v_monday + 33, 'pending', 'Vacances été'),
    (e_chloe, at_sans, v_monday + 8, v_monday + 8, 'pending', 'Rendez-vous administratif');

  raise notice 'Seed restaurant OK : org=% (Bastille=%, Lyon=%), 10 employés, semaine courante=%',
    v_org, v_loc_a, v_loc_b, v_monday;
end $$;
