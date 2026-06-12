"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { LOCATION_COOKIE } from "@/lib/auth/location-context";

/**
 * Change l'établissement courant (sélecteur global de la sidebar).
 * Vérifie que l'établissement appartient bien à l'org de l'utilisateur.
 */
export async function setCurrentLocation(locationId: string): Promise<void> {
  const ctx = await getAppContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("org_id", ctx.orgId)
    .maybeSingle();
  if (!data) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCATION_COOKIE, locationId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // Rafraîchit toutes les pages de l'espace (le contexte a changé).
  revalidatePath("/", "layout");
}
