/**
 * Jours fériés français (métropole).
 * Combine les jours fériés fixes et ceux calculés à partir de Pâques.
 * Implémentation maison de l'algorithme de Pâques (Meeus/Jones/Butcher),
 * qui est un algorithme mathématique public.
 */

import { toISODate } from "@/lib/week";

/** Dimanche de Pâques pour une année donnée (algorithme grégorien). */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/**
 * Map des jours fériés d'une année : clé = "YYYY-MM-DD", valeur = nom.
 */
export function frenchHolidays(year: number): Map<string, string> {
  const map = new Map<string, string>();

  // Fériés fixes.
  map.set(`${year}-01-01`, "Jour de l'An");
  map.set(`${year}-05-01`, "Fête du Travail");
  map.set(`${year}-05-08`, "Victoire 1945");
  map.set(`${year}-07-14`, "Fête nationale");
  map.set(`${year}-08-15`, "Assomption");
  map.set(`${year}-11-01`, "Toussaint");
  map.set(`${year}-11-11`, "Armistice 1918");
  map.set(`${year}-12-25`, "Noël");

  // Fériés mobiles (basés sur Pâques).
  const easter = easterSunday(year);
  map.set(toISODate(addDays(easter, 1)), "Lundi de Pâques");
  map.set(toISODate(addDays(easter, 39)), "Ascension");
  map.set(toISODate(addDays(easter, 50)), "Lundi de Pentecôte");

  return map;
}

/**
 * Renvoie le nom du jour férié pour une date ISO donnée, ou null.
 */
export function holidayName(dateISO: string): string | null {
  const year = Number(dateISO.slice(0, 4));
  return frenchHolidays(year).get(dateISO) ?? null;
}

/**
 * Jours fériés tombant dans une plage [from, to] (dates ISO incluses).
 * Couvre le cas d'une plage à cheval sur deux années.
 */
export function holidaysInRange(
  from: string,
  to: string,
): Map<string, string> {
  const y1 = Number(from.slice(0, 4));
  const y2 = Number(to.slice(0, 4));
  const result = new Map<string, string>();
  for (let y = y1; y <= y2; y++) {
    for (const [iso, name] of frenchHolidays(y)) {
      if (iso >= from && iso <= to) result.set(iso, name);
    }
  }
  return result;
}
