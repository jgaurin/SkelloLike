"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { DEFAULT_COLOR } from "@/lib/colors";

export type LocationResult = { ok: boolean; error?: string };

const ADMIN_ROLES = ["org_owner", "org_admin", "location_manager"];

function parse(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim() || null,
    postalCode: String(formData.get("postal_code") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    sector: String(formData.get("sector") ?? "").trim() || null,
    color: String(formData.get("color") ?? DEFAULT_COLOR),
  };
}

/**
 * Crée un nouvel établissement dans l'organisation courante.
 */
export async function createLocation(
  _prev: LocationResult,
  formData: FormData,
): Promise<LocationResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const d = parse(formData);
  if (!d.name) return { ok: false, error: "Le nom est obligatoire." };

  const supabase = await createClient();
  const { error } = await supabase.from("locations").insert({
    org_id: ctx.orgId,
    name: d.name,
    address: d.address,
    postal_code: d.postalCode,
    city: d.city,
    sector: d.sector,
    color: d.color,
  });

  if (error) return { ok: false, error: "Création impossible." };

  revalidatePath("/etablissements");
  revalidatePath("/planning");
  return { ok: true };
}

/**
 * Met à jour un établissement.
 */
export async function updateLocation(
  _prev: LocationResult,
  formData: FormData,
): Promise<LocationResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const id = String(formData.get("id") ?? "");
  const d = parse(formData);
  if (!id || !d.name) return { ok: false, error: "Informations manquantes." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update({
      name: d.name,
      address: d.address,
      postal_code: d.postalCode,
      city: d.city,
      sector: d.sector,
      color: d.color,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId);

  if (error) return { ok: false, error: "Mise à jour impossible." };

  revalidatePath("/etablissements");
  revalidatePath("/planning");
  return { ok: true };
}

/**
 * Supprime un établissement. Refusé s'il en reste un seul (il faut au moins
 * un établissement) ou s'il contient des plannings.
 */
export async function deleteLocation(id: string): Promise<LocationResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();

  const { count: total } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.orgId);
  if ((total ?? 0) <= 1) {
    return {
      ok: false,
      error: "Vous devez garder au moins un établissement.",
    };
  }

  const { count: schedules } = await supabase
    .from("schedules")
    .select("id", { count: "exact", head: true })
    .eq("location_id", id);
  if ((schedules ?? 0) > 0) {
    return {
      ok: false,
      error: "Cet établissement a des plannings. Supprimez-les d'abord.",
    };
  }

  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId);

  if (error) return { ok: false, error: "Suppression impossible." };

  revalidatePath("/etablissements");
  revalidatePath("/planning");
  return { ok: true };
}
