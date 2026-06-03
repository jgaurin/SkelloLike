import { CalendarDays } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import {
  getMonday,
  getMonthStart,
  weekDates,
  viewRange,
  isPlanningView,
  trimSeconds,
  toISODate,
  fromISODate,
  type PlanningView,
} from "@/lib/week";
import { PlanningBoard } from "./planning-board";

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; date?: string; view?: string }>;
}) {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = MANAGER_ROLES.includes(ctx.role);
  const params = await searchParams;

  const view: PlanningView = isPlanningView(params.view) ? params.view : "week";

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .order("created_at", { ascending: true });

  if (!locations?.length) {
    return (
      <>
        <AppHeader title="Planning" fullName={ctx.fullName} email={ctx.email} />
        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <CalendarDays className="size-10 text-muted-foreground/40" />
          <h3 className="mt-4 font-medium">Aucun établissement</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez un établissement avant de planifier.
          </p>
        </main>
      </>
    );
  }

  const locationId =
    locations.find((l) => l.id === params.site)?.id ?? locations[0].id;

  // Ancre normalisée selon la vue.
  const baseDate = params.date ? fromISODate(params.date) : new Date();
  const anchor =
    view === "day"
      ? params.date ?? toISODate(new Date())
      : view === "month"
        ? getMonthStart(baseDate)
        : getMonday(baseDate);

  const range = viewRange(view, anchor);

  // Employés actifs + postes + shifts sur la plage de la vue.
  const [{ data: employees }, { data: positions }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .order("last_name"),
    supabase.from("positions").select("id, name, color").order("name"),
  ]);

  // Les shifts sont chargés par plage de dates (indépendamment du schedule),
  // pour couvrir un mois qui chevauche plusieurs semaines.
  const { data: shiftRows } = await supabase
    .from("shifts")
    .select(
      "id, employee_id, position_id, shift_date, start_time, end_time, break_minutes, note_manager, status, schedules!inner(location_id)",
    )
    .gte("shift_date", range.from)
    .lte("shift_date", range.to)
    .eq("schedules.location_id", locationId);

  const shifts = (shiftRows ?? []).map((s) => ({
    id: s.id,
    employee_id: s.employee_id,
    position_id: s.position_id,
    shift_date: s.shift_date,
    start_time: trimSeconds(s.start_time),
    end_time: trimSeconds(s.end_time),
    break_minutes: s.break_minutes,
    note_manager: s.note_manager,
    status: s.status,
  }));

  // Statut de publication : basé sur le schedule de la semaine de l'ancre.
  const weekStart = view === "week" ? anchor : getMonday(baseDate);
  const { data: schedule } = await supabase
    .from("schedules")
    .select("status")
    .eq("location_id", locationId)
    .eq("week_start", weekStart)
    .maybeSingle();

  return (
    <>
      <AppHeader title="Planning" fullName={ctx.fullName} email={ctx.email} />
      <PlanningBoard
        view={view}
        locations={locations}
        locationId={locationId}
        anchor={anchor}
        weekStart={weekStart}
        rangeLabel={range.label}
        days={weekDates(weekStart)}
        employees={employees ?? []}
        positions={positions ?? []}
        shifts={shifts}
        published={schedule?.status === "published"}
        canManage={canManage}
      />
    </>
  );
}
