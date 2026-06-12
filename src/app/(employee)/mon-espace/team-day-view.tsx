import { Users } from "lucide-react";

import { shiftDay, fromISODate, isToday, toISODate } from "@/lib/week";
import { Button } from "@/components/ui/button";

export type TeamShift = {
  id: string;
  start: string;
  end: string;
  empName: string;
  posName: string | null;
  posColor: string | null;
  isMine: boolean;
};

function formatDay(iso: string) {
  return fromISODate(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function TeamDayView({
  day,
  shifts,
}: {
  day: string;
  shifts: TeamShift[];
}) {
  return (
    <div className="space-y-3">
      {/* Navigation jour par jour */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" className="size-9 shrink-0" asChild>
          <a
            href={`/mon-espace?tab=equipe&day=${shiftDay(day, -1)}`}
            aria-label="Jour précédent"
          >
            ‹
          </a>
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-medium capitalize">
            {formatDay(day)}
          </p>
          <p className="text-xs text-muted-foreground">
            {shifts.length} personne{shifts.length > 1 ? "s" : ""} ce jour-là
          </p>
        </div>
        <Button variant="outline" size="icon" className="size-9 shrink-0" asChild>
          <a
            href={`/mon-espace?tab=equipe&day=${shiftDay(day, 1)}`}
            aria-label="Jour suivant"
          >
            ›
          </a>
        </Button>
      </div>

      {!isToday(day) && (
        <div className="text-center">
          <Button variant="ghost" size="sm" asChild>
            <a href={`/mon-espace?tab=equipe&day=${toISODate(new Date())}`}>
              Aujourd&apos;hui
            </a>
          </Button>
        </div>
      )}

      {/* Liste des shifts du jour (tout le monde) */}
      {shifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Users className="size-9 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Personne n&apos;est planifié ce jour-là.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shifts.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                s.isMine ? "border-primary/40 bg-primary/5" : ""
              }`}
            >
              {/* Barre de couleur du poste */}
              <span
                className="h-9 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.posColor ?? "#94A3B8" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {s.empName}
                  {s.isMine && (
                    <span className="ml-1.5 text-xs font-normal text-primary">
                      (vous)
                    </span>
                  )}
                </p>
                {s.posName && (
                  <p className="truncate text-xs text-muted-foreground">
                    {s.posName}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {s.start} – {s.end}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
