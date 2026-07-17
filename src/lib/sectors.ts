/**
 * Secteurs métier ciblés pour le SEO — chaque secteur a sa page dédiée
 * (`/secteurs/[slug]`) avec un contenu **unique** (titre, description, défis
 * spécifiques) afin de se positionner sur les recherches « logiciel de planning
 * pour {métier} » sans contenu dupliqué.
 */

import {
  UtensilsCrossed,
  Croissant,
  Store,
  Hotel,
  Coffee,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export type SectorChallenge = { title: string; desc: string };

export type Sector = {
  slug: string;
  /** Nom court, ex. « Restaurant ». */
  name: string;
  /** Libellé pluriel pour les titres, ex. « les restaurants ». */
  forWhom: string;
  /** Icône Lucide (même set que le reste de l'UI). */
  icon: LucideIcon;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  keywords: string[];
  challenges: SectorChallenge[];
};

export const SECTORS: Sector[] = [
  {
    slug: "restaurant",
    name: "Restaurant",
    forWhom: "les restaurants",
    icon: UtensilsCrossed,
    metaTitle: "Logiciel de planning pour restaurant — Ritem",
    metaDescription:
      "Ritem gère le planning de votre restaurant : services midi/soir, coupures, extras, pointage et préparation de la paie avec majorations. Essai gratuit.",
    h1: "Le logiciel de planning pensé pour les restaurants",
    intro:
      "Des services du midi au coup de feu du soir, Ritem vous fait gagner des heures sur la gestion des plannings, du pointage et de la paie — pour que vous restiez en salle, pas dans un tableur.",
    keywords: [
      "logiciel planning restaurant",
      "logiciel de planning restauration",
      "gestion planning restaurant",
      "planning équipe restaurant",
      "logiciel RH restauration",
    ],
    challenges: [
      {
        title: "Services midi & soir, coupures, extras",
        desc: "Planifiez les deux services et les coupures en quelques clics, ajoutez des extras pour les gros week-ends, et publiez le planning aux équipes en un instant.",
      },
      {
        title: "Le bon effectif au bon moment",
        desc: "Ajustez la couverture salle et cuisine selon l'affluence. Des alertes vous préviennent en cas de sous-effectif ou de dépassement d'heures.",
      },
      {
        title: "Postes & compétences",
        desc: "Serveur, chef de rang, cuisinier, plongeur : chaque poste a sa couleur, chaque employé ses compétences — impossible de placer quelqu'un sur un poste qu'il ne tient pas.",
      },
      {
        title: "Heures réelles & paie",
        desc: "La badgeuse enregistre les heures réelles ; l'export pré-paie calcule automatiquement les majorations (nuit, dimanche, jours fériés).",
      },
    ],
  },
  {
    slug: "boulangerie",
    name: "Boulangerie",
    forWhom: "les boulangeries-pâtisseries",
    icon: Croissant,
    metaTitle: "Logiciel de planning pour boulangerie-pâtisserie — Ritem",
    metaDescription:
      "Ritem organise le planning de votre boulangerie : équipes de production dès l'aube, vente en journée, week-ends chargés, apprentis et pré-paie. Essai gratuit.",
    h1: "Le logiciel de planning des boulangeries-pâtisseries",
    intro:
      "Entre la fournée du petit matin et la vente en journée, votre boulangerie tourne sur deux rythmes. Ritem cale les équipes de production et de boutique sans casse-tête, et prépare la paie tout seul.",
    keywords: [
      "logiciel planning boulangerie",
      "planning boulangerie pâtisserie",
      "gestion planning boulangerie",
      "logiciel RH boulangerie",
      "planning équipe boulangerie",
    ],
    challenges: [
      {
        title: "Production dès l'aube, vente en journée",
        desc: "Planifiez le laboratoire dès 4h et la boutique en journée sur des horaires distincts, avec des équipes et des postes dédiés à chaque activité.",
      },
      {
        title: "Week-ends et jours fériés chargés",
        desc: "Anticipez les pics du week-end et des fêtes, renforcez les équipes et laissez Ritem calculer les majorations de dimanche et de jours fériés.",
      },
      {
        title: "Apprentis, CDD et temps partiels",
        desc: "Gérez tous les types de contrat avec leurs heures, leurs compteurs de congés et leurs particularités — apprentis et saisonniers inclus.",
      },
      {
        title: "Plusieurs points de vente",
        desc: "Pilotez plusieurs boutiques depuis un seul outil et prêtez du personnel d'un site à l'autre quand il manque du monde.",
      },
    ],
  },
  {
    slug: "commerce",
    name: "Commerce & retail",
    forWhom: "les commerces et enseignes de retail",
    icon: Store,
    metaTitle: "Logiciel de planning pour commerce & retail — Ritem",
    metaDescription:
      "Ritem planifie les équipes de votre commerce : amplitude horaire, temps partiels, saisonnalité, multi-magasins, pointage et pré-paie. Essai gratuit.",
    h1: "Le logiciel de planning pour le commerce et le retail",
    intro:
      "De l'ouverture à la fermeture, 7j/7, Ritem couvre toute l'amplitude de votre magasin, gère la polyvalence des équipes et maîtrise la masse salariale pendant les pics de saison.",
    keywords: [
      "logiciel planning commerce",
      "logiciel planning magasin",
      "planning retail",
      "gestion planning boutique",
      "logiciel RH commerce",
    ],
    challenges: [
      {
        title: "Toute l'amplitude d'ouverture",
        desc: "Couvrez l'ouverture, la fermeture et les week-ends avec des rotations claires, sans trou ni doublon dans le planning.",
      },
      {
        title: "Temps partiels & polyvalence",
        desc: "Caisse, rayon, réserve : affectez chacun selon ses compétences et son contrat, et suivez les heures des temps partiels au plus juste.",
      },
      {
        title: "Soldes, fêtes, saisonnalité",
        desc: "Renforcez les équipes sur les grosses périodes, avec des alertes sur les dépassements pour ne pas exploser le budget.",
      },
      {
        title: "Plusieurs magasins",
        desc: "Gérez tous vos points de vente depuis une seule interface et organisez le prêt de personnel entre magasins.",
      },
    ],
  },
  {
    slug: "hotellerie",
    name: "Hôtellerie",
    forWhom: "les hôtels",
    icon: Hotel,
    metaTitle: "Logiciel de planning pour hôtellerie — Ritem",
    metaDescription:
      "Ritem gère les plannings de votre hôtel : réception 24/7, nuits, étages, saison, majorations et pré-paie, sur un ou plusieurs établissements. Essai gratuit.",
    h1: "Le logiciel de planning pour l'hôtellerie",
    intro:
      "Réception de nuit, étages, petit-déjeuner : un hôtel ne s'arrête jamais. Ritem couvre tous les services 24/7, gère les majorations de nuit et s'adapte à votre saison.",
    keywords: [
      "logiciel planning hôtellerie",
      "planning hôtel",
      "gestion planning hôtellerie",
      "logiciel RH hôtellerie",
      "planning réception hôtel",
    ],
    challenges: [
      {
        title: "Réception 24/7 et nuits",
        desc: "Couvrez les nuits et les week-ends sans rupture, avec le calcul automatique des majorations de nuit.",
      },
      {
        title: "Un planning par service",
        desc: "Réception, étages, restauration, maintenance : chaque service a son équipe et son planning, coordonnés au même endroit.",
      },
      {
        title: "Saison et extras",
        desc: "Adaptez vos effectifs à la haute et la basse saison, avec CDD et extras gérés comme le reste de l'équipe.",
      },
      {
        title: "Maîtrise des heures et des coûts",
        desc: "Pointage des heures réelles et export pré-paie pour garder l'œil sur les heures supplémentaires et le coût chargé.",
      },
    ],
  },
  {
    slug: "cafe-bar",
    name: "Café & bar",
    forWhom: "les cafés et les bars",
    icon: Coffee,
    metaTitle: "Logiciel de planning pour café & bar — Ritem",
    metaDescription:
      "Ritem planifie vos équipes de café ou de bar : services décalés, extras pour les week-ends, heures de nuit majorées, pointage et pré-paie. Essai gratuit.",
    h1: "Le logiciel de planning pour les cafés et les bars",
    intro:
      "Du service du matin à la fermeture tardive, Ritem gère des rotations souples, les renforts du week-end et les heures de nuit — sans prise de tête.",
    keywords: [
      "logiciel planning bar",
      "logiciel planning café",
      "planning équipe bar",
      "gestion planning café bar",
      "logiciel RH bar",
    ],
    challenges: [
      {
        title: "Services décalés et souples",
        desc: "Matin, après-midi, soirée, nuit : composez des rotations flexibles et déplacez un créneau par simple glisser-déposer.",
      },
      {
        title: "Extras et gros week-ends",
        desc: "Ajoutez des extras pour les soirées chargées et les événements, avec un suivi propre de leurs heures.",
      },
      {
        title: "Postes et compétences",
        desc: "Barman, serveur, runner : chaque poste sa couleur, chaque personne ses compétences pour un planning cohérent.",
      },
      {
        title: "Heures de nuit et dimanche",
        desc: "Les majorations de nuit et de dimanche sont calculées automatiquement à partir des heures réelles au pointage.",
      },
    ],
  },
  {
    slug: "sante",
    name: "Santé",
    forWhom: "les établissements de santé",
    icon: Stethoscope,
    metaTitle: "Logiciel de planning pour la santé — Ritem",
    metaDescription:
      "Ritem organise les plannings de vos équipes de santé : gardes, nuits, roulements, repos de sécurité, multi-sites et suivi des heures. Essai gratuit.",
    h1: "Le logiciel de planning pour les établissements de santé",
    intro:
      "Continuité des soins, gardes de nuit, roulements : Ritem construit des plannings fiables, alerte sur les repos obligatoires et coordonne plusieurs établissements.",
    keywords: [
      "logiciel planning santé",
      "planning soignants",
      "gestion planning établissement de santé",
      "logiciel RH santé",
      "planning gardes",
    ],
    challenges: [
      {
        title: "Continuité des soins",
        desc: "Couvrez les gardes, les nuits et les week-ends sans rupture, avec une vue claire de qui est présent à chaque instant.",
      },
      {
        title: "Roulements et cycles",
        desc: "Gérez des roulements réguliers et déplacez les créneaux facilement quand un imprévu bouscule le planning.",
      },
      {
        title: "Repos et durées réglementaires",
        desc: "Des alertes vous signalent le non-respect du repos minimum ou le dépassement des durées maximales de travail.",
      },
      {
        title: "Plusieurs établissements",
        desc: "Coordonnez plusieurs sites et organisez le prêt de personnel entre eux depuis une seule interface.",
      },
    ],
  },
];

export function getSector(slug: string): Sector | undefined {
  return SECTORS.find((s) => s.slug === slug);
}
