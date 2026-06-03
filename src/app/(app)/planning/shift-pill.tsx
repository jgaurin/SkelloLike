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
        "block w-full truncate rounded-md text-left font-medium text-white transition",
        compact ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
        draggable && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-40",
        alert && "ring-2 ring-amber-400 ring-offset-1",
      )}
      style={{ backgroundColor: color }}
    >
      <span className="flex items-center gap-1">
        {alert && <AlertTriangle className="size-3 shrink-0" />}
        {shift.start_time} – {shift.end_time}
      </span>
      {!compact && positionName && (
        <span className="block truncate opacity-90">{positionName}</span>
      )}
    </button>
  );
}
