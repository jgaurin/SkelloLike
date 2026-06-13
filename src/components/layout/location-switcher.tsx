"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Building2 } from "lucide-react";

import { setCurrentLocation } from "@/lib/auth/location-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Location = { id: string; name: string };

/**
 * Sélecteur d'établissement global, affiché en haut de la sidebar.
 * Le choix est persisté (cookie) et s'applique à tout l'espace de gestion.
 */
export function LocationSwitcher({
  locations,
  currentId,
}: {
  locations: Location[];
  currentId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onChange = (id: string) => {
    startTransition(async () => {
      await setCurrentLocation(id);
      router.refresh();
    });
  };

  if (locations.length === 0) return null;

  // Un seul établissement : pas de sélecteur, juste l'affichage.
  if (locations.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
        <Building2 className="size-4 shrink-0 text-sidebar-foreground/70" />
        <span className="truncate font-medium">{locations[0].name}</span>
      </div>
    );
  }

  return (
    <Select value={currentId} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="h-9 w-full border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground">
        <span className="flex min-w-0 items-center gap-2">
          <Building2 className="size-4 shrink-0" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        {locations.map((l) => (
          <SelectItem key={l.id} value={l.id}>
            {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
