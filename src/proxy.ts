import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Proxy (ex-middleware en Next.js 16).
 * Rafraîchit la session Supabase et protège les routes.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match toutes les requêtes sauf :
     * - _next/static, _next/image, favicon
     * - fichiers de métadonnées SEO (robots, sitemap, manifest) : doivent rester
     *   accessibles aux robots sans redirection vers /login
     * - fichiers d'images
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
