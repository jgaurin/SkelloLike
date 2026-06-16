"use client";

import { ChevronDown } from "lucide-react";

/**
 * Indicateur « scroll » en bas du hero : un chevron qui rebondit et fait
 * défiler vers la section suivante (#fonctionnalites) au clic.
 */
export function ScrollDown() {
  function scrollNext() {
    const el = document.getElementById("fonctionnalites");
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={scrollNext}
      aria-label="Faire défiler vers le bas"
      className="absolute inset-x-0 bottom-6 z-10 mx-auto flex w-fit items-center justify-center text-muted-foreground transition-colors hover:text-primary"
    >
      <ChevronDown className="animate-bounce-down size-7" />
    </button>
  );
}
