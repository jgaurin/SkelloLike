import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Point d'entrée : redirige selon l'état de l'utilisateur.
 * - non connecté        → /login (géré aussi par le proxy)
 * - connecté sans org   → /onboarding
 * - connecté avec org   → /dashboard
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  // Les employés ont leur propre espace ; les managers le tableau de bord.
  if (membership.role === "employee") {
    redirect("/mon-espace");
  }

  redirect("/dashboard");
}
