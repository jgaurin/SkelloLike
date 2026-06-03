"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import type { Database } from "@/lib/types/database";

type ContractType = Database["public"]["Enums"]["contract_type"];

export type ContractResult = { ok: boolean; error?: string };

const ADMIN_ROLES = ["org_owner", "org_admin"];

const CONTRACT_TYPES: ContractType[] = [
  "cdi",
  "cdd",
  "interim",
  "extra",
  "apprenticeship",
  "internship",
];

/**
 * Crée un contrat pour un employé.
 * Contrainte DB : seul le CDI peut ne pas avoir de date de fin.
 */
export async function createContract(
  _prevState: ContractResult,
  formData: FormData,
): Promise<ContractResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Seul un administrateur peut gérer les contrats." };
  }

  const employeeId = String(formData.get("employee_id") ?? "");
  const type = String(formData.get("type") ?? "") as ContractType;
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim() || null;
  const weeklyHoursRaw = String(formData.get("weekly_hours") ?? "35").trim();
  const hourlyRateRaw = String(formData.get("hourly_rate") ?? "").trim();
  const positionId = String(formData.get("position_id") ?? "").trim() || null;

  if (!employeeId || !CONTRACT_TYPES.includes(type) || !startDate) {
    return { ok: false, error: "Type, date de début requis." };
  }
  if (type !== "cdi" && !endDate) {
    return {
      ok: false,
      error: "Une date de fin est obligatoire pour ce type de contrat.",
    };
  }
  if (endDate && endDate < startDate) {
    return { ok: false, error: "La date de fin doit suivre la date de début." };
  }

  const weeklyHours = Number(weeklyHoursRaw);
  const hourlyRate = hourlyRateRaw ? Number(hourlyRateRaw) : null;
  if (Number.isNaN(weeklyHours)) {
    return { ok: false, error: "Heures hebdomadaires invalides." };
  }

  const supabase = await createClient();

  // Défense en profondeur : vérifier que l'employé appartient bien à l'org.
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();
  if (!emp) {
    return { ok: false, error: "Employé introuvable." };
  }

  const { error } = await supabase.from("contracts").insert({
    employee_id: employeeId,
    type,
    start_date: startDate,
    end_date: endDate,
    weekly_hours: weeklyHours,
    hourly_rate: hourlyRate,
    position_id: positionId,
  });

  if (error) {
    return { ok: false, error: "Impossible de créer le contrat." };
  }

  revalidatePath(`/employes/${employeeId}`);
  return { ok: true };
}

/**
 * Supprime un contrat.
 */
export async function deleteContract(
  contractId: string,
  employeeId: string,
): Promise<ContractResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .delete()
    .eq("id", contractId);

  if (error) {
    return { ok: false, error: "Impossible de supprimer le contrat." };
  }

  revalidatePath(`/employes/${employeeId}`);
  return { ok: true };
}
