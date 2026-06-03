"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import type { BreakRule } from "@/lib/breaks";

export type BreakRulesResult = { ok: boolean; error?: string };

const ADMIN_ROLES = ["org_owner", "org_admin", "location_manager"];

/**
 * Met à jour les règles de pause automatique d'un établissement.
 * Les règles sont nettoyées et triées avant l'enregistrement.
 */
export async function updateBreakRules(
  locationId: string,
  rules: BreakRule[],
): Promise<BreakRulesResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  // Nettoyage : valeurs positives, dédoublonnées par seuil, triées.
  const cleaned = rules
    .map((r) => ({
      min_hours: Math.max(0, Number(r.min_hours) || 0),
      break_minutes: Math.max(0, Number(r.break_minutes) || 0),
    }))
    .filter((r) => r.min_hours > 0)
    .sort((a, b) => a.min_hours - b.min_hours);

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update({ break_rules: cleaned })
    .eq("id", locationId)
    .eq("org_id", ctx.orgId);

  if (error) {
    return { ok: false, error: "Impossible d'enregistrer les règles." };
  }

  revalidatePath("/parametres/pauses");
  revalidatePath("/planning");
  return { ok: true };
}
