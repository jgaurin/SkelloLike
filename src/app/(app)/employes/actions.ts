"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type EmployeeFormState = {
  error?: string;
  success?: boolean;
};

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

/**
 * Crée un employé (fiche RH) dans l'organisation courante.
 * Réservé aux rôles de gestion. L'isolation org est garantie par les RLS,
 * mais on vérifie aussi le rôle ici (défense en profondeur).
 */
export async function createEmployee(
  _prevState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { error: "Vous n'avez pas les droits pour ajouter un employé." };
  }

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const employeeNumber =
    String(formData.get("employee_number") ?? "").trim() || null;
  const hireDate = String(formData.get("hire_date") ?? "").trim() || null;

  if (!firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("employees").insert({
    org_id: ctx.orgId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    employee_number: employeeNumber,
    hire_date: hireDate,
    status: "active",
  });

  if (error) {
    return { error: "Impossible de créer l'employé. Réessayez." };
  }

  revalidatePath("/employes");
  return { success: true };
}

/**
 * Met à jour les informations d'un employé.
 */
export async function updateEmployee(
  _prevState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { error: "Vous n'avez pas les droits pour modifier un employé." };
  }

  const id = String(formData.get("id") ?? "");
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const employeeNumber =
    String(formData.get("employee_number") ?? "").trim() || null;
  const hireDate = String(formData.get("hire_date") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "active");

  if (!id || !firstName || !lastName) {
    return { error: "Informations manquantes." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      employee_number: employeeNumber,
      hire_date: hireDate,
      status: status as "active" | "inactive" | "archived",
    })
    .eq("id", id);

  if (error) {
    return { error: "Impossible de mettre à jour l'employé." };
  }

  revalidatePath("/employes");
  revalidatePath(`/employes/${id}`);
  return { success: true };
}

/**
 * Archive un employé (soft delete : statut = archived).
 */
export async function archiveEmployee(
  _prevState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { error: "Vous n'avez pas les droits." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Employé introuvable." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) {
    return { error: "Impossible d'archiver l'employé." };
  }

  revalidatePath("/employes");
  return { success: true };
}

/**
 * Supprime un seul employé puis redirige vers la liste (depuis la fiche).
 */
export async function deleteEmployeeAndRedirect(id: string): Promise<void> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    throw new Error("Droits insuffisants.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId);

  if (error) {
    throw new Error("Suppression impossible.");
  }

  revalidatePath("/employes");
  redirect("/employes");
}

export type BulkResult = { ok: boolean; error?: string; count?: number };

/**
 * Supprime définitivement un ou plusieurs employés (action de masse).
 * Suppression dure : les contrats/absences liés tombent en cascade (FK).
 */
export async function deleteEmployees(ids: string[]): Promise<BulkResult> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Vous n'avez pas les droits." };
  }
  if (!ids.length) return { ok: false, error: "Aucun employé sélectionné." };

  const supabase = await createClient();
  // .eq("org_id") en plus du RLS : défense en profondeur (jamais hors de son org).
  const { error, count } = await supabase
    .from("employees")
    .delete({ count: "exact" })
    .in("id", ids)
    .eq("org_id", ctx.orgId);

  if (error) {
    return { ok: false, error: "Impossible de supprimer les employés." };
  }

  revalidatePath("/employes");
  return { ok: true, count: count ?? ids.length };
}

/**
 * Archive un ou plusieurs employés (action de masse, soft delete).
 */
export async function archiveEmployees(ids: string[]): Promise<BulkResult> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Vous n'avez pas les droits." };
  }
  if (!ids.length) return { ok: false, error: "Aucun employé sélectionné." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("employees")
    .update({ status: "archived" }, { count: "exact" })
    .in("id", ids)
    .eq("org_id", ctx.orgId);

  if (error) {
    return { ok: false, error: "Impossible d'archiver les employés." };
  }

  revalidatePath("/employes");
  return { ok: true, count: count ?? ids.length };
}
