"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { regularizeClock, deleteClock } from "./actions";
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
} from "@/components/ui/dialog";

export function RegularizeButton({
  employeeId,
  locationId,
  day,
  name,
  inTime,
  outTime,
}: {
  employeeId: string;
  locationId: string;
  day: string;
  name: string;
  inTime: string | null;
  outTime: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(inTime ?? "09:00");
  const [end, setEnd] = useState(outTime ?? "");
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await regularizeClock(
        employeeId,
        locationId,
        day,
        start,
        end,
      );
      if (res.ok) {
        toast.success("Pointage régularisé.");
        setOpen(false);
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  const remove = () => {
    startTransition(async () => {
      const res = await deleteClock(employeeId, locationId, day);
      if (res.ok) {
        toast.success("Pointage supprimé.");
        setOpen(false);
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setOpen(true)}
        aria-label="Régulariser"
      >
        <Pencil className="size-4" />
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Régulariser le pointage</DialogTitle>
          <DialogDescription>
            {name} ·{" "}
            {new Date(day + "T12:00:00").toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="reg_in">Entrée</Label>
            <Input
              id="reg_in"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg_out">Sortie</Label>
            <Input
              id="reg_out"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {(inTime || outTime) && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={remove}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
              Supprimer
            </Button>
          )}
          <Button onClick={save} disabled={isPending}>
            {isPending ? "…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
