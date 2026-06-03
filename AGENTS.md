<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SkelloLike — règles projet

**Quoi :** clone *fonctionnel* de Skello (SaaS planning + RH). On reproduit les
fonctionnalités et les patterns de layout, avec **notre propre code et notre
propre design**. Jamais de code/assets/logo/contenus propriétaires copiés.

## Design (OBLIGATOIRE — lire `DESIGN_SYSTEM.md`)
- **Couleur main = émeraude** (`#059669`). Définie via tokens dans
  `src/app/globals.css`. **Jamais** de couleur en dur (`bg-[#...]`, `text-emerald-*`)
  dans les composants — toujours les tokens sémantiques (`bg-primary`, `text-primary`,
  `bg-sidebar`, `text-muted-foreground`, `border`…).
- **Layout :** toute page authentifiée vit dans `src/app/(app)/`, partage le shell
  (sidebar émeraude + header sticky) et rend `<AppHeader title="…" … />` puis
  `<main className="flex-1 space-y-6 p-6">`.
- **Composants :** shadcn/ui (Radix + Tailwind v4), icônes **Lucide**, toasts **sonner**.
  Réutiliser les composants existants, ne pas les réimplémenter. Ajouter :
  `npx shadcn@latest add <nom>`.
- **Police = Poppins** (`--font-sans`, via `next/font/google` dans `layout.tsx`).
  Monospace = Geist Mono. Ne pas remettre Geist Sans en police d'UI.
- **UI en français**, support du mode sombre via tokens.
- **UX niveau Skello (OBLIGATOIRE) :** toute liste d'entités doit avoir CRUD complet
  (créer/modifier/supprimer + archiver), **sélection multiple + actions de masse**,
  **confirmation** sur les actions destructives, toasts, empty/loading states,
  recherche/filtres/tri. Détails dans `DESIGN_SYSTEM.md` §6. Ne jamais livrer un
  "créer" sans le "supprimer/modifier".
- Couleurs *métier* (postes, absences, équipes, sites) = stockées en base, libres,
  appliquées en inline — seule exception aux tokens.

## Stack & conventions
- Next.js 16 (App Router, Turbopack). Middleware = **`proxy`** (`src/proxy.ts`).
  `cookies()`, `params`, `searchParams` sont des **Promises** → `await`.
- Supabase local. Clients : `src/lib/supabase/{client,server,middleware,admin}.ts`.
  `admin` (service role) **uniquement** côté serveur, après vérif auth + autorisation.
- Multi-tenant : isolation par RLS. Contexte user via `getAppContext()`
  (`src/lib/auth/context.ts`). **Vérifier auth+rôle dans chaque Server Action.**
- Régénérer les types DB après migration : `npm run db:types`.
- Avant de livrer un écran : `npx tsc --noEmit` doit passer + checklist du `DESIGN_SYSTEM.md`.

## Références
- `CAHIER_DES_CHARGES.md` — spec fonctionnelle complète (24 sections, 3 phases).
- `DESIGN_SYSTEM.md` — charte visuelle détaillée.
