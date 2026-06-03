-- ============================================================================
-- SkelloLike — Règles de pause automatique par établissement
-- Stockées en JSONB : liste de paliers { min_hours, break_minutes } triés.
-- La pause appliquée = celle du palier le plus élevé atteint par la durée brute.
-- Défaut : règle standard FR (≥ 6h → 30 min).
-- ============================================================================

alter table public.locations
  add column if not exists break_rules jsonb not null default
    '[{"min_hours": 6, "break_minutes": 30}]'::jsonb;

-- Backfill explicite pour les lignes existantes (au cas où le default ne suffit pas).
update public.locations
set break_rules = '[{"min_hours": 6, "break_minutes": 30}]'::jsonb
where break_rules is null;
