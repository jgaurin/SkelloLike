import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { getLocationContext } from "@/lib/auth/location-context";
import { AppHeader } from "@/components/layout/app-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export default async function DocumentsPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const { currentId, currentName } = await getLocationContext();

  // Employés du site courant.
  const { data: siteRows } = await supabase
    .from("employee_locations")
    .select("employee_id")
    .eq("location_id", currentId);
  const siteIds = (siteRows ?? []).map((r) => r.employee_id);

  const [{ data: employees }, { data: docs }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .in(
        "id",
        siteIds.length ? siteIds : ["00000000-0000-0000-0000-000000000000"],
      )
      .order("last_name"),
    supabase.from("documents").select("employee_id"),
  ]);

  // Nombre de documents par employé.
  const countByEmp = new Map<string, number>();
  for (const d of docs ?? []) {
    countByEmp.set(d.employee_id, (countByEmp.get(d.employee_id) ?? 0) + 1);
  }

  return (
    <>
      <AppHeader title="Documents" fullName={ctx.fullName} email={ctx.email} />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Documents RH</h2>
          <p className="text-sm text-muted-foreground">
            Documents des employés de {currentName}. Ouvrez une fiche pour
            téléverser ou consulter.
          </p>
        </div>

        {employees?.length ? (
          <div className="rounded-lg border">
            {employees.map((e) => {
              const count = countByEmp.get(e.id) ?? 0;
              return (
                <Link
                  key={e.id}
                  href={`/employes/${e.id}`}
                  className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-accent/40"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials(e.first_name, e.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 font-medium">
                    {e.first_name} {e.last_name}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <FileText className="size-4" />
                    {count} document{count > 1 ? "s" : ""}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun employé sur cet établissement.
          </p>
        )}
      </main>
    </>
  );
}
