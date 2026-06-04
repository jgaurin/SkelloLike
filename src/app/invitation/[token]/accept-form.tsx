"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { acceptInvitation, type AcceptState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AcceptState = {};

export function AcceptForm({
  token,
  email,
  defaultFirstName,
  defaultLastName,
}: {
  token: string;
  email: string;
  defaultFirstName: string;
  defaultLastName: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    acceptInvitation,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.push("/mon-espace");
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="first_name">Prénom</Label>
          <Input
            id="first_name"
            name="first_name"
            defaultValue={defaultFirstName}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Nom</Label>
          <Input
            id="last_name"
            name="last_name"
            defaultValue={defaultLastName}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Choisissez un mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
