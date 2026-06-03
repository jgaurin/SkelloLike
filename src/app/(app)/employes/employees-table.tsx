"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Search, Trash2, Archive, X } from "lucide-react";
import { toast } from "sonner";

import {
  deleteEmployees,
  archiveEmployees,
  type BulkResult,
} from "./actions";
import { EmployeeStatusBadge } from "@/components/employees/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

export type EmployeeRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  employee_number: string | null;
  status: "active" | "inactive" | "archived";
  hire_date: string | null;
};

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

type PendingAction = "delete" | "archive" | null;

export function EmployeesTable({
  employees,
  canManage,
}: {
  employees: EmployeeRow[];
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      `${e.first_name} ${e.last_name} ${e.email ?? ""} ${e.employee_number ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [employees, query]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((e) => selected.has(e.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((e) => next.delete(e.id));
      } else {
        filtered.forEach((e) => next.add(e.id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const runBulk = (
    fn: (ids: string[]) => Promise<BulkResult>,
    successLabel: string,
  ) => {
    const ids = Array.from(selected);
    startTransition(async () => {
      const res = await fn(ids);
      if (res.ok) {
        toast.success(`${res.count ?? ids.length} ${successLabel}`);
        setSelected(new Set());
      } else {
        toast.error(res.error ?? "Une erreur est survenue.");
      }
      setConfirm(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un employé…"
          className="pl-9"
        />
      </div>

      {/* Barre d'actions de masse */}
      {canManage && someSelected && (
        <div className="flex items-center gap-3 rounded-lg border bg-accent/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirm("archive")}
              disabled={isPending}
            >
              <Archive className="size-4" />
              Archiver
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirm("delete")}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
              Supprimer
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setSelected(new Set())}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {canManage && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Tout sélectionner"
                  />
                </TableHead>
              )}
              <TableHead>Nom</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Matricule</TableHead>
              <TableHead>Entrée</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 6 : 5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Aucun employé ne correspond à « {query} ».
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((emp) => (
                <TableRow
                  key={emp.id}
                  data-state={selected.has(emp.id) ? "selected" : undefined}
                >
                  {canManage && (
                    <TableCell>
                      <Checkbox
                        checked={selected.has(emp.id)}
                        onCheckedChange={() => toggleOne(emp.id)}
                        aria-label={`Sélectionner ${emp.first_name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Link
                      href={`/employes/${emp.id}`}
                      className="flex items-center gap-3 hover:underline"
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation suppression */}
      <AlertDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selected.size} employé{selected.size > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les contrats et absences liés seront
              également supprimés. Pour conserver l&apos;historique, préférez
              l&apos;archivage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                runBulk(deleteEmployees, "employé(s) supprimé(s).");
              }}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? "Suppression…" : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation archivage */}
      <AlertDialog
        open={confirm === "archive"}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Archiver {selected.size} employé{selected.size > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Les employés archivés n&apos;apparaîtront plus dans les plannings
              mais leur historique est conservé. Vous pourrez les réactiver.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                runBulk(archiveEmployees, "employé(s) archivé(s).");
              }}
              disabled={isPending}
            >
              {isPending ? "Archivage…" : "Archiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
