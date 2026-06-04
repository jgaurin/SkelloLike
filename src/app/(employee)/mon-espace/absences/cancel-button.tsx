"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { cancelMyRequest } from "./actions";
import { Button } from "@/components/ui/button";

export function CancelButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const cancel = () => {
    startTransition(async () => {
      const res = await cancelMyRequest(id);
      if (res.success) toast.success("Demande annulée.");
      else toast.error(res.error ?? "Erreur.");
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:text-destructive"
      onClick={cancel}
      disabled={isPending}
      aria-label="Annuler"
    >
      <X className="size-4" />
    </Button>
  );
}
