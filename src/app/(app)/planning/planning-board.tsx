"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PlanningToolbar } from "./planning-toolbar";
import { ShiftPill } from "./shift-pill";
import { moveShift } from "./actions";
import {
  ShiftDialog,
  type ShiftDraft,
  type Employee,
  type Position,
} from "./shift-dialog";
import {
  WEEKDAYS_SHORT,
  fromISODate,
  isToday,
  shiftHours,
  monthGrid,
  type PlanningView,
} from "@/lib/week";
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
  view,
  locations,
  locationId,
  anchor,
  weekStart,
  rangeLabel,
  days,
  employees,
  positions,
  shifts,
  published,
  canManage,
}: {
  view: PlanningView;
  locations: Location[];
  locationId: string;
  anchor: string;
  weekStart: string;
  rangeLabel: string;
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

  // Rend le contenu d'une cellule (employé × jour) : shifts + bouton "+".
  const renderCellContent = (employeeId: string, date: string) => {
    const cell = cellShifts.get(`${employeeId}|${date}`) ?? [];
    return (
      <>
        {cell.map((s) => {
          const pos = s.position_id ? posById.get(s.position_id) : null;
          return (
            <ShiftPill
              key={s.id}
              shift={s}
              color={pos?.color ?? "#64748B"}
              positionName={pos?.name}
              draggable={canManage}
              dragging={draggingId === s.id}
              onClick={() => openEdit(s)}
              onDragStart={() => setDraggingId(s.id)}
              onDragEnd={() => {
                setDraggingId(null);
                setDropTarget(null);
              }}
            />
          );
        })}
        {canManage && cell.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openCreate(employeeId, date);
            }}
            className="flex w-full items-center justify-center rounded-md py-0.5 text-muted-foreground opacity-0 transition hover:bg-accent group-hover:opacity-100"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </>
    );
  };

  // Props de drop d'une cellule (employé × jour).
  const dropProps = (employeeId: string, date: string) => {
    const key = `${employeeId}|${date}`;
    return {
      onClick: () =>
        (cellShifts.get(key)?.length ?? 0) === 0 &&
        openCreate(employeeId, date),
      onDragOver: (e: React.DragEvent) => {
        if (!canManage || !draggingId) return;
        e.preventDefault();
        if (dropTarget !== key) setDropTarget(key);
      },
      onDragLeave: (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDropTarget((t) => (t === key ? null : t));
        }
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        handleDrop(employeeId, date);
      },
      isTarget: dropTarget === key,
    };
  };

  // ── Vue Semaine ──────────────────────────────────────────────────────────
  const renderWeek = () => (
    <div className="min-w-[900px] overflow-hidden rounded-lg border">
      <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b bg-muted/40 text-sm">
        <div className="p-3 font-medium">Employé</div>
        {days.map((d, i) => (
          <div
            key={d}
            className={cn(
              "border-l p-3 text-center",
              isToday(d) && "bg-primary/5",
            )}
          >
            <div className="font-medium">{WEEKDAYS_SHORT[i]}</div>
            <div className="text-xs text-muted-foreground">
              {fromISODate(d).getDate()}
            </div>
          </div>
        ))}
      </div>

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
              const dp = dropProps(emp.id, d);
              return (
                <div
                  key={d}
                  className={cn(
                    "group min-h-16 space-y-1 border-l p-1.5 transition-colors",
                    isToday(d) && "bg-primary/5",
                    canManage && "cursor-pointer hover:bg-accent/40",
                    dp.isTarget &&
                      "bg-primary/15 ring-1 ring-inset ring-primary/40",
                  )}
                  onClick={dp.onClick}
                  onDragOver={dp.onDragOver}
                  onDragLeave={dp.onDragLeave}
                  onDrop={dp.onDrop}
                >
                  {renderCellContent(emp.id, d)}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );

  // ── Vue Jour : un seul jour, tous les employés en lignes ─────────────────
  const renderDay = () => (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-[200px_1fr] border-b bg-muted/40 text-sm">
        <div className="p-3 font-medium">Employé</div>
        <div className="p-3 font-medium">Shifts</div>
      </div>
      {employees.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Aucun employé actif.
        </div>
      ) : (
        employees.map((emp) => {
          const dp = dropProps(emp.id, anchor);
          return (
            <div
              key={emp.id}
              className="grid grid-cols-[200px_1fr] border-b last:border-b-0"
            >
              <div className="flex items-center justify-between p-3">
                <span className="truncate text-sm font-medium">
                  {emp.first_name} {emp.last_name}
                </span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                  {totalFor(emp.id).toFixed(0)}h
                </span>
              </div>
              <div
                className={cn(
                  "group flex min-h-14 flex-wrap items-start gap-1 p-1.5 transition-colors",
                  canManage && "cursor-pointer hover:bg-accent/40",
                  dp.isTarget &&
                    "bg-primary/15 ring-1 ring-inset ring-primary/40",
                )}
                onClick={dp.onClick}
                onDragOver={dp.onDragOver}
                onDragLeave={dp.onDragLeave}
                onDrop={dp.onDrop}
              >
                <div className="flex w-full flex-wrap gap-1 [&>button]:w-auto [&>button]:min-w-32">
                  {renderCellContent(emp.id, anchor)}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ── Vue Mois : calendrier, shifts agrégés par jour ───────────────────────
  const renderMonth = () => {
    const grid = monthGrid(anchor);
    // Index des shifts par jour (toutes personnes confondues).
    const byDay = new Map<string, Shift[]>();
    for (const s of localShifts) {
      const arr = byDay.get(s.shift_date) ?? [];
      arr.push(s);
      byDay.set(s.shift_date, arr);
    }
    return (
      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-sm">
          {WEEKDAYS_SHORT.map((d) => (
            <div key={d} className="p-2 text-center font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map(({ iso, inMonth }) => {
            const dayShifts = (byDay.get(iso) ?? []).sort((a, b) =>
              a.start_time.localeCompare(b.start_time),
            );
            return (
              <div
                key={iso}
                className={cn(
                  "min-h-24 space-y-0.5 border-b border-l p-1 [&:nth-child(7n+1)]:border-l-0",
                  !inMonth && "bg-muted/30 text-muted-foreground",
                  isToday(iso) && "bg-primary/5",
                  canManage && "cursor-pointer hover:bg-accent/30",
                )}
                onClick={() => openCreate(null, iso)}
              >
                <div className="px-1 text-xs font-medium">
                  {fromISODate(iso).getDate()}
                </div>
                {dayShifts.slice(0, 4).map((s) => {
                  const pos = s.position_id ? posById.get(s.position_id) : null;
                  return (
                    <ShiftPill
                      key={s.id}
                      shift={s}
                      color={pos?.color ?? "#64748B"}
                      draggable={false}
                      dragging={false}
                      compact
                      onClick={() => openEdit(s)}
                      onDragStart={() => {}}
                      onDragEnd={() => {}}
                    />
                  );
                })}
                {dayShifts.length > 4 && (
                  <div className="px-1 text-[11px] text-muted-foreground">
                    +{dayShifts.length - 4} autres
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PlanningToolbar
        view={view}
        locations={locations}
        locationId={locationId}
        anchor={anchor}
        weekStart={weekStart}
        rangeLabel={rangeLabel}
        published={published}
        canManage={canManage}
      />

      <div className="flex-1 overflow-auto p-4">
        {view === "week" && renderWeek()}
        {view === "day" && renderDay()}
        {view === "month" && renderMonth()}
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
