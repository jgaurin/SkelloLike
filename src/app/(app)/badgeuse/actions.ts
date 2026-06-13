"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type ClockResult =
  | { ok: true; action: "in" | "out"; name: string; time: string }
  | { ok: false; error: string };

/**
 * Pointage entrée/sortie via code PIN, sur l'établissement de la badgeuse.
 * - Si l'employé n'a pas de pointage ouvert : on enregistre une ENTRÉE.
 * - S'il en a un : on le ferme (SORTIE).
 */
export async function clockWithPin(
  locationId: string,
  pin: string,
): Promise<ClockResult> {
  const ctx = await getAppContext();
  const supabase = await createClient();

  const code = pin.trim();
  if (!/^\d{4}$/.test(code)) {
    return { ok: false, error: "Code à 4 chiffres requis." };
  }

  // L'établissement doit appartenir à l'org.
  const { data: loc } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();
  if (!loc) return { ok: false, error: "Établissement invalide." };

  // Employé rattaché à cet établissement, avec ce PIN.
  const { data: emp } = await supabase
    .from("employees")
    .select("id, first_name, last_name, employee_locations!inner(location_id)")
    .eq("org_id", ctx.orgId)
    .eq("pin_code", code)
    .eq("status", "active")
    .eq("employee_locations.location_id", locationId)
    .maybeSingle();

  if (!emp) {
    return { ok: false, error: "Code inconnu sur cet établissement." };
  }

  const name = `${emp.first_name} ${emp.last_name}`;

  // Pointage ouvert (entrée sans sortie) ?
  const { data: openClock } = await supabase
    .from("timeclocks")
    .select("id")
    .eq("employee_id", emp.id)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = new Date();
  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (openClock) {
    const { error } = await supabase
      .from("timeclocks")
      .update({ clock_out: now.toISOString() })
      .eq("id", openClock.id);
    if (error) return { ok: false, error: "Pointage impossible." };
    revalidatePath("/pointage");
    return { ok: true, action: "out", name, time };
  }

  const { error } = await supabase.from("timeclocks").insert({
    org_id: ctx.orgId,
    location_id: locationId,
    employee_id: emp.id,
    clock_in: now.toISOString(),
  });
  if (error) return { ok: false, error: "Pointage impossible." };

  revalidatePath("/pointage");
  return { ok: true, action: "in", name, time };
}
