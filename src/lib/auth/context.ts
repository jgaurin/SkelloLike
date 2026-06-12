import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type AppRole = Database["public"]["Enums"]["app_role"];

export type AppContext = {
  userId: string;
  email: string;
  fullName: string;
  orgId: string;
  orgName: string;
  role: AppRole;
};

/**
 * Récupère le contexte de l'utilisateur connecté (user + organisation + rôle).
 * Redirige vers /login ou /onboarding si nécessaire.
 * À utiliser dans les Server Components et les pages de l'espace (app).
 */
export async function getAppContext(): Promise<AppContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase
      .from("memberships")
      .select("org_id, role, organizations(name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!membership) {
    redirect("/onboarding");
  }

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email ||
    "Utilisateur";

  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? "",
    fullName,
    orgId: membership.org_id,
    orgName: membership.organizations?.name ?? "Mon entreprise",
    role: membership.role,
  };
}
