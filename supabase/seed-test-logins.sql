-- ============================================================================
-- SkelloLike — Comptes de connexion de test (DEV LOCAL UNIQUEMENT)
-- Réinitialise le mot de passe du manager et crée des comptes auth + pin_code
-- pour les 6 employés de démo, reliés à leurs fiches existantes.
--
-- Mot de passe pour TOUS : Skello2026!
-- Réexécutable (idempotent).
--
-- Exécution : docker exec -i supabase_db_SkelloLike psql -U postgres -d postgres < supabase/seed-test-logins.sql
-- ============================================================================

do $$
declare
  v_pwd        text := 'Skello2026!';
  v_org        uuid;
  r            record;
  v_uid        uuid;
  -- email -> pin_code des employés de démo
  v_emails     text[] := array[
    'camille.dupont@demo.fr',
    'lucas.martin@demo.fr',
    'sarah.bernard@demo.fr',
    'hugo.petit@demo.fr',
    'emma.durand@demo.fr',
    'nathan.leroy@demo.fr'
  ];
  v_pins       text[] := array['1111','2222','3333','4444','5555','6666'];
  i            int;
begin
  -- Org de référence (la première / unique en dev).
  select id into v_org from organizations order by created_at limit 1;
  if v_org is null then
    raise notice 'Aucune organisation. Lance le seed démo d''abord.';
    return;
  end if;

  -- ── 1) Reset du mot de passe manager (compte existant) ───────────────────
  update auth.users
     set encrypted_password = crypt(v_pwd, gen_salt('bf')),
         updated_at = now()
   where email = 'edgarlilian2011@gmail.com';
  raise notice 'Mot de passe manager réinitialisé.';

  -- ── 2) Comptes employés ──────────────────────────────────────────────────
  for i in 1 .. array_length(v_emails, 1) loop
    -- Fiche employé correspondante.
    select * into r from employees
     where email = v_emails[i] and org_id = v_org
     limit 1;
    if not found then
      raise notice 'Employé % introuvable, ignoré.', v_emails[i];
      continue;
    end if;

    -- Réutilise le compte auth s'il existe déjà pour cet email.
    select id into v_uid from auth.users where email = v_emails[i] limit 1;

    if v_uid is null then
      v_uid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        -- GoTrue scanne ces colonnes en text non-null : NULL provoque
        -- "Database error querying schema" au login. On force la chaîne vide.
        confirmation_token, recovery_token, email_change,
        email_change_token_new, email_change_token_current,
        phone_change, phone_change_token, reauthentication_token
      ) values (
        '00000000-0000-0000-0000-000000000000', v_uid,
        'authenticated', 'authenticated', v_emails[i],
        crypt(v_pwd, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('first_name', r.first_name, 'last_name', r.last_name),
        now(), now(),
        '', '', '', '', '', '', '', ''
      );

      insert into auth.identities (
        provider_id, user_id, identity_data, provider, last_sign_in_at,
        created_at, updated_at
      ) values (
        v_uid, v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_emails[i],
                           'email_verified', true, 'phone_verified', false),
        'email', now(), now(), now()
      );
    else
      -- Compte déjà là : on remet juste le mot de passe connu.
      update auth.users
         set encrypted_password = crypt(v_pwd, gen_salt('bf')),
             email_confirmed_at = coalesce(email_confirmed_at, now()),
             updated_at = now()
       where id = v_uid;
    end if;

    -- Profil (le trigger handle_new_user a pu déjà le créer).
    insert into profiles (id, email, first_name, last_name)
    values (v_uid, v_emails[i], r.first_name, r.last_name)
    on conflict (id) do update
      set email = excluded.email,
          first_name = excluded.first_name,
          last_name = excluded.last_name;

    -- Rattache la fiche employé + attribue un pin_code de test.
    update employees
       set user_id = v_uid,
           pin_code = v_pins[i]
     where id = r.id;

    -- Appartenance à l'org en tant qu'employé.
    insert into memberships (org_id, user_id, role)
    values (v_org, v_uid, 'employee')
    on conflict (org_id, user_id) do update set role = 'employee';

    raise notice 'Employé prêt : %  (pin %)', v_emails[i], v_pins[i];
  end loop;

  raise notice '─────────────────────────────────────────────';
  raise notice 'Terminé. Mot de passe commun : %', v_pwd;
end $$;

-- Récapitulatif.
select e.first_name, e.last_name, e.email, e.pin_code,
       (e.user_id is not null) as has_login, m.role
  from employees e
  left join memberships m on m.user_id = e.user_id
 order by e.created_at;
