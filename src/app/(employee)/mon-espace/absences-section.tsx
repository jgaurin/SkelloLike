import { createClient } from "@/lib/supabase/server";
import { getEmployeeContext } from "@/lib/auth/employee-context";
import { computeAccrued } from "@/lib/leave-accrual";
import { AbsenceStatusBadge } from "@/app/(app)/absences/status-badge";
import { RequestForm } from "./absences/request-form";
import { CancelButton } from "./absences/cancel-button";
import { CountersGrid } from "./absences/counters-grid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function fmt(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("fr-FR");
}

function weekdaysBetween(start: string, end: string) {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  let c = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const w = d.getDay();
    if (w !== 0 && w !== 6) c++;
  }
  return c;
}

/**
 * Section « Mes absences » de l'espace employé : compteurs de soldes +
 * historique des demandes + bouton de demande. Pensée pour être empilée dans
 * la page unique /mon-espace.
 */
export async function AbsencesSection() {
  const ctx = await getEmployeeContext();
  const supabase = await createClient();
  const year = new Date().getFullYear();

  const [{ data: requests }, { data: types }, { data: hireRow }, { data: balances }] =
    await Promise.all([
      supabase
        .from("absence_requests")
        .select("id, start_date, end_date, status, comment, absence_types(name, color)")
        .eq("employee_id", ctx.employeeId)
        .order("start_date", { ascending: false }),
      supabase
        .from("absence_types")
        .select("id, name, monthly_accrual, annual_cap, period_start_month, affects_counter")
        .eq("is_active", true)
        .eq("can_be_requested", true)
        .order("sort_order"),
      supabase
        .from("employees")
        .select("hire_date")
        .eq("id", ctx.employeeId)
        .maybeSingle(),
      supabase
        .from("leave_balances")
        .select("type_id, adjusted")
        .eq("employee_id", ctx.employeeId)
        .eq("year", year),
    ]);

  const { data: counterTypes } = await supabase
    .from("absence_types")
    .select(
      "id, name, color, monthly_accrual, annual_cap, period_start_month, sort_order",
    )
    .eq("affects_counter", true)
    .order("sort_order");

  const adjustMap = new Map(
    (balances ?? []).map((b) => [b.type_id, Number(b.adjusted)]),
  );

  const { data: approved } = await supabase
    .from("absence_requests")
    .select("type_id, start_date, end_date")
    .eq("employee_id", ctx.employeeId)
    .eq("status", "approved")
    .gte("start_date", `${year}-01-01`)
    .lte("end_date", `${year}-12-31`);

  const takenMap = new Map<string, number>();
  for (const a of approved ?? []) {
    takenMap.set(
      a.type_id,
      (takenMap.get(a.type_id) ?? 0) + weekdaysBetween(a.start_date, a.end_date),
    );
  }

  const counters = (counterTypes ?? [])
    .map((t) => {
      const acquired = computeAccrued(
        {
          monthlyAccrual: Number(t.monthly_accrual),
          annualCap: Number(t.annual_cap),
          periodStartMonth: t.period_start_month,
        },
        hireRow?.hire_date ?? null,
      );
      const adjusted = adjustMap.get(t.id) ?? 0;
      const taken = takenMap.get(t.id) ?? 0;
      const accrues = Number(t.monthly_accrual) > 0 || adjusted > 0;
      return {
        name: t.name,
        color: t.color,
        accrues,
        remaining: acquired + adjusted - taken,
        taken,
      };
    })
    .sort((a, b) => Number(b.accrues) - Number(a.accrues));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Mes absences</h2>
        <RequestForm types={types ?? []} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mes demandes</CardTitle>
          <CardDescription>{requests?.length ?? 0} demande(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests?.length ? (
            requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: r.absence_types?.color ?? "#94A3B8" }}
                  />
                  <span className="font-medium">
                    {r.absence_types?.name ?? "Absence"}
                  </span>
                  <span className="text-muted-foreground">
                    {fmt(r.start_date)} → {fmt(r.end_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AbsenceStatusBadge status={r.status} />
                  {r.status === "pending" && <CancelButton id={r.id} />}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune demande pour l&apos;instant.
            </p>
          )}
        </CardContent>
      </Card>

      {counters.length > 0 && <CountersGrid counters={counters} />}
    </div>
  );
}
