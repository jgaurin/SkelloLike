-- ============================================================================
-- SkelloLike — Données de test : planning complet JUIN + JUILLET 2026
-- Génère, pour la première org/établissement :
--   • un planning publié par semaine couvrant 2026-06-01 → 2026-07-31
--   • des shifts variés par employé (repos tournants, trames horaires types)
--   • quelques absences (validées + une en attente) pour les écrans RH
-- Réexécutable : n'insère pas en double (shifts/absences dédupliqués).
--
-- Pré-requis : seed-demo.sql (postes, employés, contrats) déjà exécuté.
-- Exécution :
--   docker exec -i supabase_db_SkelloLike psql -U postgres -d postgres < supabase/seed-juin-juillet.sql
-- ============================================================================

do $$
declare
  v_org    uuid;
  v_loc    uuid;
  v_from   date := date '2026-06-01';
  v_to     date := date '2026-07-31';
  d        date;
  wk       date;
  emp      record;
  v_sched  uuid;
  v_pos    uuid;
  dow      int;
  idx      int;
  slot     int;
  start_t  time;
  end_t    time;
  brk      int;
  -- trames horaires types (matin, journée, après-midi, soir, long)
  starts time[] := array['07:00','09:00','11:00','14:00','18:00'];
  ends   time[] := array['13:00','17:00','15:30','22:00','23:30'];
  brks   int[]  := array[0, 60, 30, 0, 30];
begin
  select id into v_org from organizations order by created_at limit 1;
  if v_org is null then
    raise notice 'Aucune organisation — lance seed-demo.sql d''abord.';
    return;
  end if;
  select id into v_loc from locations where org_id = v_org order by created_at limit 1;
  if v_loc is null then
    raise notice 'Aucun établissement.';
    return;
  end if;

  -- ── Plannings + shifts, jour par jour ───────────────────────────────────
  d := v_from;
  while d <= v_to loop
    wk := date_trunc('week', d)::date;  -- lundi de la semaine

    -- Un planning publié par semaine couverte.
    select id into v_sched from schedules
      where location_id = v_loc and week_start = wk;
    if v_sched is null then
      insert into schedules (location_id, week_start, status, published_at)
      values (v_loc, wk, 'published', now())
      returning id into v_sched;
    else
      update schedules set status='published', published_at=coalesce(published_at, now())
        where id = v_sched;
    end if;

    dow := extract(dow from d)::int;  -- 0 = dimanche
    idx := 0;
    for emp in
      select id from employees
      where org_id = v_org and status = 'active'
      order by last_name
    loop
      idx := idx + 1;

      -- Repos : dimanche général + 2 repos tournants décalés par employé.
      if dow = 0 then continue; end if;
      if (dow + idx) % 7 = 0 then continue; end if;
      if (dow + idx) % 5 = 0 then continue; end if;

      slot    := ((dow + idx) % 5) + 1;
      start_t := starts[slot];
      end_t   := ends[slot];
      brk     := brks[slot];

      -- Poste occupable par l'employé, sinon n'importe quel poste de l'org.
      select position_id into v_pos
        from employee_positions where employee_id = emp.id
        order by random() limit 1;
      if v_pos is null then
        select id into v_pos from positions where org_id = v_org
          order by random() limit 1;
      end if;

      -- Pas de doublon pour cet employé ce jour-là.
      if not exists (
        select 1 from shifts
        where schedule_id = v_sched and employee_id = emp.id and shift_date = d
      ) then
        insert into shifts (schedule_id, employee_id, position_id, shift_date,
                            start_time, end_time, break_minutes, status)
        values (v_sched, emp.id, v_pos, d, start_t, end_t, brk, 'published');
      end if;
    end loop;

    d := d + 1;
  end loop;

  raise notice 'Plannings + shifts générés du % au %.', v_from, v_to;

  -- ── Quelques absences pour alimenter les écrans RH ──────────────────────
  -- On retire d'abord les shifts qui chevauchent une absence créée ci-dessous
  -- (un employé absent ne doit pas avoir de shift le même jour).
  declare
    t_conges uuid;   -- congés payés
    t_maladie uuid;  -- arrêt maladie
    e1 uuid; e2 uuid; e3 uuid;
  begin
    select id into t_conges  from absence_types where org_id = v_org
      and name ilike '%cong%pay%' limit 1;
    if t_conges is null then
      select id into t_conges from absence_types where org_id = v_org limit 1;
    end if;
    select id into t_maladie from absence_types where org_id = v_org
      and name ilike '%maladie%' limit 1;
    if t_maladie is null then t_maladie := t_conges; end if;

    -- 3 employés (par ordre alphabétique) reçoivent une absence.
    select id into e1 from employees where org_id=v_org and status='active'
      order by last_name limit 1;
    select id into e2 from employees where org_id=v_org and status='active'
      order by last_name offset 1 limit 1;
    select id into e3 from employees where org_id=v_org and status='active'
      order by last_name offset 2 limit 1;

    -- Helper inline : insère une absence si elle n'existe pas déjà, et purge
    -- les shifts couverts.
    -- (1) Congés validés : e1, 1re semaine de juillet.
    if not exists (select 1 from absence_requests
                   where employee_id=e1 and start_date=date '2026-07-06') then
      insert into absence_requests (employee_id, type_id, start_date, end_date,
                                    status, reviewed_at, comment)
      values (e1, t_conges, date '2026-07-06', date '2026-07-12',
              'approved', now(), 'Vacances d''été');
      delete from shifts where employee_id=e1
        and shift_date between date '2026-07-06' and date '2026-07-12';
    end if;

    -- (2) Maladie validée : e2, mi-juin (3 jours).
    if not exists (select 1 from absence_requests
                   where employee_id=e2 and start_date=date '2026-06-17') then
      insert into absence_requests (employee_id, type_id, start_date, end_date,
                                    status, reviewed_at, comment)
      values (e2, t_maladie, date '2026-06-17', date '2026-06-19',
              'approved', now(), 'Arrêt maladie');
      delete from shifts where employee_id=e2
        and shift_date between date '2026-06-17' and date '2026-06-19';
    end if;

    -- (3) Demande de congés EN ATTENTE : e3, fin juillet (à valider côté manager).
    if not exists (select 1 from absence_requests
                   where employee_id=e3 and start_date=date '2026-07-27') then
      insert into absence_requests (employee_id, type_id, start_date, end_date,
                                    status, comment)
      values (e3, t_conges, date '2026-07-27', date '2026-07-31',
              'pending', 'Demande de congés');
    end if;

    raise notice 'Absences de test créées (2 validées + 1 en attente).';
  end;

end $$;

-- Récapitulatif.
select
  (select count(*) from schedules) as schedules,
  (select count(*) from shifts where shift_date between date '2026-06-01' and date '2026-07-31') as shifts_juin_juillet,
  (select count(*) from absence_requests) as absences;
