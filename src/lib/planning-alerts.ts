/**
 * Calcul des alertes du planning (règles RH françaises standard).
 * Logique pure, testable, sans dépendance UI ni base de données.
 */

import { shiftHours, timeToMinutes, fromISODate } from "@/lib/week";

export type AlertLevel = "warning" | "info";

export type ShiftLike = {
  id: string;
  employee_id: string | null;
  position_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
};

/** Alerte rattachée à un shift précis. */
export type ShiftAlert = {
  shiftId: string;
  level: AlertLevel;
  message: string;
};

/** Alerte rattachée à un employé (semaine). */
export type EmployeeAlert = {
  employeeId: string;
  level: AlertLevel;
  message: string;
};

export type AlertContext = {
  /** Heures hebdomadaires contractuelles par employé (depuis le contrat actif). */
  contractHours: Map<string, number>;
  /** Postes occupables par employé (employee_positions). */
  employeePositions: Map<string, Set<string>>;
};

/** Repos minimum légal entre deux services (heures). */
const MIN_REST_HOURS = 11;
/** Durée maximale d'un service (heures). */
const MAX_SHIFT_HOURS = 10;

/** Total des heures travaillées d'un employé sur l'ensemble des shifts fournis. */
function weeklyHours(shifts: ShiftLike[]): number {
  return shifts.reduce(
    (sum, s) => sum + shiftHours(s.start_time, s.end_time, s.break_minutes),
    0,
  );
}

/** Instant de début/fin absolu d'un shift en minutes depuis une époque locale. */
function shiftBounds(s: ShiftLike): { start: number; end: number } {
  const dayMs = fromISODate(s.shift_date).getTime();
  const dayMinutes = Math.round(dayMs / 60000);
  const start = dayMinutes + timeToMinutes(s.start_time);
  let endMin = timeToMinutes(s.end_time);
  // Shift de nuit : la fin est le lendemain.
  if (endMin <= timeToMinutes(s.start_time)) endMin += 24 * 60;
  const end = dayMinutes + endMin;
  return { start, end };
}

/**
 * Calcule toutes les alertes pour un ensemble de shifts (une semaine).
 * Retourne des maps indexées par shift et par employé.
 */
export function computeAlerts(
  shifts: ShiftLike[],
  ctx: AlertContext,
): {
  byShift: Map<string, ShiftAlert[]>;
  byEmployee: Map<string, EmployeeAlert[]>;
  total: number;
} {
  const byShift = new Map<string, ShiftAlert[]>();
  const byEmployee = new Map<string, EmployeeAlert[]>();

  const addShift = (a: ShiftAlert) => {
    const arr = byShift.get(a.shiftId) ?? [];
    arr.push(a);
    byShift.set(a.shiftId, arr);
  };
  const addEmployee = (a: EmployeeAlert) => {
    const arr = byEmployee.get(a.employeeId) ?? [];
    arr.push(a);
    byEmployee.set(a.employeeId, arr);
  };

  // Regroupe les shifts par employé.
  const perEmployee = new Map<string, ShiftLike[]>();
  for (const s of shifts) {
    if (!s.employee_id) continue;
    const arr = perEmployee.get(s.employee_id) ?? [];
    arr.push(s);
    perEmployee.set(s.employee_id, arr);
  }

  for (const [employeeId, empShifts] of perEmployee) {
    // 1) Dépassement des heures contractuelles.
    const contract = ctx.contractHours.get(employeeId);
    if (contract != null) {
      const worked = weeklyHours(empShifts);
      if (worked > contract + 0.01) {
        addEmployee({
          employeeId,
          level: "warning",
          message: `${worked.toFixed(1)}h planifiées pour ${contract}h au contrat (+${(worked - contract).toFixed(1)}h)`,
        });
      }
    }

    // 2) Compétence manquante + durée max, par shift.
    const skills = ctx.employeePositions.get(employeeId);
    for (const s of empShifts) {
      if (s.position_id && skills && !skills.has(s.position_id)) {
        addShift({
          shiftId: s.id,
          level: "warning",
          message: "Poste non assigné à cet employé",
        });
      }
      const h = shiftHours(s.start_time, s.end_time, s.break_minutes);
      if (h > MAX_SHIFT_HOURS) {
        addShift({
          shiftId: s.id,
          level: "warning",
          message: `Service de ${h.toFixed(1)}h (> ${MAX_SHIFT_HOURS}h)`,
        });
      }
    }

    // 3) Repos insuffisant + chevauchement entre shifts consécutifs.
    const sorted = [...empShifts].sort(
      (a, b) => shiftBounds(a).start - shiftBounds(b).start,
    );
    for (let i = 1; i < sorted.length; i++) {
      const prev = shiftBounds(sorted[i - 1]);
      const curr = shiftBounds(sorted[i]);
      const gapHours = (curr.start - prev.end) / 60;

      if (gapHours < 0) {
        addShift({
          shiftId: sorted[i].id,
          level: "warning",
          message: "Chevauchement avec un autre shift",
        });
      } else if (gapHours < MIN_REST_HOURS) {
        addShift({
          shiftId: sorted[i].id,
          level: "warning",
          message: `Repos de ${gapHours.toFixed(1)}h (< ${MIN_REST_HOURS}h légales)`,
        });
      }
    }
  }

  let total = 0;
  byShift.forEach((a) => (total += a.length));
  byEmployee.forEach((a) => (total += a.length));

  return { byShift, byEmployee, total };
}
