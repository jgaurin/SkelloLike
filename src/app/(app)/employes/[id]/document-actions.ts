"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type DocResult = { ok: boolean; error?: string };

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

const MAX_BYTES = 10 * 1024 * 1024; // 10 Mo

/**
 * Téléverse un document pour un employé.
 * Le fichier est stocké dans documents/<org_id>/<employee_id>/<uuid>-<nom>.
 */
export async function uploadDocument(
  employeeId: string,
  formData: FormData,
): Promise<DocResult> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const file = formData.get("file") as File | null;
  const category = String(formData.get("category") ?? "autre");
  if (!file || file.size === 0) {
    return { ok: false, error: "Aucun fichier sélectionné." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Fichier trop volumineux (max 10 Mo)." };
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

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const uid = crypto.randomUUID();
  const path = `${ctx.orgId}/${employeeId}/${uid}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (upErr) {
    return { ok: false, error: "Échec du téléversement." };
  }

  const { error: dbErr } = await supabase.from("documents").insert({
    org_id: ctx.orgId,
    employee_id: employeeId,
    category,
    name: file.name,
    storage_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: ctx.userId,
  });
  if (dbErr) {
    // Rollback du fichier si l'enregistrement échoue.
    await supabase.storage.from("documents").remove([path]);
    return { ok: false, error: "Enregistrement impossible." };
  }

  revalidatePath(`/employes/${employeeId}`);
  revalidatePath("/documents");
  return { ok: true };
}

/**
 * Renvoie une URL signée (temporaire) pour télécharger un document.
 */
export async function getDocumentUrl(
  documentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const ctx = await getAppContext();
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Document introuvable." };

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 60); // 60 secondes
  if (error || !data) return { ok: false, error: "Lien indisponible." };

  return { ok: true, url: data.signedUrl };
}

/**
 * Supprime un document (fichier + métadonnées).
 */
export async function deleteDocument(documentId: string): Promise<DocResult> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, employee_id")
    .eq("id", documentId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Document introuvable." };

  await supabase.storage.from("documents").remove([doc.storage_path]);
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);
  if (error) return { ok: false, error: "Suppression impossible." };

  revalidatePath(`/employes/${doc.employee_id}`);
  revalidatePath("/documents");
  return { ok: true };
}
