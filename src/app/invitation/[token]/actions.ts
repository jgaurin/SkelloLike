"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AcceptState = { error?: string; success?: boolean };

/**
 * Accepte une invitation : crée le compte de l'employé (ou réutilise un compte
 * existant pour cet email), le rattache à sa fiche employé et crée son
 * appartenance à l'org avec le rôle 'employee'.
 *
 * Utilise le service role car l'employé n'est pas encore membre de l'org.
 */
export async function acceptInvitation(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!token) return { error: "Invitation invalide." };
  if (password.length < 8) {
    return { error: "Le mot de passe doit faire au moins 8 caractères." };
  }

  const admin = createAdminClient();

  // Récupère l'invitation (non acceptée, non expirée).
  const { data: invite } = await admin
    .from("invitations")
    .select("id, org_id, employee_id, email, accepted_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return { error: "Invitation introuvable." };
  if (invite.accepted_at) return { error: "Invitation déjà utilisée." };
  if (new Date(invite.expires_at) < new Date()) {
    return { error: "Invitation expirée. Demandez-en une nouvelle." };
  }

  // Crée le compte auth (email confirmé d'office en local).
  const { data: created, error: createErr } = await admin.auth.admin.createUser(
    {
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    },
  );

  if (createErr || !created.user) {
    return { error: "Impossible de créer le compte. Email déjà utilisé ?" };
  }
  const userId = created.user.id;

  // Profil (le trigger handle_new_user peut déjà l'avoir créé).
  await admin.from("profiles").upsert(
    {
      id: userId,
      email: invite.email,
      first_name: firstName,
      last_name: lastName,
    },
    { onConflict: "id" },
  );

  // Rattache le compte à la fiche employé.
  await admin
    .from("employees")
    .update({ user_id: userId })
    .eq("id", invite.employee_id);

  // Crée l'appartenance à l'org avec le rôle 'employee'.
  await admin.from("memberships").upsert(
    { org_id: invite.org_id, user_id: userId, role: "employee" },
    { onConflict: "org_id,user_id" },
  );

  // Marque l'invitation comme acceptée.
  await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Connecte immédiatement l'employé.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password,
  });

  // Si la connexion échoue (rare), on renvoie vers le login plutôt que de
  // laisser l'employé sur une page d'invitation devenue "invalide".
  if (signInErr) {
    redirect("/login");
  }

  // Redirection côté serveur : la session est garantie posée.
  redirect("/mon-espace");
}
