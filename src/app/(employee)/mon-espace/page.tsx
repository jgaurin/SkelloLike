import { CalendarDays } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getEmployeeContext } from "@/lib/auth/employee-context";
import {
  getMonday,
  weekDates,
  shiftWeek,
  formatWeekRange,
  WEEKDAYS,
  isToday,
  trimSeconds,
  shiftHours,
  fromISODate,
} from "@/lib/week";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function MonPlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const ctx = await getEmployeeContext();
  const supabase = await createClient();
  const params = await searchParams;

  const weekStart = params.week ? getMonday(new Date(params.week)) : getMonday();
  const days = weekDates(weekStart);

  // Shifts publiés de la semaine pour cet employé + ses collègues (même org,
  // plannings publiés). On ne montre que les semaines publiées.
  const { data: shiftRows } = await supabase
    .from("shifts")
    .select(
      "id, employee_id, shift_date, start_time, end_time, break_minutes, position_id, status, positions(name, color), employees(first_name, last_name), schedules!inner(status)",
    )
    .gte("shift_date", days[0])
    .lte("shift_date", days[6])
    .eq("status", "published");

  type Row = {
    id: string;
    employee_id: string | null;
    shift_date: string;
    start: string;
    end: string;
    breakMin: number;
    posName: string | null;
    posColor: string | null;
    empName: string;
    isMine: boolean;
  };

  const rows: Row[] = (shiftRows ?? []).map((s) => ({
    id: s.id,
    employee_id: s.employee_id,
    shift_date: s.shift_date,
    start: trimSeconds(s.start_time),
    end: trimSeconds(s.end_time),
    breakMin: s.break_minutes,
    posName: s.positions?.name ?? null,
    posColor: s.positions?.color ?? null,
    empName: s.employees
      ? `${s.employees.first_name} ${s.employees.last_name}`
      : "—",
    isMine: s.employee_id === ctx.employeeId,
  }));

  const myHours = rows
    .filter((r) => r.isMine)
    .reduce((sum, r) => sum + shiftHours(r.start, r.end, r.breakMin), 0);

  const byDay = new Map<string, Row[]>();
  for (const r of rows) {
    const arr = byDay.get(r.shift_date) ?? [];
    arr.push(r);
    byDay.set(r.shift_date, arr);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Mon planning</h1>
          <p className="text-sm text-muted-foreground">
            Bonjour {ctx.fullName.split(" ")[0]} · {myHours.toFixed(0)}h cette
            semaine
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/mon-espace?week=${shiftWeek(weekStart, -1)}`}>Précédente</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/mon-espace">Cette semaine</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/mon-espace?week=${shiftWeek(weekStart, 1)}`}>Suivante</a>
          </Button>
        </div>
      </div>

      <p className="text-sm font-medium capitalize">
        {formatWeekRange(weekStart)}
      </p>

      <div className="space-y-3">
        {days.map((d, i) => {
          const dayRows = (byDay.get(d) ?? []).sort((a, b) =>
            a.start.localeCompare(b.start),
          );
          const mine = dayRows.filter((r) => r.isMine);
          const others = dayRows.filter((r) => !r.isMine);
          return (
            <Card
              key={d}
              className={isToday(d) ? "border-primary/40" : undefined}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="capitalize">
                    {WEEKDAYS[i]} {fromISODate(d).getDate()}
                  </span>
                  {isToday(d) && (
                    <span className="text-xs font-normal text-primary">
                      Aujourd&apos;hui
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mine.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Repos</p>
                ) : (
                  mine.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white"
                      style={{ backgroundColor: r.posColor ?? "#059669" }}
                    >
                      <CalendarDays className="size-4" />
                      {r.start} – {r.end}
                      {r.posName && (
                        <span className="opacity-90">· {r.posName}</span>
                      )}
                    </div>
                  ))
                )}

                {others.length > 0 && (
                  <div className="pt-1">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Avec vous ce jour-là
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {others.map((r) => (
                        <span
                          key={r.id}
                          className="rounded-full border px-2 py-0.5 text-xs"
                          title={`${r.start} – ${r.end}`}
                        >
                          {r.empName} ({r.start}–{r.end})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
