# Design System — SkelloLike

> **Règle d'or :** on reproduit les **patterns de layout** d'un SaaS de planning RH
> (sidebar de navigation, header sticky, grille de planning, cards de stats…),
> mais avec **notre propre charte couleur émeraude** et notre propre code.
> On ne copie jamais le code, les assets, le logo ou les contenus propriétaires de Skello.

---

## 1. Couleur principale (main)

**Émeraude** — `#059669` (oklch `0.63 0.16 163`).

| Usage | Token | Valeur claire | Valeur sombre |
|---|---|---|---|
| Couleur principale | `--primary` | `oklch(0.63 0.16 163)` | `oklch(0.7 0.15 163)` |
| Texte sur primary | `--primary-foreground` | quasi-blanc | très foncé |
| Anneau focus | `--ring` | émeraude | émeraude |
| Accent (fonds doux) | `--accent` | vert très clair | vert foncé |
| Sidebar (fond) | `--sidebar` | émeraude foncée `oklch(0.32 0.06 165)` | `oklch(0.21 0.025 165)` |

⚠️ **Ne jamais hardcoder une couleur en dur** (`bg-[#059669]`, `text-emerald-600`, etc.)
dans les composants. Toujours passer par les tokens sémantiques :
`bg-primary`, `text-primary`, `bg-sidebar`, `text-muted-foreground`, `border`, etc.
Pour changer la couleur main de toute l'app, on ne touche qu'à `src/app/globals.css`.

---

## 2. Layout type Skello (notre implémentation)

```
┌──────────┬───────────────────────────────────────┐
│          │  Header sticky (h-14)                  │
│ Sidebar  │  [trigger] Titre        [avatar ▾]     │
│ émeraude ├───────────────────────────────────────┤
│ foncée   │                                        │
│          │  Contenu de la page (p-6)              │
│ - Plan.  │  - cards de stats (grid)               │
│ - Point. │  - grille de planning                  │
│ - Empl.  │  - tableaux                            │
│ - Abs.   │                                        │
│ …        │                                        │
└──────────┴───────────────────────────────────────┘
```

- **Sidebar** : `src/components/layout/app-sidebar.tsx`. Fond émeraude foncé,
  collapsible en mode icône. Sections : « Pilotage » (Planning, Pointage,
  Employés, Absences) et « Gestion » (Documents, Rapports, Établissements, Paramètres).
- **Header** : `src/components/layout/app-header.tsx`. Sticky, hauteur `h-14`,
  bordure basse, `SidebarTrigger` + titre de page à gauche, menu avatar à droite.
- **Layout de l'espace** : `src/app/(app)/layout.tsx` — toutes les pages
  authentifiées vivent dans le groupe `(app)` et partagent ce shell.

Chaque page de `(app)` rend `<AppHeader title="…" … />` en haut, puis un
`<main className="flex-1 space-y-6 p-6">`.

---

## 3. Composants

- **Librairie** : shadcn/ui (Radix + Tailwind v4), preset Nova (icônes **Lucide**).
  Ajouter un composant : `npx shadcn@latest add <nom>`.
- **Police principale : Poppins** (sans-serif arrondie, esprit Skello), chargée via
  `next/font/google` dans `src/app/layout.tsx`, exposée par la variable `--font-sans`
  (poids 400/500/600/700). Monospace : Geist Mono (`--font-mono`). Ne pas réintroduire
  Geist Sans comme police d'UI.
- **Ne pas réinventer** un composant déjà fourni par shadcn (Button, Card, Input,
  Dialog, DropdownMenu, Table…). On les utilise et on les compose.
- **Icônes** : toujours `lucide-react`, taille `size-4` par défaut dans les menus.
- **Toasts** : `sonner` (déjà branché dans le layout racine).

---

## 4. Conventions visuelles

| Élément | Règle |
|---|---|
| Rayon | `--radius: 0.625rem` (via tokens `rounded-md`, `rounded-lg`) |
| Espacement page | `p-6`, sections espacées en `space-y-6` |
| Cards de stats | titre `text-sm text-muted-foreground` + valeur `text-2xl font-bold` + icône `text-primary` |
| Titres de page | `text-xl font-semibold tracking-tight` |
| Textes secondaires | `text-muted-foreground` |
| Bordures | token `border` (jamais une couleur en dur) |
| Langue UI | **français** par défaut |
| Mode sombre | supporté via la classe `.dark` (tokens déjà définis) |

---

## 5. Couleurs métier (planning)

Les **postes/qualifications** et **types d'absence** ont chacun une couleur
stockée en base (`positions.color`, `absence_types.color`, `teams.color`,
`locations.color`). Elles sont **libres** (choisies par l'utilisateur) et
appliquées en style inline sur les shifts/badges — c'est le **seul** cas où une
couleur ne vient pas des tokens du thème. La couleur **main** de l'app reste
toujours l'émeraude.

---

## 6. Checklist avant de livrer un écran

- [ ] La page vit dans `src/app/(app)/` et rend `<AppHeader>` + `<main className="p-6">`.
- [ ] Aucune couleur en dur : uniquement des tokens sémantiques.
- [ ] Composants shadcn réutilisés (pas de réimplémentation).
- [ ] Icônes Lucide, textes en français.
- [ ] Responsive (grilles `sm: / lg:`), lisible en mode sombre.
- [ ] `npx tsc --noEmit` passe.
