"use client";

import { useActionState } from "react";

import { createOrganization, type OnboardingState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: OnboardingState = {};

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(
    createOrganization,
    initialState,
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bienvenue 👋</CardTitle>
          <CardDescription>
            Configurons votre espace. Vous pourrez tout modifier plus tard.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org_name">Nom de l&apos;entreprise</Label>
              <Input
                id="org_name"
                name="org_name"
                placeholder="Ex : Le Bistrot du Coin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_name">
                Nom de votre premier établissement
              </Label>
              <Input
                id="location_name"
                name="location_name"
                placeholder="Ex : Paris République"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Secteur (optionnel)</Label>
              <Input
                id="sector"
                name="sector"
                placeholder="Restauration, retail, santé…"
              />
            </div>
            {state.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Création…" : "Créer mon espace"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
