import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAppContext } from "@/lib/auth/context";
import { isSuperAdminEmail } from "@/lib/auth/super-admin";
import { AppHeader } from "@/components/layout/app-header";
import { AccessRequestsManager, type AccessRequest } from "./requests-manager";

/**
 * Écran super-admin plateforme : liste et traitement des demandes d'accès
 * déposées depuis la landing page. Réservé aux emails SUPER_ADMIN_EMAILS.
 */
export default async function AccessRequestsPage() {
  const ctx = await getAppContext();
  if (!isSuperAdminEmail(ctx.email)) {
    notFound();
  }

  // Service role : la table est verrouillée par RLS (lecture interdite côté
  // client). L'autorisation est déjà vérifiée ci-dessus.
  const admin = createAdminClient();
  const { data: requests } = await admin
    .from("access_requests")
    .select(
      "id, company_name, contact_name, email, phone, sector, team_size, message, status, created_at",
    )
    .order("created_at", { ascending: false });

  const list = (requests ?? []) as AccessRequest[];
  const pending = list.filter((r) => r.status === "pending").length;

  return (
    <>
      <AppHeader
        title="Demandes d'accès"
        fullName={ctx.fullName}
        email={ctx.email}
      />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {list.length} demande{list.length > 1 ? "s" : ""}
            {pending > 0 ? ` · ${pending} en attente` : ""}
          </h2>
          <p className="text-sm text-muted-foreground">
            Les entreprises qui demandent un accès via la landing page.
            Approuver crée leur espace et envoie un accès au contact.
          </p>
        </div>

        <AccessRequestsManager requests={list} />
      </main>
    </>
  );
}
