import { Clock } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { getLocationContext } from "@/lib/auth/location-context";
import { AppHeader } from "@/components/layout/app-header";
import { toISODate, trimSeconds, shiftHours } from "@/lib/week";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PointagePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const { currentId, currentName } = await getLocationContext();
  const params = await searchParams;

  const day = params.day ?? toISODate(new Date());
  const dayStart = `${day}T00:00:00`;
  const dayEnd = `${day}T23:59:59`;

  const [{ data: shiftRows }, { data: clocks }] = await Promise.all([
    // Shifts planifiés du jour (cet établissement).
    supabase
      .from("shifts")
      .select(
        "employee_id, start_time, end_time, break_minutes, employees(first_name, last_name), schedules!inner(location_id)",
      )
      .eq("shift_date", day)
      .eq("schedules.location_id", currentId),
    // Pointages du jour.
    supabase
      .from("timeclocks")
      .select(
        "employee_id, clock_in, clock_out, employees(first_name, last_name)",
      )
      .eq("location_id", currentId)
      .gte("clock_in", dayStart)
      .lte("clock_in", dayEnd),
  ]);

  // Agrège par employé : heures planifiées + heures pointées.
  type Row = {
    employeeId: string;
    name: string;
    planned: number;
    actual: number;
    inTime: string | null;
    outTime: string | null;
    present: boolean;
  };
  const rowMap = new Map<string, Row>();

  for (const s of shiftRows ?? []) {
    if (!s.employee_id) continue;
    const h = shiftHours(
      trimSeconds(s.start_time),
      trimSeconds(s.end_time),
      s.break_minutes,
    );
    const r =
      rowMap.get(s.employee_id) ??
      ({
        employeeId: s.employee_id,
        name: s.employees
          ? `${s.employees.first_name} ${s.employees.last_name}`
          : "—",
        planned: 0,
        actual: 0,
        inTime: null,
        outTime: null,
        present: false,
      } as Row);
    r.planned += h;
    rowMap.set(s.employee_id, r);
  }

  for (const c of clocks ?? []) {
    const r =
      rowMap.get(c.employee_id) ??
      ({
        employeeId: c.employee_id,
        name: c.employees
          ? `${c.employees.first_name} ${c.employees.last_name}`
          : "—",
        planned: 0,
        actual: 0,
        inTime: null,
        outTime: null,
        present: false,
      } as Row);
    r.present = true;
    r.inTime = r.inTime ?? fmtTime(c.clock_in);
    if (c.clock_out) {
      r.outTime = fmtTime(c.clock_out);
      const ms =
        new Date(c.clock_out).getTime() - new Date(c.clock_in).getTime();
      r.actual += ms / 3600000;
    }
    rowMap.set(c.employee_id, r);
  }

  const rows = [...rowMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <>
      <AppHeader title="Pointage" fullName={ctx.fullName} email={ctx.email} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Pointage du jour
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentName} ·{" "}
              {new Date(day + "T12:00:00").toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Clock className="size-10 text-muted-foreground/40" />
            <h3 className="mt-4 font-medium">Rien ce jour-là</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aucun shift planifié ni pointage.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Pointage</TableHead>
                  <TableHead className="text-right">Planifié</TableHead>
                  <TableHead className="text-right">Réel</TableHead>
                  <TableHead className="text-right">Écart</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const delta = r.actual - r.planned;
                  return (
                    <TableRow key={r.employeeId}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        {r.present ? (
                          r.outTime ? (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              Parti
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-primary/20 bg-primary/10 text-primary"
                            >
                              Présent
                            </Badge>
                          )
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700"
                          >
                            Absent
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.inTime
                          ? `${r.inTime}${r.outTime ? ` – ${r.outTime}` : " – …"}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.planned.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.outTime ? `${r.actual.toFixed(1)}h` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.outTime && Math.abs(delta) >= 0.1 ? (
                          <span
                            className={
                              delta > 0 ? "text-amber-600" : "text-sky-600"
                            }
                          >
                            {delta > 0 ? "+" : "−"}
                            {Math.abs(delta).toFixed(1)}h
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </>
  );
}
