"use client";

import { useState, useTransition } from "react";
import { Delete, LogIn, LogOut } from "lucide-react";

import { clockWithPin } from "./actions";
import { Button } from "@/components/ui/button";

export function Keypad({ locationId }: { locationId: string }) {
  const [pin, setPin] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    | null
    | { type: "in" | "out"; name: string; time: string }
    | { type: "error"; message: string }
  >(null);

  const press = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) submit(next);
  };

  const submit = (code: string) => {
    startTransition(async () => {
      const res = await clockWithPin(locationId, code);
      if (res.ok) {
        setFeedback({ type: res.action, name: res.name, time: res.time });
      } else {
        setFeedback({ type: "error", message: res.error });
      }
      setPin("");
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="mx-auto w-full max-w-xs space-y-6">
      {/* Retour visuel du dernier pointage */}
      {feedback && (
        <div
          className={`rounded-xl p-4 text-center ${
            feedback.type === "error"
              ? "bg-destructive/10 text-destructive"
              : feedback.type === "in"
                ? "bg-primary/10 text-primary"
                : "bg-sky-100 text-sky-700"
          }`}
        >
          {feedback.type === "error" ? (
            <p className="font-medium">{feedback.message}</p>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                {feedback.type === "in" ? (
                  <LogIn className="size-5" />
                ) : (
                  <LogOut className="size-5" />
                )}
                {feedback.type === "in" ? "Bonjour" : "À bientôt"} {feedback.name}
              </div>
              <p className="text-sm">
                {feedback.type === "in" ? "Entrée" : "Sortie"} pointée à{" "}
                {feedback.time}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Affichage du PIN */}
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

      {/* Pavé numérique */}
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
        Saisissez votre code à 4 chiffres pour pointer.
      </p>
    </div>
  );
}
