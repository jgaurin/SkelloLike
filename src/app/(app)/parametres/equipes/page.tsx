import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { TeamsManager, type Team, type Employee } from "./teams-manager";
import { Button } from "@/components/ui/button";

const ADMIN_ROLES = ["org_owner", "org_admin", "location_manager"];

export default async function TeamsSettingsPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = ADMIN_ROLES.includes(ctx.role);

  const [{ data: locations }, { data: employees }, { data: members }] =
    await Promise.all([
      supabase
        .from("locations")
        .select("id, name, teams(id, name, color)")
        .order("created_at", { ascending: true }),
      supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("status", "active")
        .order("last_name"),
      supabase.from("employee_teams").select("team_id, employee_id"),
    ]);

  // Membres par équipe.
  const membersByTeam = new Map<string, string[]>();
  for (const m of members ?? []) {
    const arr = membersByTeam.get(m.team_id) ?? [];
    arr.push(m.employee_id);
    membersByTeam.set(m.team_id, arr);
  }

  return (
    <>
      <AppHeader title="Équipes" fullName={ctx.fullName} email={ctx.email} />
      <main className="flex-1 space-y-6 p-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/parametres">
            <ArrowLeft className="size-4" />
            Retour aux paramètres
          </Link>
        </Button>

        <div>
          <h2 className="text-xl font-semibold tracking-tight">Équipes</h2>
          <p className="text-sm text-muted-foreground">
            Regroupez vos employés en équipes pour filtrer le planning et gérer
            les accès.
          </p>
        </div>

        {(locations ?? []).map((loc) => {
          const teams: Team[] = (loc.teams ?? []).map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            memberIds: membersByTeam.get(t.id) ?? [],
          }));
          return (
            <section key={loc.id} className="space-y-3">
              {(locations?.length ?? 0) > 1 && (
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {loc.name}
                </h3>
              )}
              <TeamsManager
                locationId={loc.id}
                teams={teams}
                employees={(employees ?? []) as Employee[]}
                canManage={canManage}
              />
            </section>
          );
        })}
      </main>
    </>
  );
}
