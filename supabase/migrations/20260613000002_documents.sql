-- ============================================================================
-- SkelloLike — Documents RH par employé
-- Table de métadonnées + bucket Storage 'documents' + policies.
-- ============================================================================

create table if not exists public.documents (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  category    text not null default 'autre',
  name        text not null,
  -- Chemin du fichier dans le bucket Storage.
  storage_path text not null,
  mime_type   text,
  size_bytes  bigint,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_documents_employee on public.documents (employee_id);
create index if not exists idx_documents_org on public.documents (org_id);

alter table public.documents enable row level security;

-- Lecture : membres de l'org. Gestion : managers.
create policy "documents_select_member"
  on public.documents for select
  using (public.is_org_member(org_id));

create policy "documents_manage_manager"
  on public.documents for all
  using (public.is_org_manager(org_id))
  with check (public.is_org_manager(org_id));

-- ── Bucket Storage privé pour les documents ──────────────────────────────
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Policies Storage : les membres de l'org peuvent lire/écrire dans le dossier
-- de leur organisation (le chemin commence par "<org_id>/").
create policy "documents_storage_read"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
  );

create policy "documents_storage_write"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and public.is_org_manager((split_part(name, '/', 1))::uuid)
  );

create policy "documents_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and public.is_org_manager((split_part(name, '/', 1))::uuid)
  );
