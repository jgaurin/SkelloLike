"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type RulesResult = { ok: boolean; error?: string };

const ADMIN_ROLES = ["org_owner", "org_admin"];

/**
 * Met à jour les règles & compteurs de l'organisation.
 */
export async function updateOrgRules(
  _prev: RulesResult,
  formData: FormData,
): Promise<RulesResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const agreement =
    String(formData.get("collective_agreement") ?? "").trim() || null;
  const chargeRate = Number(formData.get("payroll_charge_rate") ?? 43) || 0;
  const refDays = Number(formData.get("reference_days_per_week") ?? 5) || 5;
  const mealEnabled = formData.get("meal_allowance_enabled") === "on";
  const mealAmount = Number(formData.get("meal_allowance_amount") ?? 0) || 0;

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      collective_agreement: agreement,
      payroll_charge_rate: Math.max(0, Math.min(100, chargeRate)),
      reference_days_per_week: Math.max(1, Math.min(7, refDays)),
      meal_allowance_enabled: mealEnabled,
      meal_allowance_amount: Math.max(0, mealAmount),
    })
    .eq("id", ctx.orgId);

  if (error) {
    return { ok: false, error: "Enregistrement impossible." };
  }

  revalidatePath("/parametres/regles");
  return { ok: true };
}
