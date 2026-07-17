import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  Clock,
  Users,
  FileText,
  CalendarDays,
  UsersRound,
  SlidersHorizontal,
  Wallet,
  ArrowRight,
  Check,
} from "lucide-react";

import { SECTORS, getSector } from "@/lib/sectors";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  return SECTORS.map((s) => ({ secteur: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ secteur: string }>;
}): Promise<Metadata> {
  const { secteur } = await params;
  const s = getSector(secteur);
  if (!s) return {};
  const url = absoluteUrl(`/secteurs/${s.slug}`);
  return {
    title: { absolute: s.metaTitle },
    description: s.metaDescription,
    keywords: s.keywords,
    alternates: { canonical: `/secteurs/${s.slug}` },
    openGraph: {
      type: "website",
      url,
      title: s.metaTitle,
      description: s.metaDescription,
    },
    twitter: { title: s.metaTitle, description: s.metaDescription },
  };
}

// Icônes cyclées pour les 4 défis du secteur.
const CHALLENGE_ICONS = [CalendarDays, SlidersHorizontal, UsersRound, Wallet];

// Les 4 briques produit (identiques à l'accueil).
const FEATURES = [
  {
    icon: CalendarClock,
    title: "Planning",
    desc: "Vues jour, semaine, mois. Création en un clic, glisser-déposer, publication aux équipes, alertes sur les conflits.",
  },
  {
    icon: Clock,
    title: "Badgeuse",
    desc: "Pointage des arrivées, départs et pauses en mode kiosque sur tablette. Heures réelles vs planifiées.",
  },
  {
    icon: Users,
    title: "RH & absences",
    desc: "Congés, absences, compteurs et soldes. Demandes et validations centralisées.",
  },
  {
    icon: FileText,
    title: "Pré-paie",
    desc: "Heures, majorations (nuit, dimanche, fériés) et primes. Export prêt pour votre paie.",
  },
];

export default async function SectorPage({
  params,
}: {
  params: Promise<{ secteur: string }>;
}) {
  const { secteur } = await params;
  const s = getSector(secteur);
  if (!s) notFound();

  const others = SECTORS.filter((x) => x.slug !== s.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Secteurs",
        item: absoluteUrl("/secteurs"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: s.name,
        item: absoluteUrl(`/secteurs/${s.slug}`),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b border-border/60">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -right-16 top-10 size-[26rem] rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-20 bottom-0 size-80 rounded-full bg-primary/10 blur-3xl" />
          </div>
          <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <nav
              aria-label="Fil d'Ariane"
              className="mb-5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground"
            >
              <Link href="/" className="hover:text-primary">
                Accueil
              </Link>
              <span aria-hidden>/</span>
              <Link href="/secteurs" className="hover:text-primary">
                Secteurs
              </Link>
              <span aria-hidden>/</span>
              <span className="text-foreground">{s.name}</span>
            </nav>

            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span aria-hidden>{s.emoji}</span> {s.name}
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              {s.h1}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {s.intro}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base shadow-sm">
                <Link href="/#demande">
                  Demander une démo <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-6 text-base"
              >
                <Link href="/login">J&apos;ai déjà un compte</Link>
              </Button>
            </div>

            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Sans engagement", "Mise en place accompagnée", "Support en français"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="size-4 text-primary" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        </section>

        {/* Défis du secteur */}
        <section className="w-full py-16 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {s.name} : les défis du terrain, résolus
              </h2>
              <p className="mt-3 text-muted-foreground">
                Ritem est pensé pour la réalité du terrain — pas pour un tableur.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {s.challenges.map((c, i) => {
                const Icon = CHALLENGE_ICONS[i % CHALLENGE_ICONS.length];
                return (
                  <div
                    key={c.title}
                    className="rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--elevation-card)]"
                  >
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {c.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Briques produit */}
        <section className="w-full border-y border-border/60 bg-muted/40 py-16 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Tout {SITE_NAME}, pour {s.forWhom}
              </h2>
              <p className="mt-3 text-muted-foreground">
                Un seul outil, du planning à la préparation de la paie.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--elevation-card)]"
                >
                  <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Autres secteurs (maillage) */}
        <section className="w-full py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              {SITE_NAME} s&apos;adapte à votre métier
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={`/secteurs/${o.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <span aria-hidden>{o.emoji}</span> {o.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="w-full border-t border-border/60 bg-primary/5 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Prêt à simplifier vos plannings ?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Découvrez {SITE_NAME} en conditions réelles, pensé pour {s.forWhom}.
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
