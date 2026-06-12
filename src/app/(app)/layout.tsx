import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role, organizations(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  // Un employé n'a pas accès à l'espace de gestion : on le renvoie au sien.
  if (membership.role === "employee") {
    redirect("/mon-espace");
  }

  const orgName = membership.organizations?.name ?? "Mon entreprise";

  return (
    <SidebarProvider>
      <AppSidebar orgName={orgName} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
