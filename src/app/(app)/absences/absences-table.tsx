"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, X, Trash2, CalendarOff } from "lucide-react";
import { toast } from "sonner";

import {
  reviewAbsenceRequest,
  deleteAbsenceRequest,
} from "./actions";
import { AbsenceStatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Status = "pending" | "approved" | "rejected" | "cancelled";

export type AbsenceRow = {
  id: string;
  start_date: string;
  end_date: string;
  status: Status;
  comment: string | null;
  employee: string;
  type: string;
  typeColor: string;
};

function fmt(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("fr-FR");
}

/** Nombre de jours (calendaires) couverts par une absence. */
function dayCount(start: string, end: string) {
  const ms =
    new Date(end + "T12:00:00").getTime() -
    new Date(start + "T12:00:00").getTime();
  return Math.round(ms / 86400000) + 1;
}

export function AbsencesTable({
  absences,
  canManage,
}: {
  absences: AbsenceRow[];
  canManage: boolean;
}) {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      filter === "all" ? absences : absences.filter((a) => a.status === filter),
    [absences, filter],
  );

  const review = (id: string, decision: "approved" | "rejected") => {
    startTransition(async () => {
      const res = await reviewAbsenceRequest(id, decision);
      if (res.ok)
        toast.success(decision === "approved" ? "Validée." : "Refusée.");
      else toast.error(res.error ?? "Erreur.");
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      const res = await deleteAbsenceRequest(id);
      if (res.ok) toast.success("Supprimée.");
      else toast.error(res.error ?? "Erreur.");
    });
  };

  const pendingCount = absences.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as Status | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="pending">
              En attente {pendingCount > 0 ? `(${pendingCount})` : ""}
            </SelectItem>
            <SelectItem value="approved">Validées</SelectItem>
            <SelectItem value="rejected">Refusées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <CalendarOff className="size-10 text-muted-foreground/40" />
          <h3 className="mt-4 font-medium">Aucune absence</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Les demandes de congés apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Jours</TableHead>
                <TableHead>Statut</TableHead>
                {canManage && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.employee}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: a.typeColor }}
                      />
                      {a.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fmt(a.start_date)} → {fmt(a.end_date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dayCount(a.start_date, a.end_date)}
                  </TableCell>
                  <TableCell>
                    <AbsenceStatusBadge status={a.status} />
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {a.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 text-primary hover:text-primary"
                              onClick={() => review(a.id, "approved")}
                              disabled={isPending}
                              aria-label="Valider"
                            >
                              <Check className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => review(a.id, "rejected")}
                              disabled={isPending}
                              aria-label="Refuser"
                            >
                              <X className="size-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(a.id)}
                          disabled={isPending}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
