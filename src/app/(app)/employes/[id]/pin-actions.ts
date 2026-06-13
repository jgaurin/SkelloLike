"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type PinResult =
  | { ok: true; pin: string }
  | { ok: false; error: string };

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

/**
 * Définit (ou génère) le code PIN de pointage d'un employé.
 * Le PIN doit être unique parmi les employés de l'organisation.
 * @param pin code à 4 chiffres, ou vide pour en générer un aléatoire.
 */
export async function setEmployeePin(
  employeeId: string,
  pin: string,
): Promise<PinResult> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();

  // PINs déjà utilisés dans l'org (hors employé courant).
  const { data: used } = await supabase
    .from("employees")
    .select("pin_code")
    .eq("org_id", ctx.orgId)
    .neq("id", employeeId)
    .not("pin_code", "is", null);
  const taken = new Set((used ?? []).map((u) => u.pin_code));

  let code = pin.trim();
  if (code) {
    if (!/^\d{4}$/.test(code)) {
      return { ok: false, error: "Le code doit faire 4 chiffres." };
    }
    if (taken.has(code)) {
      return { ok: false, error: "Ce code est déjà utilisé." };
    }
  } else {
    // Génère un PIN libre.
    let tries = 0;
    do {
      code = String(Math.floor(1000 + Math.random() * 9000));
      tries++;
    } while (taken.has(code) && tries < 50);
  }

  const { error } = await supabase
    .from("employees")
    .update({ pin_code: code })
    .eq("id", employeeId)
    .eq("org_id", ctx.orgId);

  if (error) return { ok: false, error: "Enregistrement impossible." };

  revalidatePath(`/employes/${employeeId}`);
  return { ok: true, pin: code };
}
