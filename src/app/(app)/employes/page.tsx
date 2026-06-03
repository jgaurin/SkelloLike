import Link from "next/link";
import { Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { EmployeeStatusBadge } from "@/components/employees/status-badge";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export default async function EmployeesPage() {
  const ctx = await getAppContext();
  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, email, phone, employee_number, status, hire_date")
    .order("last_name", { ascending: true });

  return (
    <>
      <AppHeader title="Employés" fullName={ctx.fullName} email={ctx.email} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {employees?.length ?? 0} employé{(employees?.length ?? 0) > 1 ? "s" : ""}
            </h2>
            <p className="text-sm text-muted-foreground">
              Gérez les fiches RH de {ctx.orgName}.
            </p>
          </div>
          <EmployeeFormDialog />
        </div>

        {employees?.length ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Entrée</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id} className="cursor-pointer">
                    <TableCell>
                      <Link
                        href={`/employes/${emp.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {initials(emp.first_name, emp.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {emp.first_name} {emp.last_name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {emp.email ?? emp.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {emp.employee_number ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {emp.hire_date
                        ? new Date(emp.hire_date).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <EmployeeStatusBadge status={emp.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <h3 className="mt-4 font-medium">Aucun employé</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajoutez votre premier employé pour commencer.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
