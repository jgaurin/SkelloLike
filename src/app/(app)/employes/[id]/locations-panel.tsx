"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { setEmployeeLocations } from "./location-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Location = { id: string; name: string };

export function LocationsPanel({
  employeeId,
  allLocations,
  primaryId: initialPrimary,
  otherIds: initialOthers,
  canManage,
}: {
  employeeId: string;
  allLocations: Location[];
  primaryId: string | null;
  otherIds: string[];
  canManage: boolean;
}) {
  const [primary, setPrimary] = useState<string | null>(initialPrimary);
  const [others, setOthers] = useState<Set<string>>(new Set(initialOthers));
  const [isPending, startTransition] = useTransition();

  const toggleOther = (id: string) => {
    setOthers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = () => {
    if (!primary) {
      toast.error("Choisissez un établissement principal.");
      return;
    }
    startTransition(async () => {
      const res = await setEmployeeLocations(
        employeeId,
        primary,
        Array.from(others).filter((id) => id !== primary),
      );
      if (res.ok) toast.success("Établissements mis à jour.");
      else toast.error(res.error ?? "Erreur.");
    });
  };

  if (allLocations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun établissement. Créez-en dans Établissements.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {allLocations.map((loc) => {
          const isPrimary = primary === loc.id;
          const isOther = others.has(loc.id) && !isPrimary;
          return (
            <div
              key={loc.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                {canManage ? (
                  <Checkbox
                    checked={isPrimary || isOther}
                    onCheckedChange={() => {
                      if (isPrimary) return; // le principal reste coché
                      toggleOther(loc.id);
                    }}
                    disabled={isPrimary}
                    aria-label={`Rattacher à ${loc.name}`}
                  />
                ) : (
                  <span
                    className={`size-2 rounded-full ${
                      isPrimary || isOther ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
                <span className="truncate text-sm">{loc.name}</span>
                {isPrimary && (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Star className="size-3 fill-current" />
                    Principal
                  </span>
                )}
              </span>

              {canManage && !isPrimary && (isOther || isPrimary === null) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setPrimary(loc.id);
                    setOthers((prev) => {
                      const next = new Set(prev);
                      next.delete(loc.id);
                      return next;
                    });
                  }}
                >
                  Définir principal
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      )}
    </div>
  );
}
