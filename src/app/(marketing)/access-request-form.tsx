"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight } from "lucide-react";

import { submitAccessRequest, type AccessRequestState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: AccessRequestState = { ok: false };

const SECTORS = [
  "Restauration",
  "Retail / Commerce",
  "Hôtellerie",
  "Santé",
  "Industrie",
  "Logistique",
  "Autre",
];

const TEAM_SIZES = ["1 à 10", "11 à 50", "51 à 200", "201 à 500", "500+"];

const fieldClass =
  "h-11 rounded-xl bg-background/60 shadow-none focus-visible:ring-primary/30";

const selectClass =
  "flex h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-primary/30";

export function AccessRequestForm() {
  const [state, formAction, pending] = useActionState(
    submitAccessRequest,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card p-8 text-center shadow-xl sm:p-10">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-9 text-primary" />
        </span>
        <h3 className="text-xl font-semibold">Demande envoyée 🎉</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Un conseiller vous recontacte très vite.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-5 rounded-3xl border border-border/60 bg-card p-6 shadow-xl sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company_name">Entreprise *</Label>
          <Input
            id="company_name"
            name="company_name"
            placeholder="Le Bistrot du Coin"
            className={fieldClass}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_name">Votre nom *</Label>
          <Input
            id="contact_name"
            name="contact_name"
            placeholder="Camille Martin"
            className={fieldClass}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="camille@bistrot.fr"
            className={fieldClass}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="06 12 34 56 78"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sector">Secteur</Label>
          <select
            id="sector"
            name="sector"
            className={selectClass}
            defaultValue=""
          >
            <option value="" disabled>
              Sélectionner…
            </option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="team_size">Taille de l&apos;équipe</Label>
          <select
            id="team_size"
            name="team_size"
            className={selectClass}
            defaultValue=""
          >
            <option value="" disabled>
              Sélectionner…
            </option>
            {TEAM_SIZES.map((t) => (
              <option key={t} value={t}>
                {t} employés
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message (optionnel)</Label>
        <Textarea
          id="message"
          name="message"
          rows={3}
          placeholder="Un mot sur votre besoin…"
          className="rounded-xl bg-background/60 shadow-none focus-visible:ring-primary/30"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-12 w-full text-base shadow-sm"
        disabled={pending}
      >
        {pending ? (
          "Envoi…"
        ) : (
          <>
            Demander une démo
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
