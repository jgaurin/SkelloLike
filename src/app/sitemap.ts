import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { SECTORS } from "@/lib/sectors";

/**
 * Sitemap — uniquement les pages publiques indexables. Les écrans applicatifs
 * (derrière l'auth) en sont volontairement absents.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/secteurs"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...SECTORS.map((s) => ({
      url: absoluteUrl(`/secteurs/${s.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: absoluteUrl("/confidentialite"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: absoluteUrl("/suppression-compte"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
