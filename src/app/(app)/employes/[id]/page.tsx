import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { EmployeeStatusBadge } from "@/components/employees/status-badge";
import { EditEmployeeForm } from "./edit-employee-form";
import { EmployeeActions } from "./employee-actions";
import { InviteButton } from "./invite-button";
import { ContractsPanel } from "./contracts-panel";
import { PositionsPanel } from "./positions-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAppContext();
  const supabase = await createClient();
  const canManage = [
    "org_owner",
    "org_admin",
    "location_manager",
    "team_manager",
  ].includes(ctx.role);
  const canManageContracts = ["org_owner", "org_admin"].includes(ctx.role);

  const { data: employee } = await supabase
    .from("employees")
    .select(
      "id, first_name, last_name, email, phone, employee_number, hire_date, status, user_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!employee) {
    notFound();
  }

  const [{ data: contracts }, { data: positions }, { data: assigned }] =
    await Promise.all([
      supabase
        .from("contracts")
        .select("id, type, start_date, end_date, weekly_hours, hourly_rate")
        .eq("employee_id", id)
        .order("start_date", { ascending: false }),
      supabase.from("positions").select("id, name, color").order("name"),
      supabase
        .from("employee_positions")
        .select("position_id")
        .eq("employee_id", id),
    ]);

  const assignedIds = (assigned ?? []).map((a) => a.position_id);

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
          <div className="flex-1">
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
          {canManage && (
            <div className="flex items-center gap-2">
              <InviteButton
                employeeId={employee.id}
                hasAccount={!!employee.user_id}
              />
              <EmployeeActions
                id={employee.id}
                name={`${employee.first_name} ${employee.last_name}`}
              />
            </div>
          )}
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
            <CardContent>
              <ContractsPanel
                employeeId={employee.id}
                contracts={contracts ?? []}
                positions={positions ?? []}
                canManage={canManageContracts}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Postes occupables</CardTitle>
              <CardDescription>
                Les postes que cet employé peut occuper sur le planning.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PositionsPanel
                employeeId={employee.id}
                allPositions={positions ?? []}
                assignedIds={assignedIds}
                canManage={canManage}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
