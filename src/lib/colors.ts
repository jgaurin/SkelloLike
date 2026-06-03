/**
 * Palette de couleurs proposée pour les entités métier (postes, équipes, types
 * d'absence, établissements). Ces couleurs sont LIBRES (choix utilisateur) et
 * appliquées en inline — c'est l'exception aux tokens du thème (cf. DESIGN_SYSTEM §5).
 */
export const PRESET_COLORS = [
  "#059669", // émeraude (défaut, cohérent avec la marque)
  "#0EA5E9", // sky
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#EC4899", // rose
  "#EF4444", // rouge
  "#F59E0B", // ambre
  "#84CC16", // lime
  "#14B8A6", // teal
  "#64748B", // slate
] as const;

export const DEFAULT_COLOR = PRESET_COLORS[0];
