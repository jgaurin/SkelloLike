import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { AbsenceFormDialog } from "./absence-form-dialog";
import { AbsencesTable, type AbsenceRow } from "./absences-table";

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

export default async function AbsencesPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = MANAGER_ROLES.includes(ctx.role);

  const [{ data: requests }, { data: employees }, { data: types }] =
    await Promise.all([
      supabase
        .from("absence_requests")
        .select(
          "id, start_date, end_date, status, comment, employees(first_name, last_name), absence_types(name, color)",
        )
        .order("start_date", { ascending: false }),
      supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("status", "active")
        .order("last_name"),
      supabase.from("absence_types").select("id, name").order("name"),
    ]);

  const rows: AbsenceRow[] = (requests ?? []).map((r) => ({
    id: r.id,
    start_date: r.start_date,
    end_date: r.end_date,
    status: r.status,
    comment: r.comment,
    employee: r.employees
      ? `${r.employees.first_name} ${r.employees.last_name}`
      : "—",
    type: r.absence_types?.name ?? "—",
    typeColor: r.absence_types?.color ?? "#94A3B8",
  }));

  return (
    <>
      <AppHeader title="Absences" fullName={ctx.fullName} email={ctx.email} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {rows.length} absence{rows.length > 1 ? "s" : ""}
            </h2>
            <p className="text-sm text-muted-foreground">
              Congés et absences de {ctx.orgName}.
            </p>
          </div>
          {canManage && (
            <AbsenceFormDialog
              employees={employees ?? []}
              types={types ?? []}
            />
          )}
        </div>

        <AbsencesTable absences={rows} canManage={canManage} />
      </main>
    </>
  );
}
