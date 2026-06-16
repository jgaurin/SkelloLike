import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  Clock,
  Users,
  FileText,
  Check,
  Quote,
  Star,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AccessRequestForm } from "./(marketing)/access-request-form";
import { PlanningCard3D } from "./(marketing)/planning-card-3d";
import { Reveal } from "./(marketing)/reveal";
import { Faq } from "./(marketing)/faq";
import { SectorsCarousel } from "./(marketing)/sectors-carousel";
import { CountUp } from "./(marketing)/count-up";
import { DemoCta } from "./(marketing)/demo-cta";
import { ScrollDown } from "./(marketing)/scroll-down";

/**
 * Landing page publique de Ritem.
 * - Visiteur non connecté → page marketing + formulaire de demande d'accès.
 * - Connecté sans org      → /onboarding
 * - Connecté employé       → /mon-espace
 * - Connecté manager       → /dashboard
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership) redirect("/onboarding");
    if (membership.role === "employee") redirect("/mon-espace");
    redirect("/dashboard");
  }

  const features = [
    {
      icon: CalendarClock,
      title: "Planning",
      desc: "Vues jour, semaine et mois. Création en un clic, publication aux employés, alertes sur les conflits.",
    },
    {
      icon: Clock,
      title: "Badgeuse",
      desc: "Pointage des arrivées, départs et pauses. Mode kiosque verrouillé sur tablette.",
    },
    {
      icon: Users,
      title: "RH & absences",
      desc: "Congés, absences, compteurs et soldes. Demandes et validations centralisées.",
    },
    {
      icon: FileText,
      title: "Pré-paie",
      desc: "Heures réelles, primes et régularisations. Export prêt pour votre paie.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* En-tête */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:h-18 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm sm:size-9 sm:text-lg">
              R
            </span>
            <span className="text-foreground">Ritem</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Se connecter</Link>
            </Button>
            <DemoCta
              className="hidden shadow-sm sm:inline-flex"
              withIcon={false}
            >
              Demander une démo
            </DemoCta>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden border-b border-border/60 lg:min-h-0">
        {/* Blobs émeraude animés en fond */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="animate-blob absolute -right-16 top-32 size-[28rem] rounded-full bg-primary/10 blur-3xl [animation-delay:4s]" />
          <div className="animate-blob absolute bottom-0 left-1/3 size-80 rounded-full bg-primary/10 blur-3xl [animation-delay:8s]" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:grid-cols-2 lg:gap-12 lg:pb-24 lg:pt-16">
          <div className="space-y-6 text-center lg:text-left">
            <Reveal delay={80}>
              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Le planning de vos équipes,
                <span className="text-primary"> enfin simple.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
                Ritem réunit la gestion des plannings, le pointage, les absences
                et la préparation de la paie dans un seul outil pensé pour les
                équipes terrain.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <DemoCta size="lg" className="h-12 px-6 text-base shadow-sm">
                  Demander une démo
                </DemoCta>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 px-6 text-base"
                >
                  <Link href="/login">J&apos;ai déjà un compte</Link>
                </Button>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-1 text-sm text-muted-foreground lg:justify-start">
                {["Sans engagement", "Mise en place accompagnée", "Support en français"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <Check className="size-4 text-primary" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </Reveal>
          </div>

          {/* Carte planning 3D — masquée sur mobile/tablette */}
          <Reveal delay={200} className="hidden lg:block lg:pl-6">
            <PlanningCard3D />
          </Reveal>
        </div>

        <ScrollDown />
      </section>

      {/* Fonctionnalités */}
      <section
        id="fonctionnalites"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:py-28"
      >
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tout ce qu&apos;il faut pour piloter vos équipes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Quatre modules complémentaires, une seule plateforme.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <div className="group h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={160}>
          <div className="mt-12 flex flex-col items-center gap-3 text-center sm:mt-16">
            <DemoCta
              size="lg"
              className="h-12 w-full px-7 text-base shadow-sm sm:w-auto"
            >
              Demander une démo
            </DemoCta>
            <p className="text-sm text-muted-foreground">
              Mise en place accompagnée · sans engagement
            </p>
          </div>
        </Reveal>
      </section>

      {/* Secteurs — carrousel défilant */}
      <section className="w-full py-16 sm:py-20 lg:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pensé pour les équipes terrain
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Restauration, commerce, hôtellerie, santé… Ritem s&apos;adapte à
              votre métier.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 sm:mt-14">
          <SectorsCarousel />
        </div>
      </section>

      {/* Témoignages */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ils gèrent leurs équipes avec Ritem
              </h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:mt-14 md:grid-cols-3">
            {[
              {
                quote:
                  "On a divisé par deux le temps passé à faire les plannings. Mes managers s'y retrouvent enfin.",
                name: "Camille R.",
                role: "Directrice, 3 restaurants",
              },
              {
                quote:
                  "Le pointage et la pré-paie connectés, c'est ce qui nous manquait. Plus aucune ressaisie.",
                name: "Sofiane B.",
                role: "Responsable retail",
              },
              {
                quote:
                  "Mes équipes voient leur planning sur leur téléphone. Les demandes d'absence sont fluides.",
                name: "Léa M.",
                role: "Gérante d'hôtel",
              },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 120}>
                <figure className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-7">
                  <Quote className="size-7 text-primary/30" />
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                    « {t.quote} »
                  </blockquote>
                  <div className="mt-5 flex items-center gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="size-4 fill-current" />
                    ))}
                  </div>
                  <figcaption className="mt-3">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>

          {/* Résultats chiffrés */}
          <div className="mt-12 grid grid-cols-2 gap-8 border-t border-border/60 pt-12 sm:mt-14 sm:gap-10 lg:grid-cols-4">
            {[
              { num: 3, suffix: " min", label: "pour publier un planning" },
              { num: 100, suffix: " %", label: "des heures suivies en temps réel" },
              {
                num: 30,
                prefix: "−",
                suffix: " %",
                label: "de temps passé sur les plannings",
              },
              { num: 0, label: "double-saisie pour la paie" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary sm:text-4xl">
                    <CountUp
                      value={s.num}
                      prefix={s.prefix}
                      suffix={s.suffix}
                    />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Demande de démo */}
      <section
        id="demande"
        className="border-t border-border/60"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:py-28">
          <Reveal className="space-y-5">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Demandez votre démo
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Ritem se déploie avec un accompagnement. Laissez-nous vos
              coordonnées : un conseiller vous recontacte pour vous présenter
              l&apos;outil et planifier une démo adaptée à votre activité.
            </p>
            <ul className="space-y-3 pt-1 text-sm">
              {[
                "Configuration de vos établissements et équipes",
                "Import de vos employés et de vos contrats",
                "Démo personnalisée à votre secteur",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" />
                  </span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <AccessRequestForm />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/60 bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Questions fréquentes
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Tout ce qu&apos;il faut savoir avant de démarrer.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 sm:mt-14">
            <Reveal>
              <Faq />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              R
            </span>
            Ritem
          </span>
          <span>© {new Date().getFullYear()} Ritem. Plannings &amp; RH.</span>
        </div>
      </footer>
    </div>
  );
}
