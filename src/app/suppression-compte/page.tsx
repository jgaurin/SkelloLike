import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suppression de compte — Ritem",
  description:
    "Comment demander la suppression de votre compte Ritem et des données associées.",
};

/**
 * Page publique de demande de suppression de compte.
 * URL requise par Google Play (section « Suppression de compte » de la fiche).
 * Doit citer le nom de l'app, la procédure, et les données supprimées/conservées.
 */
export default function SuppressionComptePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* En-tête */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:h-18 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm sm:size-9 sm:text-lg">
              R
            </span>
            <span className="text-foreground">Ritem</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Suppression de votre compte Ritem
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Application <strong className="text-foreground">Ritem</strong> — éditée
          par Jorian Gaurin
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
          <p>
            Cette page explique comment demander la suppression de votre compte
            <strong> Ritem</strong> et des données personnelles qui y sont
            associées.
          </p>

          <section className="space-y-3">
            <h2>Comment demander la suppression</h2>
            <p>
              Pour demander la suppression de votre compte et de vos données,
              deux possibilités :
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                <strong>Contactez votre employeur</strong> (l&apos;entreprise qui
                vous a fourni votre accès Ritem). Il est responsable de vos
                données et peut désactiver votre compte.
              </li>
              <li>
                Ou envoyez un e-mail à{" "}
                <a
                  href="mailto:ritem.pro@gmail.com?subject=Demande%20de%20suppression%20de%20compte%20Ritem"
                  className="text-primary underline underline-offset-2"
                >
                  ritem.pro@gmail.com
                </a>{" "}
                depuis l&apos;adresse liée à votre compte, avec l&apos;objet
                « Demande de suppression de compte ».
              </li>
            </ul>
            <p>
              Votre demande est traitée sous <strong>30 jours</strong>. Une
              confirmation vous est envoyée une fois la suppression effectuée.
            </p>
          </section>

          <section className="space-y-3">
            <h2>Données supprimées</h2>
            <p>
              À la suite de votre demande, les données personnelles suivantes
              sont supprimées ou anonymisées :
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>vos identifiants de connexion (adresse e-mail, mot de passe) ;</li>
              <li>
                vos données de profil (prénom, nom, téléphone, photo, code de
                badgeuse) ;
              </li>
              <li>vos demandes d&apos;absences et vos compteurs personnels.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2>Données conservées et durées</h2>
            <p>
              Certaines données peuvent être conservées après la suppression de
              votre compte lorsque la loi l&apos;impose à votre employeur :
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                <strong>Données de planning et d&apos;heures travaillées</strong> :
                conservées par votre employeur au titre de ses obligations
                légales en matière de droit du travail et de paie (généralement
                jusqu&apos;à 5 ans).
              </li>
              <li>
                Ces données sont conservées par l&apos;entreprise employeuse
                (responsable de traitement), et non à des fins commerciales ou
                publicitaires.
              </li>
            </ul>
            <p>
              Pour le détail complet du traitement de vos données, consultez
              notre{" "}
              <Link
                href="/confidentialite"
                className="text-primary underline underline-offset-2"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2>Contact</h2>
            <p>
              Pour toute question sur la suppression de vos données :{" "}
              <strong>ritem.pro@gmail.com</strong>.
            </p>
          </section>
        </div>
      </main>

      {/* Pied de page */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
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
