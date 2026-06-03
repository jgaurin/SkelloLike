"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Location = { id: string; name: string };

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function ExportPanel({ locations }: { locations: Location[] }) {
  const now = new Date();
  const [site, setSite] = useState(locations[0]?.id ?? "");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based

  const monthParam = `${year}-${String(month).padStart(2, "0")}`;
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  const href = (format: "xlsx" | "csv") =>
    `/api/export/prepaie?site=${site}&month=${monthParam}&format=${format}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pré-paie mensuelle</CardTitle>
        <CardDescription>
          Jours et heures travaillés, heures supplémentaires par semaine et
          absences par type — pour transmettre à la paie.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {locations.length > 1 && (
            <div className="space-y-1.5">
              <Label>Établissement</Label>
              <Select value={site} onValueChange={setSite}>
                <SelectTrigger>
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
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Mois</Label>
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Année</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={href("xlsx")}>
              <FileSpreadsheet className="size-4" />
              Exporter en Excel
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={href("csv")}>
              <FileText className="size-4" />
              Exporter en CSV
            </a>
          </Button>
          <Button variant="ghost" asChild>
            <a
              href={`/api/export/hours?site=${site}&format=xlsx`}
              className="text-muted-foreground"
            >
              <Clock className="size-4" />
              Heures de la semaine
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
