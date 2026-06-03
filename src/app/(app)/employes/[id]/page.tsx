import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { EmployeeStatusBadge } from "@/components/employees/status-badge";
import { EditEmployeeForm } from "./edit-employee-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  interim: "Intérim",
  extra: "Extra",
  apprenticeship: "Alternance",
  internship: "Stage",
};

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAppContext();
  const supabase = await createClient();

  const { data: employee } = await supabase
    .from("employees")
    .select(
      "id, first_name, last_name, email, phone, employee_number, hire_date, status",
    )
    .eq("id", id)
    .maybeSingle();

  if (!employee) {
    notFound();
  }

  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, type, start_date, end_date, weekly_hours, hourly_rate")
    .eq("employee_id", id)
    .order("start_date", { ascending: false });

  return (
    <>
      <AppHeader
        title="Fiche employé"
        fullName={ctx.fullName}
        email={ctx.email}
      />
      <main className="flex-1 space-y-6 p-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/employes">
            <ArrowLeft className="size-4" />
            Retour aux employés
          </Link>
        </Button>

        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {`${employee.first_name[0] ?? ""}${employee.last_name[0] ?? ""}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {employee.first_name} {employee.last_name}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <EmployeeStatusBadge status={employee.status} />
              {employee.employee_number && (
                <span className="text-sm text-muted-foreground">
                  Matricule {employee.employee_number}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
              <CardDescription>
                Coordonnées et statut de l&apos;employé.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditEmployeeForm employee={employee} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contrats</CardTitle>
              <CardDescription>
                {contracts?.length ?? 0} contrat(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {contracts?.length ? (
                contracts.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="font-medium">
                      {CONTRACT_LABELS[c.type] ?? c.type} · {c.weekly_hours}h/sem
                    </div>
                    <div className="text-muted-foreground">
                      Depuis le{" "}
                      {new Date(c.start_date).toLocaleDateString("fr-FR")}
                      {c.end_date
                        ? ` au ${new Date(c.end_date).toLocaleDateString("fr-FR")}`
                        : ""}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun contrat enregistré.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
