"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { DEFAULT_COLOR } from "@/lib/colors";

export type TeamResult = { ok: boolean; error?: string };

const ADMIN_ROLES = ["org_owner", "org_admin", "location_manager"];

type DB = Awaited<ReturnType<typeof createClient>>;

/** Vérifie que l'établissement appartient à l'org courante. */
async function assertLocationInOrg(
  supabase: DB,
  locationId: string,
  orgId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("org_id", orgId)
    .maybeSingle();
  return !!data;
}

/** Vérifie qu'une équipe appartient bien à un établissement de l'org. */
async function assertTeamInOrg(
  supabase: DB,
  teamId: string,
  orgId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("teams")
    .select("id, locations!inner(org_id)")
    .eq("id", teamId)
    .eq("locations.org_id", orgId)
    .maybeSingle();
  return !!data;
}

/**
 * Crée une équipe rattachée à un établissement.
 */
export async function createTeam(
  locationId: string,
  name: string,
  color: string,
): Promise<TeamResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  if (!name.trim()) return { ok: false, error: "Le nom est obligatoire." };

  const supabase = await createClient();
  if (!(await assertLocationInOrg(supabase, locationId, ctx.orgId))) {
    return { ok: false, error: "Établissement introuvable." };
  }

  const { error } = await supabase.from("teams").insert({
    location_id: locationId,
    name: name.trim(),
    color: color || DEFAULT_COLOR,
  });
  if (error) return { ok: false, error: "Création impossible." };

  revalidatePath("/parametres/equipes");
  return { ok: true };
}

/**
 * Renomme / recolore une équipe.
 */
export async function updateTeam(
  teamId: string,
  name: string,
  color: string,
): Promise<TeamResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  if (!name.trim()) return { ok: false, error: "Le nom est obligatoire." };

  const supabase = await createClient();
  if (!(await assertTeamInOrg(supabase, teamId, ctx.orgId))) {
    return { ok: false, error: "Équipe introuvable." };
  }

  const { error } = await supabase
    .from("teams")
    .update({ name: name.trim(), color })
    .eq("id", teamId);
  if (error) return { ok: false, error: "Mise à jour impossible." };

  revalidatePath("/parametres/equipes");
  return { ok: true };
}

/**
 * Supprime une équipe (les rattachements employés tombent en cascade).
 */
export async function deleteTeam(teamId: string): Promise<TeamResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();
  if (!(await assertTeamInOrg(supabase, teamId, ctx.orgId))) {
    return { ok: false, error: "Équipe introuvable." };
  }

  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) return { ok: false, error: "Suppression impossible." };

  revalidatePath("/parametres/equipes");
  return { ok: true };
}

/**
 * Définit la composition d'une équipe (remplace les membres).
 */
export async function setTeamMembers(
  teamId: string,
  employeeIds: string[],
): Promise<TeamResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();
  if (!(await assertTeamInOrg(supabase, teamId, ctx.orgId))) {
    return { ok: false, error: "Équipe introuvable." };
  }

  await supabase.from("employee_teams").delete().eq("team_id", teamId);

  if (employeeIds.length > 0) {
    const { error } = await supabase.from("employee_teams").insert(
      employeeIds.map((employee_id) => ({ team_id: teamId, employee_id })),
    );
    if (error) return { ok: false, error: "Mise à jour impossible." };
  }

  revalidatePath("/parametres/equipes");
  return { ok: true };
}
