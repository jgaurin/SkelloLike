"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type PositionAssignResult = { ok: boolean; error?: string };

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

/**
 * Définit la liste des postes qu'un employé peut occuper (remplace l'existant).
 */
export async function setEmployeePositions(
  employeeId: string,
  positionIds: string[],
): Promise<PositionAssignResult> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();

  // Vérifier que l'employé appartient à l'org (défense en profondeur).
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();
  if (!emp) {
    return { ok: false, error: "Employé introuvable." };
  }

  // Remplace l'ensemble : on supprime tout puis on réinsère.
  const { error: delError } = await supabase
    .from("employee_positions")
    .delete()
    .eq("employee_id", employeeId);
  if (delError) {
    return { ok: false, error: "Erreur lors de la mise à jour." };
  }

  if (positionIds.length > 0) {
    const { error: insError } = await supabase
      .from("employee_positions")
      .insert(
        positionIds.map((position_id) => ({
          employee_id: employeeId,
          position_id,
        })),
      );
    if (insError) {
      return { ok: false, error: "Erreur lors de l'assignation des postes." };
    }
  }

  revalidatePath(`/employes/${employeeId}`);
  return { ok: true };
}
