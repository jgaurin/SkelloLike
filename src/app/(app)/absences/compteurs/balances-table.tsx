"use client";

import { useState, useTransition } from "react";
import { Pencil, CalendarClock } from "lucide-react";
import { toast } from "sonner";

import { upsertLeaveBalance } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type BalanceRow = {
  employeeId: string;
  employee: string;
  typeId: string;
  type: string;
  typeColor: string;
  acquired: number;
  adjusted: number;
  taken: number;
  remaining: number;
};

function EditDialog({
  row,
  year,
  onClose,
}: {
  row: BalanceRow;
  year: number;
  onClose: () => void;
}) {
  const [adjusted, setAdjusted] = useState(row.adjusted);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await upsertLeaveBalance(
        row.employeeId,
        row.typeId,
        year,
        adjusted,
      );
      if (res.ok) {
        toast.success("Solde mis à jour.");
        onClose();
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  const remaining = row.acquired + adjusted - row.taken;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajuster le solde</DialogTitle>
          <DialogDescription>
            {row.employee} · {row.type} · {year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Acquis (automatique)</span>
            <span className="font-medium">{row.acquired} j</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjusted">Ajustement (+/−)</Label>
            <Input
              id="adjusted"
              type="number"
              step="0.5"
              value={adjusted}
              onChange={(e) => setAdjusted(Number(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Correction manuelle (report de l&apos;an dernier, régularisation…).
              L&apos;acquis se calcule automatiquement selon le contrat.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Pris : {row.taken} · Restant
            </span>
            <span className="font-semibold text-primary">{remaining} j</span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BalancesTable({
  rows,
  year,
  canManage,
  hasData,
}: {
  rows: BalanceRow[];
  year: number;
  canManage: boolean;
  hasData: boolean;
}) {
  const [editing, setEditing] = useState<BalanceRow | null>(null);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <CalendarClock className="size-10 text-muted-foreground/40" />
        <h3 className="mt-4 font-medium">Pas de compteur à afficher</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Il faut des employés actifs et des types d&apos;absence avec décompte
          (Congés payés, RTT…).
        </p>
      </div>
    );
  }

  // Regroupe par employé pour des sous-en-têtes lisibles.
  const byEmployee = new Map<string, BalanceRow[]>();
  for (const r of rows) {
    const arr = byEmployee.get(r.employee) ?? [];
    arr.push(r);
    byEmployee.set(r.employee, arr);
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Acquis</TableHead>
              <TableHead className="text-right">Pris</TableHead>
              <TableHead className="text-right">Restant</TableHead>
              {canManage && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...byEmployee.entries()].map(([emp, empRows]) =>
              empRows.map((r, i) => (
                <TableRow key={`${r.employeeId}-${r.typeId}`}>
                  <TableCell className="font-medium">
                    {i === 0 ? emp : ""}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: r.typeColor }}
                      />
                      {r.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.acquired + r.adjusted}
                    {r.adjusted !== 0 && (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        ({r.acquired}
                        {r.adjusted > 0 ? "+" : ""}
                        {r.adjusted})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {r.taken}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        r.remaining < 0
                          ? "font-semibold text-destructive tabular-nums"
                          : "font-semibold text-primary tabular-nums"
                      }
                    >
                      {r.remaining}
                    </span>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditing(r)}
                        aria-label="Ajuster"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )),
            )}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <EditDialog
          row={editing}
          year={year}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
