-- ============================================================================
-- SkelloLike — Suivi des pauses au pointage
-- On suit l'état du pointage (présent / en pause / parti) et le total de pause.
-- ============================================================================

alter table public.timeclocks
  -- Début de la pause en cours (null si pas en pause).
  add column if not exists break_started_at timestamptz,
  -- Minutes de pause cumulées sur ce pointage.
  add column if not exists break_minutes integer not null default 0;
