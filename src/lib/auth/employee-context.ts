import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type EmployeeContext = {
  userId: string;
  employeeId: string;
  orgId: string;
  orgName: string;
  fullName: string;
  email: string;
};

/**
 * Contexte de l'employé connecté (sa fiche + son org).
 * Redirige les managers vers /dashboard et les non-connectés vers /login.
 */
export async function getEmployeeContext(): Promise<EmployeeContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role, organizations(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");
  // Un manager n'a rien à faire dans l'espace employé.
  if (membership.role !== "employee") redirect("/dashboard");

  const { data: employee } = await supabase
    .from("employees")
    .select("id, first_name, last_name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!employee) {
    // Compte employé sans fiche rattachée : cas anormal.
    redirect("/login");
  }

  return {
    userId: user.id,
    employeeId: employee.id,
    orgId: membership.org_id,
    orgName: membership.organizations?.name ?? "Mon entreprise",
    fullName: `${employee.first_name} ${employee.last_name}`,
    email: employee.email ?? user.email ?? "",
  };
}
