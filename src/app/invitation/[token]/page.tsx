import { createAdminClient } from "@/lib/supabase/admin";
import { AcceptForm } from "./accept-form";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invitations")
    .select(
      "email, accepted_at, expires_at, employees(first_name, last_name), organizations(name)",
    )
    .eq("token", token)
    .maybeSingle();

  const invalid =
    !invite ||
    !!invite.accepted_at ||
    new Date(invite.expires_at) < new Date();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            SkelloLike
          </h1>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {invalid ? (
            <div className="text-center">
              <h2 className="font-semibold">Invitation invalide</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ce lien est expiré ou déjà utilisé. Demandez une nouvelle
                invitation à votre manager.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold">
                Bienvenue chez {invite.organizations?.name} 👋
              </h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Créez votre compte pour accéder à votre planning.
              </p>
              <AcceptForm
                token={token}
                email={invite.email}
                defaultFirstName={invite.employees?.first_name ?? ""}
                defaultLastName={invite.employees?.last_name ?? ""}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
