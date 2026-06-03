"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";

import { publishSchedule } from "./actions";
import { formatWeekRange, shiftWeek, getMonday } from "@/lib/week";
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

export function PlanningToolbar({
  locations,
  locationId,
  weekStart,
  published,
  canManage,
}: {
  locations: Location[];
  locationId: string;
  weekStart: string;
  published: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (site: string, week: string) => {
    router.push(`/planning?site=${site}&week=${week}`);
  };

  const onPublish = () => {
    startTransition(async () => {
      const res = await publishSchedule(locationId, weekStart);
      if (res.ok) toast.success("Planning publié. Les employés sont notifiés.");
      else toast.error(res.error ?? "Erreur.");
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-b bg-background px-6 py-3">
      {/* Sélecteur d'établissement */}
      {locations.length > 1 && (
        <Select
          value={locationId}
          onValueChange={(v) => navigate(v, weekStart)}
        >
          <SelectTrigger className="w-52">
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

      {/* Navigation semaine */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => navigate(locationId, shiftWeek(weekStart, -1))}
          aria-label="Semaine précédente"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(locationId, getMonday())}
        >
          Aujourd&apos;hui
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => navigate(locationId, shiftWeek(weekStart, 1))}
          aria-label="Semaine suivante"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <span className="text-sm font-medium capitalize">
        {formatWeekRange(weekStart)}
      </span>

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
          <Button size="sm" onClick={onPublish} disabled={isPending}>
            <Send className="size-4" />
            {published ? "Republier" : "Publier"}
          </Button>
        )}
      </div>
    </div>
  );
}
