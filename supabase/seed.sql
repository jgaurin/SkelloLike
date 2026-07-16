-- ============================================================================
-- Ritem — Jeu de données démo « Boulangerie Cloé » (idempotent)
--
-- Une organisation boulangerie-pâtisserie artisanale avec DEUX établissements
-- (Centre-Ville + Gare), postes, équipes, 16 employés (tous types de contrat),
-- plannings + shifts publiés sur JUILLET et AOÛT 2026, pointages réalistes,
-- absences variées (congés, maladie, fermeture annuelle), soldes de congés,
-- documents RH, invitations en attente, modèles de planning, réglages
-- d'alertes et quelques demandes d'accès (leads plateforme).
--
-- Rejouable : supprime l'org « Boulangerie Cloé » et les comptes de démo
-- existants avant de tout recréer.
--
-- Chargé automatiquement par `supabase db reset` (voir supabase/config.toml,
-- [db.seed] sql_paths = ["./seed.sql"]). Peut aussi être rejoué seul :
--   docker exec -i supabase_db_SkelloLike psql -U postgres -d postgres -f supabase/seed.sql
--
-- Connexions de test (mot de passe unique) :
--   chloe.marchand@boulangerie-cloe.fr   — org_owner (gérante, les 2 sites)
--   karim.haddad@boulangerie-cloe.fr     — location_manager (Centre-Ville)
--   antoine.lemoine@boulangerie-cloe.fr  — location_manager (Gare)
--   theo.vasseur@boulangerie-cloe.fr     — employee (vendeur, Centre-Ville)
--   Mot de passe : Boulangerie2026!
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 0. Nettoyage d'un éventuel run précédent
-- ────────────────────────────────────────────────────────────────────────────
delete from public.organizations where name = 'Boulangerie Cloé';
delete from auth.users where email in (
  'chloe.marchand@boulangerie-cloe.fr',
  'karim.haddad@boulangerie-cloe.fr',
  'antoine.lemoine@boulangerie-cloe.fr',
  'theo.vasseur@boulangerie-cloe.fr'
);

do $$
declare
  v_pwd   text := 'Boulangerie2026!';
  v_org   uuid;
  v_chloe_uid uuid;

  -- établissements
  v_loc_centre uuid;
  v_loc_gare   uuid;

  -- postes
  p_resp      uuid;
  p_chefboul  uuid;
  p_boulanger uuid;
  p_patissier uuid;
  p_vendeur   uuid;
  p_apprenti  uuid;

  -- équipes
  t_fournil_centre  uuid;
  t_boutique_centre uuid;
  t_fournil_gare    uuid;
  t_boutique_gare   uuid;

  -- types d'absence (créés automatiquement par le trigger on_org_created)
  at_cp       uuid;
  at_rtt      uuid;
  at_maladie  uuid;
  at_mariage  uuid;
  at_sanssolde uuid;

  -- employés
  e_chloe    uuid; e_karim    uuid; e_ines     uuid; e_yasmine  uuid;
  e_theo     uuid; e_lea      uuid; e_lena     uuid;
  e_antoine  uuid; e_manon    uuid; e_sofiane  uuid; e_camille  uuid;
  e_nora     uuid; e_baptiste uuid; e_enzo     uuid; e_sarah    uuid;
  e_julien   uuid;

  -- variables de boucle
  r          record;
  cfg        record;
  d          date;
  wk         date;
  v_sched    uuid;
  v_sched_status text;
  v_closed   boolean;
  v_uid      uuid;
  v_clock_in timestamptz;
  v_clock_out timestamptz;
  v_brk      int;

  v_draft_week date := date_trunc('week', date '2026-08-24')::date;
  v_from date := date '2026-07-01';
  v_to   date := date '2026-08-31';

  -- comptes de connexion à créer
  v_login_emails text[] := array[
    'chloe.marchand@boulangerie-cloe.fr',
    'karim.haddad@boulangerie-cloe.fr',
    'antoine.lemoine@boulangerie-cloe.fr',
    'theo.vasseur@boulangerie-cloe.fr'
  ];
  v_login_first  text[] := array['Chloé','Karim','Antoine','Théo'];
  v_login_last   text[] := array['Marchand','Haddad','Lemoine','Vasseur'];
  i int;
