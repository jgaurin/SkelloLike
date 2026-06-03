"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updateBreakRules } from "./actions";
import type { BreakRule } from "@/lib/breaks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BreakRulesEditor({
  locationId,
  locationName,
  initialRules,
  canManage,
}: {
  locationId: string;
  locationName: string;
  initialRules: BreakRule[];
  canManage: boolean;
}) {
  const [rules, setRules] = useState<BreakRule[]>(
    initialRules.length
      ? initialRules
      : [{ min_hours: 6, break_minutes: 30 }],
  );
  const [isPending, startTransition] = useTransition();

  const update = (i: number, patch: Partial<BreakRule>) =>
    setRules((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );

  const addRule = () =>
    setRules((prev) => [...prev, { min_hours: 8, break_minutes: 45 }]);

  const removeRule = (i: number) =>
    setRules((prev) => prev.filter((_, idx) => idx !== i));

  const save = () => {
    startTransition(async () => {
      const res = await updateBreakRules(locationId, rules);
      if (res.ok) toast.success("Règles de pause enregistrées.");
      else toast.error(res.error ?? "Erreur.");
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Une pause est appliquée automatiquement selon la durée du shift. La
        règle au seuil le plus élevé atteint l&apos;emporte. Exemple : « à
        partir de 6h → 30 min ».
      </p>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 text-xs font-medium text-muted-foreground">
          <span>À partir de (heures)</span>
          <span>Pause (minutes)</span>
          <span />
        </div>
        {rules.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_auto] items-center gap-3"
          >
            <Input
              type="number"
              min="0"
              step="0.5"
              value={r.min_hours}
              disabled={!canManage}
              onChange={(e) =>
                update(i, { min_hours: Number(e.target.value) || 0 })
              }
            />
            <Input
              type="number"
              min="0"
              step="5"
              value={r.break_minutes}
              disabled={!canManage}
              onChange={(e) =>
                update(i, { break_minutes: Number(e.target.value) || 0 })
              }
            />
            {canManage && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground hover:text-destructive"
                onClick={() => removeRule(i)}
                aria-label="Supprimer le palier"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {canManage && (
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={addRule}>
            <Plus className="size-4" />
            Ajouter un palier
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      )}
    </div>
  );
}
