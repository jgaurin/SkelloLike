"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type RegulResult = { ok: boolean; error?: string };

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

/** Combine une date ISO (YYYY-MM-DD) et une heure (HH:MM) en timestamp ISO. */
function toTimestamp(day: string, time: string): string | null {
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  // On garde l'heure locale (le client et le serveur sont sur le même fuseau en dev).
  return new Date(`${day}T${time}:00`).toISOString();
}

/**
 * Régularise (crée ou met à jour) le pointage d'un employé pour un jour donné.
 * - Si un pointage existe déjà ce jour-là, on met à jour ses heures.
 * - Sinon on en crée un.
 * `out` peut être vide (employé encore présent).
 */
export async function regularizeClock(
  employeeId: string,
  locationId: string,
  day: string,
  inTime: string,
  outTime: string,
): Promise<RegulResult> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const clockIn = toTimestamp(day, inTime);
  if (!clockIn) return { ok: false, error: "Heure d'entrée invalide." };

  let clockOut: string | null = null;
  if (outTime) {
    clockOut = toTimestamp(day, outTime);
    if (!clockOut) return { ok: false, error: "Heure de sortie invalide." };
    if (clockOut < clockIn) {
      return { ok: false, error: "La sortie doit suivre l'entrée." };
    }
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

  // Pointage existant ce jour-là ?
  const { data: existing } = await supabase
    .from("timeclocks")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("location_id", locationId)
    .gte("clock_in", `${day}T00:00:00`)
    .lte("clock_in", `${day}T23:59:59`)
    .order("clock_in", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("timeclocks")
      .update({ clock_in: clockIn, clock_out: clockOut })
      .eq("id", existing.id);
    if (error) return { ok: false, error: "Mise à jour impossible." };
  } else {
    const { error } = await supabase.from("timeclocks").insert({
      org_id: ctx.orgId,
      location_id: locationId,
      employee_id: employeeId,
      clock_in: clockIn,
      clock_out: clockOut,
    });
    if (error) return { ok: false, error: "Création impossible." };
  }

  revalidatePath("/pointage");
  return { ok: true };
}

/**
 * Supprime le pointage d'un employé pour un jour donné.
 */
export async function deleteClock(
  employeeId: string,
  locationId: string,
  day: string,
): Promise<RegulResult> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("timeclocks")
    .delete()
    .eq("employee_id", employeeId)
    .eq("location_id", locationId)
    .eq("org_id", ctx.orgId)
    .gte("clock_in", `${day}T00:00:00`)
    .lte("clock_in", `${day}T23:59:59`);

  if (error) return { ok: false, error: "Suppression impossible." };

  revalidatePath("/pointage");
  return { ok: true };
}
