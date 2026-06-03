import { CalendarOff } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { ExportPanel } from "./export-panel";

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

export default async function RapportsPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = MANAGER_ROLES.includes(ctx.role);

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .order("created_at", { ascending: true });

  return (
    <>
      <AppHeader title="Rapports" fullName={ctx.fullName} email={ctx.email} />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Rapports &amp; exports
          </h2>
          <p className="text-sm text-muted-foreground">
            Exportez les données du planning pour la paie.
          </p>
        </div>

        {!canManage ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <CalendarOff className="size-10 text-muted-foreground/40" />
            <h3 className="mt-4 font-medium">Accès réservé</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Les exports sont réservés aux managers.
            </p>
          </div>
        ) : (
          <ExportPanel locations={locations ?? []} />
        )}
      </main>
    </>
  );
}
