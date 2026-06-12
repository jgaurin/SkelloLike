-- ============================================================================
-- SkelloLike — Données de démo sur 2 mois (planning publié pour tous)
-- Génère des shifts variés pour chaque employé actif, du lundi de la semaine
-- courante jusqu'à ~8 semaines plus tard, et publie les plannings.
-- Réexécutable : ne recrée pas de shifts là où il y en a déjà.
-- ============================================================================

do $$
declare
  v_org   uuid;
  v_loc   uuid;
  v_monday date := date_trunc('week', current_date)::date;
  v_end    date := (date_trunc('week', current_date) + interval '8 weeks')::date;
  d        date;
  emp      record;
  v_sched  uuid;
  v_pos    uuid;
  dow      int;
  idx      int;
  start_t  time;
  end_t    time;
  brk      int;
  -- 5 trames horaires types (matin, journée, soir, coupure midi, long)
  starts time[] := array['07:00','09:00','11:00','14:00','18:00'];
  ends   time[] := array['13:00','17:00','15:30','22:00','23:30'];
  brks   int[]  := array[0, 60, 30, 0, 30];
begin
  select id into v_org from organizations order by created_at limit 1;
  select id into v_loc from locations where org_id = v_org order by created_at limit 1;
  if v_loc is null then return; end if;

  d := v_monday;
  while d < v_end loop
    -- Planning de la semaine (créé + publié).
    select id into v_sched from schedules
      where location_id = v_loc and week_start = date_trunc('week', d)::date;
    if v_sched is null then
      insert into schedules (location_id, week_start, status, published_at)
      values (v_loc, date_trunc('week', d)::date, 'published', now())
      returning id into v_sched;
    else
      update schedules set status='published', published_at=now() where id=v_sched;
    end if;

    dow := extract(dow from d)::int; -- 0=dimanche
    idx := 0;
    for emp in
      select id from employees where org_id = v_org and status='active' order by last_name
    loop
      idx := idx + 1;
      -- Jour de repos tournant : chaque employé se repose 2 jours/semaine,
      -- décalés selon son index, + dimanche pour la plupart.
      if dow = 0 then continue; end if;                 -- dimanche : repos général
      if (dow + idx) % 7 = 0 then continue; end if;     -- 1 repos tournant
      if (dow + idx) % 5 = 0 then continue; end if;     -- 2e repos tournant

      -- Choix d'une trame horaire variée selon le jour et l'employé.
      declare slot int := ((dow + idx) % 5) + 1;
      begin
        start_t := starts[slot];
        end_t   := ends[slot];
        brk     := brks[slot];
      end;

      -- Poste : un des postes occupables de l'employé, sinon un poste de l'org.
      select position_id into v_pos
        from employee_positions where employee_id = emp.id
        order by random() limit 1;
      if v_pos is null then
        select id into v_pos from positions where org_id = v_org order by random() limit 1;
      end if;

      -- N'insère pas si un shift existe déjà pour cet employé ce jour-là.
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

  raise notice 'Seed 2 mois OK : du % au %', v_monday, v_end;
end;
$$;
