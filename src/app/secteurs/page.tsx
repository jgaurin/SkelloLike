import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SECTORS } from "@/lib/sectors";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Logiciel de planning par secteur",
  description:
    "Ritem s'adapte à votre métier : restaurant, boulangerie, commerce, hôtellerie, café & bar, santé. Découvrez le logiciel de planning et RH fait pour votre secteur.",
  alternates: { canonical: "/secteurs" },
  openGraph: {
    type: "website",
    url: absoluteUrl("/secteurs"),
    title: "Logiciel de planning par secteur — Ritem",
    description:
      "Ritem s'adapte à votre métier : restaurant, boulangerie, commerce, hôtellerie, café & bar, santé.",
  },
};

export default function SectorsHub() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader />

      <main>
        <section className="relative isolate overflow-hidden border-b border-border/60">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -right-16 top-10 size-[26rem] rounded-full bg-primary/10 blur-3xl" />
          </div>
          <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Un logiciel de planning adapté à{" "}
              <span className="text-primary">chaque secteur</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {SITE_NAME} gère le planning, le pointage, les absences et la
              préparation de la paie — avec les spécificités de votre métier.
            </p>
          </div>
        </section>

        <section className="w-full py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SECTORS.map((s) => (
                <Link
                  key={s.slug}
                  href={`/secteurs/${s.slug}`}
                  className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--elevation-card)] transition-shadow hover:shadow-[var(--elevation-card-hover)]"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    <span aria-hidden>{s.emoji}</span>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold group-hover:text-primary">
                    {s.name}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {s.intro}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Voir la solution{" "}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full border-t border-border/60 bg-primary/5 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Vous ne voyez pas votre métier ?
            </h2>
            <p className="mt-3 text-muted-foreground">
              {SITE_NAME} convient à toute équipe qui travaille en horaires
              postés. Parlons-en.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="h-12 px-8 text-base shadow-sm">
                <Link href="/#demande">
                  Demander une démo <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
