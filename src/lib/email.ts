import "server-only";

import { Resend } from "resend";

/**
 * Envoi d'emails via Resend.
 * Si `RESEND_API_KEY` n'est pas configurée, l'envoi est sauté silencieusement
 * (utile en dev : on retombe alors sur le lien à copier côté manager).
 */

const apiKey = process.env.RESEND_API_KEY;
const fromAddress =
  process.env.RESEND_FROM ?? "Ritem <onboarding@resend.dev>";

/** Vrai si l'envoi d'email est configuré. */
export function emailEnabled(): boolean {
  return !!apiKey;
}

/**
 * Adresses des propriétaires Ritem qui reçoivent les demandes de démo.
 * Définies via DEMO_NOTIFY_EMAILS (séparées par des virgules).
 */
export function demoNotifyEmails(): string[] {
  return (process.env.DEMO_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean }> {
  if (!apiKey) return { ok: false };
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

/** Gabarit HTML simple pour l'email d'invitation. */
export function invitationEmailHtml(opts: {
  orgName: string;
  link: string;
}): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h1 style="color: #059669; font-size: 20px;">Ritem</h1>
    <p style="font-size: 15px; color: #1e293b;">
      Bonjour,<br /><br />
      Vous êtes invité·e à rejoindre <strong>${opts.orgName}</strong> sur Ritem
      pour consulter votre planning et gérer vos absences.
    </p>
    <p style="margin: 24px 0;">
      <a href="${opts.link}"
         style="background: #059669; color: #fff; text-decoration: none;
                padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Créer mon compte
      </a>
    </p>
    <p style="font-size: 13px; color: #64748b;">
      Ce lien expire dans 14 jours. S'il ne fonctionne pas, copiez cette adresse
      dans votre navigateur :<br />
      <span style="word-break: break-all;">${opts.link}</span>
    </p>
  </div>`;
}

/** Gabarit HTML de notification d'une nouvelle demande de démo (interne). */
export function demoRequestEmailHtml(opts: {
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  sector: string | null;
  teamSize: string | null;
  message: string | null;
}): string {
  const row = (label: string, value: string | null) =>
    value
      ? `<tr><td style="padding:6px 12px;color:#64748b;font-size:13px;">${label}</td>
         <td style="padding:6px 12px;color:#1e293b;font-size:14px;font-weight:500;">${value}</td></tr>`
      : "";
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
    <h1 style="color: #059669; font-size: 18px;">Nouvelle demande de démo</h1>
    <p style="font-size: 14px; color: #1e293b;">
      Un prospect a rempli le formulaire sur ritem.pro :
    </p>
    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;">
      ${row("Entreprise", opts.companyName)}
      ${row("Contact", opts.contactName)}
      ${row("Email", opts.email)}
      ${row("Téléphone", opts.phone)}
      ${row("Secteur", opts.sector)}
      ${row("Taille d'équipe", opts.teamSize)}
      ${row("Message", opts.message)}
    </table>
    <p style="margin-top:20px;">
      <a href="mailto:${opts.email}"
         style="background:#059669;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">
        Répondre à ${opts.contactName}
      </a>
    </p>
  </div>`;
}
