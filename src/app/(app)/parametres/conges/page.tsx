import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { AccrualEditor, type AccrualType } from "./accrual-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ADMIN_ROLES = ["org_owner", "org_admin"];

export default async function CongesSettingsPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = ADMIN_ROLES.includes(ctx.role);

  const { data: types } = await supabase
    .from("absence_types")
    .select(
      "id, name, color, monthly_accrual, annual_cap, period_start_month, affects_counter",
    )
    .eq("affects_counter", true)
    .order("name");

  return (
    <>
      <AppHeader
        title="Acquisition des congés"
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
            Acquisition des congés
          </h2>
          <p className="text-sm text-muted-foreground">
            Définissez combien de jours chaque type de congé acquiert par mois
            travaillé. Le compteur de chaque employé se calcule automatiquement
            depuis sa date d&apos;entrée.
          </p>
        </div>

        <div className="space-y-4">
          {types?.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AccrualEditor
                  type={t as AccrualType}
                  canManage={canManage}
                />
              </CardContent>
            </Card>
          ))}
          {(types?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun type de congé avec décompte de solde.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
