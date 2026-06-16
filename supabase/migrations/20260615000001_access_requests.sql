-- ============================================================================
-- Ritem — Demandes d'accès (leads entreprise)
-- Un prospect remplit le formulaire public de la landing page pour demander un
-- accès. La demande n'est rattachée à aucune organisation : c'est un lead que
-- le super-admin de la plateforme traite (approuve → provisionne une org, ou
-- rejette). RLS verrouille tout : insertion et lecture passent par le service
-- role côté serveur (Server Actions), jamais par le client.
-- ============================================================================

create type public.access_request_status as enum (
  'pending',
  'approved',
  'rejected'
);

create table if not exists public.access_requests (
  id            uuid primary key default uuid_generate_v4(),
  company_name  text not null,
  contact_name  text not null,
  email         text not null,
  phone         text,
  sector        text,
  team_size     text,
  message       text,
  status        public.access_request_status not null default 'pending',
  org_id        uuid references public.organizations (id) on delete set null,
  handled_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_access_requests_status
  on public.access_requests (status, created_at desc);

alter table public.access_requests enable row level security;

-- Aucune policy : RLS active sans policy ⇒ tout accès via le client (anon /
-- authenticated) est refusé. Seul le service role (qui bypass RLS) lit et écrit,
-- depuis les Server Actions après vérification de l'autorisation côté app.
