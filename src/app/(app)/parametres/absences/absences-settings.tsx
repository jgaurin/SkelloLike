"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  toggleAbsenceType,
  deleteAbsenceType,
} from "./actions";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export type AbsenceTypeRow = {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  affects_counter: boolean;
  can_be_requested: boolean;
  paid_by: string;
};

const GROUPS: { key: string; label: string }[] = [
  { key: "employer", label: "Absences indemnisées par l'employeur" },
  { key: "third_party", label: "Absences indemnisées par un tiers" },
  { key: "none", label: "Absences non indemnisées" },
];

function Row({
  type,
  canManage,
}: {
  type: AbsenceTypeRow;
  canManage: boolean;
}) {
  const [active, setActive] = useState(type.is_active);
  const [accrual, setAccrual] = useState(type.affects_counter);
  const [requestable, setRequestable] = useState(type.can_be_requested);
  const [, startTransition] = useTransition();

  const toggle = (
    field: "is_active" | "affects_counter" | "can_be_requested",
    value: boolean,
    setter: (v: boolean) => void,
  ) => {
    if (!canManage) return;
    setter(value);
    startTransition(async () => {
      const res = await toggleAbsenceType(type.id, field, value);
      if (!res.ok) {
        setter(!value); // rollback
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteAbsenceType(type.id);
      if (res.ok) toast.success("Type supprimé.");
      else toast.error(res.error ?? "Erreur.");
    });
  };

  return (
    <div className="grid grid-cols-[60px_1fr_140px_140px_40px] items-center gap-2 border-b px-3 py-2.5 last:border-b-0">
      <Switch
        checked={active}
        onCheckedChange={(v) => toggle("is_active", v, setActive)}
        disabled={!canManage}
      />
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: type.color }}
        />
        <span className="text-sm font-medium">{type.name}</span>
      </div>
      <div className="flex justify-center">
        <Checkbox
          checked={accrual}
          onCheckedChange={(v) =>
            toggle("affects_counter", !!v, setAccrual)
          }
          disabled={!canManage || !active}
          aria-label="Permet l'acquisition de congés"
        />
      </div>
      <div className="flex justify-center">
        <Checkbox
          checked={requestable}
          onCheckedChange={(v) =>
            toggle("can_be_requested", !!v, setRequestable)
          }
          disabled={!canManage || !active}
          aria-label="Peut être demandée par l'employé"
        />
      </div>
      <div className="flex justify-center">
        {canManage && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label="Supprimer"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function AbsencesSettings({
  types,
  canManage,
}: {
  types: AbsenceTypeRow[];
  canManage: boolean;
}) {
  return (
    <div className="space-y-6">
      {GROUPS.map((g) => {
        const groupTypes = types.filter((t) => t.paid_by === g.key);
        if (groupTypes.length === 0) return null;
        return (
          <div key={g.key} className="rounded-lg border">
            <div className="border-b bg-muted/40 px-3 py-2.5">
              <h3 className="text-sm font-semibold">{g.label}</h3>
            </div>
            {/* En-tête de colonnes */}
            <div className="grid grid-cols-[60px_1fr_140px_140px_40px] gap-2 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>Activer</span>
              <span>Type d&apos;absence</span>
              <span className="text-center">Acquisition congés</span>
              <span className="text-center">Demandable employé</span>
              <span />
            </div>
            {groupTypes.map((t) => (
              <Row key={t.id} type={t} canManage={canManage} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
