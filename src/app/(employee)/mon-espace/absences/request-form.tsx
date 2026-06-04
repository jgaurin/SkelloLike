"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { requestAbsence, type RequestState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type AbsenceType = { id: string; name: string };

const initialState: RequestState = {};

export function RequestForm({ types }: { types: AbsenceType[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    requestAbsence,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Demande envoyée. Votre manager va la traiter.");
      setOpen(false);
    }
  }, [state.success]);

  if (types.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun type d&apos;absence n&apos;est ouvert aux demandes pour le moment.
      </p>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Demander une absence
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Demander une absence</DialogTitle>
            <DialogDescription>
              Votre manager recevra la demande pour validation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type_id">Type *</Label>
              <Select name="type_id" required>
                <SelectTrigger id="type_id">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_date">Du *</Label>
                <Input id="start_date" name="start_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Au *</Label>
                <Input id="end_date" name="end_date" type="date" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Commentaire</Label>
              <Textarea id="comment" name="comment" rows={2} />
            </div>
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer la demande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
