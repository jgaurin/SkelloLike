import { createClient } from "@/lib/supabase/server";
import { getEmployeeContext } from "@/lib/auth/employee-context";
import {
  getMonday,
  weekDates,
  trimSeconds,
  shiftHours,
  toISODate,
} from "@/lib/week";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyShiftsView } from "./my-shifts-view";
import { TeamDayView, type TeamShift } from "./team-day-view";

export default async function MonEspacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; week?: string; day?: string }>;
}) {
  const ctx = await getEmployeeContext();
  const supabase = await createClient();
  const params = await searchParams;

  const tab = params.tab === "equipe" ? "equipe" : "mes-shifts";

  // ── Onglet "Mes shifts" : semaine ───────────────────────────────────────
  const weekStart = params.week ? getMonday(new Date(params.week)) : getMonday();
  const weekDays = weekDates(weekStart);

  // ── Onglet "Toute l'équipe" : jour ──────────────────────────────────────
  const day = params.day ?? toISODate(new Date());

  // Une seule requête couvrant la semaine ET le jour affiché (shifts publiés).
  const from = weekDays[0] < day ? weekDays[0] : day;
  const to = weekDays[6] > day ? weekDays[6] : day;

  const { data: shiftRows } = await supabase
    .from("shifts")
    .select(
      "id, employee_id, shift_date, start_time, end_time, break_minutes, positions(name, color), employees(first_name, last_name), schedules!inner(status)",
    )
    .gte("shift_date", from)
    .lte("shift_date", to)
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

  // Données "Mes shifts" (semaine, à moi).
  const myWeekShifts = rows
    .filter((r) => r.isMine && weekDays.includes(r.shift_date))
    .map((r) => ({
      id: r.id,
      date: r.shift_date,
      start: r.start,
      end: r.end,
      posName: r.posName,
      posColor: r.posColor,
      hours: shiftHours(r.start, r.end, r.breakMin),
    }));

  const myWeekHours = myWeekShifts.reduce((s, x) => s + x.hours, 0);

  // Données "Toute l'équipe" (jour donné).
  const teamDayShifts: TeamShift[] = rows
    .filter((r) => r.shift_date === day)
    .map((r) => ({
      id: r.id,
      start: r.start,
      end: r.end,
      empName: r.empName,
      posName: r.posName,
      posColor: r.posColor,
      isMine: r.isMine,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Bonjour {ctx.fullName.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Votre planning chez {ctx.orgName}.
        </p>
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mes-shifts" asChild>
            <a href="/mon-espace?tab=mes-shifts">Mes shifts</a>
          </TabsTrigger>
          <TabsTrigger value="equipe" asChild>
            <a href="/mon-espace?tab=equipe">Toute l&apos;équipe</a>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mes-shifts" className="mt-4">
          <MyShiftsView
            weekStart={weekStart}
            days={weekDays}
            shifts={myWeekShifts}
            totalHours={myWeekHours}
          />
        </TabsContent>

        <TabsContent value="equipe" className="mt-4">
          <TeamDayView day={day} shifts={teamDayShifts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
