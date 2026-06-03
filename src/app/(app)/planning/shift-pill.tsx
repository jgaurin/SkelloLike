"use client";

import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

export type ShiftPillData = {
  id: string;
  employee_id: string | null;
  position_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  note_manager: string | null;
  status: string;
};

/**
 * Pastille d'un shift, réutilisée par les vues Jour / Semaine / Mois.
 * Gère le clic (édition) et le drag (déplacement).
 */
export function ShiftPill({
  shift,
  color,
  positionName,
  draggable,
  dragging,
  compact,
  alert,
  alertTitle,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  shift: ShiftPillData;
  color: string;
  positionName?: string;
  draggable: boolean;
  dragging: boolean;
  compact?: boolean;
  alert?: boolean;
  alertTitle?: string;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => {
        onDragStart();
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={alertTitle}
      className={cn(
        "relative block w-full overflow-hidden rounded-md text-left font-medium text-white transition",
        compact ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
        draggable && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-40",
      )}
      style={{ backgroundColor: color }}
    >
      {/* Liseré d'alerte : barre ambre à gauche + voile diagonal subtil. */}
      {alert && (
        <>
          <span className="absolute inset-y-0 left-0 w-1 bg-amber-400" />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(251,191,36,0.9) 0 6px, transparent 6px 12px)",
            }}
          />
        </>
      )}
      <span className={cn("relative flex items-center gap-1", alert && "pl-1.5")}>
        <span className="truncate">
          {shift.start_time} – {shift.end_time}
        </span>
        {alert && (
          <span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950">
            <AlertTriangle className="size-2.5" />
          </span>
        )}
      </span>
      {!compact && positionName && (
        <span className="relative block truncate opacity-90">
          {positionName}
        </span>
      )}
    </button>
  );
}
