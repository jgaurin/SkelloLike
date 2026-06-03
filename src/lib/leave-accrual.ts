/**
 * Calcul de l'acquisition automatique des congés.
 *
 * Règle : un employé acquiert `monthlyAccrual` jours par mois travaillé, depuis
 * le plus tardif entre sa date d'entrée et le début de la période de référence,
 * jusqu'au mois courant (ou la fin de la période). Le résultat est plafonné par
 * `annualCap` (si > 0).
 */

export type AccrualSettings = {
  monthlyAccrual: number;
  annualCap: number;
  periodStartMonth: number; // 1 = janvier … 12 = décembre
};

/** Début de la période de référence (année N ou N-1) contenant `ref`. */
function periodStart(ref: Date, startMonth: number): Date {
  const year =
    ref.getMonth() + 1 >= startMonth
      ? ref.getFullYear()
      : ref.getFullYear() - 1;
  return new Date(year, startMonth - 1, 1);
}

/**
 * Nombre de mois entiers écoulés entre `from` et `to` (inclus le mois courant).
 * Ex : du 1er juin au 15 août = 3 mois (juin, juillet, août).
 */
function monthsWorked(from: Date, to: Date): number {
  if (to < from) return 0;
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    1;
  return Math.max(0, months);
}

/**
 * Jours acquis pour un employé à la date `ref` (par défaut aujourd'hui).
 * @param hireDate date d'entrée ISO ("YYYY-MM-DD") ou null
 */
export function computeAccrued(
  settings: AccrualSettings,
  hireDate: string | null,
  ref: Date = new Date(),
): number {
  if (settings.monthlyAccrual <= 0) return 0;

  const start = periodStart(ref, settings.periodStartMonth);
  // On compte à partir du plus tardif entre l'entrée et le début de période.
  const hire = hireDate ? new Date(hireDate + "T12:00:00") : start;
  const from = hire > start ? hire : start;
  // On normalise au 1er du mois d'entrée.
  const fromMonth = new Date(from.getFullYear(), from.getMonth(), 1);

  const months = monthsWorked(fromMonth, ref);
  let accrued = months * settings.monthlyAccrual;

  if (settings.annualCap > 0) {
    accrued = Math.min(accrued, settings.annualCap);
  }
  // Arrondi au demi-jour (pratique RH courante).
  return Math.round(accrued * 2) / 2;
}
