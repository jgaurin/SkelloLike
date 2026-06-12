"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";

import { publishSchedule } from "./actions";
import { PlanningTools } from "./planning-tools";
import {
  shiftWeek,
  shiftDay,
  shiftMonth,
  getMonday,
  toISODate,
  type PlanningView,
} from "@/lib/week";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const VIEW_LABELS: Record<PlanningView, string> = {
  day: "Jour",
  week: "Semaine",
  month: "Mois",
};

export function PlanningToolbar({
  view,
  locationId,
  anchor,
  weekStart,
  rangeLabel,
  templates,
  teams,
  selectedTeam,
  status,
  blockingCount,
  canManage,
}: {
  view: PlanningView;
  locationId: string;
  anchor: string;
  weekStart: string;
  rangeLabel: string;
  templates: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  selectedTeam: string | null;
  status: "draft" | "published" | "partial";
  blockingCount: number;
  canManage: boolean;
}) {
  const published = status === "published";
  const blocked = blockingCount > 0;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const ALL_TEAMS = "__all__";

  // L'établissement est géré globalement (sidebar) ; on ne le passe plus en URL.
  const go = (opts: { date?: string; view?: string; team?: string | null }) => {
    const date = opts.date ?? anchor;
    const v = opts.view ?? view;
    const team = opts.team === undefined ? selectedTeam : opts.team;
    const teamParam = team ? `&team=${team}` : "";
    router.push(`/planning?view=${v}&date=${date}${teamParam}`);
  };

  const prev = () =>
    go({
      date:
        view === "day"
          ? shiftDay(anchor, -1)
          : view === "month"
            ? shiftMonth(anchor, -1)
            : shiftWeek(anchor, -1),
    });

  const next = () =>
    go({
      date:
        view === "day"
          ? shiftDay(anchor, 1)
          : view === "month"
            ? shiftMonth(anchor, 1)
            : shiftWeek(anchor, 1),
    });

  const today = () => go({ date: toISODate(new Date()) });

  const onPublish = () => {
    startTransition(async () => {
      const res = await publishSchedule(locationId, weekStart);
      if (res.ok) toast.success("Planning publié. Les employés sont notifiés.");
      else toast.error(res.error ?? "Erreur.");
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-3 sm:gap-3 sm:px-6">
      {/* Filtre par équipe */}
      {teams.length > 0 && (
        <Select
          value={selectedTeam ?? ALL_TEAMS}
          onValueChange={(v) => go({ team: v === ALL_TEAMS ? null : v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TEAMS}>Toutes les équipes</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Sélecteur de vue Jour / Semaine / Mois */}
      <div className="flex rounded-md border p-0.5">
        {(Object.keys(VIEW_LABELS) as PlanningView[]).map((v) => (
          <Button
            key={v}
            type="button"
            variant={view === v ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3"
            onClick={() => go({ view: v })}
          >
            {VIEW_LABELS[v]}
          </Button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={prev}
          aria-label="Précédent"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={today}>
          Aujourd&apos;hui
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={next}
          aria-label="Suivant"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <span className="text-sm font-medium capitalize">{rangeLabel}</span>

      <div className="ml-auto flex items-center gap-2">
        {status === "published" && (
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/10 text-primary"
          >
            Publié
          </Badge>
        )}
        {status === "partial" && (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            Partiellement publié
          </Badge>
        )}
        {status === "draft" && (
          <Badge variant="outline" className="text-muted-foreground">
            Brouillon
          </Badge>
        )}
        {canManage && (
          <PlanningTools
            locationId={locationId}
            weekStart={weekStart}
            templates={templates}
          />
        )}
        {canManage && (
          <Button
            size="sm"
            onClick={onPublish}
            disabled={isPending || blocked}
            title={
              blocked
                ? `${blockingCount} alerte(s) bloquante(s) à résoudre avant publication`
                : undefined
            }
          >
            <Send className="size-4" />
            {published ? "Republier" : "Publier"}
          </Button>
        )}
      </div>
    </div>
  );
}
