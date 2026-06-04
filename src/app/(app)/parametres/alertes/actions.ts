"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";

export type AlertSettingResult = { ok: boolean; error?: string };

const ADMIN_ROLES = ["org_owner", "org_admin"];

/**
 * Met à jour le réglage d'une alerte (activée et/ou bloquante) pour l'org.
 */
export async function updateAlertSetting(
  alertCode: string,
  enabled: boolean,
  blocking: boolean,
): Promise<AlertSettingResult> {
  const ctx = await getAppContext();
  if (!ADMIN_ROLES.includes(ctx.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("alert_settings").upsert(
    {
      org_id: ctx.orgId,
      alert_code: alertCode,
      enabled,
      // Une alerte désactivée ne peut pas être bloquante.
      blocking: enabled && blocking,
    },
    { onConflict: "org_id,alert_code" },
  );

  if (error) {
    return { ok: false, error: "Enregistrement impossible." };
  }

  revalidatePath("/parametres/alertes");
  revalidatePath("/planning");
  return { ok: true };
}
