"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateAlertSetting } from "./actions";
import { ALERT_CATALOG } from "@/lib/planning-alerts";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

type Setting = { enabled: boolean; blocking: boolean };

function Row({
  code,
  label,
  description,
  initial,
  canManage,
}: {
  code: string;
  label: string;
  description: string;
  initial: Setting;
  canManage: boolean;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [blocking, setBlocking] = useState(initial.blocking);
  const [, startTransition] = useTransition();

  const persist = (nextEnabled: boolean, nextBlocking: boolean) => {
    startTransition(async () => {
      const res = await updateAlertSetting(code, nextEnabled, nextBlocking);
      if (!res.ok) {
        toast.error(res.error ?? "Erreur.");
        setEnabled(initial.enabled);
        setBlocking(initial.blocking);
      }
    });
  };

  return (
    <div className="grid grid-cols-[60px_1fr_110px] items-center gap-3 border-b px-3 py-3 last:border-b-0">
      <Switch
        checked={enabled}
        disabled={!canManage}
        onCheckedChange={(v) => {
          setEnabled(v);
          if (!v) setBlocking(false);
          persist(v, v ? blocking : false);
        }}
      />
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <label className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Checkbox
          checked={blocking}
          disabled={!canManage || !enabled}
          onCheckedChange={(v) => {
            setBlocking(!!v);
            persist(enabled, !!v);
          }}
        />
        Bloquante
      </label>
    </div>
  );
}

export function AlertsSettings({
  settings,
  canManage,
}: {
  settings: Record<string, Setting>;
  canManage: boolean;
}) {
  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-[60px_1fr_110px] gap-3 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
        <span>Activer</span>
        <span>Type d&apos;alerte</span>
        <span className="text-center">Bloquante</span>
      </div>
      {ALERT_CATALOG.map((a) => (
        <Row
          key={a.code}
          code={a.code}
          label={a.label}
          description={a.description}
          initial={settings[a.code] ?? { enabled: true, blocking: false }}
          canManage={canManage}
        />
      ))}
    </div>
  );
}
