"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Vérifie le mot de passe du manager connecté pour autoriser la sortie du
 * mode kiosque. Renvoie simplement ok/erreur (pas de redirection serveur :
 * la navigation se fait côté client après succès).
 */
export async function verifyExitPassword(
  email: string,
  password: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // Re-vérifie le mot de passe sans casser la session courante.
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { ok: !error };
}
