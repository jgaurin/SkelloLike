"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PlanningToolbar } from "./planning-toolbar";
import { moveShift } from "./actions";
import {
  ShiftDialog,
  type ShiftDraft,
  type Employee,
  type Position,
} from "./shift-dialog";
import { WEEKDAYS_SHORT, fromISODate, isToday, shiftHours } from "@/lib/week";
import { cn } from "@/lib/utils";

type Location = { id: string; name: string };

type Shift = {
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

export function PlanningBoard({
  locations,
  locationId,
  weekStart,
  days,
  employees,
  positions,
  shifts,
  published,
  canManage,
}: {
  locations: Location[];
  locationId: string;
  weekStart: string;
  days: string[];
  employees: Employee[];
  positions: Position[];
  shifts: Shift[];
  published: boolean;
  canManage: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<ShiftDraft | null>(null);

  // Copie locale des shifts pour le drag & drop optimiste.
  const [localShifts, setLocalShifts] = useState<Shift[]>(shifts);
  useEffect(() => setLocalShifts(shifts), [shifts]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const posById = new Map(positions.map((p) => [p.id, p]));

  // Index shifts par "employeeId|date".
  const cellShifts = new Map<string, Shift[]>();
  for (const s of localShifts) {
    const key = `${s.employee_id ?? "none"}|${s.shift_date}`;
    const arr = cellShifts.get(key) ?? [];
    arr.push(s);
    cellShifts.set(key, arr);
  }

  // Déplace un shift vers (employé, date) avec mise à jour optimiste.
  const handleDrop = async (employeeId: string, date: string) => {
    const id = draggingId;
    setDraggingId(null);
    setDropTarget(null);
    if (!id) return;

    const shift = localShifts.find((s) => s.id === id);
    if (!shift) return;
    if (shift.employee_id === employeeId && shift.shift_date === date) return;

    const previous = localShifts;
    setLocalShifts((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, employee_id: employeeId, shift_date: date } : s,
      ),
    );

    const res = await moveShift(id, date, employeeId);
    if (!res.ok) {
      setLocalShifts(previous); // rollback
      toast.error(res.error ?? "Déplacement impossible.");
    }
  };

  const openCreate = (employeeId: string | null, date: string) => {
    if (!canManage) return;
    setDraft({
      employee_id: employeeId,
      position_id: null,
      shift_date: date,
      start_time: "09:00",
      end_time: "17:00",
      break_minutes: 0,
      note_manager: null,
    });
    setDialogOpen(true);
  };

  const openEdit = (shift: Shift) => {
    if (!canManage) return;
    setDraft({ ...shift });
    setDialogOpen(true);
  };

  // Heures totales par employé sur la semaine.
  const totalFor = (employeeId: string) =>
    localShifts
      .filter((s) => s.employee_id === employeeId)
      .reduce(
        (sum, s) => sum + shiftHours(s.start_time, s.end_time, s.break_minutes),
        0,
      );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PlanningToolbar
        locations={locations}
        locationId={locationId}
        weekStart={weekStart}
        published={published}
        canManage={canManage}
      />

      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-[900px] overflow-hidden rounded-lg border">
          {/* En-tête jours */}
          <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b bg-muted/40 text-sm">
            <div className="p-3 font-medium">Employé</div>
            {days.map((d, i) => {
              const date = fromISODate(d);
              return (
                <div
                  key={d}
                  className={cn(
                    "border-l p-3 text-center",
                    isToday(d) && "bg-primary/5",
                  )}
                >
                  <div className="font-medium">{WEEKDAYS_SHORT[i]}</div>
                  <div className="text-xs text-muted-foreground">
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lignes employés */}
          {employees.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucun employé actif. Ajoutez des employés pour planifier.
            </div>
          ) : (
            employees.map((emp) => (
              <div
                key={emp.id}
                className="grid grid-cols-[200px_repeat(7,1fr)] border-b last:border-b-0"
              >
                <div className="flex items-center justify-between p-3">
                  <span className="truncate text-sm font-medium">
                    {emp.first_name} {emp.last_name}
                  </span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                    {totalFor(emp.id).toFixed(0)}h
                  </span>
                </div>
                {days.map((d) => {
                  const key = `${emp.id}|${d}`;
                  const cell = cellShifts.get(key) ?? [];
                  return (
                    <div
                      key={d}
                      className={cn(
                        "group min-h-16 space-y-1 border-l p-1.5 transition-colors",
                        isToday(d) && "bg-primary/5",
                        canManage && "cursor-pointer hover:bg-accent/40",
                        dropTarget === key && "bg-primary/15 ring-1 ring-inset ring-primary/40",
                      )}
                      onClick={() =>
                        cell.length === 0 && openCreate(emp.id, d)
                      }
                      onDragOver={(e) => {
                        if (!canManage || !draggingId) return;
                        e.preventDefault();
                        if (dropTarget !== key) setDropTarget(key);
                      }}
                      onDragLeave={(e) => {
                        // Ne réinitialise que si on quitte réellement la cellule.
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setDropTarget((t) => (t === key ? null : t));
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(emp.id, d);
                      }}
                    >
                      {cell.map((s) => {
                        const pos = s.position_id
                          ? posById.get(s.position_id)
                          : null;
                        const color = pos?.color ?? "#64748B";
                        return (
                          <button
                            key={s.id}
                            type="button"
                            draggable={canManage}
                            onDragStart={(e) => {
                              setDraggingId(s.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => {
                              setDraggingId(null);
                              setDropTarget(null);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(s);
                            }}
                            className={cn(
                              "block w-full rounded-md px-2 py-1 text-left text-xs font-medium text-white transition",
                              canManage && "cursor-grab active:cursor-grabbing",
                              draggingId === s.id && "opacity-40",
                            )}
                            style={{ backgroundColor: color }}
                          >
                            <div>
                              {s.start_time} – {s.end_time}
                            </div>
                            {pos && (
                              <div className="truncate opacity-90">
                                {pos.name}
                              </div>
                            )}
                          </button>
                        );
                      })}
                      {canManage && cell.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreate(emp.id, d);
                          }}
                          className="flex w-full items-center justify-center rounded-md py-0.5 text-muted-foreground opacity-0 transition hover:bg-accent group-hover:opacity-100"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      <ShiftDialog
        key={draft ? `${draft.id ?? "new"}-${draft.employee_id}-${draft.shift_date}` : "empty"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        draft={draft}
        locationId={locationId}
        weekStart={weekStart}
        employees={employees}
        positions={positions}
      />
    </div>
  );
}
