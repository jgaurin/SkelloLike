-- ============================================================================
-- Ritem — Privilèges de tables pour anon / authenticated
--
-- Contexte : sur cette base, les rôles applicatifs `anon` et `authenticated`
-- n'avaient PAS reçu les privilèges DML de base (SELECT/INSERT/UPDATE/DELETE)
-- sur le schéma public. Résultat : toute requête côté client renvoyait
-- "permission denied", même quand les policies RLS l'autorisaient — un employé
-- connecté ne voyait pas son membership et se retrouvait renvoyé vers
-- /onboarding. La RLS reste la seule barrière de sécurité réelle ; ces GRANT ne
-- font qu'ouvrir l'accès SQL que la RLS filtre ensuite ligne par ligne.
--
-- Idempotent et rejouable après un `supabase db reset`.
-- ============================================================================

-- Usage du schéma.
grant usage on schema public to anon, authenticated, service_role;

-- DML sur toutes les tables existantes du schéma public.
grant select, insert, update, delete
  on all tables in schema public to authenticated;

-- anon : lecture seule (la RLS restreint ensuite à ce qui est réellement public).
grant select on all tables in schema public to anon;

-- service_role : accès complet (bypass RLS de toute façon).
grant all on all tables in schema public to service_role;

-- Séquences (pour les colonnes à défaut basé sur des séquences, le cas échéant).
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- Mêmes privilèges accordés automatiquement aux objets créés PLUS TARD,
-- pour que les prochaines migrations n'aient pas à répéter ces GRANT.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
