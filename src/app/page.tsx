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
    .select("org_id")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
