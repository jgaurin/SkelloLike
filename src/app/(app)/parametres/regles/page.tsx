import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { RulesForm, type OrgRules } from "./rules-form";
import { Button } from "@/components/ui/button";

const ADMIN_ROLES = ["org_owner", "org_admin"];

export default async function RulesSettingsPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = ADMIN_ROLES.includes(ctx.role);

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "collective_agreement, payroll_charge_rate, reference_days_per_week, meal_allowance_enabled, meal_allowance_amount",
    )
    .eq("id", ctx.orgId)
    .single();

  const rules: OrgRules = {
    collective_agreement: org?.collective_agreement ?? null,
    payroll_charge_rate: Number(org?.payroll_charge_rate ?? 43),
    reference_days_per_week: org?.reference_days_per_week ?? 5,
    meal_allowance_enabled: org?.meal_allowance_enabled ?? false,
    meal_allowance_amount: Number(org?.meal_allowance_amount ?? 0),
  };

  return (
    <>
      <AppHeader
        title="Règles et compteurs"
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
            Règles et compteurs
          </h2>
          <p className="text-sm text-muted-foreground">
            Configurez votre espace pour qu&apos;il corresponde au
            fonctionnement de votre établissement.
          </p>
        </div>

        <RulesForm rules={rules} canManage={canManage} />
      </main>
    </>
  );
}
