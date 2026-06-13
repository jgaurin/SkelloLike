"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type EmployeeLocationsResult = { ok: boolean; error?: string };

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

/**
 * Définit les établissements d'un employé : un principal + des secondaires.
 * Remplace l'ensemble des rattachements.
 */
export async function setEmployeeLocations(
  employeeId: string,
  primaryId: string,
  otherIds: string[],
): Promise<EmployeeLocationsResult> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  if (!primaryId) {
    return { ok: false, error: "Un établissement principal est requis." };
  }

  const supabase = await createClient();

  // L'employé doit appartenir à l'org.
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();
  if (!emp) return { ok: false, error: "Employé introuvable." };

  // Les établissements doivent appartenir à l'org.
  const all = Array.from(new Set([primaryId, ...otherIds]));
  const { data: validLocs } = await supabase
    .from("locations")
    .select("id")
    .eq("org_id", ctx.orgId)
    .in("id", all);
  const validIds = new Set((validLocs ?? []).map((l) => l.id));
  if (!validIds.has(primaryId)) {
    return { ok: false, error: "Établissement principal invalide." };
  }

  // Remplace tous les rattachements.
  await supabase
    .from("employee_locations")
    .delete()
    .eq("employee_id", employeeId);

  const rows = all
    .filter((id) => validIds.has(id))
    .map((location_id) => ({
      employee_id: employeeId,
      location_id,
      is_primary: location_id === primaryId,
    }));

  const { error } = await supabase.from("employee_locations").insert(rows);
  if (error) return { ok: false, error: "Enregistrement impossible." };

  revalidatePath(`/employes/${employeeId}`);
  revalidatePath("/planning");
  revalidatePath("/employes");
  return { ok: true };
}
