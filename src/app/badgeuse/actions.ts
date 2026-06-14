"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

/** État de pointage d'un employé sur la badgeuse. */
export type ClockState = "out" | "in" | "break";

export type LookupResult =
  | {
      ok: true;
      employeeId: string;
      name: string;
      state: ClockState;
      clockId: string | null;
    }
  | { ok: false; error: string };

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Identifie un employé par son PIN sur l'établissement et renvoie son état
 * actuel (parti / présent / en pause), pour afficher les bons boutons.
 */
export async function lookupByPin(
  locationId: string,
  pin: string,
): Promise<LookupResult> {
  const ctx = await getAppContext();
  const code = pin.trim();
  if (!/^\d{4}$/.test(code)) {
    return { ok: false, error: "Code à 4 chiffres requis." };
  }

  const supabase = await createClient();

  const { data: loc } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();
  if (!loc) return { ok: false, error: "Établissement invalide." };

  const { data: emp } = await supabase
    .from("employees")
    .select("id, first_name, last_name, employee_locations!inner(location_id)")
    .eq("org_id", ctx.orgId)
    .eq("pin_code", code)
    .eq("status", "active")
    .eq("employee_locations.location_id", locationId)
    .maybeSingle();
  if (!emp) return { ok: false, error: "Code inconnu sur cet établissement." };

  // Pointage ouvert du jour (entrée sans sortie).
  const { data: open } = await supabase
    .from("timeclocks")
    .select("id, break_started_at")
    .eq("employee_id", emp.id)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  let state: ClockState = "out";
  if (open) state = open.break_started_at ? "break" : "in";

  return {
    ok: true,
    employeeId: emp.id,
    name: `${emp.first_name} ${emp.last_name}`,
    state,
    clockId: open?.id ?? null,
  };
}

/** Vérifie l'employé + son établissement (sécurité commune aux actions). */
async function assertEmployee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  employeeId: string,
  locationId: string,
) {
  const { data } = await supabase
    .from("employees")
    .select("id, employee_locations!inner(location_id)")
    .eq("id", employeeId)
    .eq("org_id", orgId)
    .eq("employee_locations.location_id", locationId)
    .maybeSingle();
  return !!data;
}

/** Arrivée : crée un nouveau pointage ouvert. */
export async function clockArrive(
  locationId: string,
  employeeId: string,
): Promise<ActionResult> {
  const ctx = await getAppContext();
  const supabase = await createClient();
  if (!(await assertEmployee(supabase, ctx.orgId, employeeId, locationId))) {
    return { ok: false, error: "Employé introuvable." };
  }

  // Refuse si un pointage est déjà ouvert.
  const { data: open } = await supabase
    .from("timeclocks")
    .select("id")
    .eq("employee_id", employeeId)
    .is("clock_out", null)
    .maybeSingle();
  if (open) return { ok: false, error: "Déjà en service." };

  const { error } = await supabase.from("timeclocks").insert({
    org_id: ctx.orgId,
    location_id: locationId,
    employee_id: employeeId,
    clock_in: new Date().toISOString(),
  });
  if (error) return { ok: false, error: "Pointage impossible." };

  revalidatePath("/pointage");
  return { ok: true, message: "Arrivée enregistrée" };
}

/** Départ : ferme le pointage ouvert (clôture une pause en cours au passage). */
export async function clockLeave(
  clockId: string,
): Promise<ActionResult> {
  const ctx = await getAppContext();
  const supabase = await createClient();

  const { data: clock } = await supabase
    .from("timeclocks")
    .select("id, break_started_at, break_minutes")
    .eq("id", clockId)
    .eq("org_id", ctx.orgId)
    .is("clock_out", null)
    .maybeSingle();
  if (!clock) return { ok: false, error: "Aucun service en cours." };

  // Si une pause était en cours, on la clôt aussi.
  let breakMinutes = clock.break_minutes;
  if (clock.break_started_at) {
    breakMinutes += Math.round(
      (Date.now() - new Date(clock.break_started_at).getTime()) / 60000,
    );
  }

  const { error } = await supabase
    .from("timeclocks")
    .update({
      clock_out: new Date().toISOString(),
      break_started_at: null,
      break_minutes: breakMinutes,
    })
    .eq("id", clockId);
  if (error) return { ok: false, error: "Pointage impossible." };

  revalidatePath("/pointage");
  return { ok: true, message: "Départ enregistré" };
}

/** Début de pause. */
export async function clockBreakStart(
  clockId: string,
): Promise<ActionResult> {
  const ctx = await getAppContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("timeclocks")
    .update({ break_started_at: new Date().toISOString() })
    .eq("id", clockId)
    .eq("org_id", ctx.orgId)
    .is("clock_out", null)
    .is("break_started_at", null);
  if (error) return { ok: false, error: "Pause impossible." };

  revalidatePath("/pointage");
  return { ok: true, message: "Pause commencée" };
}

/** Fin de pause : cumule la durée et reprend le service. */
export async function clockBreakEnd(
  clockId: string,
): Promise<ActionResult> {
  const ctx = await getAppContext();
  const supabase = await createClient();

  const { data: clock } = await supabase
    .from("timeclocks")
    .select("id, break_started_at, break_minutes")
    .eq("id", clockId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();
  if (!clock?.break_started_at) {
    return { ok: false, error: "Aucune pause en cours." };
  }

  const added = Math.round(
    (Date.now() - new Date(clock.break_started_at).getTime()) / 60000,
  );

  const { error } = await supabase
    .from("timeclocks")
    .update({
      break_started_at: null,
      break_minutes: clock.break_minutes + added,
    })
    .eq("id", clockId);
  if (error) return { ok: false, error: "Reprise impossible." };

  revalidatePath("/pointage");
  return { ok: true, message: "Reprise du service" };
}
