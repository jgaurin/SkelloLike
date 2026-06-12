import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { LocationsManager, type Location } from "./locations-manager";

const ADMIN_ROLES = ["org_owner", "org_admin", "location_manager"];

export default async function LocationsPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = ADMIN_ROLES.includes(ctx.role);

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, address, postal_code, city, sector, color")
    .order("created_at", { ascending: true });

  return (
    <>
      <AppHeader
        title="Établissements"
        fullName={ctx.fullName}
        email={ctx.email}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {locations?.length ?? 0} établissement
            {(locations?.length ?? 0) > 1 ? "s" : ""}
          </h2>
          <p className="text-sm text-muted-foreground">
            Les sites de {ctx.orgName}. Chacun a son propre planning.
          </p>
        </div>

        <LocationsManager
          locations={(locations ?? []) as Location[]}
          canManage={canManage}
        />
      </main>
    </>
  );
}
