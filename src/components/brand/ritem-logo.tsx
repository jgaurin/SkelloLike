/**
 * Identité Ritem en SVG — deux verrous de marque, jamais côte à côte.
 *
 *  • <RitemMark>     le pictogramme « r. » (le « r » + le point émeraude).
 *                    Sert de monogramme / favicon / avatar. Carré compact.
 *  • <RitemWordmark> le logotype complet « ritem » (le point du « i » est
 *                    l'accent émeraude). Sert de logo texte.
 *
 * Règle d'usage : on affiche l'UN OU l'AUTRE, jamais « r. » collé à « ritem »
 * (ça se lirait « r.ritem »). Ex. sidebar : wordmark déplié, mark une fois replié.
 *
 * Adaptatif : les lettres sont peintes en `currentColor` (donc suivent la
 * couleur du texte : encre foncée sur fond clair, blanc sur fond foncé) et le
 * point utilise `--ritem-accent`. Sur un fond émeraude on surcharge
 * `--ritem-accent` (ex. `[--ritem-accent:var(--sidebar-primary)]`) pour que le
 * point reste visible.
 *
 * La police vient de `var(--font-sans)` (Poppins) : le tracé reste cohérent
 * avec le reste de l'UI et n'est pas figé dans un chemin vectoriel approximatif.
 */

const FONT_STACK =
  "var(--font-sans), 'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif";

type LogoProps = {
  className?: string;
  /** Libellé accessible ; masqué si le logo est purement décoratif. */
  title?: string;
};

/** Pictogramme « r. » — monogramme carré. Hauteur = 1em par défaut. */
export function RitemMark({ className, title = "Ritem" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label={title}
      style={{ fontFamily: FONT_STACK }}
    >
      <text
        x="8"
        y="30"
        fontSize="34"
        fontWeight={600}
        letterSpacing="-1"
        fill="currentColor"
      >
        r
      </text>
      <circle cx="27.5" cy="27" r="5.4" fill="var(--ritem-accent, #059669)" />
    </svg>
  );
}

/** Logotype « ritem » — le point du « i » est l'accent émeraude. */
export function RitemWordmark({ className, title = "Ritem" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 168 56"
      className={className}
      role="img"
      aria-label={title}
      style={{ fontFamily: FONT_STACK }}
    >
      {/* « ritem » avec un i NORMAL (présent dans le sous-ensemble latin de
          Poppins → même rendu partout ; le i sans point U+0131 tombait en
          fallback dans le vrai navigateur et décalait tout). Le point émeraude
          recouvre exactement le point natif du i. */}
      <text
        x="6"
        y="42"
        fontSize="48"
        fontWeight={600}
        letterSpacing="-1.5"
        fill="currentColor"
      >
        ritem
      </text>
      <circle cx="31" cy="9" r="5" fill="var(--ritem-accent, #059669)" />
    </svg>
  );
}
