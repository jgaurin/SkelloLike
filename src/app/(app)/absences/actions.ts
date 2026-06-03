"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type AbsenceResult = { ok: boolean; error?: string };

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
 * Crée une demande d'absence pour un employé.
 * - Un manager peut créer pour n'importe quel employé de l'org.
 * - Un employé (lié) ne peut créer que pour lui-même (garanti par RLS).
 */
export async function createAbsenceRequest(
  _prevState: AbsenceResult,
  formData: FormData,
): Promise<AbsenceResult> {
  const ctx = await getAppContext();

  const employeeId = String(formData.get("employee_id") ?? "");
  const typeId = String(formData.get("type_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (!employeeId || !typeId || !startDate || !endDate) {
    return { ok: false, error: "Employé, type et dates requis." };
  }
  if (endDate < startDate) {
    return { ok: false, error: "La date de fin doit suivre la date de début." };
  }

  const supabase = await createClient();

  // Un manager qui crée une demande la valide directement (saisie pour autrui).
  const isManager = canManage(ctx.role);

  const { error } = await supabase.from("absence_requests").insert({
    employee_id: employeeId,
    type_id: typeId,
    start_date: startDate,
    end_date: endDate,
    comment,
    status: isManager ? "approved" : "pending",
    reviewed_by: isManager ? ctx.userId : null,
    reviewed_at: isManager ? new Date().toISOString() : null,
  });

  if (error) {
    return { ok: false, error: "Impossible de créer la demande." };
  }

  revalidatePath("/absences");
  revalidatePath("/planning");
  return { ok: true };
}

/**
 * Valide ou refuse une demande d'absence (manager uniquement).
 */
export async function reviewAbsenceRequest(
  id: string,
  decision: "approved" | "rejected",
): Promise<AbsenceResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("absence_requests")
    .update({
      status: decision,
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Action impossible." };
  }

  revalidatePath("/absences");
  revalidatePath("/planning");
  return { ok: true };
}

/**
 * Supprime une demande d'absence (manager uniquement).
 */
export async function deleteAbsenceRequest(id: string): Promise<AbsenceResult> {
  const ctx = await getAppContext();
  if (!canManage(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("absence_requests")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Suppression impossible." };
  }

  revalidatePath("/absences");
  revalidatePath("/planning");
  return { ok: true };
}
