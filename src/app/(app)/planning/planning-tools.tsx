"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Wrench,
  Copy,
  Save,
  LayoutTemplate,
  Trash2,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import {
  copyWeek,
  saveWeekAsTemplate,
  applyTemplate,
  deleteTemplate,
} from "./template-actions";
import { shiftWeek, formatWeekRange } from "@/lib/week";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Template = { id: string; name: string };

export function PlanningTools({
  locationId,
  weekStart,
  templates,
}: {
  locationId: string;
  weekStart: string;
  templates: Template[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<null | "copy" | "save" | "apply">(null);
  const [templateName, setTemplateName] = useState("");
  const [selectedTpl, setSelectedTpl] = useState<string | null>(null);

  const close = () => setDialog(null);

  const doCopy = () => {
    const target = shiftWeek(weekStart, 1); // copie vers la semaine suivante
    startTransition(async () => {
      const res = await copyWeek(locationId, weekStart, target);
      if (res.ok) {
        toast.success(
          `${res.count} shift(s) copié(s) vers la semaine suivante.`,
        );
        close();
        // On reste sur la semaine courante ; on rafraîchit juste les données.
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  const doSave = () => {
    startTransition(async () => {
      const res = await saveWeekAsTemplate(locationId, weekStart, templateName);
      if (res.ok) {
        toast.success("Modèle enregistré.");
        setTemplateName("");
        close();
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  const doApply = (templateId: string) => {
    startTransition(async () => {
      const res = await applyTemplate(locationId, weekStart, templateId);
      if (res.ok) {
        toast.success(`Modèle appliqué (${res.count} shift(s)).`);
        close();
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  const doDelete = (templateId: string) => {
    startTransition(async () => {
      const res = await deleteTemplate(templateId);
      if (res.ok) {
        toast.success("Modèle supprimé.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Wrench className="size-4" />
            Outils
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setDialog("copy")}>
            <Copy className="size-4" />
            Copier vers la semaine suivante
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("save")}>
            <Save className="size-4" />
            Enregistrer comme modèle
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDialog("apply")}
            disabled={templates.length === 0}
          >
            <LayoutTemplate className="size-4" />
            Appliquer un modèle
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Exporter les heures
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <a
              href={`/api/export/hours?site=${locationId}&week=${weekStart}&format=xlsx`}
            >
              <FileSpreadsheet className="size-4" />
              Excel (.xlsx)
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`/api/export/hours?site=${locationId}&week=${weekStart}&format=csv`}
            >
              <FileText className="size-4" />
              CSV
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Copier vers la semaine suivante */}
      <Dialog open={dialog === "copy"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copier la semaine</DialogTitle>
            <DialogDescription>
              Copie tous les shifts de la semaine du {formatWeekRange(weekStart)}{" "}
              vers la semaine suivante. Les shifts existants de la cible seront
              remplacés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={isPending}>
              Annuler
            </Button>
            <Button onClick={doCopy} disabled={isPending}>
              {isPending ? "Copie…" : "Copier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enregistrer comme modèle */}
      <Dialog open={dialog === "save"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer comme modèle</DialogTitle>
            <DialogDescription>
              Sauvegardez cette semaine pour la réappliquer plus tard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="tpl_name">Nom du modèle</Label>
            <Input
              id="tpl_name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ex : Semaine type, Haute saison…"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={isPending}>
              Annuler
            </Button>
            <Button
              onClick={doSave}
              disabled={isPending || !templateName.trim()}
            >
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appliquer un modèle */}
      <Dialog open={dialog === "apply"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appliquer un modèle</DialogTitle>
            <DialogDescription>
              Le modèle remplacera les shifts de la semaine du{" "}
              {formatWeekRange(weekStart)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="text-sm font-medium">{t.name}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => doApply(t.id)}
                    disabled={isPending}
                  >
                    Appliquer
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => doDelete(t.id)}
                    disabled={isPending}
                    aria-label="Supprimer le modèle"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
