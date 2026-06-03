import { Construction } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { getAppContext } from "@/lib/auth/context";

/**
 * Page placeholder pour les modules pas encore développés.
 * Évite les 404 quand on clique dans la sidebar.
 */
export async function ComingSoon({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  const ctx = await getAppContext();
  return (
    <>
      <AppHeader title={title} fullName={ctx.fullName} email={ctx.email} />
      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Construction className="size-7 text-primary" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Ce module arrive bientôt ({phase}). Suivez l&apos;avancement dans le
          cahier des charges.
        </p>
      </main>
    </>
  );
}
