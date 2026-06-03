"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createContract,
  deleteContract,
  type ContractResult,
} from "./contract-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  interim: "Intérim",
  extra: "Extra",
  apprenticeship: "Alternance",
  internship: "Stage",
};

type Contract = {
  id: string;
  type: string;
  start_date: string;
  end_date: string | null;
  weekly_hours: number;
  hourly_rate: number | null;
};

type Position = { id: string; name: string };

const initialState: ContractResult = { ok: false };

function CreateContractDialog({
  employeeId,
  positions,
}: {
  employeeId: string;
  positions: Position[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("cdi");
  const [state, formAction, pending] = useActionState(
    createContract,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Contrat ajouté.");
      setOpen(false);
    }
  }, [state.ok]);

  const needsEndDate = type !== "cdi";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" />
          Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={formAction}>
          <input type="hidden" name="employee_id" value={employeeId} />
          <DialogHeader>
            <DialogTitle>Nouveau contrat</DialogTitle>
            <DialogDescription>
              Type, durée et rémunération de l&apos;employé.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type de contrat *</Label>
              <Select name="type" value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTRACT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_date">Début *</Label>
                <Input id="start_date" name="start_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">
                  Fin {needsEndDate ? "*" : "(CDI : aucune)"}
                </Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required={needsEndDate}
                  disabled={!needsEndDate}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="weekly_hours">Heures / sem.</Label>
                <Input
                  id="weekly_hours"
                  name="weekly_hours"
                  type="number"
                  step="0.5"
                  min="0"
                  defaultValue="35"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Taux horaire (€)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="12.50"
                />
              </div>
            </div>

            {positions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="position_id">Poste</Label>
                <Select name="position_id">
                  <SelectTrigger id="position_id">
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Ajout…" : "Ajouter le contrat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ContractsPanel({
  employeeId,
  contracts,
  positions,
  canManage,
}: {
  employeeId: string;
  contracts: Contract[];
  positions: Position[];
  canManage: boolean;
}) {
  const [deleting, setDeleting] = useState<Contract | null>(null);
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteContract(deleting.id, employeeId);
      if (res.ok) toast.success("Contrat supprimé.");
      else toast.error(res.error ?? "Erreur.");
      setDeleting(null);
    });
  };

  return (
    <div className="space-y-3">
      {canManage && (
        <div className="flex justify-end">
          <CreateContractDialog
            employeeId={employeeId}
            positions={positions}
          />
        </div>
      )}

      {contracts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun contrat enregistré.
        </p>
      ) : (
        contracts.map((c) => (
          <div
            key={c.id}
            className="flex items-start justify-between rounded-md border px-3 py-2 text-sm"
          >
            <div>
              <div className="font-medium">
                {CONTRACT_LABELS[c.type] ?? c.type} · {c.weekly_hours}h/sem
                {c.hourly_rate != null && ` · ${c.hourly_rate.toFixed(2)} €/h`}
              </div>
              <div className="text-muted-foreground">
                Depuis le {new Date(c.start_date).toLocaleDateString("fr-FR")}
                {c.end_date
                  ? ` au ${new Date(c.end_date).toLocaleDateString("fr-FR")}`
                  : ""}
              </div>
            </div>
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => setDeleting(c)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contrat ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
