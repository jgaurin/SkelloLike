/**
 * Calcul des alertes du planning (règles RH françaises standard).
 * Logique pure, testable, sans dépendance UI ni base de données.
 */

import { shiftHours, timeToMinutes, fromISODate } from "@/lib/week";

export type AlertLevel = "warning" | "info";

/** Codes d'alerte configurables (clé stable stockée en base). */
export type AlertCode =
  | "contract_overtime"
  | "min_rest"
  | "max_shift_hours"
  | "missing_skill"
  | "overlap";

/** Catalogue : libellé + description de chaque alerte (pour les paramètres). */
export const ALERT_CATALOG: {
  code: AlertCode;
  label: string;
  description: string;
}[] = [
  {
    code: "contract_overtime",
    label: "Dépassement du temps contractuel",
    description:
      "L'employé est planifié au-delà de ses heures hebdomadaires contractuelles.",
  },
  {
    code: "min_rest",
    label: "Repos journalier insuffisant",
    description:
      "Moins de 11h de repos entre deux services (droit du travail).",
  },
  {
    code: "max_shift_hours",
    label: "Volume horaire journée",
    description: "Un service dépasse 10h de travail effectif.",
  },
  {
    code: "missing_skill",
    label: "Compétence manquante",
    description: "L'employé n'est pas habilité au poste affecté.",
  },
  {
    code: "overlap",
    label: "Conflit d'horaires",
    description: "Deux shifts de l'employé se chevauchent.",
  },
];

/** Réglage d'une alerte : activée et/ou bloquante. */
export type AlertSetting = { enabled: boolean; blocking: boolean };
export type AlertSettings = Partial<Record<AlertCode, AlertSetting>>;

/** Réglage effectif d'un code (par défaut : activé, non bloquant). */
function settingFor(
  settings: AlertSettings | undefined,
  code: AlertCode,
): AlertSetting {
  return settings?.[code] ?? { enabled: true, blocking: false };
}

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
  code: AlertCode;
  level: AlertLevel;
  blocking: boolean;
  message: string;
};

/** Alerte rattachée à un employé (semaine). */
export type EmployeeAlert = {
  employeeId: string;
  code: AlertCode;
  level: AlertLevel;
  blocking: boolean;
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
  settings?: AlertSettings,
): {
  byShift: Map<string, ShiftAlert[]>;
  byEmployee: Map<string, EmployeeAlert[]>;
  total: number;
  blockingTotal: number;
} {
  const byShift = new Map<string, ShiftAlert[]>();
  const byEmployee = new Map<string, EmployeeAlert[]>();

  const addShift = (
    code: AlertCode,
    shiftId: string,
    message: string,
  ) => {
    const st = settingFor(settings, code);
    if (!st.enabled) return;
    const arr = byShift.get(shiftId) ?? [];
    arr.push({ shiftId, code, level: "warning", blocking: st.blocking, message });
    byShift.set(shiftId, arr);
  };
  const addEmployee = (
    code: AlertCode,
    employeeId: string,
    message: string,
  ) => {
    const st = settingFor(settings, code);
    if (!st.enabled) return;
    const arr = byEmployee.get(employeeId) ?? [];
    arr.push({
      employeeId,
      code,
      level: "warning",
      blocking: st.blocking,
      message,
    });
    byEmployee.set(employeeId, arr);
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
        addEmployee(
          "contract_overtime",
          employeeId,
          `${worked.toFixed(1)}h planifiées pour ${contract}h au contrat (+${(worked - contract).toFixed(1)}h)`,
        );
      }
    }

    // 2) Compétence manquante + durée max, par shift.
    const skills = ctx.employeePositions.get(employeeId);
    for (const s of empShifts) {
      if (s.position_id && skills && !skills.has(s.position_id)) {
        addShift("missing_skill", s.id, "Poste non assigné à cet employé");
      }
      const h = shiftHours(s.start_time, s.end_time, s.break_minutes);
      if (h > MAX_SHIFT_HOURS) {
        addShift(
          "max_shift_hours",
          s.id,
          `Service de ${h.toFixed(1)}h (> ${MAX_SHIFT_HOURS}h)`,
        );
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
        addShift("overlap", sorted[i].id, "Chevauchement avec un autre shift");
      } else if (gapHours < MIN_REST_HOURS) {
        addShift(
          "min_rest",
          sorted[i].id,
          `Repos de ${gapHours.toFixed(1)}h (< ${MIN_REST_HOURS}h légales)`,
        );
      }
    }
  }

  let total = 0;
  let blockingTotal = 0;
  byShift.forEach((arr) => {
    total += arr.length;
    blockingTotal += arr.filter((a) => a.blocking).length;
  });
  byEmployee.forEach((arr) => {
    total += arr.length;
    blockingTotal += arr.filter((a) => a.blocking).length;
  });

  return { byShift, byEmployee, total, blockingTotal };
}
