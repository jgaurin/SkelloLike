import { Building2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LocationsPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, city, address, sector, color")
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
            Les sites de {ctx.orgName}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations?.map((loc) => (
            <Card key={loc.id}>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div
                  className="flex size-9 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${loc.color}1a`, color: loc.color }}
                >
                  <Building2 className="size-5" />
                </div>
                <CardTitle className="text-base">{loc.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {loc.address && <div>{loc.address}</div>}
                <div>{loc.city ?? "Ville non renseignée"}</div>
                {loc.sector && (
                  <div className="mt-1 text-xs">{loc.sector}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
