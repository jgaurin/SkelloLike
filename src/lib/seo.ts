/**
 * Constantes SEO centralisées — réutilisées par la metadata racine, le sitemap,
 * robots, le manifest et les données structurées (JSON-LD).
 *
 * ⚠️ En production, définir `NEXT_PUBLIC_SITE_URL` sur le vrai domaine
 * (ex. https://ritem.fr). Sinon les URLs canoniques / OG pointent vers localhost.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "Ritem";

/** Accroche courte (≈ 60 car.) — sert de titre par défaut. */
export const SITE_TITLE =
  "Ritem — Logiciel de planning et gestion RH pour équipes terrain";

/** Meta description (≈ 155 car.) — visible dans les résultats de recherche. */
export const SITE_DESCRIPTION =
  "Ritem réunit planning, badgeuse, gestion des absences et préparation de la paie dans un seul outil pensé pour les équipes terrain : restauration, commerce, hôtellerie, santé.";

/** Mots-clés du domaine (secondaire pour Google, utile pour d'autres moteurs). */
export const SITE_KEYWORDS = [
  "logiciel planning",
  "logiciel de gestion des plannings",
  "planning équipes",
  "logiciel RH",
  "gestion des absences",
  "badgeuse",
  "pointage",
  "préparation de la paie",
  "planning restaurant",
  "planning commerce",
  "logiciel planning restauration",
  "gestion du temps de travail",
  "SIRH",
  "Ritem",
];

export const SITE_LOCALE = "fr_FR";

/** URL absolue à partir d'un chemin relatif. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
