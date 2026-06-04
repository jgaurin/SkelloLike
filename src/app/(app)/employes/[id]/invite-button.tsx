"use client";

import { useState, useTransition } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { inviteEmployee } from "./invite-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function InviteButton({
  employeeId,
  hasAccount,
}: {
  employeeId: string;
  hasAccount: boolean;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const invite = () => {
    startTransition(async () => {
      const res = await inviteEmployee(employeeId);
      if (res.ok) {
        setLink(res.link);
      } else {
        toast.error(res.error);
      }
    });
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Lien copié.");
    setTimeout(() => setCopied(false), 2000);
  };

  if (hasAccount) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Check className="size-4" />
        Compte actif
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={invite} disabled={isPending}>
        <Mail className="size-4" />
        {isPending ? "…" : "Inviter"}
      </Button>

      <Dialog open={!!link} onOpenChange={(o) => !o && setLink(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitation créée</DialogTitle>
            <DialogDescription>
              Partagez ce lien avec l&apos;employé pour qu&apos;il crée son
              compte et accède à son planning. (L&apos;envoi automatique par
              email arrivera plus tard.)
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input readOnly value={link ?? ""} className="text-xs" />
            <Button size="icon" onClick={copy} aria-label="Copier">
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
