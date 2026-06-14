"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { verifyExitPassword } from "./exit-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ExitButton({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const res = await verifyExitPassword(email, password);
      if (res.ok) {
        router.push("/dashboard");
      } else {
        toast.error("Mot de passe incorrect.");
        setPassword("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Lock className="size-4" />
        Quitter
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Quitter la badgeuse</DialogTitle>
          <DialogDescription>
            Saisissez votre mot de passe manager pour déverrouiller le mode
            kiosque.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-2 py-2">
            <Label htmlFor="exit_pwd">Mot de passe</Label>
            <Input
              id="exit_pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !password}>
              {isPending ? "Vérification…" : "Déverrouiller"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
