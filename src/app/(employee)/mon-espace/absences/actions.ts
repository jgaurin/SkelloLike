"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmployeeContext } from "@/lib/auth/employee-context";

export type RequestState = { error?: string; success?: boolean };

/**
 * Un employé pose une demande d'absence pour lui-même.
 * La demande part en statut "pending" : le manager valide.
 * Seuls les types "demandables" et actifs sont acceptés.
 */
export async function requestAbsence(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const ctx = await getEmployeeContext();

  const typeId = String(formData.get("type_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (!typeId || !startDate || !endDate) {
    return { error: "Type et dates requis." };
  }
  if (endDate < startDate) {
    return { error: "La date de fin doit suivre la date de début." };
  }

  const supabase = await createClient();

  // Le type doit être actif ET demandable.
  const { data: type } = await supabase
    .from("absence_types")
    .select("id, is_active, can_be_requested")
    .eq("id", typeId)
    .maybeSingle();

  if (!type || !type.is_active || !type.can_be_requested) {
    return { error: "Ce type d'absence n'est pas disponible." };
  }

  const { error } = await supabase.from("absence_requests").insert({
    employee_id: ctx.employeeId,
    type_id: typeId,
    start_date: startDate,
    end_date: endDate,
    comment,
    status: "pending",
  });

  if (error) {
    return { error: "Impossible d'envoyer la demande." };
  }

  revalidatePath("/mon-espace");
  revalidatePath("/absences");
  return { success: true };
}

/**
 * Annule une demande encore en attente (l'employé peut se rétracter).
 */
export async function cancelMyRequest(id: string): Promise<RequestState> {
  const ctx = await getEmployeeContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("absence_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("employee_id", ctx.employeeId)
    .eq("status", "pending");

  if (error) return { error: "Annulation impossible." };

  revalidatePath("/mon-espace");
  return { success: true };
}
