"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Bouton « Demander une démo » qui défile en douceur jusqu'au formulaire
 * (#demande), centré dans la fenêtre, et qui refonctionne à chaque clic
 * (contrairement à une ancre href qui ne rejoue pas si le hash est déjà posé).
 */
export function DemoCta({
  className,
  size,
  children,
  withIcon = true,
}: {
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  children: React.ReactNode;
  withIcon?: boolean;
}) {
  function scrollToForm() {
    const el = document.getElementById("demande");
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "center",
    });
  }

  return (
    <Button
      type="button"
      size={size}
      className={className}
      onClick={scrollToForm}
    >
      {children}
      {withIcon && <ArrowRight className="size-4" />}
    </Button>
  );
}
