/**
 * Utilitaires de gestion des semaines pour le planning.
 * La semaine commence le LUNDI (convention FR / Skello).
 * Les dates sont manipulées en chaîne ISO "YYYY-MM-DD" (sans timezone) pour
 * éviter les décalages liés au fuseau horaire.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEKDAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

export const WEEKDAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Convertit une Date en "YYYY-MM-DD" (composantes locales). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse "YYYY-MM-DD" en Date locale (midi pour éviter les bascules DST). */
export function fromISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Lundi de la semaine contenant la date donnée. */
export function getMonday(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = (d.getDay() + 6) % 7; // 0 = lundi … 6 = dimanche
  d.setDate(d.getDate() - dow);
  return toISODate(d);
}

/** Les 7 dates ISO de la semaine commençant à `monday`. */
export function weekDates(monday: string): string[] {
  const base = fromISODate(monday).getTime();
  return Array.from({ length: 7 }, (_, i) =>
    toISODate(new Date(base + i * DAY_MS)),
  );
}

/** Décale une semaine (en nombre de semaines, +/-). */
export function shiftWeek(monday: string, weeks: number): string {
  const base = fromISODate(monday).getTime();
  return getMonday(new Date(base + weeks * 7 * DAY_MS));
}

/** Libellé d'une plage de semaine, ex. "2 – 8 juin 2026". */
export function formatWeekRange(monday: string): string {
  const dates = weekDates(monday);
  const start = fromISODate(dates[0]);
  const end = fromISODate(dates[6]);
  const sameMonth = start.getMonth() === end.getMonth();
  const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric" });
  const fullFmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (sameMonth) {
    return `${dayFmt.format(start)} – ${fullFmt.format(end)}`;
  }
  const startFmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  });
  return `${startFmt.format(start)} – ${fullFmt.format(end)}`;
}

/** Vrai si la chaîne ISO correspond à aujourd'hui. */
export function isToday(iso: string): boolean {
  return iso === toISODate(new Date());
}

/** Minutes depuis minuit pour "HH:MM" (durée d'un shift). */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Durée travaillée d'un shift en heures (pauses déduites). */
export function shiftHours(
  start: string,
  end: string,
  breakMinutes = 0,
): number {
  let mins = timeToMinutes(end) - timeToMinutes(start);
  if (mins < 0) mins += 24 * 60; // shift de nuit
  mins -= breakMinutes;
  return Math.max(0, mins) / 60;
}

/** "HH:MM:SS" -> "HH:MM". */
export function trimSeconds(time: string): string {
  return time.slice(0, 5);
}

// ── Vues du planning ──────────────────────────────────────────────────────

export type PlanningView = "day" | "week" | "month";

export function isPlanningView(v: string | undefined): v is PlanningView {
  return v === "day" || v === "week" || v === "month";
}

/** Décale un jour (ISO) de n jours. */
export function shiftDay(iso: string, days: number): string {
  return toISODate(new Date(fromISODate(iso).getTime() + days * DAY_MS));
}

/** Premier jour du mois contenant la date (ISO "YYYY-MM-01"). */
export function getMonthStart(date: Date = new Date()): string {
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
}

/** Décale un mois à partir d'un "YYYY-MM-01". */
export function shiftMonth(monthStart: string, months: number): string {
  const d = fromISODate(monthStart);
  return getMonthStart(new Date(d.getFullYear(), d.getMonth() + months, 1));
}

/**
 * Grille calendaire d'un mois : semaines complètes (lundi→dimanche) couvrant
 * tout le mois. Chaque date sait si elle appartient au mois courant.
 */
export function monthGrid(
  monthStart: string,
): { iso: string; inMonth: boolean }[] {
  const first = fromISODate(monthStart);
  const month = first.getMonth();
  const gridStart = fromISODate(getMonday(first));
  // 6 semaines couvrent tous les cas de figure.
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart.getTime() + i * DAY_MS);
    return { iso: toISODate(d), inMonth: d.getMonth() === month };
  });
}

/** Bornes [début, fin] ISO d'une vue, pour charger les shifts. */
export function viewRange(
  view: PlanningView,
  anchor: string,
): { from: string; to: string; label: string } {
  if (view === "day") {
    return {
      from: anchor,
      to: anchor,
      label: fromISODate(anchor).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
  }
  if (view === "month") {
    const grid = monthGrid(anchor);
    return {
      from: grid[0].iso,
      to: grid[grid.length - 1].iso,
      label: fromISODate(anchor).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    };
  }
  // week
  const days = weekDates(anchor);
  return { from: days[0], to: days[6], label: formatWeekRange(anchor) };
}
