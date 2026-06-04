-- ============================================================================
-- SkelloLike — Paramétrage des alertes du planning
-- Chaque organisation peut activer/désactiver chaque alerte et la rendre
-- bloquante ou simplement informative. Les "codes" d'alerte sont fixes (gérés
-- dans le code applicatif), seuls les réglages sont stockés ici.
-- ============================================================================

create table if not exists public.alert_settings (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  alert_code  text not null,
  enabled     boolean not null default true,
  blocking    boolean not null default false,
  unique (org_id, alert_code)
);

create index if not exists idx_alert_settings_org on public.alert_settings (org_id);

alter table public.alert_settings enable row level security;

create policy "alert_settings_select_member"
  on public.alert_settings for select
  using (public.is_org_member(org_id));

create policy "alert_settings_manage_admin"
  on public.alert_settings for all
  using (public.has_org_role(org_id, array['org_owner', 'org_admin']::public.app_role[]))
  with check (public.has_org_role(org_id, array['org_owner', 'org_admin']::public.app_role[]));
