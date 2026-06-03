"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type OnboardingState = {
  error?: string;
};

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
 * Crée l'organisation, l'établissement initial et rattache l'utilisateur
 * courant comme org_owner. Utilise le service role car les RLS bloquent
 * volontairement l'insertion directe d'organisations.
 */
export async function createOrganization(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orgName = String(formData.get("org_name") ?? "").trim();
  const locationName = String(formData.get("location_name") ?? "").trim();
  const sector = String(formData.get("sector") ?? "").trim() || null;

  if (!orgName || !locationName) {
    return { error: "Nom de l'entreprise et de l'établissement requis." };
  }

  const admin = createAdminClient();

  // Slug unique (suffixe court pour éviter les collisions).
  const slug = `${slugify(orgName)}-${Math.random().toString(36).slice(2, 6)}`;

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: orgName,
      slug,
      plan: "trial",
      trial_ends_at: trialEnds.toISOString(),
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return { error: "Impossible de créer l'organisation. Réessayez." };
  }

  const { error: membershipError } = await admin.from("memberships").insert({
    org_id: org.id,
    user_id: user.id,
    role: "org_owner",
  });

  if (membershipError) {
    return { error: "Erreur lors de la création du compte propriétaire." };
  }

  const { error: locationError } = await admin.from("locations").insert({
    org_id: org.id,
    name: locationName,
    sector,
  });

  if (locationError) {
    return { error: "Erreur lors de la création de l'établissement." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
