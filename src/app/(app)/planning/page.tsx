import { CalendarDays } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { getMonday, weekDates, trimSeconds } from "@/lib/week";
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
  searchParams: Promise<{ site?: string; week?: string }>;
}) {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = MANAGER_ROLES.includes(ctx.role);
  const params = await searchParams;

  // Établissements de l'org (pour le sélecteur).
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
  const weekStart = params.week ? getMonday(new Date(params.week)) : getMonday();
  const days = weekDates(weekStart);

  // Employés actifs + postes + shifts de la semaine, en parallèle.
  const [{ data: employees }, { data: positions }, { data: schedule }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("status", "active")
        .order("last_name"),
      supabase.from("positions").select("id, name, color").order("name"),
      supabase
        .from("schedules")
        .select("id, status")
        .eq("location_id", locationId)
        .eq("week_start", weekStart)
        .maybeSingle(),
    ]);

  let shifts: Array<{
    id: string;
    employee_id: string | null;
    position_id: string | null;
    shift_date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    note_manager: string | null;
    status: string;
  }> = [];

  if (schedule) {
    const { data } = await supabase
      .from("shifts")
      .select(
        "id, employee_id, position_id, shift_date, start_time, end_time, break_minutes, note_manager, status",
      )
      .eq("schedule_id", schedule.id);
    shifts = (data ?? []).map((s) => ({
      ...s,
      start_time: trimSeconds(s.start_time),
      end_time: trimSeconds(s.end_time),
    }));
  }

  return (
    <>
      <AppHeader title="Planning" fullName={ctx.fullName} email={ctx.email} />
      <PlanningBoard
        locations={locations}
        locationId={locationId}
        weekStart={weekStart}
        days={days}
        employees={employees ?? []}
        positions={positions ?? []}
        shifts={shifts}
        published={schedule?.status === "published"}
        canManage={canManage}
      />
    </>
  );
}
