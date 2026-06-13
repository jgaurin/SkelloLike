/**
 * Ventilation des heures d'un shift pour les majorations de pré-paie.
 * Découpe la durée travaillée en : heures de nuit, de dimanche, de jour férié.
 * Logique RH standard française, implémentation maison.
 *
 * Note : les heures majorées sont comptées par catégorie (une heure peut être à
 * la fois "nuit" et "dimanche"). L'export les expose séparément pour que la paie
 * applique les cumuls selon la convention.
 */

import { timeToMinutes } from "@/lib/week";

export type PremiumRules = {
  nightStartHour: number; // ex : 21
  nightEndHour: number; // ex : 6
  /** Dates ISO des jours fériés (pour marquer les heures fériées). */
  holidays: Set<string>;
};

export type PremiumHours = {
  night: number;
  sunday: number;
  holiday: number;
};

/** Une minute donnée tombe-t-elle dans la plage de nuit ? */
function isNightMinute(
  minuteOfDay: number,
  startHour: number,
  endHour: number,
): boolean {
  const m = ((minuteOfDay % 1440) + 1440) % 1440;
  const start = startHour * 60;
  const end = endHour * 60;
  // Plage qui traverse minuit (ex : 21h -> 6h).
  if (start > end) return m >= start || m < end;
  // Plage simple (ex : 0h -> 6h).
  return m >= start && m < end;
}

/**
 * Ventile un shift en heures majorées.
 * @param date    date ISO du shift (jour de début)
 * @param start   "HH:MM"
 * @param end     "HH:MM"
 * @param breakMin pause en minutes (déduite proportionnellement)
 */
export function splitPremiumHours(
  date: string,
  start: string,
  end: string,
  breakMin: number,
  rules: PremiumRules,
): PremiumHours {
  const startMin = timeToMinutes(start);
  let endMin = timeToMinutes(end);
  if (endMin <= startMin) endMin += 1440; // shift de nuit qui passe minuit

  const grossMinutes = endMin - startMin;
  if (grossMinutes <= 0) return { night: 0, sunday: 0, holiday: 0 };

  // Facteur pour déduire la pause au prorata.
  const workFactor = Math.max(0, (grossMinutes - breakMin) / grossMinutes);

  const dow = new Date(date + "T12:00:00").getDay(); // 0 = dimanche
  const isSunday = dow === 0;
  const isHoliday = rules.holidays.has(date);

  let nightMin = 0;
  // On parcourt minute par minute (simple et exact pour les bornes de nuit).
  for (let m = startMin; m < endMin; m++) {
    if (isNightMinute(m, rules.nightStartHour, rules.nightEndHour)) {
      nightMin++;
    }
  }

  const toH = (min: number) => Math.round((min * workFactor) / 60 * 100) / 100;
  const workedH = toH(grossMinutes);

  return {
    night: toH(nightMin),
    sunday: isSunday ? workedH : 0,
    holiday: isHoliday ? workedH : 0,
  };
}
