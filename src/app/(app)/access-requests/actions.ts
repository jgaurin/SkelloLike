"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperAdmin } from "@/lib/auth/super-admin";
import { sendEmail, emailEnabled, invitationEmailHtml } from "@/lib/email";

export type RequestActionResult =
  | { ok: true; link?: string; sent?: boolean }
  | { ok: false; error: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Approuve une demande d'accès : provisionne une organisation + un établissement
 * initial, rattache le contact comme org_owner (compte créé via le service role
 * et lien d'accès envoyé), puis marque la demande comme approuvée.
 */
export async function approveAccessRequest(
  id: string,
): Promise<RequestActionResult> {
  const { isSuperAdmin } = await getSuperAdmin();
  if (!isSuperAdmin) return { ok: false, error: "Droits insuffisants." };

  const admin = createAdminClient();

  const { data: req } = await admin
    .from("access_requests")
    .select("id, company_name, contact_name, email, sector, status")
    .eq("id", id)
    .maybeSingle();

  if (!req) return { ok: false, error: "Demande introuvable." };
  if (req.status !== "pending") {
    return { ok: false, error: "Cette demande a déjà été traitée." };
  }

  // 1. Organisation + essai 14 jours.
  const slug = `${slugify(req.company_name)}-${Math.random().toString(36).slice(2, 6)}`;
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: req.company_name,
      slug,
      plan: "trial",
      trial_ends_at: trialEnds.toISOString(),
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return { ok: false, error: "Création de l'organisation impossible." };
  }

  // 2. Établissement initial.
  await admin.from("locations").insert({
    org_id: org.id,
    name: req.company_name,
    sector: req.sector,
  });

  // 3. Compte propriétaire : on crée (ou retrouve) l'utilisateur, puis on génère
  //    un lien d'accès pour qu'il définisse son mot de passe.
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email: req.email,
      email_confirm: true,
      user_metadata: { full_name: req.contact_name },
    });

  let userId = created?.user?.id ?? null;

  // Si l'utilisateur existe déjà, on le récupère.
  if (createErr && !userId) {
    const { data: list } = await admin.auth.admin.listUsers();
    userId =
      list?.users.find(
        (u) => u.email?.toLowerCase() === req.email.toLowerCase(),
      )?.id ?? null;
  }

  if (!userId) {
    return { ok: false, error: "Création du compte propriétaire impossible." };
  }

  // Membership org_owner.
  await admin
    .from("memberships")
    .upsert(
      { org_id: org.id, user_id: userId, role: "org_owner" },
      { onConflict: "org_id,user_id" },
    );

  // Lien de connexion (recovery = définir un mot de passe).
  let link = `${base}/login`;
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: req.email,
    options: { redirectTo: `${base}/dashboard` },
  });
  if (linkData?.properties?.action_link) {
    link = linkData.properties.action_link;
  }

  // 4. Marque la demande approuvée.
  await admin
    .from("access_requests")
    .update({
      status: "approved",
      org_id: org.id,
      handled_at: new Date().toISOString(),
    })
    .eq("id", id);

  // 5. Email d'accès si Resend est configuré.
  let sent = false;
  if (emailEnabled()) {
    const res = await sendEmail({
      to: req.email,
      subject: `Votre accès Ritem pour ${req.company_name}`,
      html: invitationEmailHtml({ orgName: req.company_name, link }),
    });
    sent = res.ok;
  }

  revalidatePath("/access-requests");
  return { ok: true, link, sent };
}

/** Rejette une demande d'accès. */
export async function rejectAccessRequest(
  id: string,
): Promise<RequestActionResult> {
  const { isSuperAdmin } = await getSuperAdmin();
  if (!isSuperAdmin) return { ok: false, error: "Droits insuffisants." };

  const admin = createAdminClient();
  const { data: req } = await admin
    .from("access_requests")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!req) return { ok: false, error: "Demande introuvable." };
  if (req.status !== "pending") {
    return { ok: false, error: "Cette demande a déjà été traitée." };
  }

  const { error } = await admin
    .from("access_requests")
    .update({ status: "rejected", handled_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: "Action impossible." };

  revalidatePath("/access-requests");
  return { ok: true };
}

/** Supprime définitivement une demande. */
export async function deleteAccessRequest(
  id: string,
): Promise<RequestActionResult> {
  const { isSuperAdmin } = await getSuperAdmin();
  if (!isSuperAdmin) return { ok: false, error: "Droits insuffisants." };

  const admin = createAdminClient();
  const { error } = await admin.from("access_requests").delete().eq("id", id);

  if (error) return { ok: false, error: "Suppression impossible." };

  revalidatePath("/access-requests");
  return { ok: true };
}
