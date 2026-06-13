import Link from "next/link";
import { Clock, Users, CalendarOff, Wallet, AlertTriangle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { getLocationContext } from "@/lib/auth/location-context";
import { AppHeader } from "@/components/layout/app-header";
import { getMonday, weekDates, trimSeconds, shiftHours } from "@/lib/week";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const { currentId, currentName } = await getLocationContext();

  const weekStart = getMonday();
  const days = weekDates(weekStart);

  // Employés rattachés au site courant.
  const { data: siteRows } = await supabase
    .from("employee_locations")
    .select("employee_id")
    .eq("location_id", currentId);
  const siteIds = (siteRows ?? []).map((r) => r.employee_id);
  const safeIds = siteIds.length
    ? siteIds
    : ["00000000-0000-0000-0000-000000000000"];

  const [
    { count: employeeCount },
    { data: weekShiftRows },
    { count: pendingAbsences },
    { data: contracts },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .in("id", safeIds),
    // Shifts de la semaine en cours pour cet établissement.
    supabase
      .from("shifts")
      .select(
        "employee_id, start_time, end_time, break_minutes, status, schedules!inner(location_id)",
      )
      .gte("shift_date", days[0])
      .lte("shift_date", days[6])
      .eq("schedules.location_id", currentId),
    // Demandes d'absence en attente pour les employés du site.
    supabase
      .from("absence_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .in("employee_id", safeIds),
    supabase
      .from("contracts")
      .select("employee_id, hourly_rate, start_date")
      .in("employee_id", safeIds)
      .order("start_date", { ascending: false }),
  ]);

  // Taux horaire le plus récent par employé.
  const rateByEmp = new Map<string, number>();
  for (const c of contracts ?? []) {
    if (!rateByEmp.has(c.employee_id)) {
      rateByEmp.set(c.employee_id, Number(c.hourly_rate ?? 0));
    }
  }

  // Heures planifiées + masse salariale estimée (semaine en cours).
  let weekHours = 0;
  let payrollMass = 0;
  for (const s of weekShiftRows ?? []) {
    const h = shiftHours(
      trimSeconds(s.start_time),
      trimSeconds(s.end_time),
      s.break_minutes,
    );
    weekHours += h;
    if (s.employee_id) {
      payrollMass += h * (rateByEmp.get(s.employee_id) ?? 0);
    }
  }

  const stats = [
    {
      label: "Employés actifs",
      value: String(employeeCount ?? 0),
      icon: Users,
      href: "/employes",
    },
    {
      label: "Heures planifiées (sem.)",
      value: `${weekHours.toFixed(0)}h`,
      icon: Clock,
      href: "/planning",
    },
    {
      label: "Masse salariale est. (sem.)",
      value: `${payrollMass.toFixed(0)} €`,
      icon: Wallet,
      href: "/rapports",
    },
    {
      label: "Absences en attente",
      value: String(pendingAbsences ?? 0),
      icon: CalendarOff,
      href: "/absences",
    },
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
            Aperçu de {currentName} · semaine en cours.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition hover:border-primary/40 hover:shadow-sm">
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
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accès rapide</CardTitle>
              <CardDescription>Vos actions courantes.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/planning">Ouvrir le planning</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/employes">Gérer les employés</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/absences">Valider les absences</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/rapports">Exporter la pré-paie</Link>
              </Button>
            </CardContent>
          </Card>

          {(pendingAbsences ?? 0) > 0 ? (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="size-4" />
                  À traiter
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <Link
                  href="/absences"
                  className="font-medium text-amber-800 hover:underline dark:text-amber-200"
                >
                  {pendingAbsences} demande
                  {(pendingAbsences ?? 0) > 1 ? "s" : ""} d&apos;absence en
                  attente de validation →
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tout est à jour ✅</CardTitle>
                <CardDescription>
                  Aucune demande d&apos;absence en attente.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
