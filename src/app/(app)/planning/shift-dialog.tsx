"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

import { createShift, updateShift, deleteShift } from "./actions";
import { createPositionQuick } from "@/app/(app)/parametres/postes/actions";
import { shiftHours } from "@/lib/week";
import { autoBreakMinutes, type BreakRule } from "@/lib/breaks";
import { PRESET_COLORS } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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

/** Formate une durée en heures décimales -> "7h" / "7h30". */
function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export function ShiftDialog({
  open,
  onOpenChange,
  draft,
  alertMessages = [],
  locationId,
  weekStart,
  employees,
  positions,
  breakRules,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  draft: ShiftDraft | null;
  alertMessages?: string[];
  locationId: string;
  weekStart: string;
  employees: Employee[];
  positions: Position[];
  breakRules: BreakRule[];
}) {
  const [isPending, startTransition] = useTransition();
  const [start, setStart] = useState(draft?.start_time ?? "09:00");
  const [end, setEnd] = useState(draft?.end_time ?? "17:00");

  // Pause : contrôlée, recalculée auto quand on change les heures.
  // En création, on part de la pause auto ; en édition, on garde la valeur existante.
  const [breakMin, setBreakMin] = useState<number>(
    draft?.id
      ? (draft?.break_minutes ?? 0)
      : autoBreakMinutes(
          draft?.start_time ?? "09:00",
          draft?.end_time ?? "17:00",
          breakRules,
        ),
  );
  // Tant que l'utilisateur n'a pas édité la pause à la main, on la garde auto.
  const [breakTouched, setBreakTouched] = useState(false);

  const applyTimes = (s: string, e: string) => {
    setStart(s);
    setEnd(e);
    if (!breakTouched) {
      setBreakMin(autoBreakMinutes(s, e, breakRules));
    }
  };

  // Liste locale des postes (pour ajouter un poste créé à la volée).
  const [posList, setPosList] = useState<Position[]>(positions);
  const [selectedPos, setSelectedPos] = useState<string>(
    draft?.position_id ?? NONE,
  );
  // Mini-formulaire de création de poste inline.
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(PRESET_COLORS[0]);
  const [savingPos, setSavingPos] = useState(false);

  const createNewPosition = () => {
    if (!newName.trim()) return;
    setSavingPos(true);
    startTransition(async () => {
      const res = await createPositionQuick(newName, newColor);
      setSavingPos(false);
      if (res.ok) {
        setPosList((prev) => [...prev, res.position]);
        setSelectedPos(res.position.id);
        setCreating(false);
        setNewName("");
        toast.success("Poste créé.");
      } else {
        toast.error(res.error);
      }
    });
  };

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

  const hours = shiftHours(start, end, breakMin);

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

          <div className="space-y-5 py-4">
            {/* Section 1 — Affectation */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
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

              <div className="space-y-1.5">
                <Label htmlFor="position_id">Poste</Label>
                {/* La valeur réelle envoyée au formulaire. */}
                <input type="hidden" name="position_id" value={selectedPos} />
                {!creating ? (
                  <>
                    <Select value={selectedPos} onValueChange={setSelectedPos}>
                      <SelectTrigger id="position_id">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Aucun</SelectItem>
                        {posList.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: p.color }}
                              />
                              {p.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => setCreating(true)}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Plus className="size-3" />
                      Créer un poste
                    </button>
                  </>
                ) : (
                  /* Mini-formulaire de création inline. */
                  <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-2">
                    <Input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          createNewPosition();
                        }
                      }}
                      placeholder="Nom du poste"
                      className="h-8"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewColor(c)}
                          className={cn(
                            "size-5 rounded-full",
                            newColor === c && "ring-2 ring-ring ring-offset-1",
                          )}
                          style={{ backgroundColor: c }}
                          aria-label={`Couleur ${c}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 flex-1"
                        onClick={createNewPosition}
                        disabled={savingPos || !newName.trim()}
                      >
                        <Check className="size-3.5" />
                        {savingPos ? "…" : "Créer"}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => {
                          setCreating(false);
                          setNewName("");
                        }}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2 — Horaires (encadré pour regrouper visuellement) */}
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start_time">Début</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={start}
                    onChange={(e) => applyTimes(e.target.value, end)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end_time">Fin</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    value={end}
                    onChange={(e) => applyTimes(start, e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="break_minutes">Pause (min)</Label>
                  <Input
                    id="break_minutes"
                    name="break_minutes"
                    type="number"
                    min="0"
                    step="5"
                    value={breakMin}
                    onChange={(e) => {
                      setBreakTouched(true);
                      setBreakMin(Number(e.target.value) || 0);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 border-t pt-2 text-sm">
                <span className="text-muted-foreground">Durée travaillée :</span>
                <span className="font-semibold text-primary">
                  {formatDuration(hours)}
                </span>
                {!breakTouched && breakMin > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    pause auto : {breakMin} min
                  </span>
                )}
              </div>
            </div>

            {/* Section 3 — Note */}
            <div className="space-y-1.5">
              <Label htmlFor="note_manager">Note interne</Label>
              <Textarea
                id="note_manager"
                name="note_manager"
                rows={2}
                placeholder="Visible par les managers uniquement"
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
