"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  uploadDocument,
  getDocumentUrl,
  deleteDocument,
} from "./document-actions";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type DocItem = {
  id: string;
  name: string;
  category: string;
  size_bytes: number | null;
  created_at: string;
};

const CATEGORIES = [
  { value: "contrat", label: "Contrat" },
  { value: "identite", label: "Pièce d'identité" },
  { value: "diplome", label: "Diplôme" },
  { value: "medical", label: "Médical" },
  { value: "autre", label: "Autre" },
];

function catLabel(v: string) {
  return CATEGORIES.find((c) => c.value === v)?.label ?? "Autre";
}

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export function DocumentsPanel({
  employeeId,
  documents,
  canManage,
}: {
  employeeId: string;
  documents: DocItem[];
  canManage: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("contrat");
  const [deleting, setDeleting] = useState<DocItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const onUpload = (file: File) => {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("category", category);
    startTransition(async () => {
      const res = await uploadDocument(employeeId, fd);
      if (res.ok) toast.success("Document ajouté.");
      else toast.error(res.error ?? "Erreur.");
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  const onDownload = (id: string) => {
    startTransition(async () => {
      const res = await getDocumentUrl(id);
      if (res.ok) window.open(res.url, "_blank");
      else toast.error(res.error);
    });
  };

  const onDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteDocument(deleting.id);
      if (res.ok) toast.success("Document supprimé.");
      else toast.error(res.error ?? "Erreur.");
      setDeleting(null);
    });
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
          >
            <Upload className="size-4" />
            {isPending ? "Envoi…" : "Téléverser"}
          </Button>
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun document.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground">
                  {catLabel(d.category)}
                  {d.size_bytes ? ` · ${fmtSize(d.size_bytes)}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onDownload(d.id)}
                disabled={isPending}
                aria-label="Télécharger"
              >
                <Download className="size-4" />
              </Button>
              {canManage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleting(d)}
                  disabled={isPending}
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleting?.name} » sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
