import Link from "next/link";

import { RitemWordmark } from "@/components/brand/ritem-logo";
import { SECTORS } from "@/lib/sectors";

/**
 * Pied de page public partagé. Maille l'ensemble des pages secteur (bon pour le
 * SEO : chaque page publique renvoie vers toutes les autres).
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs space-y-2">
            <span className="flex items-center text-[color:var(--ritem-ink)]">
              <RitemWordmark className="h-6 w-auto" title="Ritem" />
            </span>
            <p className="text-sm text-muted-foreground">
              Plannings, pointage, absences et préparation de la paie pour les
              équipes terrain.
            </p>
          </div>

          <nav aria-label="Secteurs" className="text-sm">
            <p className="mb-3 font-medium text-foreground">Par secteur</p>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-muted-foreground">
              {SECTORS.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/secteurs/${s.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Ritem. Plannings &amp; RH.</span>
          <div className="flex gap-5">
            <Link href="/secteurs" className="hover:text-primary">
              Secteurs
            </Link>
            <Link href="/confidentialite" className="hover:text-primary">
              Confidentialité
            </Link>
            <Link href="/login" className="hover:text-primary">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
