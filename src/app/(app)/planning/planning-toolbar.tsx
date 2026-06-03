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

type Location = { id: string; name: string };

const VIEW_LABELS: Record<PlanningView, string> = {
  day: "Jour",
  week: "Semaine",
  month: "Mois",
};

export function PlanningToolbar({
  view,
  locations,
  locationId,
  anchor,
  weekStart,
  rangeLabel,
  templates,
  published,
  canManage,
}: {
  view: PlanningView;
  locations: Location[];
  locationId: string;
  anchor: string;
  weekStart: string;
  rangeLabel: string;
  templates: { id: string; name: string }[];
  published: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const go = (opts: { site?: string; date?: string; view?: string }) => {
    const site = opts.site ?? locationId;
    const date = opts.date ?? anchor;
    const v = opts.view ?? view;
    router.push(`/planning?site=${site}&view=${v}&date=${date}`);
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
    <div className="flex flex-wrap items-center gap-3 border-b bg-background px-6 py-3">
      {locations.length > 1 && (
        <Select value={locationId} onValueChange={(v) => go({ site: v })}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
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
        {published ? (
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/10 text-primary"
          >
            Publié
          </Badge>
        ) : (
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
          <Button size="sm" onClick={onPublish} disabled={isPending}>
            <Send className="size-4" />
            {published ? "Republier" : "Publier"}
          </Button>
        )}
      </div>
    </div>
  );
}
