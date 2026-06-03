import { CalendarDays, Clock, Users, CalendarOff } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();

  const [{ count: employeeCount }, { data: locations }] = await Promise.all([
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("locations").select("id, name, city"),
  ]);

  const stats = [
    {
      label: "Employés actifs",
      value: employeeCount ?? 0,
      icon: Users,
    },
    {
      label: "Établissements",
      value: locations?.length ?? 0,
      icon: CalendarDays,
    },
    { label: "Shifts cette semaine", value: 0, icon: Clock },
    { label: "Absences en attente", value: 0, icon: CalendarOff },
  ];

  return (
    <>
      <AppHeader
        title="Tableau de bord"
        fullName={ctx.fullName}
        email={ctx.email}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Bonjour {ctx.fullName.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            Voici un aperçu de {ctx.orgName}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vos établissements</CardTitle>
            <CardDescription>
              Gérez les plannings de chaque site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {locations?.length ? (
              locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{loc.name}</span>
                  <span className="text-muted-foreground">
                    {loc.city ?? "—"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun établissement pour l&apos;instant.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