begin
  ------------------------------------------------------------------------------
  -- 1. Organisation + réglages (charges, majorations, indemnité repas…)
  ------------------------------------------------------------------------------
  insert into public.organizations (name, slug, plan, trial_ends_at)
  values ('Boulangerie Cloé', 'boulangerie-cloe-'||substr(md5(random()::text),1,4), 'starter', null)
  returning id into v_org;

  update public.organizations set
    collective_agreement    = 'Boulangerie-pâtisserie artisanale (IDCC 843)',
    payroll_charge_rate     = 42,
    reference_days_per_week = 5,
    meal_allowance_enabled  = true,
    meal_allowance_amount   = 5.95,
    night_premium_rate      = 20,
    night_start_hour        = 21,
    night_end_hour          = 6,
    sunday_premium_rate     = 10,
    holiday_premium_rate    = 100
  where id = v_org;

  ------------------------------------------------------------------------------
  -- 2. Comptes de connexion (auth.users + identities)
  ------------------------------------------------------------------------------
  create temp table tmp_logins (email text primary key, uid uuid) on commit drop;

  for i in 1 .. array_length(v_login_emails, 1) loop
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid,
      'authenticated', 'authenticated', v_login_emails[i],
      crypt(v_pwd, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('first_name', v_login_first[i], 'last_name', v_login_last[i]),
      now(), now(),
      '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at,
      created_at, updated_at
    ) values (
      v_uid, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_login_emails[i],
                         'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now()
    );

    insert into public.profiles (id, email, first_name, last_name)
    values (v_uid, v_login_emails[i], v_login_first[i], v_login_last[i])
    on conflict (id) do update
      set email = excluded.email, first_name = excluded.first_name, last_name = excluded.last_name;

    insert into tmp_logins (email, uid) values (v_login_emails[i], v_uid);
  end loop;

  select uid into v_chloe_uid from tmp_logins where email = 'chloe.marchand@boulangerie-cloe.fr';

  ------------------------------------------------------------------------------
  -- 3. Établissements (2 boulangeries)
  ------------------------------------------------------------------------------
  insert into public.locations
    (org_id, name, address, postal_code, city, sector, color, day_start_hour, break_rules)
  values
    (v_org, 'Boulangerie Cloé — Centre-Ville', '14 rue des Halles', '44000', 'Nantes',
     'Boulangerie-pâtisserie', '#B45309', 4,
     '[{"min_hours":6,"break_minutes":30},{"min_hours":9,"break_minutes":45}]'::jsonb)
  returning id into v_loc_centre;

  insert into public.locations
    (org_id, name, address, postal_code, city, sector, color, day_start_hour, break_rules)
  values
    (v_org, 'Boulangerie Cloé — Gare', '2 place de la Gare Sud', '44200', 'Nantes',
     'Boulangerie-pâtisserie', '#0EA5E9', 4,
     '[{"min_hours":6,"break_minutes":30},{"min_hours":9,"break_minutes":45}]'::jsonb)
  returning id into v_loc_gare;

  ------------------------------------------------------------------------------
  -- 4. Postes
  ------------------------------------------------------------------------------
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Responsable',         '#7C3AED', 15.50) returning id into p_resp;
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Chef boulanger',      '#92400E', 15.00) returning id into p_chefboul;
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Boulanger',           '#B45309', 13.20) returning id into p_boulanger;
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Pâtissier',           '#DB2777', 13.60) returning id into p_patissier;
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Vendeur',             '#059669', 11.88) returning id into p_vendeur;
  insert into public.positions (org_id, name, color, default_rate) values
    (v_org, 'Apprenti boulanger',  '#0EA5E9', 8.50)  returning id into p_apprenti;

  ------------------------------------------------------------------------------
  -- 5. Équipes
  ------------------------------------------------------------------------------
  insert into public.teams (location_id, name, color) values
    (v_loc_centre, 'Fournil Centre-Ville',  '#92400E') returning id into t_fournil_centre;
  insert into public.teams (location_id, name, color) values
    (v_loc_centre, 'Boutique Centre-Ville', '#059669') returning id into t_boutique_centre;
  insert into public.teams (location_id, name, color) values
    (v_loc_gare, 'Fournil Gare',    '#92400E') returning id into t_fournil_gare;
  insert into public.teams (location_id, name, color) values
    (v_loc_gare, 'Boutique Gare',   '#059669') returning id into t_boutique_gare;

  ------------------------------------------------------------------------------
  -- 6. Employés (16 — tous les types de contrat représentés)
  ------------------------------------------------------------------------------
  insert into public.employees (org_id, user_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, v_chloe_uid, 'Chloé', 'Marchand', 'chloe.marchand@boulangerie-cloe.fr', '0601020304', 'CLO-001', 'active', '2019-03-01', '1001')
  returning id into e_chloe;

  select uid into v_uid from tmp_logins where email = 'karim.haddad@boulangerie-cloe.fr';
  insert into public.employees (org_id, user_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, v_uid, 'Karim', 'Haddad', 'karim.haddad@boulangerie-cloe.fr', '0602030405', 'CLO-002', 'active', '2020-06-15', '1002')
  returning id into e_karim;

  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, 'Inès', 'Rocher', 'ines.rocher@boulangerie-cloe.fr', '0603040506', 'CLO-003', 'active', '2022-09-01', '1003')
  returning id into e_ines;

  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, 'Yasmine', 'Belkacem', 'yasmine.belkacem@boulangerie-cloe.fr', '0604050607', 'CLO-004', 'active', '2021-11-10', '1004')
  returning id into e_yasmine;

  select uid into v_uid from tmp_logins where email = 'theo.vasseur@boulangerie-cloe.fr';
  insert into public.employees (org_id, user_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, v_uid, 'Théo', 'Vasseur', 'theo.vasseur@boulangerie-cloe.fr', '0605060708', 'CLO-005', 'active', '2023-04-03', '1005')
  returning id into e_theo;

  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, 'Léa', 'Fontaine', 'lea.fontaine@boulangerie-cloe.fr', '0606070809', 'CLO-006', 'active', '2025-09-01', '1006')
  returning id into e_lea;

  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, 'Léna', 'Bourgeois', 'lena.bourgeois@boulangerie-cloe.fr', '0607080910', 'CLO-015', 'active', '2026-07-01', '1015')
  returning id into e_lena;

  select uid into v_uid from tmp_logins where email = 'antoine.lemoine@boulangerie-cloe.fr';
  insert into public.employees (org_id, user_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, v_uid, 'Antoine', 'Lemoine', 'antoine.lemoine@boulangerie-cloe.fr', '0611223344', 'CLO-007', 'active', '2019-11-04', '1007')
  returning id into e_antoine;

  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, 'Manon', 'Aubert', 'manon.aubert@boulangerie-cloe.fr', '0622334455', 'CLO-008', 'active', '2023-02-06', '1008')
  returning id into e_manon;

  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, 'Sofiane', 'Cherif', 'sofiane.cherif@boulangerie-cloe.fr', '0633445566', 'CLO-009', 'active', '2021-05-17', '1009')
  returning id into e_sofiane;

  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, 'Camille', 'Perrot', 'camille.perrot@boulangerie-cloe.fr', '0644556677', 'CLO-010', 'active', '2024-01-08', '1010')
  returning id into e_camille;

  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, 'Nora', 'Idrissi', 'nora.idrissi@boulangerie-cloe.fr', '0655667788', 'CLO-011', 'active', '2026-06-15', '1011')
  returning id into e_nora;

  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, 'Baptiste', 'Roy', 'baptiste.roy@boulangerie-cloe.fr', '0666778899', 'CLO-012', 'active', '2025-09-01', '1012')
  returning id into e_baptiste;

  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, 'Enzo', 'Girard', 'enzo.girard@boulangerie-cloe.fr', '0677889900', 'CLO-013', 'active', '2026-08-01', '1013')
  returning id into e_enzo;

  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, pin_code) values
    (v_org, 'Sarah', 'Nguyen', 'sarah.nguyen@boulangerie-cloe.fr', '0688990011', 'CLO-014', 'active', '2026-08-15', '1014')
  returning id into e_sarah;

  -- Employée archivée (partie fin juin, avant la période démo).
  insert into public.employees (org_id, first_name, last_name, email, phone, employee_number, status, hire_date, exit_date) values
    (v_org, 'Julien', 'Faure', 'julien.faure@boulangerie-cloe.fr', '0699001122', 'CLO-016', 'archived', '2021-01-11', '2026-06-30')
  returning id into e_julien;

  ------------------------------------------------------------------------------
  -- 7. Appartenances (memberships) — rôles applicatifs
  ------------------------------------------------------------------------------
  insert into public.memberships (org_id, user_id, role) values
    (v_org, v_chloe_uid, 'org_owner');
  select uid into v_uid from tmp_logins where email = 'karim.haddad@boulangerie-cloe.fr';
  insert into public.memberships (org_id, user_id, role) values (v_org, v_uid, 'location_manager');
  select uid into v_uid from tmp_logins where email = 'antoine.lemoine@boulangerie-cloe.fr';
  insert into public.memberships (org_id, user_id, role) values (v_org, v_uid, 'location_manager');
  select uid into v_uid from tmp_logins where email = 'theo.vasseur@boulangerie-cloe.fr';
  insert into public.memberships (org_id, user_id, role) values (v_org, v_uid, 'employee');

  ------------------------------------------------------------------------------
  -- 8. Rattachements établissements (employee_locations)
  ------------------------------------------------------------------------------
  insert into public.employee_locations (employee_id, location_id, is_primary) values
    (e_chloe, v_loc_centre, true), (e_chloe, v_loc_gare, false),
    (e_karim, v_loc_centre, true), (e_ines, v_loc_centre, true),
    (e_yasmine, v_loc_centre, true), (e_theo, v_loc_centre, true),
    (e_lea, v_loc_centre, true), (e_lena, v_loc_centre, true),
    (e_julien, v_loc_centre, true),
    (e_antoine, v_loc_gare, true), (e_manon, v_loc_gare, true),
    (e_sofiane, v_loc_gare, true), (e_camille, v_loc_gare, true),
    (e_nora, v_loc_gare, true), (e_baptiste, v_loc_gare, true),
    (e_enzo, v_loc_gare, true), (e_sarah, v_loc_gare, true);

  ------------------------------------------------------------------------------
  -- 9. Postes occupables (employee_positions)
  ------------------------------------------------------------------------------
  insert into public.employee_positions (employee_id, position_id) values
    (e_chloe, p_resp), (e_chloe, p_boulanger),
    (e_karim, p_chefboul), (e_karim, p_boulanger),
    (e_ines, p_boulanger),
    (e_yasmine, p_patissier),
    (e_theo, p_vendeur),
    (e_lea, p_apprenti),
    (e_lena, p_patissier),
    (e_antoine, p_chefboul), (e_antoine, p_boulanger),
    (e_manon, p_boulanger),
    (e_sofiane, p_vendeur),
    (e_camille, p_vendeur),
    (e_nora, p_vendeur),
    (e_baptiste, p_apprenti),
    (e_enzo, p_boulanger),
    (e_sarah, p_vendeur),
    (e_julien, p_vendeur);

  ------------------------------------------------------------------------------
  -- 10. Équipes des employés (employee_teams)
  ------------------------------------------------------------------------------
  insert into public.employee_teams (employee_id, team_id) values
    (e_chloe, t_boutique_centre), (e_chloe, t_fournil_centre),
    (e_karim, t_fournil_centre), (e_ines, t_fournil_centre),
    (e_yasmine, t_fournil_centre), (e_lea, t_fournil_centre), (e_lena, t_fournil_centre),
    (e_theo, t_boutique_centre), (e_julien, t_boutique_centre),
    (e_antoine, t_fournil_gare), (e_manon, t_fournil_gare),
    (e_baptiste, t_fournil_gare), (e_enzo, t_fournil_gare),
    (e_sofiane, t_boutique_gare), (e_camille, t_boutique_gare),
    (e_nora, t_boutique_gare), (e_sarah, t_boutique_gare);

  ------------------------------------------------------------------------------
  -- 11. Contrats (les 6 types sont représentés)
  ------------------------------------------------------------------------------
  insert into public.contracts (employee_id, type, start_date, weekly_hours, hourly_rate, position_id) values
    (e_chloe,   'cdi', '2019-03-01', 39, 15.50, p_resp),
    (e_karim,   'cdi', '2020-06-15', 39, 15.00, p_chefboul),
    (e_ines,    'cdi', '2022-09-01', 35, 13.20, p_boulanger),
    (e_yasmine, 'cdi', '2021-11-10', 35, 13.60, p_patissier),
    (e_theo,    'cdi', '2023-04-03', 30, 11.88, p_vendeur),
    (e_antoine, 'cdi', '2019-11-04', 39, 15.00, p_chefboul),
    (e_sofiane, 'cdi', '2021-05-17', 35, 11.88, p_vendeur),
    (e_camille, 'cdi', '2024-01-08', 28, 11.88, p_vendeur);

  insert into public.contracts (employee_id, type, start_date, end_date, weekly_hours, hourly_rate, position_id) values
    (e_julien,   'cdi',           '2021-01-11', '2026-06-30', 30, 11.88, p_vendeur),
    (e_lea,      'apprenticeship','2025-09-01', '2027-08-31', 35, 8.50,  p_apprenti),
    (e_baptiste, 'apprenticeship','2025-09-01', '2027-08-31', 35, 8.50,  p_apprenti),
    (e_lena,     'internship',   '2026-07-01', '2026-07-14', 35, 4.35,  p_patissier),
    (e_nora,     'cdd',          '2026-06-15', '2026-09-15', 35, 11.88, p_vendeur),
    (e_enzo,     'interim',      '2026-08-01', '2026-08-31', 35, 13.20, p_boulanger),
    (e_sarah,    'extra',        '2026-08-15', '2026-08-15', 35, 11.88, p_vendeur);

  ------------------------------------------------------------------------------
  -- 12. Types d'absence : accrual standard + lookup des types utilisés
  ------------------------------------------------------------------------------
  update public.absence_types
     set monthly_accrual = 2.5, annual_cap = 30, period_start_month = 6
   where org_id = v_org and name = 'Congés payés';
  update public.absence_types
     set monthly_accrual = 1, annual_cap = 12, period_start_month = 1
   where org_id = v_org and name = 'RTT';

  select id into at_cp        from public.absence_types where org_id = v_org and name = 'Congés payés';
  select id into at_rtt       from public.absence_types where org_id = v_org and name = 'RTT';
  select id into at_maladie   from public.absence_types where org_id = v_org and name = 'Maladie';
  select id into at_mariage   from public.absence_types where org_id = v_org and name = 'Congé mariage / PACS';
  select id into at_sanssolde from public.absence_types where org_id = v_org and name = 'Congé sans solde';

  ------------------------------------------------------------------------------
  -- 13. Absences — fermeture annuelle (Centre-Ville) + congés étalés (Gare)
  --     + maladie, mariage, sans solde, une en attente, une rejetée, une annulée
  ------------------------------------------------------------------------------
  insert into public.absence_requests (employee_id, type_id, start_date, end_date, status, comment, reviewed_by, reviewed_at) values
    -- Fermeture annuelle du Centre-Ville : toute l'équipe en congé.
    (e_chloe,   at_cp, '2026-08-10', '2026-08-23', 'approved', 'Fermeture annuelle', v_chloe_uid, now() - interval '20 days'),
    (e_karim,   at_cp, '2026-08-10', '2026-08-23', 'approved', 'Fermeture annuelle', v_chloe_uid, now() - interval '20 days'),
    (e_ines,    at_cp, '2026-08-10', '2026-08-23', 'approved', 'Fermeture annuelle', v_chloe_uid, now() - interval '20 days'),
    (e_yasmine, at_cp, '2026-08-10', '2026-08-23', 'approved', 'Fermeture annuelle', v_chloe_uid, now() - interval '20 days'),
    (e_theo,    at_cp, '2026-08-10', '2026-08-23', 'approved', 'Fermeture annuelle', v_chloe_uid, now() - interval '20 days'),
    (e_lea,     at_cp, '2026-08-10', '2026-08-23', 'approved', 'Fermeture annuelle', v_chloe_uid, now() - interval '20 days'),
    -- Congés payés étalés à la Gare (le magasin reste ouvert).
    (e_antoine, at_cp, '2026-07-20', '2026-07-26', 'approved', 'Vacances d''été', v_chloe_uid, now() - interval '25 days'),
    (e_baptiste,at_cp, '2026-07-13', '2026-07-19', 'approved', 'Vacances d''été', v_chloe_uid, now() - interval '28 days'),
    (e_sofiane, at_cp, '2026-07-27', '2026-08-02', 'approved', 'Vacances d''été', v_chloe_uid, now() - interval '22 days'),
    (e_manon,   at_cp, '2026-08-03', '2026-08-09', 'approved', 'Vacances d''été', v_chloe_uid, now() - interval '18 days'),
    (e_camille, at_cp, '2026-08-17', '2026-08-23', 'approved', 'Vacances d''été', v_chloe_uid, now() - interval '15 days'),
    -- Autres types.
    (e_ines,    at_maladie,   '2026-07-08', '2026-07-10', 'approved', 'Arrêt maladie', v_chloe_uid, now() - interval '9 days'),
    (e_manon,   at_mariage,   '2026-07-31', '2026-07-31', 'approved', 'Mariage', v_chloe_uid, now() - interval '10 days'),
    (e_karim,   at_sanssolde, '2026-08-01', '2026-08-01', 'approved', 'Rendez-vous personnel', v_chloe_uid, now() - interval '12 days'),
    -- En attente (à traiter par la gérante).
    (e_yasmine, at_cp, '2026-08-27', '2026-08-30', 'pending', 'Prolongation de fin d''été', null, null),
    -- Rejetée.
    (e_sofiane, at_cp, '2026-08-08', '2026-08-09', 'rejected', 'Refusé : forte activité avant la semaine de congé validée', v_chloe_uid, now() - interval '19 days'),
    -- Annulée par l'employée elle-même.
    (e_camille, at_cp, '2026-07-14', '2026-07-15', 'cancelled', 'Finalement annulé', null, null);

  ------------------------------------------------------------------------------
  -- 14. Soldes de congés (CDI + apprentis)
  ------------------------------------------------------------------------------
  insert into public.leave_balances (employee_id, type_id, year, acquired, taken, adjusted) values
    (e_chloe,    at_cp, 2026, 25, 0, 0),  (e_chloe,    at_rtt, 2026, 7, 1, 0),
    (e_karim,    at_cp, 2026, 25, 0, 0),  (e_karim,    at_rtt, 2026, 7, 2, 0),
    (e_ines,     at_cp, 2026, 25, 0, 0),  (e_ines,     at_rtt, 2026, 7, 0, 0),
    (e_yasmine,  at_cp, 2026, 25, 0, 0),  (e_yasmine,  at_rtt, 2026, 7, 3, 0),
    (e_theo,     at_cp, 2026, 21, 0, 0),  (e_theo,     at_rtt, 2026, 6, 0, 0),
    (e_antoine,  at_cp, 2026, 25, 7, 0),  (e_antoine,  at_rtt, 2026, 7, 1, 0),
    (e_sofiane,  at_cp, 2026, 25, 7, 0),  (e_sofiane,  at_rtt, 2026, 7, 0, 0),
    (e_camille,  at_cp, 2026, 20, 7, 0),  (e_camille,  at_rtt, 2026, 6, 0, 0),
    (e_lea,      at_cp, 2026, 22, 7, 0),
    (e_manon,    at_cp, 2026, 25, 8, 0),
    (e_baptiste, at_cp, 2026, 22, 7, 0);

  ------------------------------------------------------------------------------
  -- 15. Génération des plannings + shifts (juillet + août 2026)
  --     Centre-Ville : fermé le lundi + fermeture annuelle 10→23 août.
  --     Gare : ouverte tous les jours.
  ------------------------------------------------------------------------------
  create temp table tmp_cfg (
    employee_id  uuid,
    location_id  uuid,
    position_id  uuid,
    start_t      time,
    end_t        time,
    brk          int,
    workdays     int[],   -- extract(dow): 0=dimanche … 6=samedi ; null = tous les jours actifs
    active_from  date,
    active_to    date
  ) on commit drop;

  insert into tmp_cfg values
    (e_chloe,    v_loc_centre, p_resp,      '08:00','16:00',60, array[2,3,4,5,6],   v_from, v_to),
    (e_karim,    v_loc_centre, p_chefboul,  '04:00','12:30',30, array[2,3,4,5,6],   v_from, v_to),
    (e_ines,     v_loc_centre, p_boulanger, '04:00','11:30',30, array[3,4,5,6,0],   v_from, v_to),
    (e_yasmine,  v_loc_centre, p_patissier, '05:00','12:30',30, array[2,3,4,5,6],   v_from, v_to),
    (e_theo,     v_loc_centre, p_vendeur,   '07:00','14:30',30, array[3,4,5,6],     v_from, v_to),
    (e_lea,      v_loc_centre, p_apprenti,  '05:00','12:30',30, array[2,3,4,5,6],   v_from, v_to),
    (e_lena,     v_loc_centre, p_patissier, '05:00','12:00',30, array[2,3,4,5,6],   v_from, date '2026-07-14'),
    (e_antoine,  v_loc_gare,   p_chefboul,  '04:00','12:30',30, array[4,5,6,0,1],   v_from, v_to),
    (e_manon,    v_loc_gare,   p_boulanger, '04:00','11:30',30, array[2,3,5,6,0],   v_from, v_to),
    (e_sofiane,  v_loc_gare,   p_vendeur,   '07:00','14:30',30, array[3,4,5,6,0],   v_from, v_to),
    (e_camille,  v_loc_gare,   p_vendeur,   '13:00','20:00',30, array[4,5,6,0],     v_from, v_to),
    (e_nora,     v_loc_gare,   p_vendeur,   '13:00','20:30',30, array[2,3,4,5,6],   v_from, v_to),
    (e_baptiste, v_loc_gare,   p_apprenti,  '04:00','11:30',30, array[2,3,4,5,6],   v_from, v_to),
    (e_enzo,     v_loc_gare,   p_boulanger, '04:00','11:30',30, array[1,2],         date '2026-08-01', v_to),
    (e_sarah,    v_loc_gare,   p_vendeur,   '09:00','19:00',60, null,               date '2026-08-15', date '2026-08-15');

  d := v_from;
  while d <= v_to loop
    for cfg in select * from tmp_cfg loop
      continue when d < cfg.active_from or d > cfg.active_to;

      -- Établissement fermé ce jour ?
      v_closed := false;
      if cfg.location_id = v_loc_centre and (
           extract(dow from d)::int = 1
           or d between date '2026-08-10' and date '2026-08-23'
         ) then
        v_closed := true;
      end if;
      continue when v_closed;

      -- Jour de repos de l'employé ?
      continue when cfg.workdays is not null and not (extract(dow from d)::int = any(cfg.workdays));

      -- Absence approuvée couvrant ce jour ?
      continue when exists (
        select 1 from public.absence_requests ar
        where ar.employee_id = cfg.employee_id and ar.status = 'approved'
          and d between ar.start_date and ar.end_date
      );

      wk := date_trunc('week', d)::date;
      v_sched_status := case when wk = v_draft_week then 'draft' else 'published' end;

      select id into v_sched from public.schedules
        where location_id = cfg.location_id and week_start = wk;
      if v_sched is null then
        insert into public.schedules (location_id, week_start, status, published_at, published_by)
        values (
          cfg.location_id, wk, v_sched_status::public.schedule_status,
          case when v_sched_status = 'published' then (wk - 3)::timestamptz else null end,
          case when v_sched_status = 'published' then v_chloe_uid else null end
        )
        returning id into v_sched;
      end if;

      insert into public.shifts (schedule_id, employee_id, position_id, shift_date, start_time, end_time, break_minutes, status)
      values (v_sched, cfg.employee_id, cfg.position_id, d, cfg.start_t, cfg.end_t, cfg.brk, v_sched_status::public.shift_status);
    end loop;
    d := d + 1;
  end loop;

  raise notice 'Plannings + shifts générés du % au % (semaine du % laissée en brouillon).', v_from, v_to, v_draft_week;

  ------------------------------------------------------------------------------
  -- 16. Pointages (timeclocks) — jours déjà passés + un pointage en cours
  ------------------------------------------------------------------------------
  for r in
    select s.employee_id, s.shift_date, s.start_time, s.end_time, s.break_minutes,
           sc.location_id
    from public.shifts s
    join public.schedules sc on sc.id = s.schedule_id
    where s.status = 'published' and s.shift_date < current_date
  loop
    v_clock_in  := (r.shift_date + r.start_time) + (floor(random()*8)  || ' minutes')::interval;
    v_clock_out := (r.shift_date + r.end_time)   + (floor(random()*15) || ' minutes')::interval;
    v_brk       := greatest(0, r.break_minutes + (array[-10,0,0,10])[1 + floor(random()*4)]);
    insert into public.timeclocks (org_id, location_id, employee_id, clock_in, clock_out, break_minutes)
    values (v_org, r.location_id, r.employee_id, v_clock_in, v_clock_out, v_brk);
  end loop;

  -- Un pointage en cours aujourd'hui (présent, pas encore parti).
  select s.employee_id, sc.location_id into r
  from public.shifts s
  join public.schedules sc on sc.id = s.schedule_id
  where s.shift_date = current_date and s.status = 'published'
  order by random() limit 1;

  if r.employee_id is not null then
    insert into public.timeclocks (org_id, location_id, employee_id, clock_in, break_minutes)
    values (v_org, r.location_id, r.employee_id, now() - interval '90 minutes', 0);
  end if;

  ------------------------------------------------------------------------------
  -- 17. Documents RH (métadonnées ; bucket 'documents')
  ------------------------------------------------------------------------------
  insert into public.documents (org_id, employee_id, category, name, storage_path, mime_type, size_bytes, uploaded_by) values
    (v_org, e_chloe,    'contrat',  'Contrat de travail — Chloé Marchand.pdf',   v_org||'/'||e_chloe||'/contrat.pdf',   'application/pdf', 182340, v_chloe_uid),
    (v_org, e_chloe,    'identite', 'Carte d''identité.pdf',                     v_org||'/'||e_chloe||'/identite.pdf',  'application/pdf', 95210,  v_chloe_uid),
    (v_org, e_karim,    'contrat',  'Contrat de travail — Karim Haddad.pdf',     v_org||'/'||e_karim||'/contrat.pdf',   'application/pdf', 176500, v_chloe_uid),
    (v_org, e_karim,    'identite', 'Carte d''identité.pdf',                     v_org||'/'||e_karim||'/identite.pdf',  'application/pdf', 88760,  v_chloe_uid),
    (v_org, e_antoine,  'contrat',  'Contrat de travail — Antoine Lemoine.pdf',  v_org||'/'||e_antoine||'/contrat.pdf', 'application/pdf', 179320, v_chloe_uid),
    (v_org, e_antoine,  'identite', 'Carte d''identité.pdf',                     v_org||'/'||e_antoine||'/identite.pdf','application/pdf', 91040,  v_chloe_uid),
    (v_org, e_ines,     'contrat',  'Contrat de travail — Inès Rocher.pdf',      v_org||'/'||e_ines||'/contrat.pdf',    'application/pdf', 174900, v_chloe_uid),
    (v_org, e_yasmine,  'contrat',  'Contrat de travail — Yasmine Belkacem.pdf', v_org||'/'||e_yasmine||'/contrat.pdf', 'application/pdf', 175800, v_chloe_uid),
    (v_org, e_yasmine,  'medical',  'Visite médicale d''embauche.pdf',          v_org||'/'||e_yasmine||'/medical.pdf', 'application/pdf', 64200,  v_chloe_uid),
    (v_org, e_lea,      'diplome',  'Convention d''apprentissage.pdf',          v_org||'/'||e_lea||'/convention.pdf',  'application/pdf', 210400, v_chloe_uid),
    (v_org, e_baptiste, 'diplome',  'Convention d''apprentissage.pdf',          v_org||'/'||e_baptiste||'/convention.pdf','application/pdf', 208100, v_chloe_uid),
    (v_org, e_lena,     'diplome',  'Convention de stage.pdf',                  v_org||'/'||e_lena||'/convention.pdf', 'application/pdf', 152300, v_chloe_uid),
    (v_org, e_nora,     'contrat',  'Contrat CDD — Nora Idrissi.pdf',           v_org||'/'||e_nora||'/contrat.pdf',    'application/pdf', 168900, v_chloe_uid),
    (v_org, e_enzo,     'contrat',  'Contrat de mission intérim.pdf',           v_org||'/'||e_enzo||'/contrat.pdf',    'application/pdf', 158700, v_chloe_uid),
    (v_org, e_sarah,    'contrat',  'Contrat extra — journée du 15 août.pdf',   v_org||'/'||e_sarah||'/contrat.pdf',   'application/pdf', 89400,  v_chloe_uid);

  ------------------------------------------------------------------------------
  -- 18. Invitations en attente (employés sans compte applicatif)
  ------------------------------------------------------------------------------
  insert into public.invitations (org_id, employee_id, email, created_at) values
    (v_org, e_ines,    'ines.rocher@boulangerie-cloe.fr',    now() - interval '3 days'),
    (v_org, e_yasmine, 'yasmine.belkacem@boulangerie-cloe.fr', now() - interval '2 days'),
    (v_org, e_manon,   'manon.aubert@boulangerie-cloe.fr',    now() - interval '1 day');

  ------------------------------------------------------------------------------
  -- 19. Modèles de planning (schedule_templates + template_shifts)
  ------------------------------------------------------------------------------
  declare
    v_tpl_boutique uuid;
    v_tpl_fournil  uuid;
  begin
    insert into public.schedule_templates (location_id, name, created_by)
    values (v_loc_centre, 'Semaine type — Boutique Centre-Ville', v_chloe_uid)
    returning id into v_tpl_boutique;

    -- day_of_week : 0 = lundi … 6 = dimanche. Théo travaille mer→sam.
    insert into public.template_shifts (template_id, day_of_week, position_id, employee_id, start_time, end_time, break_minutes) values
      (v_tpl_boutique, 2, p_vendeur, e_theo, '07:00', '14:30', 30),
      (v_tpl_boutique, 3, p_vendeur, e_theo, '07:00', '14:30', 30),
      (v_tpl_boutique, 4, p_vendeur, e_theo, '07:00', '14:30', 30),
      (v_tpl_boutique, 5, p_vendeur, e_theo, '07:00', '14:30', 30);

    insert into public.schedule_templates (location_id, name, created_by)
    values (v_loc_gare, 'Semaine type — Fournil Gare', v_chloe_uid)
    returning id into v_tpl_fournil;

    -- Antoine : jeu→lun (repos mar/mer).
    insert into public.template_shifts (template_id, day_of_week, position_id, employee_id, start_time, end_time, break_minutes) values
      (v_tpl_fournil, 3, p_chefboul, e_antoine, '04:00', '12:30', 30),
      (v_tpl_fournil, 4, p_chefboul, e_antoine, '04:00', '12:30', 30),
      (v_tpl_fournil, 5, p_chefboul, e_antoine, '04:00', '12:30', 30),
      (v_tpl_fournil, 6, p_chefboul, e_antoine, '04:00', '12:30', 30),
      (v_tpl_fournil, 0, p_chefboul, e_antoine, '04:00', '12:30', 30);
  end;

  ------------------------------------------------------------------------------
  -- 20. Réglages d'alertes du planning
  ------------------------------------------------------------------------------
  insert into public.alert_settings (org_id, alert_code, enabled, blocking) values
    (v_org, 'contract_overtime', true, true),
    (v_org, 'min_rest',          true, true),
    (v_org, 'max_shift_hours',   true, false),
    (v_org, 'missing_skill',     true, false),
    (v_org, 'overlap',           true, true);

  raise notice 'Seed Boulangerie Cloé OK : org=% (Centre-Ville=%, Gare=%), 16 employés.',
    v_org, v_loc_centre, v_loc_gare;
