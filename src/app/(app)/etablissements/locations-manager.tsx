"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

import {
  createLocation,
  updateLocation,
  deleteLocation,
  type LocationResult,
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

export type Location = {
  id: string;
  name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  sector: string | null;
  color: string;
};

const initialState: LocationResult = { ok: false };

/** Champs partagés entre création et édition. */
function LocationFields({ location }: { location?: Location }) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de l&apos;établissement *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={location?.name}
          placeholder="Ex : Paris République"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          name="address"
          defaultValue={location?.address ?? ""}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="postal_code">Code postal</Label>
          <Input
            id="postal_code"
            name="postal_code"
            defaultValue={location?.postal_code ?? ""}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" name="city" defaultValue={location?.city ?? ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sector">Secteur</Label>
        <Input
          id="sector"
          name="sector"
          defaultValue={location?.sector ?? ""}
          placeholder="Restauration, retail, santé…"
        />
      </div>
      <div className="space-y-2">
        <Label>Couleur</Label>
        <ColorPicker name="color" defaultValue={location?.color} />
      </div>
    </div>
  );
}

function CreateDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createLocation,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Établissement créé.");
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Ajouter un établissement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Nouvel établissement</DialogTitle>
            <DialogDescription>
              Chaque établissement a son propre planning.
            </DialogDescription>
          </DialogHeader>
          <LocationFields />
          {state.error && (
            <p className="pb-2 text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  location,
  open,
  onOpenChange,
}: {
  location: Location;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateLocation,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Établissement mis à jour.");
      onOpenChange(false);
    }
  }, [state.ok, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form action={formAction}>
          <input type="hidden" name="id" value={location.id} />
          <DialogHeader>
            <DialogTitle>Modifier l&apos;établissement</DialogTitle>
            <DialogDescription>{location.name}</DialogDescription>
          </DialogHeader>
          <LocationFields location={location} />
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

export function LocationsManager({
  locations,
  canManage,
}: {
  locations: Location[];
  canManage: boolean;
}) {
  const [editing, setEditing] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState<Location | null>(null);
  const [isPending, setIsPending] = useState(false);

  const onDelete = async () => {
    if (!deleting) return;
    setIsPending(true);
    const res = await deleteLocation(deleting.id);
    setIsPending(false);
    if (res.ok) toast.success("Établissement supprimé.");
    else toast.error(res.error ?? "Erreur.");
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <CreateDialog />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => (
          <div key={loc.id} className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${loc.color}1a`, color: loc.color }}
              >
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{loc.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {[loc.address, loc.city].filter(Boolean).join(", ") || "—"}
                </p>
                {loc.sector && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {loc.sector}
                  </p>
                )}
              </div>
            </div>
            {canManage && (
              <div className="mt-3 flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setEditing(loc)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleting(loc)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <EditDialog
          location={editing}
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
              Supprimer « {deleting?.name} » ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les équipes de cet établissement
              seront aussi supprimées.
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
