"use server";

import {
  sendEmail,
  emailEnabled,
  demoNotifyEmails,
  demoRequestEmailHtml,
} from "@/lib/email";

export type AccessRequestState = { ok: boolean; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Demande de démo déposée depuis la landing publique.
 * Les demandes sont gérées par les propriétaires Ritem PAR EMAIL uniquement :
 * on envoie une notification aux adresses DEMO_NOTIFY_EMAILS. Aucune donnée
 * n'est stockée ni exposée dans l'application. Route publique, sans auth.
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

  const recipients = demoNotifyEmails();
  if (!emailEnabled() || recipients.length === 0) {
    // Mauvaise configuration serveur : on log et on renvoie une erreur générique.
    console.error(
      "[demo] Notification impossible : RESEND_API_KEY ou DEMO_NOTIFY_EMAILS manquant.",
    );
    return {
      ok: false,
      error: "Envoi impossible pour le moment. Réessayez plus tard.",
    };
  }

  const res = await sendEmail({
    to: recipients.join(", "),
    subject: `Demande de démo — ${companyName}`,
    html: demoRequestEmailHtml({
      companyName,
      contactName,
      email,
      phone,
      sector,
      teamSize,
      message,
    }),
  });

  if (!res.ok) {
    return { ok: false, error: "Envoi impossible pour le moment. Réessayez." };
  }

  return { ok: true };
}
