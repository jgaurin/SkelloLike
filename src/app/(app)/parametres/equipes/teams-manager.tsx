"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import {
  createTeam,
  updateTeam,
  deleteTeam,
  setTeamMembers,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type Employee = { id: string; first_name: string; last_name: string };
export type Team = {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
};

function TeamDialog({
  team,
  locationId,
  open,
  onOpenChange,
}: {
  team?: Team;
  locationId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [name, setName] = useState(team?.name ?? "");
  const [color, setColor] = useState(team?.color ?? "#059669");
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = team
        ? await updateTeam(team.id, name, color)
        : await createTeam(locationId, name, color);
      if (res.ok) {
        toast.success(team ? "Équipe mise à jour." : "Équipe créée.");
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{team ? "Modifier l'équipe" : "Nouvelle équipe"}</DialogTitle>
          <DialogDescription>
            Les équipes permettent de filtrer le planning.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="team_name">Nom de l&apos;équipe</Label>
            <Input
              id="team_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Cuisine, Vente, Extras…"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-7 rounded-full ${color === c ? "ring-2 ring-ring ring-offset-2" : ""}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending || !name.trim()}>
            {isPending ? "…" : team ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TEAM_COLORS = [
  "#059669",
  "#0EA5E9",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F59E0B",
  "#14B8A6",
];

function MembersDialog({
  team,
  employees,
  open,
  onOpenChange,
}: {
  team: Team;
  employees: Employee[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(team.memberIds),
  );
  const [isPending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const save = () => {
    startTransition(async () => {
      const res = await setTeamMembers(team.id, Array.from(selected));
      if (res.ok) {
        toast.success("Composition mise à jour.");
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Composition · {team.name}</DialogTitle>
          <DialogDescription>
            Sélectionnez les employés de cette équipe.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-72 space-y-1 overflow-auto py-2">
          {employees.map((e) => (
            <label
              key={e.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
            >
              <Checkbox
                checked={selected.has(e.id)}
                onCheckedChange={() => toggle(e.id)}
              />
              <span className="text-sm">
                {e.first_name} {e.last_name}
              </span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "…" : `Enregistrer (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TeamsManager({
  locationId,
  teams,
  employees,
  canManage,
}: {
  locationId: string;
  teams: Team[];
  employees: Employee[];
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [members, setMembers] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState<Team | null>(null);
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteTeam(deleting.id);
      if (res.ok) toast.success("Équipe supprimée.");
      else toast.error(res.error ?? "Erreur.");
      setDeleting(null);
    });
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Ajouter une équipe
              </Button>
            </DialogTrigger>
            {createOpen && (
              <TeamDialogInline
                locationId={locationId}
                onClose={() => setCreateOpen(false)}
              />
            )}
          </Dialog>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Users className="size-10 text-muted-foreground/40" />
          <h3 className="mt-4 font-medium">Aucune équipe</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez des équipes pour organiser et filtrer vos employés.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <div key={t.id} className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span className="flex-1 truncate font-medium">{t.name}</span>
                {canManage && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setEditing(t)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(t)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.memberIds.length} employé
                {t.memberIds.length > 1 ? "s" : ""}
              </p>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setMembers(t)}
                >
                  <Users className="size-4" />
                  Gérer les employés
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TeamDialog
          team={editing}
          locationId={locationId}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
      {members && (
        <MembersDialog
          team={members}
          employees={employees}
          open={!!members}
          onOpenChange={(o) => !o && setMembers(null)}
        />
      )}

      {/* Confirmation suppression */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer « {deleting?.name} » ?</DialogTitle>
            <DialogDescription>
              Les employés ne seront plus rattachés à cette équipe. Action
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Formulaire de création inline (dans le Dialog déjà ouvert par le trigger). */
function TeamDialogInline({
  locationId,
  onClose,
}: {
  locationId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#059669");
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await createTeam(locationId, name, color);
      if (res.ok) {
        toast.success("Équipe créée.");
        onClose();
      } else {
        toast.error(res.error ?? "Erreur.");
      }
    });
  };

  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Nouvelle équipe</DialogTitle>
        <DialogDescription>
          Les équipes permettent de filtrer le planning.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="new_team_name">Nom de l&apos;équipe</Label>
          <Input
            id="new_team_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Cuisine, Vente, Extras…"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label>Couleur</Label>
          <div className="flex flex-wrap gap-2">
            {TEAM_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`size-7 rounded-full ${color === c ? "ring-2 ring-ring ring-offset-2" : ""}`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={isPending || !name.trim()}>
          {isPending ? "…" : "Créer"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
