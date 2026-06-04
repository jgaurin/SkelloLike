import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { AlertsSettings } from "./alerts-settings";
import { Button } from "@/components/ui/button";

const ADMIN_ROLES = ["org_owner", "org_admin"];

export default async function AlertsSettingsPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = ADMIN_ROLES.includes(ctx.role);

  const { data: rows } = await supabase
    .from("alert_settings")
    .select("alert_code, enabled, blocking");

  const settings: Record<string, { enabled: boolean; blocking: boolean }> = {};
  for (const r of rows ?? []) {
    settings[r.alert_code] = { enabled: r.enabled, blocking: r.blocking };
  }

  return (
    <>
      <AppHeader title="Alertes" fullName={ctx.fullName} email={ctx.email} />
      <main className="flex-1 space-y-6 p-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/parametres">
            <ArrowLeft className="size-4" />
            Retour aux paramètres
          </Link>
        </Button>

        <div>
          <h2 className="text-xl font-semibold tracking-tight">Alertes</h2>
          <p className="text-sm text-muted-foreground">
            Définissez les alertes qui s&apos;affichent sur le planning pour vous
            guider. Une alerte « bloquante » empêchera la publication tant
            qu&apos;elle n&apos;est pas résolue.
          </p>
        </div>

        <AlertsSettings settings={settings} canManage={canManage} />
      </main>
    </>
  );
}
