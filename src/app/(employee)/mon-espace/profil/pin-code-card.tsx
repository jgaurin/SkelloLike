"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Affiche le code de badgeuse (PIN à 4 chiffres) de l'employé, masqué par
 * défaut. L'employé le révèle d'un clic pour le saisir sur la borne.
 */
export function PinCodeCard({ pinCode }: { pinCode: string | null }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <KeyRound className="size-4 text-primary" />
        Code de badgeuse
      </div>

      {pinCode ? (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-mono text-3xl font-semibold tracking-[0.4em]">
              {revealed ? pinCode : "••••"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? "Masquer le code" : "Afficher le code"}
            >
              {revealed ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Saisissez ce code à 4 chiffres sur la borne pour pointer votre
            arrivée, vos pauses et votre départ.
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Aucun code défini — contactez votre manager pour pouvoir pointer.
        </p>
      )}
    </div>
  );
}
