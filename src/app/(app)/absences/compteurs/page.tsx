import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { computeAccrued } from "@/lib/leave-accrual";
import { BalancesTable, type BalanceRow } from "./balances-table";

const ADMIN_ROLES = ["org_owner", "org_admin", "location_manager"];

/** Compte les jours ouvrés (lun→ven) entre deux dates ISO incluses. */
function weekdaysBetween(start: string, end: string): number {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  let count = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export default async function CompteursPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = ADMIN_ROLES.includes(ctx.role);
  const params = await searchParams;

  const year = Number(params.year) || new Date().getFullYear();

  const [{ data: employees }, { data: types }, { data: balances }, { data: absences }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, first_name, last_name, hire_date")
        .eq("status", "active")
        .order("last_name"),
      // Seuls les types qui décomptent un solde (CP, RTT…), avec leurs règles d'acquisition.
      supabase
        .from("absence_types")
        .select(
          "id, name, color, monthly_accrual, annual_cap, period_start_month",
        )
        .eq("affects_counter", true)
        .order("name"),
      // Le solde stocke désormais uniquement l'ajustement manuel (correction).
      supabase
        .from("leave_balances")
        .select("employee_id, type_id, adjusted")
        .eq("year", year),
      // Absences validées de l'année pour calculer le "pris".
      supabase
        .from("absence_requests")
        .select("employee_id, type_id, start_date, end_date")
        .eq("status", "approved")
        .gte("start_date", `${year}-01-01`)
        .lte("end_date", `${year}-12-31`),
    ]);

  // Pris (jours ouvrés) par employé+type, depuis les absences validées.
  const takenMap = new Map<string, number>();
  for (const a of absences ?? []) {
    if (!a.employee_id) continue;
    const key = `${a.employee_id}|${a.type_id}`;
    const days = weekdaysBetween(a.start_date, a.end_date);
    takenMap.set(key, (takenMap.get(key) ?? 0) + days);
  }

  // Ajustement manuel (correction) par employé+type.
  const adjustMap = new Map<string, number>();
  for (const b of balances ?? []) {
    adjustMap.set(`${b.employee_id}|${b.type_id}`, Number(b.adjusted));
  }

  // Date de référence du calcul : 31 déc. pour une année passée, sinon aujourd'hui.
  const now = new Date();
  const ref =
    year < now.getFullYear() ? new Date(year, 11, 31) : now;

  const rows: BalanceRow[] = [];
  for (const emp of employees ?? []) {
    for (const t of types ?? []) {
      const key = `${emp.id}|${t.id}`;
      // Acquis = calcul automatique selon la règle du type et la date d'entrée.
      const acquired = computeAccrued(
        {
          monthlyAccrual: Number(t.monthly_accrual),
          annualCap: Number(t.annual_cap),
          periodStartMonth: t.period_start_month,
        },
        emp.hire_date,
        ref,
      );
      const adjusted = adjustMap.get(key) ?? 0;
      const taken = takenMap.get(key) ?? 0;
      rows.push({
        employeeId: emp.id,
        employee: `${emp.first_name} ${emp.last_name}`,
        typeId: t.id,
        type: t.name,
        typeColor: t.color,
        acquired,
        adjusted,
        taken,
        remaining: acquired + adjusted - taken,
      });
    }
  }

  return (
    <>
      <AppHeader
        title="Compteurs de congés"
        fullName={ctx.fullName}
        email={ctx.email}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Compteurs de congés — {year}
          </h2>
          <p className="text-sm text-muted-foreground">
            Soldes acquis, pris et restants par employé. Le « pris » est calculé
            depuis les absences validées (jours ouvrés).
          </p>
        </div>

        <BalancesTable
          rows={rows}
          year={year}
          canManage={canManage}
          hasData={(types?.length ?? 0) > 0 && (employees?.length ?? 0) > 0}
        />
      </main>
    </>
  );
}
