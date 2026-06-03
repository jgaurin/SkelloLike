"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { setEmployeePositions } from "./position-actions";
import { cn } from "@/lib/utils";

type Position = { id: string; name: string; color: string };

export function PositionsPanel({
  employeeId,
  allPositions,
  assignedIds,
  canManage,
}: {
  employeeId: string;
  allPositions: Position[];
  assignedIds: string[];
  canManage: boolean;
}) {
  const [assigned, setAssigned] = useState<Set<string>>(
    new Set(assignedIds),
  );
  const [isPending, startTransition] = useTransition();

  const toggle = (id: string) => {
    if (!canManage) return;
    const next = new Set(assigned);
    next.has(id) ? next.delete(id) : next.add(id);
    setAssigned(next);

    startTransition(async () => {
      const res = await setEmployeePositions(employeeId, Array.from(next));
      if (!res.ok) {
        toast.error(res.error ?? "Erreur.");
        setAssigned(new Set(assigned)); // rollback
      }
    });
  };

  if (allPositions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun poste défini. Créez-en dans Paramètres → Postes.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allPositions.map((pos) => {
        const isOn = assigned.has(pos.id);
        return (
          <button
            key={pos.id}
            type="button"
            disabled={!canManage || isPending}
            onClick={() => toggle(pos.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition",
              isOn
                ? "border-transparent text-white"
                : "border-border bg-background text-muted-foreground hover:bg-accent",
              !canManage && "cursor-default",
            )}
            style={isOn ? { backgroundColor: pos.color } : undefined}
          >
            {isOn && <Check className="size-3.5" />}
            {pos.name}
          </button>
        );
      })}
    </div>
  );
}
