import { createClient } from "@/lib/supabase/server";

/**
 * Liste des emails super-admin plateforme (variable d'env SUPER_ADMIN_EMAILS,
 * séparés par des virgules). Ces comptes peuvent traiter les demandes d'accès.
 */
function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Vrai si l'email fait partie des super-admins plateforme. */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return superAdminEmails().includes(email.toLowerCase());
}

/**
 * Récupère l'utilisateur connecté et indique s'il est super-admin.
 * Ne redirige pas : à l'appelant de décider (notFound / redirect).
 */
export async function getSuperAdmin(): Promise<{
  email: string | null;
  isSuperAdmin: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;
  return { email, isSuperAdmin: isSuperAdminEmail(email) };
}
