"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { PRESET_COLORS } from "@/lib/colors";

/**
 * Sélecteur de couleur métier (postes, équipes, absences…).
 * Stocke la valeur dans un input caché pour les formulaires.
 */
export function ColorPicker({
  name,
  defaultValue = PRESET_COLORS[0],
}: {
  name: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex flex-wrap gap-2">
      <input type="hidden" name={name} value={value} />
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => setValue(color)}
          className={cn(
            "flex size-7 items-center justify-center rounded-full ring-offset-2 transition",
            value === color && "ring-2 ring-ring",
          )}
          style={{ backgroundColor: color }}
          aria-label={`Couleur ${color}`}
        >
          {value === color && <Check className="size-4 text-white" />}
        </button>
      ))}
    </div>
  );
}
