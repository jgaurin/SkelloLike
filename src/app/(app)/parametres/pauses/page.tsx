import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { parseBreakRules } from "@/lib/breaks";
import { BreakRulesEditor } from "./break-rules-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ADMIN_ROLES = ["org_owner", "org_admin", "location_manager"];

export default async function BreakRulesPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = ADMIN_ROLES.includes(ctx.role);

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, break_rules")
    .order("created_at", { ascending: true });

  return (
    <>
      <AppHeader
        title="Pauses automatiques"
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
            Pauses automatiques
          </h2>
          <p className="text-sm text-muted-foreground">
            Définissez le pré-remplissage des pauses par établissement.
          </p>
        </div>

        <div className="space-y-4">
          {locations?.map((loc) => (
            <Card key={loc.id}>
              <CardHeader>
                <CardTitle className="text-base">{loc.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <BreakRulesEditor
                  locationId={loc.id}
                  locationName={loc.name}
                  initialRules={parseBreakRules(loc.break_rules)}
                  canManage={canManage}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
