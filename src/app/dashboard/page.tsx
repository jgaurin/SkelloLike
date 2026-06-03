import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, organizations(name, plan, trial_ends_at)")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const org = membership.organizations;
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, city")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{org?.name}</h1>
          <p className="text-sm text-muted-foreground">
            Plan {org?.plan} · Rôle : {membership.role}
          </p>
        </div>
        <form action={logout}>
          <Button variant="outline" type="submit">
            Se déconnecter
          </Button>
        </form>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Établissements</CardTitle>
            <CardDescription>
              {locations?.length ?? 0} site(s) configuré(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {locations?.map((loc) => (
              <div key={loc.id} className="text-muted-foreground">
                {loc.name}
                {loc.city ? ` · ${loc.city}` : ""}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">
              Planning
            </CardTitle>
            <CardDescription>Bientôt disponible (Phase 1)</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">
              Employés
            </CardTitle>
            <CardDescription>Bientôt disponible (Phase 1)</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
