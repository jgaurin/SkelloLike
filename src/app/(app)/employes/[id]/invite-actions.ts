"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { sendEmail, emailEnabled, invitationEmailHtml } from "@/lib/email";

export type InviteResult =
  | { ok: true; link: string; sent: boolean; email: string }
  | { ok: false; error: string };

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

/**
 * Crée (ou régénère) une invitation pour un employé et renvoie le lien
 * d'acceptation. En local, le lien est affiché au manager pour le partager ;
 * en production il serait envoyé par email.
 */
export async function inviteEmployee(
  employeeId: string,
): Promise<InviteResult> {
  const ctx = await getAppContext();
  if (!MANAGER_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();

  // L'employé doit appartenir à l'org et avoir un email.
  const { data: emp } = await supabase
    .from("employees")
    .select("id, email, user_id")
    .eq("id", employeeId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();

  if (!emp) return { ok: false, error: "Employé introuvable." };
  if (emp.user_id) {
    return { ok: false, error: "Cet employé a déjà un compte." };
  }
  if (!emp.email) {
    return {
      ok: false,
      error: "Ajoutez un email à l'employé avant de l'inviter.",
    };
  }

  // Supprime une invitation non acceptée existante, puis en recrée une.
  await supabase
    .from("invitations")
    .delete()
    .eq("employee_id", employeeId)
    .is("accepted_at", null);

  const { data: invite, error } = await supabase
    .from("invitations")
    .insert({
      org_id: ctx.orgId,
      employee_id: employeeId,
      email: emp.email,
    })
    .select("token")
    .single();

  if (error || !invite) {
    return { ok: false, error: "Impossible de créer l'invitation." };
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = `${base}/invitation/${invite.token}`;

  // Envoie l'email d'invitation si Resend est configuré, sinon on retourne le
  // lien pour que le manager le partage manuellement.
  let sent = false;
  if (emailEnabled()) {
    const res = await sendEmail({
      to: emp.email,
      subject: `Invitation à rejoindre ${ctx.orgName} sur SkelloLike`,
      html: invitationEmailHtml({ orgName: ctx.orgName, link }),
    });
    sent = res.ok;
  }

  revalidatePath(`/employes/${employeeId}`);
  return { ok: true, link, sent, email: emp.email };
}
