import type { Metadata } from "next";

import { RitemWordmark } from "@/components/brand/ritem-logo";

// Pages d'authentification : pas de valeur SEO, on ne les indexe pas.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center text-[color:var(--ritem-ink)]">
          <RitemWordmark className="h-9 w-auto" />
          <p className="mt-2 text-sm text-muted-foreground">
            Plannings &amp; gestion RH simplifiés
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
