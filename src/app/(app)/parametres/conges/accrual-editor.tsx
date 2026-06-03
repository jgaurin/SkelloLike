"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateAccrualSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export type AccrualType = {
  id: string;
  name: string;
  color: string;
  monthly_accrual: number;
  annual_cap: number;
  period_start_month: number;
};

export function AccrualEditor({
  type,
  canManage,
}: {
  type: AccrualType;
  canManage: boolean;
}) {
  const [monthly, setMonthly] = useState(type.monthly_accrual);
  const [cap, setCap] = useState(type.annual_cap);
  const [month, setMonth] = useState(type.period_start_month);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await updateAccrualSettings(type.id, monthly, cap, month);
      if (res.ok) toast.success("Règles enregistrées.");
      else toast.error(res.error ?? "Erreur.");
    });
  };

  return (
    <div className="grid grid-cols-[1fr_auto] items-end gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Jours / mois</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={monthly}
            disabled={!canManage}
            onChange={(e) => setMonthly(Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Plafond annuel</Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={cap}
            disabled={!canManage}
            onChange={(e) => setCap(Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Début de période</Label>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
            disabled={!canManage}
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
      </div>
      {canManage && (
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? "…" : "Enregistrer"}
        </Button>
      )}
    </div>
  );
}
