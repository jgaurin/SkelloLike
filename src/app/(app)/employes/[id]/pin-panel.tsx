"use client";

import { useState, useTransition } from "react";
import { KeyRound, Shuffle } from "lucide-react";
import { toast } from "sonner";

import { setEmployeePin } from "./pin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PinPanel({
  employeeId,
  initialPin,
  canManage,
}: {
  employeeId: string;
  initialPin: string | null;
  canManage: boolean;
}) {
  const [pin, setPin] = useState(initialPin ?? "");
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const save = (value: string) => {
    startTransition(async () => {
      const res = await setEmployeePin(employeeId, value);
      if (res.ok) {
        setPin(res.pin);
        setDraft("");
        toast.success("Code PIN enregistré.");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <KeyRound className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">Code de pointage :</span>
        <span className="font-mono text-base font-semibold tracking-widest">
          {pin || "— — — —"}
        </span>
      </div>

      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={draft}
            onChange={(e) =>
              setDraft(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="4 chiffres"
            inputMode="numeric"
            className="w-28 font-mono tracking-widest"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => save(draft)}
            disabled={isPending || draft.length !== 4}
          >
            Définir
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => save("")}
            disabled={isPending}
          >
            <Shuffle className="size-4" />
            Générer
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        L&apos;employé saisit ce code sur la badgeuse pour pointer.
      </p>
    </div>
  );
}
