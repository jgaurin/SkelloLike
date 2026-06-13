import { Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { getLocationContext } from "@/lib/auth/location-context";
import { AppHeader } from "@/components/layout/app-header";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { EmployeesTable } from "./employees-table";

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

export default async function EmployeesPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = MANAGER_ROLES.includes(ctx.role);
  const { currentId, currentName } = await getLocationContext();

  // Employés rattachés à l'établissement courant (principal ou prêté).
  const { data: siteRows } = await supabase
    .from("employee_locations")
    .select("employee_id")
    .eq("location_id", currentId);
  const siteIds = (siteRows ?? []).map((r) => r.employee_id);

  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, email, phone, employee_number, status, hire_date")
    .in("id", siteIds.length ? siteIds : ["00000000-0000-0000-0000-000000000000"])
    .order("last_name", { ascending: true });

  return (
    <>
      <AppHeader title="Employés" fullName={ctx.fullName} email={ctx.email} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {employees?.length ?? 0} employé{(employees?.length ?? 0) > 1 ? "s" : ""}
            </h2>
            <p className="text-sm text-muted-foreground">
              Fiches RH rattachées à {currentName}.
            </p>
          </div>
          <EmployeeFormDialog />
        </div>

        {employees?.length ? (
          <EmployeesTable employees={employees} canManage={canManage} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <h3 className="mt-4 font-medium">Aucun employé</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajoutez votre premier employé pour commencer.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
