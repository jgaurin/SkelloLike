# Ritem

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
| Base de données / Auth / Storage | **Supabase** (PostgreSQL) — local via Docker en dev, **cloud** en prod |
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
| `npm run db:seed` | Réinjecter les données de démo (rejouable) |

### Données de démo

`supabase/seed.sql` est chargé automatiquement par `npm run db:reset` (voir
`[db.seed]` dans `supabase/config.toml`). Il crée une organisation démo
**« Boulangerie Cloé »** (2 établissements, 16 employés, tous types de contrat,
plannings + pointages sur juillet-août, absences, documents…).

```bash
npm run db:seed   # rejoue le seed sans réappliquer les migrations
```

Comptes de test (mot de passe `Boulangerie2026!`) :
- `chloe.marchand@boulangerie-cloe.fr` — gérante (org_owner, les 2 sites)
- `karim.haddad@boulangerie-cloe.fr` — responsable Centre-Ville
- `antoine.lemoine@boulangerie-cloe.fr` — responsable Gare
- `theo.vasseur@boulangerie-cloe.fr` — employé (vendeur)

---

## Production

Le site public est **https://ritem.pro**, hébergé sur un **VPS Ubuntu**.
L'infra de prod diffère du dev local :

| | Dev local | Production (VPS) |
|---|---|---|
| Base de données | Supabase local (Docker) | **Supabase cloud** |
| Serveur Next.js | `next dev` (port 3000) | `next start` via **pm2** (port 3002) |
| Reverse-proxy / TLS | — | **Apache** + Let's Encrypt → `localhost:3002` |

- **Code** : `/var/www/ritem`, process pm2 nommé `ritem` (`npm run start`).
- **Variables** : `/var/www/ritem/.env.production` (Supabase cloud + Resend) ;
  `NEXT_PUBLIC_SITE_URL=https://ritem.pro`. Le mot de passe Postgres n'y est pas
  (l'app n'utilise que les clés API) — il se réinitialise dans le dashboard Supabase.
- **Déployer une mise à jour** :

  ```bash
  cd /var/www/ritem
  git pull && npm run build && pm2 restart ritem
  ```

- **Réinitialiser la démo cloud** : rejouer `supabase/seed.sql` sur la base cloud
  (SQL Editor du dashboard Supabase, ou `psql` via la connexion Postgres —
  `sslmode=require`, `set search_path to public, extensions;`). Le seed est autonome.

> **SEO** : `robots.txt`, `sitemap.xml`, favicon (`icon.svg`/`icon.png`/`favicon.ico`),
> Open Graph et données structurées JSON-LD sont générés automatiquement
> (voir `src/lib/seo.ts`). Après déploiement, soumettre le sitemap dans
> **Google Search Console** pour accélérer l'indexation.

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
  seed.sql          données de démo (chargé par `db reset`)
```

### Documents de référence
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


