import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { PositionsManager } from "./positions-manager";
import { Button } from "@/components/ui/button";

const ADMIN_ROLES = ["org_owner", "org_admin", "location_manager"];

export default async function PositionsPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = ADMIN_ROLES.includes(ctx.role);

  const { data: positions } = await supabase
    .from("positions")
    .select("id, name, color, default_rate")
    .order("name", { ascending: true });

  return (
    <>
      <AppHeader
        title="Postes & qualifications"
        fullName={ctx.fullName}
        email={ctx.email}
      />
      <main className="flex-1 space-y-6 p-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/parametres">
            <ArrowLeft className="size-4" />
            Retour aux paramètres
          </Link>
        </Button>

        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Postes & qualifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Les postes (Serveur, Cuisinier…) servent à organiser le planning et
            calculer la paie. Chaque poste a sa couleur.
          </p>
        </div>

        <PositionsManager
          positions={positions ?? []}
          canManage={canManage}
        />
      </main>
    </>
  );
}
