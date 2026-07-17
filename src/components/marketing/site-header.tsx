import Link from "next/link";

import { RitemWordmark } from "@/components/brand/ritem-logo";
import { Button } from "@/components/ui/button";

/**
 * En-tête public partagé (landing + pages secteur). Le CTA pointe vers le
 * formulaire de démo de l'accueil (`/#demande`) pour fonctionner depuis
 * n'importe quelle page.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:h-18 sm:px-6">
        <Link
          href="/"
          aria-label="Ritem — accueil"
          className="flex items-center text-[color:var(--ritem-ink)]"
        >
          <RitemWordmark className="h-7 w-auto sm:h-8" />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild className="shadow-sm">
            <Link href="/#demande">Demander une démo</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
