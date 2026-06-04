/**
 * Calcul de la pré-paie mensuelle par employé.
 *
 * Reproduit la structure d'un export de pré-paie : jours et heures travaillés,
 * heures supplémentaires ventilées par semaine ISO, et absences agrégées par
 * type. Logique métier RH standard, implémentation maison.
 */

import { shiftHours } from "@/lib/week";

export type PrepaieShift = {
  employee_id: string | null;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string;
  break_minutes: number;
};

export type PrepaieAbsence = {
  employee_id: string | null;
  type_name: string;
  start_date: string;
  end_date: string;
};

export type PrepaieRow = {
  name: string;
  workedDays: number;
  workedHours: number;
  /** Heures supp/comp par semaine ISO, clé = numéro de semaine. */
  overtimeByWeek: Record<number, number>;
  overtimeTotal: number;
  /** Heures/jours d'absence par type (libellé du type). */
  absencesByType: Record<string, number>;
  /** Nombre de jours fériés tombant un jour de shift planifié de l'employé. */
  holidaysWorked: number;
};

/** Numéro de semaine ISO 8601 d'une date ISO. */
export function isoWeek(dateISO: string): number {
  const d = new Date(dateISO + "T12:00:00");
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.valueOf() - firstThursday.valueOf();
  return 1 + Math.round(diff / (7 * 86400000));
}

/** Compte les jours ouvrés (lun→ven) entre deux dates ISO incluses. */
function weekdaysBetween(start: string, end: string, monthStart: string, monthEnd: string): number {
  // On borne l'absence au mois courant.
  const s = new Date(
    (start > monthStart ? start : monthStart) + "T12:00:00",
  );
  const e = new Date((end < monthEnd ? end : monthEnd) + "T12:00:00");
  let count = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return Math.max(0, count);
}

export type PrepaieInput = {
  employees: { id: string; first_name: string; last_name: string }[];
  /** Heures contractuelles hebdo par employé (pour le calcul des heures supp). */
  contractHours: Map<string, number>;
  shifts: PrepaieShift[];
  absences: PrepaieAbsence[];
  /** Dates ISO des jours fériés du mois. */
  holidays: Set<string>;
  monthStart: string; // YYYY-MM-01
  monthEnd: string; // dernier jour du mois
};

/**
 * Calcule les lignes de pré-paie pour un mois donné.
 */
export function computePrepaie(input: PrepaieInput): {
  rows: PrepaieRow[];
  weeks: number[];
  absenceTypes: string[];
} {
  const { employees, contractHours, shifts, absences } = input;

  // Heures travaillées par employé, par semaine et par jour.
  type Acc = {
    hoursByWeek: Map<number, number>;
    days: Set<string>;
  };
  const work = new Map<string, Acc>();
  const weeksSet = new Set<number>();

  for (const s of shifts) {
    if (!s.employee_id) continue;
    const h = shiftHours(s.start_time, s.end_time, s.break_minutes);
    if (h <= 0) continue;
    const week = isoWeek(s.shift_date);
    weeksSet.add(week);
    const acc =
      work.get(s.employee_id) ??
      ({ hoursByWeek: new Map(), days: new Set() } as Acc);
    acc.hoursByWeek.set(week, (acc.hoursByWeek.get(week) ?? 0) + h);
    acc.days.add(s.shift_date);
    work.set(s.employee_id, acc);
  }

  // Absences par employé et par type (en jours ouvrés, mois borné).
  const absByEmp = new Map<string, Map<string, number>>();
  const typesSet = new Set<string>();
  for (const a of absences) {
    if (!a.employee_id) continue;
    typesSet.add(a.type_name);
    const days = weekdaysBetween(
      a.start_date,
      a.end_date,
      input.monthStart,
      input.monthEnd,
    );
    const m = absByEmp.get(a.employee_id) ?? new Map<string, number>();
    m.set(a.type_name, (m.get(a.type_name) ?? 0) + days);
    absByEmp.set(a.employee_id, m);
  }

  const weeks = [...weeksSet].sort((a, b) => a - b);
  const absenceTypes = [...typesSet].sort();

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const rows: PrepaieRow[] = employees.map((e) => {
    const acc = work.get(e.id);
    const weeklyContract = contractHours.get(e.id) ?? 35;

    const overtimeByWeek: Record<number, number> = {};
    let workedHours = 0;
    let overtimeTotal = 0;

    for (const week of weeks) {
      const h = acc?.hoursByWeek.get(week) ?? 0;
      workedHours += h;
      // Heures supp = au-delà du contrat hebdo.
      const ot = Math.max(0, h - weeklyContract);
      overtimeByWeek[week] = round2(ot);
      overtimeTotal += ot;
    }

    const absencesByType: Record<string, number> = {};
    const m = absByEmp.get(e.id);
    for (const t of absenceTypes) {
      absencesByType[t] = round2(m?.get(t) ?? 0);
    }

    // Jours fériés sur lesquels l'employé a un shift planifié.
    let holidaysWorked = 0;
    if (acc) {
      for (const day of acc.days) {
        if (input.holidays.has(day)) holidaysWorked++;
      }
    }

    return {
      name: `${e.last_name.toUpperCase()} ${e.first_name}`,
      workedDays: acc?.days.size ?? 0,
      workedHours: round2(workedHours),
      overtimeByWeek,
      overtimeTotal: round2(overtimeTotal),
      absencesByType,
      holidaysWorked,
    };
  });

  return { rows, weeks, absenceTypes };
}
