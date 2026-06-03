import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Client Supabase avec la clé service_role — contourne les RLS.
 *
 * À n'utiliser QUE côté serveur, dans des Server Actions/Route Handlers, après
 * avoir vérifié l'authentification et l'autorisation manuellement. Ne jamais
 * exposer cette clé au navigateur.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
