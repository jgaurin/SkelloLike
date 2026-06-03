"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type BalanceResult = { ok: boolean; error?: string };

const ADMIN_ROLES = ["org_owner", "org_admin", "location_manager"];

/**
 * Ajuste manuellement le solde acquis (ou l'ajustement) d'un employé pour un
 * type d'absence et une année. Crée la ligne si elle n'existe pas (upsert).
 */
export async function upsertLeaveBalance(
  employeeId: string,
  typeId: string,
  year: number,
  acquired: number,
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
      acquired: Math.max(0, acquired),
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
