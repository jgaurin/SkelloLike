import { redirect } from "next/navigation";

import { getAppContext } from "@/lib/auth/context";
import { getLocationContext } from "@/lib/auth/location-context";
import { Keypad } from "./keypad";
import { ExitButton } from "./exit-button";

const MANAGER_ROLES = [
  "org_owner",
  "org_admin",
  "location_manager",
  "team_manager",
];

/**
 * Badgeuse en mode kiosque : plein écran, sans sidebar ni profil.
 * Conçue pour une tablette posée à l'entrée. Pour sortir, il faut le mot de
 * passe d'un manager (bouton « Quitter »).
 */
export default async function BadgeuseKioskPage() {
  const ctx = await getAppContext();
  // Seul un manager peut lancer/quitter le kiosque (un employé n'a pas accès).
  if (!MANAGER_ROLES.includes(ctx.role)) {
    redirect("/mon-espace");
  }
  const { currentId, currentName } = await getLocationContext();

  const now = new Date();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Barre minimale : nom du site + bouton quitter verrouillé */}
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">
            S
          </div>
          <span className="font-semibold">{currentName}</span>
        </div>
        <ExitButton email={ctx.email} />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Badgeuse</h1>
          <p className="mt-1 text-muted-foreground">
            {now.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Keypad locationId={currentId} />
      </main>
    </div>
  );
}
