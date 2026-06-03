import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";

/**
 * Client Supabase pour les Server Components, Server Actions et Route Handlers.
 * Lit/écrit la session via les cookies Next.js.
 *
 * Note Next.js 16 : `cookies()` est asynchrone, d'où le `await`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component : la mutation des cookies est
            // ignorée. Le middleware se charge de rafraîchir la session.
          }
        },
      },
    },
  );
}
