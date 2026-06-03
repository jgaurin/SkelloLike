"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { createShift, updateShift, deleteShift } from "./actions";
import { shiftHours } from "@/lib/week";
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
} from "@/components/ui/dialog";

export type Employee = { id: string; first_name: string; last_name: string };
export type Position = { id: string; name: string; color: string };

export type ShiftDraft = {
  id?: string;
  employee_id: string | null;
  position_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  note_manager: string | null;
};

const NONE = "__none__";

export function ShiftDialog({
  open,
  onOpenChange,
  draft,
  alertMessages = [],
  locationId,
  weekStart,
  employees,
  positions,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  draft: ShiftDraft | null;
  alertMessages?: string[];
  locationId: string;
  weekStart: string;
  employees: Employee[];
  positions: Position[];
}) {
  const [isPending, startTransition] = useTransition();
  const [start, setStart] = useState(draft?.start_time ?? "09:00");
  const [end, setEnd] = useState(draft?.end_time ?? "17:00");

  if (!draft) return null;
  const isEdit = !!draft.id;

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = isEdit
        ? await updateShift(draft.id!, formData)
        : await createShift(locationId, weekStart, formData);
      if (res.ok) {
        toast.success(isEdit ? "Shift modifié." : "Shift créé.");
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  const onDelete = () => {
    if (!draft.id) return;
    startTransition(async () => {
      const res = await deleteShift(draft.id!);
      if (res.ok) {
        toast.success("Shift supprimé.");
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  const hours = shiftHours(start, end, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form action={submit}>
          <input type="hidden" name="shift_date" value={draft.shift_date} />
          <DialogHeader>
            <DialogTitle>{isEdit ? "Modifier le shift" : "Nouveau shift"}</DialogTitle>
            <DialogDescription>
              {new Date(draft.shift_date + "T12:00:00").toLocaleDateString(
                "fr-FR",
                { weekday: "long", day: "numeric", month: "long" },
              )}
            </DialogDescription>
          </DialogHeader>

          {alertMessages.length > 0 && (
            <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4" />
                {alertMessages.length} alerte
                {alertMessages.length > 1 ? "s" : ""}
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                {alertMessages.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employé</Label>
              <Select
                name="employee_id"
                defaultValue={draft.employee_id ?? NONE}
              >
                <SelectTrigger id="employee_id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Non assigné</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.first_name} {e.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position_id">Poste</Label>
              <Select
                name="position_id"
                defaultValue={draft.position_id ?? NONE}
              >
                <SelectTrigger id="position_id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Aucun</SelectItem>
                  {positions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_time">Début</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Fin</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="break_minutes">Pause (min)</Label>
                <Input
                  id="break_minutes"
                  name="break_minutes"
                  type="number"
                  min="0"
                  step="5"
                  defaultValue={draft.break_minutes || 0}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Durée : {hours.toFixed(2).replace(".", "h").replace("h00", "h")}
            </p>

            <div className="space-y-2">
              <Label htmlFor="note_manager">Note (interne)</Label>
              <Textarea
                id="note_manager"
                name="note_manager"
                rows={2}
                defaultValue={draft.note_manager ?? ""}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={isPending}
              >
                <Trash2 className="size-4" />
                Supprimer
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "…" : isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
