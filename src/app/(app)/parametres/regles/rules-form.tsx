"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";

import { updateOrgRules, type RulesResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type OrgRules = {
  collective_agreement: string | null;
  payroll_charge_rate: number;
  reference_days_per_week: number;
  meal_allowance_enabled: boolean;
  meal_allowance_amount: number;
};

const initialState: RulesResult = { ok: false };

export function RulesForm({
  rules,
  canManage,
}: {
  rules: OrgRules;
  canManage: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateOrgRules,
    initialState,
  );
  const [mealEnabled, setMealEnabled] = useState(rules.meal_allowance_enabled);

  useEffect(() => {
    if (state.ok) toast.success("Règles enregistrées.");
  }, [state.ok]);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convention & paie</CardTitle>
          <CardDescription>
            Paramètres généraux utilisés pour la planification et la paie.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collective_agreement">Convention collective</Label>
            <Input
              id="collective_agreement"
              name="collective_agreement"
              defaultValue={rules.collective_agreement ?? ""}
              placeholder="Ex : IDCC 1979 - HCR"
              disabled={!canManage}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payroll_charge_rate">
                Taux de charges patronales (%)
              </Label>
              <Input
                id="payroll_charge_rate"
                name="payroll_charge_rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                defaultValue={rules.payroll_charge_rate}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference_days_per_week">
                Jours travaillés de référence / semaine
              </Label>
              <Input
                id="reference_days_per_week"
                name="reference_days_per_week"
                type="number"
                min="1"
                max="7"
                defaultValue={rules.reference_days_per_week}
                disabled={!canManage}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Indemnités repas</CardTitle>
          <CardDescription>
            Indemnisez les repas de vos employés, calculés depuis les plannings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="meal_allowance_enabled">
              Indemniser les repas
            </Label>
            <Switch
              id="meal_allowance_enabled"
              name="meal_allowance_enabled"
              checked={mealEnabled}
              onCheckedChange={setMealEnabled}
              disabled={!canManage}
            />
          </div>
          {mealEnabled && (
            <div className="space-y-2">
              <Label htmlFor="meal_allowance_amount">
                Montant par repas (€)
              </Label>
              <Input
                id="meal_allowance_amount"
                name="meal_allowance_amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={rules.meal_allowance_amount}
                disabled={!canManage}
                className="max-w-40"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      )}
    </form>
  );
}
