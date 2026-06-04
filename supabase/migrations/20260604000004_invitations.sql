-- ============================================================================
-- SkelloLike — Invitations des employés
-- Un manager invite un employé : un token unique est généré. L'employé crée son
-- compte via le lien et son user_id est rattaché à sa fiche employé.
-- ============================================================================

create table if not exists public.invitations (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  email       text not null,
  token       text not null unique default replace(gen_random_uuid()::text, '-', ''),
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '14 days')
);

create index if not exists idx_invitations_org on public.invitations (org_id);
create index if not exists idx_invitations_token on public.invitations (token);

alter table public.invitations enable row level security;

-- Les managers de l'org voient/gèrent les invitations.
create policy "invitations_manage"
  on public.invitations for all
  using (
    public.has_org_role(
      org_id,
      array['org_owner', 'org_admin', 'location_manager', 'team_manager']::public.app_role[]
    )
  )
  with check (
    public.has_org_role(
      org_id,
      array['org_owner', 'org_admin', 'location_manager', 'team_manager']::public.app_role[]
    )
  );

-- Note : l'acceptation d'une invitation (lecture par token, rattachement du
-- compte) se fait via une Server Action avec le service role, car l'employé
-- n'est pas encore membre de l'org au moment d'accepter.
