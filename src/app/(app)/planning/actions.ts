"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { shiftHours } from "@/lib/week";

export type ShiftResult = { ok: boolean; error?: string };

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

function canManage(role: string) {
  return MANAGER_ROLES.includes(role);
}

/**
 * Récupère (ou crée) le planning hebdomadaire d'un établissement pour une
 * semaine donnée. Renvoie l'id du schedule.
 */
async function ensureSchedule(
  supabase: Awaited<ReturnType<typeof createClient>>,
  locationId: string,
  weekStart: string,
): Promise<{ id: string } | null> {
  const { data: existing } = await supabase
    .from("schedules")
    .select("id")
    .eq("location_id", locationId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("schedules")
    .insert({ location_id: locationId, week_start: weekStart, status: "draft" })
    .select("id")
    .single();

  if (error || !created) return null;
  return created;
}

/** Vérifie que l'établissement appartient à l'org courante. */
async function assertLocationInOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

/** Le sélecteur "Non assigné / Aucun" envoie cette valeur sentinelle. */
const NONE = "__none__";

function nullable(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s && s !== NONE ? s : null;
}

function parseShiftForm(formData: FormData) {
  const employeeId = nullable(formData.get("employee_id"));
  const positionId = nullable(formData.get("position_id"));
  const shiftDate = String(formData.get("shift_date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();
  const breakMinutes = Number(formData.get("break_minutes") ?? 0) || 0;
  const noteManager = String(formData.get("note_manager") ?? "").trim() || null;
  return {
    employeeId,
    positionId,
    shiftDate,
    startTime,
    endTime,
    breakMinutes,
    noteManager,
  };
}

function validateShift(s: ReturnType<typeof parseShiftForm>): string | null {
  if (!s.shiftDate || !s.startTime || !s.endTime) {
    return "Date, heure de début et de fin requises.";
  }
  if (shiftHours(s.startTime, s.endTime, s.breakMinutes) <= 0) {
    return "La durée du shift doit être positive.";
  }
  return null;
}

/**
 * Crée un shift. Crée le planning de la semaine si nécessaire.
 */
export async function createShift(
  locationId: string,
  weekStart: string,
  formData: FormData,
): Promise<ShiftResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  if (!(await assertLocationInOrg(supabase, locationId, ctx.orgId))) {
    return { ok: false, error: "Établissement introuvable." };
  }

  const s = parseShiftForm(formData);
  const err = validateShift(s);
  if (err) return { ok: false, error: err };

  const schedule = await ensureSchedule(supabase, locationId, weekStart);
  if (!schedule) {
    return { ok: false, error: "Impossible de préparer le planning." };
  }

  const { error } = await supabase.from("shifts").insert({
    schedule_id: schedule.id,
    employee_id: s.employeeId,
    position_id: s.positionId,
    shift_date: s.shiftDate,
    start_time: s.startTime,
    end_time: s.endTime,
    break_minutes: s.breakMinutes,
    note_manager: s.noteManager,
    status: "draft",
  });

  if (error) return { ok: false, error: "Impossible de créer le shift." };

  revalidatePath("/planning");
  return { ok: true };
}

/**
 * Met à jour un shift existant.
 */
export async function updateShift(
  shiftId: string,
  formData: FormData,
): Promise<ShiftResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const s = parseShiftForm(formData);
  const err = validateShift(s);
  if (err) return { ok: false, error: err };

  const supabase = await createClient();
  const { error } = await supabase
    .from("shifts")
    .update({
      employee_id: s.employeeId,
      position_id: s.positionId,
      shift_date: s.shiftDate,
      start_time: s.startTime,
      end_time: s.endTime,
      break_minutes: s.breakMinutes,
      note_manager: s.noteManager,
    })
    .eq("id", shiftId);

  if (error) return { ok: false, error: "Impossible de modifier le shift." };

  revalidatePath("/planning");
  return { ok: true };
}

/**
 * Supprime un shift.
 */
export async function deleteShift(shiftId: string): Promise<ShiftResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  const { error } = await supabase.from("shifts").delete().eq("id", shiftId);

  if (error) return { ok: false, error: "Impossible de supprimer le shift." };

  revalidatePath("/planning");
  return { ok: true };
}

/**
 * Déplace un shift vers une autre date / un autre employé (drag & drop).
 */
export async function moveShift(
  shiftId: string,
  newDate: string,
  newEmployeeId: string | null,
): Promise<ShiftResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("shifts")
    .update({ shift_date: newDate, employee_id: newEmployeeId })
    .eq("id", shiftId);

  if (error) return { ok: false, error: "Déplacement impossible." };

  revalidatePath("/planning");
  return { ok: true };
}

/**
 * Publie le planning d'une semaine (brouillon -> publié).
 */
export async function publishSchedule(
  locationId: string,
  weekStart: string,
): Promise<ShiftResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  if (!(await assertLocationInOrg(supabase, locationId, ctx.orgId))) {
    return { ok: false, error: "Établissement introuvable." };
  }

  const schedule = await ensureSchedule(supabase, locationId, weekStart);
  if (!schedule) return { ok: false, error: "Aucun planning à publier." };

  const { error } = await supabase
    .from("schedules")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_by: ctx.userId,
    })
    .eq("id", schedule.id);

  if (error) return { ok: false, error: "Publication impossible." };

  // Tous les shifts du planning passent en "published".
  await supabase
    .from("shifts")
    .update({ status: "published" })
    .eq("schedule_id", schedule.id)
    .eq("status", "draft");

  revalidatePath("/planning");
  return { ok: true };
}
