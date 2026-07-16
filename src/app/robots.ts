import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * robots.txt — autorise l'indexation des pages publiques, bloque les espaces
 * privés (application authentifiée, API, tunnel d'auth) et pointe le sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/planning",
          "/pointage",
          "/badgeuse",
          "/employes",
          "/absences",
          "/documents",
          "/rapports",
          "/parametres",
          "/mon-espace",
          "/onboarding",
          "/api/",
          "/auth/",
          "/invitation",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
