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
import { parseBreakRules } from "@/lib/breaks";
import { holidaysInRange } from "@/lib/holidays";

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
    .select("id, name, break_rules")
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

  const selectedLocation =
    locations.find((l) => l.id === params.site) ?? locations[0];
  const locationId = selectedLocation.id;
  const breakRules = parseBreakRules(selectedLocation.break_rules);

  // Ancre normalisée selon la vue.
  const baseDate = params.date ? fromISODate(params.date) : new Date();
  const anchor =
    view === "day"
      ? params.date ?? toISODate(new Date())
      : view === "month"
        ? getMonthStart(baseDate)
        : getMonday(baseDate);

  const range = viewRange(view, anchor);

  // Jours fériés français tombant dans la plage affichée.
  const holidays = Array.from(holidaysInRange(range.from, range.to).entries());

  // Employés actifs + postes + contrats + postes occupables.
  const [
    { data: employees },
    { data: positions },
    { data: contracts },
    { data: empPositions },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .order("last_name"),
    supabase.from("positions").select("id, name, color").order("name"),
    supabase
      .from("contracts")
      .select("employee_id, weekly_hours, start_date")
      .order("start_date", { ascending: false }),
    supabase.from("employee_positions").select("employee_id, position_id"),
  ]);

  // Heures contractuelles : on garde le contrat le plus récent par employé.
  const contractHours = new Map<string, number>();
  for (const c of contracts ?? []) {
    if (!contractHours.has(c.employee_id)) {
      contractHours.set(c.employee_id, Number(c.weekly_hours));
    }
  }

  // Postes occupables par employé.
  const employeePositions = new Map<string, Set<string>>();
  for (const ep of empPositions ?? []) {
    const set = employeePositions.get(ep.employee_id) ?? new Set<string>();
    set.add(ep.position_id);
    employeePositions.set(ep.employee_id, set);
  }

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

  // Absences validées qui chevauchent la plage affichée.
  const { data: absenceRows } = await supabase
    .from("absence_requests")
    .select("employee_id, start_date, end_date, absence_types(name, color)")
    .eq("status", "approved")
    .lte("start_date", range.to)
    .gte("end_date", range.from);

  // Étend chaque absence en une entrée par jour (employé|date) pour le board.
  const absences: {
    employee_id: string;
    date: string;
    name: string;
    color: string;
  }[] = [];
  for (const a of absenceRows ?? []) {
    if (!a.employee_id) continue;
    const start = new Date(a.start_date + "T12:00:00").getTime();
    const end = new Date(a.end_date + "T12:00:00").getTime();
    for (let t = start; t <= end; t += 86400000) {
      const d = new Date(t);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (iso < range.from || iso > range.to) continue;
      absences.push({
        employee_id: a.employee_id,
        date: iso,
        name: a.absence_types?.name ?? "Absence",
        color: a.absence_types?.color ?? "#94A3B8",
      });
    }
  }

  // Statut de publication : basé sur le schedule de la semaine de l'ancre.
  const weekStart = view === "week" ? anchor : getMonday(baseDate);
  const [{ data: schedule }, { data: templates }] = await Promise.all([
    supabase
      .from("schedules")
      .select("status")
      .eq("location_id", locationId)
      .eq("week_start", weekStart)
      .maybeSingle(),
    supabase
      .from("schedule_templates")
      .select("id, name")
      .eq("location_id", locationId)
      .order("created_at", { ascending: false }),
  ]);

  // Réglages des alertes de l'organisation (activées / bloquantes).
  const { data: alertRows } = await supabase
    .from("alert_settings")
    .select("alert_code, enabled, blocking");
  const alertSettings: Record<string, { enabled: boolean; blocking: boolean }> =
    {};
  for (const a of alertRows ?? []) {
    alertSettings[a.alert_code] = { enabled: a.enabled, blocking: a.blocking };
  }

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
        absences={absences}
        contractHours={Array.from(contractHours.entries())}
        employeePositions={Array.from(employeePositions.entries()).map(
          ([id, set]) => [id, Array.from(set)] as [string, string[]],
        )}
        breakRules={breakRules}
        templates={templates ?? []}
        holidays={holidays}
        alertSettings={alertSettings}
        published={schedule?.status === "published"}
        canManage={canManage}
      />
    </>
  );
}
