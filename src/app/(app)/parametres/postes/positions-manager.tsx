"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import { toast } from "sonner";

import {
  createPosition,
  updatePosition,
  deletePosition,
  type ActionResult,
} from "./actions";
import { ColorPicker } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export type Position = {
  id: string;
  name: string;
  color: string;
  default_rate: number | null;
};

const initialState: ActionResult = { ok: false };

/** Champs partagés création/édition. */
function PositionFields({ position }: { position?: Position }) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du poste *</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ex : Serveur, Cuisinier, Caissier…"
          defaultValue={position?.name}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Couleur</Label>
        <ColorPicker name="color" defaultValue={position?.color} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="default_rate">Taux horaire par défaut (€)</Label>
        <Input
          id="default_rate"
          name="default_rate"
          type="number"
          step="0.01"
          min="0"
          placeholder="Ex : 12.50"
          defaultValue={position?.default_rate ?? ""}
        />
      </div>
    </div>
  );
}

function CreateDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createPosition,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Poste créé.");
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Ajouter un poste
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Nouveau poste</DialogTitle>
            <DialogDescription>
              Les postes structurent le planning et la paie.
            </DialogDescription>
          </DialogHeader>
          <PositionFields />
          {state.error && (
            <p className="pb-2 text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer le poste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  position,
  open,
  onOpenChange,
}: {
  position: Position;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    updatePosition,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Poste mis à jour.");
      onOpenChange(false);
    }
  }, [state.ok, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form action={formAction}>
          <input type="hidden" name="id" value={position.id} />
          <DialogHeader>
            <DialogTitle>Modifier le poste</DialogTitle>
            <DialogDescription>{position.name}</DialogDescription>
          </DialogHeader>
          <PositionFields position={position} />
          {state.error && (
            <p className="pb-2 text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PositionsManager({
  positions,
  canManage,
}: {
  positions: Position[];
  canManage: boolean;
}) {
  const [editing, setEditing] = useState<Position | null>(null);
  const [deleting, setDeleting] = useState<Position | null>(null);
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deletePosition(deleting.id);
      if (res.ok) {
        toast.success("Poste supprimé.");
      } else {
        toast.error(res.error ?? "Erreur.");
      }
      setDeleting(null);
    });
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <CreateDialog />
        </div>
      )}

      {positions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Briefcase className="size-10 text-muted-foreground/40" />
          <h3 className="mt-4 font-medium">Aucun poste</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez vos postes (Serveur, Cuisinier…) pour organiser le planning.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {positions.map((pos) => (
            <div
              key={pos.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <span
                className="size-4 shrink-0 rounded-full"
                style={{ backgroundColor: pos.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{pos.name}</div>
                {pos.default_rate != null && (
                  <div className="text-xs text-muted-foreground">
                    {pos.default_rate.toFixed(2)} €/h
                  </div>
                )}
              </div>
              {canManage && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setEditing(pos)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleting(pos)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditDialog
          position={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer le poste « {deleting?.name} » ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les shifts et contrats liés à ce
              poste ne seront plus associés à aucun poste.
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
