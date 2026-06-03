"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { DEFAULT_COLOR } from "@/lib/colors";

export type ActionResult = { ok: boolean; error?: string };

const ADMIN_ROLES = ["org_owner", "org_admin", "location_manager"];

function canManage(role: string) {
  return ADMIN_ROLES.includes(role);
}

/**
 * Crée un poste / qualification dans l'organisation courante.
 */
export async function createPosition(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? DEFAULT_COLOR);
  const rateRaw = String(formData.get("default_rate") ?? "").trim();
  const defaultRate = rateRaw ? Number(rateRaw) : null;

  if (!name) {
    return { ok: false, error: "Le nom du poste est obligatoire." };
  }
  if (defaultRate !== null && Number.isNaN(defaultRate)) {
    return { ok: false, error: "Le taux horaire doit être un nombre." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("positions").insert({
    org_id: ctx.orgId,
    name,
    color,
    default_rate: defaultRate,
  });

  if (error) {
    return { ok: false, error: "Impossible de créer le poste." };
  }

  revalidatePath("/parametres/postes");
  return { ok: true };
}

export type QuickPositionResult =
  | { ok: true; position: { id: string; name: string; color: string } }
  | { ok: false; error: string };

/**
 * Crée un poste rapidement (depuis le dialog d'un shift) et renvoie l'objet créé
 * pour pouvoir le sélectionner immédiatement.
 */
export async function createPositionQuick(
  name: string,
  color: string,
): Promise<QuickPositionResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Le nom du poste est obligatoire." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("positions")
    .insert({ org_id: ctx.orgId, name: trimmed, color: color || DEFAULT_COLOR })
    .select("id, name, color")
    .single();

  if (error || !data) {
    return { ok: false, error: "Impossible de créer le poste." };
  }

  revalidatePath("/parametres/postes");
  revalidatePath("/planning");
  return { ok: true, position: data };
}

/**
 * Met à jour un poste existant.
 */
export async function updatePosition(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? DEFAULT_COLOR);
  const rateRaw = String(formData.get("default_rate") ?? "").trim();
  const defaultRate = rateRaw ? Number(rateRaw) : null;

  if (!id || !name) {
    return { ok: false, error: "Informations manquantes." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("positions")
    .update({ name, color, default_rate: defaultRate })
    .eq("id", id)
    .eq("org_id", ctx.orgId);

  if (error) {
    return { ok: false, error: "Impossible de mettre à jour le poste." };
  }

  revalidatePath("/parametres/postes");
  return { ok: true };
}

/**
 * Supprime un poste. Les shifts/contrats qui le référencent passent à NULL (FK).
 */
export async function deletePosition(id: string): Promise<ActionResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  if (!id) return { ok: false, error: "Poste introuvable." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("positions")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId);

  if (error) {
    return { ok: false, error: "Impossible de supprimer le poste." };
  }

  revalidatePath("/parametres/postes");
  return { ok: true };
}