end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 21. Demandes d'accès (leads plateforme, indépendants de toute organisation)
-- ────────────────────────────────────────────────────────────────────────────
delete from public.access_requests where company_name in (
  'Le Petit Prince Café', 'Pharmacie du Centre', 'Boutique Mode Emma'
);

insert into public.access_requests (company_name, contact_name, email, phone, sector, team_size, message, status, handled_at) values
  ('Le Petit Prince Café', 'Marion Weiss', 'marion.weiss@lepetitprince-cafe.fr', '0612345678', 'Restauration', '6-10', 'Nous cherchons un outil pour gérer le planning de nos 2 salariés en extra.', 'pending', null),
  ('Pharmacie du Centre',  'David Cohen',  'david.cohen@pharmacieducentre.fr',   '0623456789', 'Santé',        '11-20', 'Intéressés pour remplacer nos plannings Excel.', 'approved', now() - interval '5 days'),
  ('Boutique Mode Emma',   'Emma Roussel', 'emma.roussel@modeemma.fr',           '0634567890', 'Retail',       '1-5',  'Petite boutique, besoin simple de planning.', 'rejected', now() - interval '10 days');

-- ────────────────────────────────────────────────────────────────────────────
-- Récapitulatif
-- ────────────────────────────────────────────────────────────────────────────
select
  (select count(*) from public.organizations)                                              as organizations,
  (select count(*) from public.locations)                                                  as locations,
  (select count(*) from public.employees)                                                   as employees,
  (select count(*) from public.contracts)                                                   as contracts,
  (select count(*) from public.schedules)                                                   as schedules,
  (select count(*) from public.shifts)                                                      as shifts,
  (select count(*) from public.shifts where shift_date between '2026-07-01' and '2026-08-31') as shifts_juil_aout,
  (select count(*) from public.timeclocks)                                                  as timeclocks,
  (select count(*) from public.absence_requests)                                            as absence_requests,
  (select count(*) from public.leave_balances)                                               as leave_balances,
  (select count(*) from public.documents)                                                    as documents,
  (select count(*) from public.invitations)                                                  as invitations,
  (select count(*) from public.schedule_templates)                                           as schedule_templates,
  (select count(*) from public.alert_settings)                                                as alert_settings,
  (select count(*) from public.access_requests)                                               as access_requests;
