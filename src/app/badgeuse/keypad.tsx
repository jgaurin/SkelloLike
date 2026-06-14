"use client";

import { useState, useTransition } from "react";
import { Delete, LogIn, LogOut, Coffee, Play } from "lucide-react";

import {
  lookupByPin,
  clockArrive,
  clockLeave,
  clockBreakStart,
  clockBreakEnd,
  type ClockState,
} from "./actions";
import { Button } from "@/components/ui/button";

type Identified = {
  employeeId: string;
  name: string;
  state: ClockState;
  clockId: string | null;
};

export function Keypad({ locationId }: { locationId: string }) {
  const [pin, setPin] = useState("");
  const [person, setPerson] = useState<Identified | null>(null);
  const [isPending, startTransition] = useTransition();
  const [flash, setFlash] = useState<
    null | { type: "success" | "error"; text: string }
  >(null);

  const reset = () => {
    setPin("");
    setPerson(null);
  };

  const showFlash = (type: "success" | "error", text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 3500);
  };

  const press = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) identify(next);
  };

  const identify = (code: string) => {
    startTransition(async () => {
      const res = await lookupByPin(locationId, code);
      if (res.ok) {
        setPerson({
          employeeId: res.employeeId,
          name: res.name,
          state: res.state,
          clockId: res.clockId,
        });
      } else {
        showFlash("error", res.error);
        setPin("");
      }
    });
  };

  const run = (
    fn: () => Promise<{ ok: boolean; message?: string; error?: string }>,
  ) => {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) showFlash("success", `${person?.name} — ${res.message}`);
      else showFlash("error", res.error ?? "Erreur.");
      reset();
    });
  };

  // ── Écran 2 : actions contextuelles après identification ─────────────────
  if (person) {
    return (
      <div className="mx-auto w-full max-w-xs space-y-5 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Bonjour</p>
          <p className="text-2xl font-semibold">{person.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {person.state === "out"
              ? "Vous n'êtes pas en service"
              : person.state === "break"
                ? "Vous êtes en pause"
                : "Vous êtes en service"}
          </p>
        </div>

        <div className="space-y-2">
          {person.state === "out" && (
            <Button
              className="h-14 w-full text-lg"
              onClick={() => run(() => clockArrive(locationId, person.employeeId))}
              disabled={isPending}
            >
              <LogIn className="size-5" />
              Arrivée
            </Button>
          )}

          {person.state === "in" && person.clockId && (
            <>
              <Button
                variant="outline"
                className="h-14 w-full text-lg"
                onClick={() => run(() => clockBreakStart(person.clockId!))}
                disabled={isPending}
              >
                <Coffee className="size-5" />
                Partir en pause
              </Button>
              <Button
                className="h-14 w-full text-lg"
                onClick={() => run(() => clockLeave(person.clockId!))}
                disabled={isPending}
              >
                <LogOut className="size-5" />
                Fin de service
              </Button>
            </>
          )}

          {person.state === "break" && person.clockId && (
            <>
              <Button
                className="h-14 w-full text-lg"
                onClick={() => run(() => clockBreakEnd(person.clockId!))}
                disabled={isPending}
              >
                <Play className="size-5" />
                Reprendre le service
              </Button>
              <Button
                variant="outline"
                className="h-14 w-full text-lg"
                onClick={() => run(() => clockLeave(person.clockId!))}
                disabled={isPending}
              >
                <LogOut className="size-5" />
                Fin de service
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={reset}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  // ── Écran 1 : saisie du PIN ──────────────────────────────────────────────
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return (
    <div className="mx-auto w-full max-w-xs space-y-6">
      {flash && (
        <div
          className={`rounded-xl p-4 text-center font-medium ${
            flash.type === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
        >
          {flash.text}
        </div>
      )}

      <div className="flex justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`size-4 rounded-full ${
              i < pin.length ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <Button
            key={k}
            variant="outline"
            className="h-16 text-2xl font-semibold"
            onClick={() => press(k)}
            disabled={isPending}
          >
            {k}
          </Button>
        ))}
        <div />
        <Button
          variant="outline"
          className="h-16 text-2xl font-semibold"
          onClick={() => press("0")}
          disabled={isPending}
        >
          0
        </Button>
        <Button
          variant="ghost"
          className="h-16"
          onClick={() => setPin((p) => p.slice(0, -1))}
          disabled={isPending || pin.length === 0}
          aria-label="Effacer"
        >
          <Delete className="size-6" />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Saisissez votre code à 4 chiffres.
      </p>
    </div>
  );
}
