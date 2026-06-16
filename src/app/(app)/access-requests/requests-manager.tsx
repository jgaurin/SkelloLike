"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Check,
  X,
  Trash2,
  Mail,
  Phone,
  Building2,
  Inbox,
} from "lucide-react";

import type { Database } from "@/lib/types/database";
import {
  approveAccessRequest,
  rejectAccessRequest,
  deleteAccessRequest,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Status = Database["public"]["Enums"]["access_request_status"];

export type AccessRequest = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  sector: string | null;
  team_size: string | null;
  message: string | null;
  status: Status;
  created_at: string;
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
};

const STATUS_VARIANT: Record<Status, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AccessRequestsManager({
  requests,
}: {
  requests: AccessRequest[];
}) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<
    | { kind: "approve" | "reject" | "delete"; req: AccessRequest }
    | null
  >(null);

  function run() {
    if (!confirm) return;
    const { kind, req } = confirm;
    startTransition(async () => {
      if (kind === "approve") {
        const res = await approveAccessRequest(req.id);
        if (res.ok) {
          toast.success(
            res.sent
              ? `Espace créé. Accès envoyé à ${req.email}.`
              : "Espace créé. Copiez le lien d'accès pour le contact.",
          );
          if (res.link && !res.sent) {
            navigator.clipboard?.writeText(res.link).catch(() => {});
          }
        } else {
          toast.error(res.error);
        }
      } else if (kind === "reject") {
        const res = await rejectAccessRequest(req.id);
        if (res.ok) toast.success("Demande rejetée.");
        else toast.error(res.error);
      } else {
        const res = await deleteAccessRequest(req.id);
        if (res.ok) toast.success("Demande supprimée.");
        else toast.error(res.error);
      }
      setConfirm(null);
    });
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <Inbox className="size-10 text-muted-foreground" />
        <div>
          <p className="font-medium">Aucune demande pour le moment</p>
          <p className="text-sm text-muted-foreground">
            Les demandes déposées sur la landing page apparaîtront ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entreprise</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Profil</TableHead>
              <TableHead>Reçue le</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    <Building2 className="size-4 text-muted-foreground" />
                    {req.company_name}
                  </div>
                  {req.message && (
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                      {req.message}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{req.contact_name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="size-3" />
                    {req.email}
                  </div>
                  {req.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="size-3" />
                      {req.phone}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {[req.sector, req.team_size && `${req.team_size} empl.`]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(req.created_at)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[req.status]}>
                    {STATUS_LABEL[req.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {req.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => setConfirm({ kind: "approve", req })}
                        >
                          <Check className="size-4" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => setConfirm({ kind: "reject", req })}
                        >
                          <X className="size-4" />
                          Rejeter
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => setConfirm({ kind: "delete", req })}
                        aria-label="Supprimer la demande"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          {confirm?.kind === "approve" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Approuver {confirm.req.company_name} ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Un espace Ritem (organisation + établissement) sera créé et un
                  accès propriétaire sera envoyé à {confirm.req.email}. Si
                  l&apos;envoi d&apos;email n&apos;est pas configuré, le lien
                  d&apos;accès sera copié dans votre presse-papier.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    run();
                  }}
                  disabled={isPending}
                >
                  {isPending ? "Création…" : "Créer l'espace"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
          {confirm?.kind === "reject" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Rejeter cette demande ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  La demande de {confirm.req.company_name} sera marquée comme
                  rejetée. Aucun espace ne sera créé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    run();
                  }}
                  disabled={isPending}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {isPending ? "…" : "Rejeter"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
          {confirm?.kind === "delete" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette demande ?</AlertDialogTitle>
                <AlertDialogDescription>
                  La demande de {confirm.req.company_name} sera définitivement
                  supprimée. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    run();
                  }}
                  disabled={isPending}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {isPending ? "Suppression…" : "Supprimer définitivement"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
