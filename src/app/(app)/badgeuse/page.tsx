import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { getLocationContext } from "@/lib/auth/location-context";
import { AppHeader } from "@/components/layout/app-header";
import { Keypad } from "./keypad";

export default async function BadgeusePage() {
  const ctx = await getAppContext();
  await createClient();
  const { currentId, currentName } = await getLocationContext();

  return (
    <>
      <AppHeader title="Badgeuse" fullName={ctx.fullName} email={ctx.email} />
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold">{currentName}</h2>
          <p className="text-sm text-muted-foreground">
            Pointez votre entrée ou votre sortie
          </p>
        </div>
        <Keypad locationId={currentId} />
      </main>
    </>
  );
}
