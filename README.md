# SkelloLike

**Clone fonctionnel de Skello** — un SaaS de gestion des plannings et des
ressources humaines pour les équipes horaires (restauration, retail,
hôtellerie…). On reproduit les fonctionnalités et les patterns de Skello avec
**notre propre code et notre propre design** (aucun code/asset/contenu
propriétaire copié).

> Couleur principale : **émeraude** (`#059669`) · Police : **Poppins** · UI en français.

---

## Stack technique

| Couche | Techno |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, React 19) |
| Langage | TypeScript |
| Base de données / Auth / Storage | **Supabase** (PostgreSQL, en local via Docker) |
| UI | Tailwind CSS v4 + **shadcn/ui** (Radix), icônes **Lucide**, toasts **sonner** |
| Excel | ExcelJS · CSV natif |
| Isolation | Multi-tenant par **RLS** PostgreSQL |

> ⚠️ Next.js 16 : le middleware s'appelle **`proxy`** (`src/proxy.ts`).
> `cookies()`, `params`, `searchParams` sont des **Promises** (à `await`).

---

## Prérequis

- **Node.js** 20+
- **Docker Desktop** (pour la stack Supabase locale)
- **Supabase CLI** (utilisé via `npx`, aucune installation requise)

---

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer la base Supabase locale (Docker doit tourner)
npm run db:start          # = supabase start

# 3. Lancer l'app
npm run dev               # http://localhost:3000
```

À la première utilisation, créez un compte sur `/signup` puis suivez
l'onboarding (création de l'organisation + 1er établissement).

### Variables d'environnement

Le fichier `.env.local` (ignoré par git) contient les clés Supabase locales :

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé publishable affichée par `npm run db:status`>
SUPABASE_SERVICE_ROLE_KEY=<clé secret affichée par `npm run db:status`>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Récupérez les clés avec `npm run db:status` si elles changent.

---

## Scripts npm

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de dev (port 3000) |
| `npm run build` | Build de production |
| `npm run db:start` / `db:stop` | Démarrer / arrêter Supabase |
| `npm run db:status` | Afficher URLs + clés locales |
| `npm run db:reset` | Réappliquer toutes les migrations (⚠️ efface les données) |
| `npm run db:types` | Régénérer les types TypeScript depuis le schéma |
| `npm run db:seed-demo` | Injecter des données de démo |

### Données de démo

```bash
npm run db:seed-demo                                              # employés, postes, contrats, shifts
docker exec -i supabase_db_SkelloLike psql -U postgres < supabase/seed-2months.sql   # 2 mois de planning publié
```

---

## Fonctionnalités

### Gestion (espace manager)
- **Planning** : vues Jour / Semaine / Mois, drag & drop, regroupement par
  employé ou **par poste**, copier la semaine, **modèles**, publication
  (brouillon → publié), **alertes** (repos 11h, dépassement contrat, durée max,
  compétence, conflit) configurables et bloquantes, **jours fériés** FR,
  **pauses automatiques** configurables.
- **Employés** : CRUD complet, sélection multiple + actions de masse, recherche,
  contrats, postes occupables, **multi-établissements** (site principal + prêts),
  documents RH, code PIN de pointage, invitation par email.
- **Absences** : demande / validation, types configurables (activer, acquisition,
  demandable), **compteurs de congés** avec acquisition automatique.
- **Pointage / Badgeuse** : kiosque PIN (entrée/sortie), comparatif planifié vs
  réel par jour.
- **Rapports** : export **pré-paie mensuelle** (CSV + Excel mis en forme) — heures
  travaillées, heures supp par semaine, **majorations** (nuit/dimanche/fériés),
  absences par type, indemnités repas, coût chargé.
- **Établissements** : multi-sites, chacun avec son planning.
- **Paramètres** : règles & compteurs (convention, charges, repas), postes,
  pauses, acquisition des congés, absences, équipes, alertes.

### Espace employé
- **Mes shifts** (vue semaine) et **Toute l'équipe** (vue jour, statut de chacun :
  travail / repos / congé), **demande d'absence**, **compteurs de congés**.
- Accès par **invitation** (lien envoyé par le manager → création de compte).

---

## Architecture

```
Organization → Location (établissement) → Team (équipe) → Employee
```

- **Rôles** : `org_owner`, `org_admin`, `location_manager`, `team_manager`,
  `employee`. Le rôle détermine l'espace (gestion vs employé) et les droits.
- **Isolation** : chaque table est protégée par des **policies RLS** filtrant par
  organisation. Le client `admin` (service role) n'est utilisé côté serveur
  qu'après vérification d'auth + autorisation.
- **Contexte** : `getAppContext()` (manager), `getEmployeeContext()` (employé),
  `getLocationContext()` (établissement courant, sélecteur global de la sidebar).

### Organisation du code

```
src/
  app/
    (auth)/         login, signup, actions d'auth
    (app)/          espace manager (planning, employés, absences, rapports, …)
    (employee)/     espace employé (/mon-espace)
    invitation/     acceptation d'invitation
    api/export/     routes d'export CSV / Excel
  components/
    ui/             composants shadcn
    layout/         sidebar, header, etc.
  lib/
    supabase/       clients client/server/middleware/admin
    auth/           contextes & actions de rôle/établissement
    week.ts, breaks.ts, holidays.ts, prepaie.ts, pay-premiums.ts, planning-alerts.ts
    types/database.ts   types générés depuis le schéma
supabase/
  migrations/       schéma versionné
  seed-*.sql        données de démo
```

### Documents de référence
- `CAHIER_DES_CHARGES.md` — spécification fonctionnelle complète (24 sections, 3 phases).
- `DESIGN_SYSTEM.md` — charte visuelle et standards UX.
- `AGENTS.md` / `CLAUDE.md` — règles projet pour les assistants de code.

---

## Conventions

- **Design** : aucune couleur en dur dans les composants → toujours les tokens
  sémantiques (`bg-primary`, `bg-sidebar`, `text-muted-foreground`…). Pour
  rethémer, on ne touche qu'à `src/app/globals.css`. Exception : les couleurs
  *métier* (postes, absences, équipes, sites) stockées en base et appliquées en inline.
- **UX niveau Skello** : toute liste d'entités a un CRUD complet, sélection
  multiple, confirmation des actions destructives, toasts, états vides/chargement,
  recherche/filtres.
- Avant de livrer : `npx tsc --noEmit` doit passer.

---

## Dépannage

- **« Failed to fetch » / chargement infini** : Docker Desktop est arrêté.
  Rouvrez-le, attendez « Engine running », puis `npm run db:start`.
- **Supabase instable après un redémarrage** : `npm run db:stop` puis
  `npm run db:start`.
- **`Internal Server Error` en dev** : cache `.next` corrompu (souvent après
  suppression du dossier pendant que le serveur tourne). Arrêtez le serveur,
  `rm -rf .next`, relancez `npm run dev`.

---

## Roadmap

- **Phase 1 (MVP)** ✅ : auth, multi-tenant, employés, postes, contrats, planning,
  absences, compteurs.
- **Phase 2** 🚧 : pointage/badgeuse ✅, pré-paie + majorations ✅, documents RH ✅,
  multi-sites ✅, espace employé ✅. À venir : notifications email, régularisation
  des pointages, pré-paie basée sur le réel.
- **Phase 3** : app mobile employés, intégrations paie (Silae, Sage), SSO, API
  publique, facturation Stripe.

---

*Projet personnel — clone fonctionnel à but d'apprentissage. SkelloLike n'est pas
affilié à Skello.*
