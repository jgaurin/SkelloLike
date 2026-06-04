"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type AbsenceTypeResult = { ok: boolean; error?: string };

const ADMIN_ROLES = ["org_owner", "org_admin"];

type ToggleField = "is_active" | "affects_counter" | "can_be_requested";

/**
 * Bascule un paramètre booléen d'un type d'absence.
 */
export async function toggleAbsenceType(
  typeId: string,
  field: ToggleField,
  value: boolean,
): Promise<AbsenceTypeResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const patch: {
    is_active?: boolean;
    affects_counter?: boolean;
    can_be_requested?: boolean;
  } = {};
  patch[field] = value;

  const supabase = await createClient();
  const { error } = await supabase
    .from("absence_types")
    .update(patch)
    .eq("id", typeId)
    .eq("org_id", ctx.orgId);

  if (error) {
    return { ok: false, error: "Mise à jour impossible." };
  }

  revalidatePath("/parametres/absences");
  revalidatePath("/absences");
  return { ok: true };
}

/**
 * Crée un type d'absence personnalisé.
 */
export async function createAbsenceType(
  name: string,
  color: string,
  paidBy: string,
): Promise<AbsenceTypeResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  if (!name.trim()) return { ok: false, error: "Le nom est obligatoire." };

  const supabase = await createClient();
  const { error } = await supabase.from("absence_types").insert({
    org_id: ctx.orgId,
    name: name.trim(),
    color,
    paid_by: paidBy,
    is_active: true,
    sort_order: 999,
  });

  if (error) {
    return { ok: false, error: "Création impossible." };
  }

  revalidatePath("/parametres/absences");
  return { ok: true };
}

/**
 * Supprime un type d'absence (seulement s'il n'est lié à aucune demande).
 */
export async function deleteAbsenceType(
  typeId: string,
): Promise<AbsenceTypeResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("absence_requests")
    .select("id", { count: "exact", head: true })
    .eq("type_id", typeId);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "Type utilisé par des absences : désactivez-le plutôt.",
    };
  }

  const { error } = await supabase
    .from("absence_types")
    .delete()
    .eq("id", typeId)
    .eq("org_id", ctx.orgId);

  if (error) return { ok: false, error: "Suppression impossible." };

  revalidatePath("/parametres/absences");
  return { ok: true };
}
