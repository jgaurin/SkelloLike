/**
 * Calcul de la pause automatique d'un shift selon des paliers configurables.
 * Un palier = { min_hours, break_minutes }. La pause appliquée est celle du
 * palier le plus élevé atteint par la durée BRUTE du shift (pauses non déduites).
 */

import { shiftHours } from "@/lib/week";

export type BreakRule = { min_hours: number; break_minutes: number };

/** Règle par défaut : standard FR (≥ 6h → 30 min). */
export const DEFAULT_BREAK_RULES: BreakRule[] = [
  { min_hours: 6, break_minutes: 30 },
];

/** Valide et trie une valeur jsonb en liste de paliers exploitable. */
export function parseBreakRules(raw: unknown): BreakRule[] {
  if (!Array.isArray(raw)) return DEFAULT_BREAK_RULES;
  const rules = raw
    .filter(
      (r): r is BreakRule =>
        !!r &&
        typeof r === "object" &&
        typeof (r as BreakRule).min_hours === "number" &&
        typeof (r as BreakRule).break_minutes === "number",
    )
    .sort((a, b) => a.min_hours - b.min_hours);
  return rules.length ? rules : DEFAULT_BREAK_RULES;
}

/**
 * Minutes de pause à appliquer pour un shift de `start`→`end` (durée brute),
 * selon les paliers donnés.
 */
export function autoBreakMinutes(
  start: string,
  end: string,
  rules: BreakRule[],
): number {
  const grossHours = shiftHours(start, end, 0);
  let result = 0;
  for (const r of rules) {
    if (grossHours >= r.min_hours) result = r.break_minutes;
  }
  return result;
}
