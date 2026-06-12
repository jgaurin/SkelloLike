import { Users, Moon } from "lucide-react";

import { shiftDay, fromISODate, isToday, toISODate } from "@/lib/week";
import { Button } from "@/components/ui/button";

export type TeamShift = {
  employeeId: string;
  name: string;
  isMine: boolean;
  status: "working" | "off" | "absence";
  shifts: {
    id: string;
    start: string;
    end: string;
    posName: string | null;
    posColor: string | null;
  }[];
  absenceName: string | null;
  absenceColor: string | null;
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
  roster,
}: {
  day: string;
  roster: TeamShift[];
}) {
  const working = roster.filter((r) => r.status === "working").length;
  const absent = roster.filter((r) => r.status === "absence").length;

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
            {working} au travail
            {absent > 0 ? ` · ${absent} absent${absent > 1 ? "s" : ""}` : ""}
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

      {roster.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Users className="size-9 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Aucun employé.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {roster.map((r) => (
            <div
              key={r.employeeId}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                r.isMine ? "border-primary/40 bg-primary/5" : ""
              } ${r.status === "off" ? "opacity-70" : ""}`}
            >
              {/* Barre de couleur : poste si au travail, type d'absence sinon */}
              <span
                className="h-9 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    r.status === "working"
                      ? (r.shifts[0]?.posColor ?? "#94A3B8")
                      : r.status === "absence"
                        ? (r.absenceColor ?? "#94A3B8")
                        : "#CBD5E1",
                }}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {r.name}
                  {r.isMine && (
                    <span className="ml-1.5 text-xs font-normal text-primary">
                      (vous)
                    </span>
                  )}
                </p>

                {r.status === "working" && r.shifts[0]?.posName && (
                  <p className="truncate text-xs text-muted-foreground">
                    {r.shifts.map((s) => s.posName).filter(Boolean).join(" · ")}
                  </p>
                )}
                {r.status === "absence" && (
                  <p
                    className="truncate text-xs font-medium"
                    style={{ color: r.absenceColor ?? undefined }}
                  >
                    {r.absenceName}
                  </p>
                )}
                {r.status === "off" && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Moon className="size-3" />
                    En repos
                  </p>
                )}
              </div>

              {/* Horaires (à droite) */}
              <div className="shrink-0 text-right">
                {r.status === "working" ? (
                  <div className="space-y-0.5">
                    {r.shifts.map((s) => (
                      <p
                        key={s.id}
                        className="text-sm font-medium tabular-nums"
                      >
                        {s.start} – {s.end}
                      </p>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
