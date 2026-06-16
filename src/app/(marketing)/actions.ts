"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type AccessRequestState = { ok: boolean; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Enregistre une demande d'accès (lead) déposée depuis la landing page publique.
 * Insertion via le service role car la table access_requests est verrouillée par
 * RLS (aucun accès client). Aucune authentification requise : route publique.
 */
export async function submitAccessRequest(
  _prev: AccessRequestState,
  formData: FormData,
): Promise<AccessRequestState> {
  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const sector = String(formData.get("sector") ?? "").trim() || null;
  const teamSize = String(formData.get("team_size") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;

  if (!companyName || !contactName || !email) {
    return { ok: false, error: "Entreprise, nom et email sont obligatoires." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Adresse email invalide." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("access_requests").insert({
    company_name: companyName,
    contact_name: contactName,
    email,
    phone,
    sector,
    team_size: teamSize,
    message,
  });

  if (error) {
    return { ok: false, error: "Envoi impossible pour le moment. Réessayez." };
  }

  return { ok: true };
}
