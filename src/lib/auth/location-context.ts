import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

const LOCATION_COOKIE = "sl_location";

export type LocationOption = { id: string; name: string };

export type LocationContext = {
  locations: LocationOption[];
  /** Établissement actuellement sélectionné (toujours valide). */
  currentId: string;
  currentName: string;
};

/**
 * Établissements de l'org + établissement courant (depuis le cookie, sinon le
 * premier). S'applique à tout l'espace de gestion (planning, employés, absences…).
 */
export async function getLocationContext(): Promise<LocationContext> {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .order("created_at", { ascending: true });

  const list = locations ?? [];
  const cookieStore = await cookies();
  const saved = cookieStore.get(LOCATION_COOKIE)?.value;

  // Le site sauvegardé doit exister (sinon on retombe sur le premier).
  const current =
    list.find((l) => l.id === saved) ?? list[0] ?? { id: "", name: "" };

  return {
    locations: list,
    currentId: current.id,
    currentName: current.name,
  };
}

export { LOCATION_COOKIE };
