"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type AccrualResult = { ok: boolean; error?: string };

const ADMIN_ROLES = ["org_owner", "org_admin"];

/**
 * Met à jour les règles d'acquisition d'un type d'absence.
 */
export async function updateAccrualSettings(
  typeId: string,
  monthlyAccrual: number,
  annualCap: number,
  periodStartMonth: number,
): Promise<AccrualResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const month = Math.min(12, Math.max(1, Math.round(periodStartMonth) || 1));

  const supabase = await createClient();
  const { error } = await supabase
    .from("absence_types")
    .update({
      monthly_accrual: Math.max(0, monthlyAccrual),
      annual_cap: Math.max(0, annualCap),
      period_start_month: month,
    })
    .eq("id", typeId)
    .eq("org_id", ctx.orgId);

  if (error) {
    return { ok: false, error: "Enregistrement impossible." };
  }

  revalidatePath("/parametres/conges");
  revalidatePath("/absences/compteurs");
  return { ok: true };
}
