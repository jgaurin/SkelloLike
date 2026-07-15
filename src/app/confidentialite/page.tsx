import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Ritem",
  description:
    "Comment l'application Ritem collecte, utilise et protège les données personnelles de ses utilisateurs.",
};

/**
 * Page publique de la politique de confidentialité.
 * URL requise par Google Play pour la fiche de l'application mobile Ritem.
 * Le contenu est synchronisé avec mobile/PRIVACY_POLICY.md.
 */
export default function ConfidentialitePage() {
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
          Politique de confidentialité
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Dernière mise à jour : 3 juillet 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
          <p>
            La présente politique de confidentialité décrit comment
            l&apos;application mobile <strong>Ritem</strong> (« l&apos;Application
            ») collecte, utilise et protège les données personnelles de ses
            utilisateurs. Elle s&apos;applique à l&apos;application Android
            destinée aux employés des entreprises clientes de Ritem.
          </p>

          <section className="space-y-3">
            <h2>1. Responsable du traitement</h2>
            <p>
              L&apos;Application est éditée par <strong>Jorian Gaurin</strong>,
              éditeur individuel.
            </p>
            <p>
              Contact : <strong>contact@ritem.pro</strong>
            </p>
            <p>
              Pour les données saisies par les employés, l&apos;entreprise
              employeuse (cliente de Ritem) agit en tant que{" "}
              <strong>responsable de traitement</strong> ; Ritem agit en tant que{" "}
              <strong>sous-traitant</strong> au sens du RGPD, pour le compte de
              cette entreprise.
            </p>
          </section>

          <section className="space-y-3">
            <h2>2. Données que nous collectons</h2>
            <p>
              L&apos;Application traite uniquement les données nécessaires à son
              fonctionnement :
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                <strong>Données de compte</strong> : adresse email et mot de
                passe (chiffré), utilisés pour l&apos;authentification.
              </li>
              <li>
                <strong>Données de profil employé</strong> : prénom, nom, email,
                téléphone, date d&apos;entrée, photo (si fournie), code de
                badgeuse.
              </li>
              <li>
                <strong>Données de planning</strong> : horaires de travail,
                postes, équipes, établissements.
              </li>
              <li>
                <strong>Données d&apos;absences</strong> : demandes de
                congés/absences, dates, statut, compteurs de soldes.
              </li>
            </ul>
            <p>
              L&apos;Application <strong>ne collecte pas</strong> : votre
              position géographique, vos contacts, vos photos (hors photo de
              profil fournie volontairement), ni aucune donnée publicitaire.
              L&apos;Application n&apos;utilise <strong>aucun traceur
              publicitaire</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2>3. Finalités du traitement</h2>
            <p>Ces données sont utilisées exclusivement pour :</p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>vous authentifier et sécuriser l&apos;accès à votre espace ;</li>
              <li>afficher votre planning et celui de votre équipe ;</li>
              <li>gérer vos demandes d&apos;absences ;</li>
              <li>afficher votre profil et votre code de badgeuse.</li>
            </ul>
            <p>
              Aucune donnée n&apos;est utilisée à des fins commerciales ou
              publicitaires, ni revendue à des tiers.
            </p>
          </section>

          <section className="space-y-3">
            <h2>4. Base légale</h2>
            <p>
              Le traitement repose sur l&apos;<strong>exécution du contrat de
              travail</strong> entre l&apos;employé et son employeur, et sur
              l&apos;<strong>intérêt légitime</strong> de l&apos;employeur à
              organiser le travail de ses équipes (planning, RH).
            </p>
          </section>

          <section className="space-y-3">
            <h2>5. Hébergement et sous-traitants</h2>
            <p>
              Les données sont hébergées par <strong>Supabase</strong>
              (infrastructure cloud), sur des serveurs situés dans
              l&apos;<strong>Union européenne</strong>. Supabase agit comme
              sous-traitant technique et n&apos;accède pas aux données à
              d&apos;autres fins que l&apos;hébergement.
            </p>
          </section>

          <section className="space-y-3">
            <h2>6. Durée de conservation</h2>
            <p>
              Les données sont conservées pendant la durée de la relation
              contractuelle entre l&apos;employé et son employeur, puis archivées
              ou supprimées conformément aux obligations légales de
              l&apos;employeur. À la fin de cette relation, le compte est
              désactivé.
            </p>
          </section>

          <section className="space-y-3">
            <h2>7. Sécurité</h2>
            <p>
              L&apos;accès aux données est protégé par authentification et par
              des règles d&apos;isolation par entreprise (Row Level Security).
              Les mots de passe sont stockés sous forme chiffrée. Les
              communications entre l&apos;Application et nos serveurs sont
              chiffrées (HTTPS/TLS).
            </p>
          </section>

          <section className="space-y-3">
            <h2>8. Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès,
              de rectification, d&apos;effacement, de limitation et
              d&apos;opposition sur vos données. Ces droits s&apos;exercent en
              priorité auprès de votre employeur (responsable de traitement), ou
              en nous contactant à <strong>contact@ritem.pro</strong>.
            </p>
            <p>
              Vous pouvez également introduire une réclamation auprès de la CNIL
              (
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                www.cnil.fr
              </a>
              ).
            </p>
          </section>

          <section className="space-y-3">
            <h2>9. Suppression de compte et des données</h2>
            <p>
              Pour demander la suppression de votre compte et de vos données,
              contactez votre employeur ou écrivez à{" "}
              <strong>contact@ritem.pro</strong>. La demande est traitée sous
              30 jours.
            </p>
          </section>

          <section className="space-y-3">
            <h2>10. Modifications</h2>
            <p>
              Cette politique peut être mise à jour. La date de dernière mise à
              jour figure en haut de cette page. En cas de modification
              substantielle, les utilisateurs en seront informés.
            </p>
          </section>

          <section className="space-y-3">
            <h2>11. Contact</h2>
            <p>
              Pour toute question relative à cette politique ou à vos données :{" "}
              <strong>contact@ritem.pro</strong>.
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
