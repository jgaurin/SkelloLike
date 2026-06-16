"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    q: "Comment obtenir une démo de Ritem ?",
    a: "Remplissez le formulaire de demande de démo. Un conseiller vous recontacte pour vous présenter l'outil, configurer votre espace et l'adapter à votre secteur.",
  },
  {
    q: "Ritem convient-il à plusieurs établissements ?",
    a: "Oui. Chaque établissement a son propre planning, ses équipes et ses postes. Vous basculez de l'un à l'autre depuis le sélecteur, avec une vision consolidée côté direction.",
  },
  {
    q: "Mes employés peuvent-ils consulter leur planning ?",
    a: "Chaque employé dispose de son espace : planning publié, demandes d'absence, pointage via la badgeuse. Les managers valident et régularisent en quelques clics.",
  },
  {
    q: "La préparation de la paie est-elle incluse ?",
    a: "Ritem calcule les heures réelles, les primes et les régularisations à partir du pointage, puis génère un export prêt à transmettre à votre logiciel de paie.",
  },
  {
    q: "Mes données sont-elles isolées et sécurisées ?",
    a: "Chaque organisation est strictement cloisonnée. Les accès sont contrôlés par rôle, et vos données ne sont jamais partagées entre entreprises.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-medium">{item.q}</span>
              <ChevronDown
                className={`size-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
