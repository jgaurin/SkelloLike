"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type BalanceResult = { ok: boolean; error?: string };

const ADMIN_ROLES = ["org_owner", "org_admin", "location_manager"];

/**
 * Met à jour l'ajustement manuel (correction) du solde d'un employé pour un
 * type d'absence et une année. L'acquis est calculé automatiquement ailleurs.
 * Crée la ligne si elle n'existe pas (upsert).
 */
export async function upsertLeaveBalance(
  employeeId: string,
  typeId: string,
  year: number,
  adjusted: number,
): Promise<BalanceResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();

  // Défense en profondeur : l'employé appartient bien à l'org.
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();
  if (!emp) {
    return { ok: false, error: "Employé introuvable." };
  }

  const { error } = await supabase.from("leave_balances").upsert(
    {
      employee_id: employeeId,
      type_id: typeId,
      year,
      adjusted,
    },
    { onConflict: "employee_id,type_id,year" },
  );

  if (error) {
    return { ok: false, error: "Enregistrement impossible." };
  }

  revalidatePath("/absences/compteurs");
  return { ok: true };
}
