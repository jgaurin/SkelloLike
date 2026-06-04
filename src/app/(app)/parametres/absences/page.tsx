import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { AbsencesSettings, type AbsenceTypeRow } from "./absences-settings";
import { Button } from "@/components/ui/button";

const ADMIN_ROLES = ["org_owner", "org_admin"];

export default async function AbsenceSettingsPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = ADMIN_ROLES.includes(ctx.role);

  const { data: types } = await supabase
    .from("absence_types")
    .select(
      "id, name, color, is_active, affects_counter, can_be_requested, paid_by",
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <>
      <AppHeader title="Absences" fullName={ctx.fullName} email={ctx.email} />
      <main className="flex-1 space-y-6 p-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/parametres">
            <ArrowLeft className="size-4" />
            Retour aux paramètres
          </Link>
        </Button>

        <div>
          <h2 className="text-xl font-semibold tracking-tight">Absences</h2>
          <p className="text-sm text-muted-foreground">
            Activez ou désactivez les absences utilisées pour la gestion de
            votre paie. Les absences désactivées n&apos;apparaîtront pas lors de
            la création d&apos;une absence.
          </p>
        </div>

        <AbsencesSettings
          types={(types ?? []) as AbsenceTypeRow[]}
          canManage={canManage}
        />
      </main>
    </>
  );
}
