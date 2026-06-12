import { CalendarDays } from "lucide-react";

import {
  WEEKDAYS,
  shiftWeek,
  formatWeekRange,
  isToday,
  fromISODate,
} from "@/lib/week";
import { Button } from "@/components/ui/button";

type MyShift = {
  id: string;
  date: string;
  start: string;
  end: string;
  posName: string | null;
  posColor: string | null;
  hours: number;
};

export function MyShiftsView({
  weekStart,
  days,
  shifts,
  totalHours,
}: {
  weekStart: string;
  days: string[];
  shifts: MyShift[];
  totalHours: number;
}) {
  const byDay = new Map<string, MyShift[]>();
  for (const s of shifts) {
    const arr = byDay.get(s.date) ?? [];
    arr.push(s);
    byDay.set(s.date, arr);
  }

  return (
    <div className="space-y-3">
      {/* Barre de navigation semaine — compacte sur mobile */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" className="size-9 shrink-0" asChild>
          <a
            href={`/mon-espace?tab=mes-shifts&week=${shiftWeek(weekStart, -1)}`}
            aria-label="Semaine précédente"
          >
            ‹
          </a>
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-medium capitalize">
            {formatWeekRange(weekStart)}
          </p>
          <p className="text-xs text-muted-foreground">
            {totalHours.toFixed(0)}h cette semaine
          </p>
        </div>
        <Button variant="outline" size="icon" className="size-9 shrink-0" asChild>
          <a
            href={`/mon-espace?tab=mes-shifts&week=${shiftWeek(weekStart, 1)}`}
            aria-label="Semaine suivante"
          >
            ›
          </a>
        </Button>
      </div>

      {/* Liste des jours (vertical, mobile-first) */}
      <div className="space-y-2">
        {days.map((d, i) => {
          const dayShifts = (byDay.get(d) ?? []).sort((a, b) =>
            a.start.localeCompare(b.start),
          );
          const today = isToday(d);
          return (
            <div
              key={d}
              className={`flex gap-3 rounded-lg border p-3 ${
                today ? "border-primary/40 bg-primary/5" : ""
              }`}
            >
              {/* Colonne date */}
              <div className="flex w-12 shrink-0 flex-col items-center justify-center">
                <span className="text-xs uppercase text-muted-foreground">
                  {WEEKDAYS[i].slice(0, 3)}
                </span>
                <span
                  className={`text-lg font-semibold ${today ? "text-primary" : ""}`}
                >
                  {fromISODate(d).getDate()}
                </span>
              </div>

              {/* Shifts du jour */}
              <div className="min-w-0 flex-1 space-y-1.5">
                {dayShifts.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">Repos</p>
                ) : (
                  dayShifts.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white"
                      style={{ backgroundColor: s.posColor ?? "#059669" }}
                    >
                      <CalendarDays className="size-4 shrink-0" />
                      <span>
                        {s.start} – {s.end}
                      </span>
                      {s.posName && (
                        <span className="truncate opacity-90">
                          · {s.posName}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
