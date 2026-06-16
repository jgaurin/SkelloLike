"use client";

import { useRef } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  BarChart3,
  Bell,
  TrendingUp,
  Check,
} from "lucide-react";

type Shift = { label: string; col: number; span: number; tone: number };

// Lignes du mini-planning décoratif. `tone` = teinte d'opacité émeraude.
const ROWS: { name: string; role: string; shifts: Shift[] }[] = [
  { name: "Camille", role: "Service", shifts: [{ label: "09–15", col: 0, span: 3, tone: 1 }] },
  { name: "Sofiane", role: "Cuisine", shifts: [{ label: "11–18", col: 2, span: 2, tone: 2 }] },
  { name: "Léa", role: "Caisse", shifts: [{ label: "14–20", col: 1, span: 2, tone: 1 }] },
  { name: "Marc", role: "Manager", shifts: [{ label: "08–16", col: 3, span: 2, tone: 3 }] },
  { name: "Inès", role: "Service", shifts: [{ label: "17–23", col: 0, span: 2, tone: 2 }] },
  { name: "Yanis", role: "Plonge", shifts: [{ label: "18–23", col: 4, span: 2, tone: 1 }] },
];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const TONE: Record<number, string> = {
  1: "bg-primary/25 text-primary",
  2: "bg-primary/45 text-primary",
  3: "bg-primary/70 text-primary-foreground",
};

const NAV = [
  { icon: CalendarDays, active: true },
  { icon: Clock, active: false },
  { icon: Users, active: false },
  { icon: BarChart3, active: false },
];

/**
 * Maquette d'application en perspective 3D (sidebar + planning + stats), avec
 * parallaxe à la souris et cartes flottantes en sur-couche. Purement décoratif.
 * Couleurs via tokens (émeraude = primary).
 */
export function PlanningCard3D() {
  const wrapRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 11).toFixed(2)}deg`);
  }

  function onLeave() {
    const el = wrapRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      className="relative [perspective:1600px]"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        ref={wrapRef}
        className="animate-float transition-transform duration-300 ease-out [transform-style:preserve-3d] [transform:rotateX(var(--rx,6deg))_rotateY(var(--ry,-13deg))]"
      >
        <div className="overflow-hidden rounded-3xl border bg-card/90 shadow-2xl backdrop-blur-sm">
          {/* Barre fenêtre */}
          <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
            <span className="size-3 rounded-full bg-destructive/40" />
            <span className="size-3 rounded-full bg-primary/40" />
            <span className="size-3 rounded-full bg-muted-foreground/30" />
            <span className="ml-2 text-xs font-medium text-muted-foreground">
              Ritem · Planning de la semaine
            </span>
          </div>

          <div className="flex">
            {/* Sidebar mini */}
            <div className="hidden w-14 shrink-0 flex-col items-center gap-3 border-r bg-sidebar py-4 sm:flex">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                R
              </span>
              {NAV.map((n, i) => (
                <span
                  key={i}
                  className={`flex size-8 items-center justify-center rounded-lg ${
                    n.active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/50"
                  }`}
                >
                  <n.icon className="size-4" />
                </span>
              ))}
            </div>

            {/* Contenu planning */}
            <div className="min-w-0 flex-1 p-4 sm:p-5">
              {/* En-tête jours */}
              <div className="mb-2 grid grid-cols-[72px_repeat(6,1fr)] gap-1.5 text-center text-[10px] font-medium text-muted-foreground">
                <span />
                {DAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Lignes employés */}
              <div className="space-y-1.5">
                {ROWS.map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[72px_repeat(6,1fr)] items-center gap-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {row.name}
                      </p>
                      <p className="truncate text-[9px] text-muted-foreground">
                        {row.role}
                      </p>
                    </div>
                    <div className="col-span-6 grid grid-cols-6 gap-1.5">
                      {Array.from({ length: 6 }).map((_, col) => {
                        const shift = row.shifts.find(
                          (s) => col >= s.col && col < s.col + s.span,
                        );
                        const isStart = row.shifts.some((s) => s.col === col);
                        if (shift && isStart) {
                          return (
                            <div
                              key={col}
                              className={`flex h-8 items-center justify-center rounded-md px-1 text-[10px] font-semibold ${TONE[shift.tone]}`}
                              style={{ gridColumn: `span ${shift.span}` }}
                            >
                              {shift.label}
                            </div>
                          );
                        }
                        if (shift) return null;
                        return (
                          <div key={col} className="h-8 rounded-md bg-muted/60" />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bandeau stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4">
                {[
                  { label: "Heures planifiées", value: "182 h" },
                  { label: "Employés", value: "6" },
                  { label: "Coût semaine", value: "3 240 €" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-muted/50 p-2">
                    <p className="text-sm font-bold text-foreground">{s.value}</p>
                    <p className="text-[9px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Pied : action publier */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Brouillon · 6 jours
                </span>
                <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground">
                  <Check className="size-3" />
                  Publier
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes flottantes en sur-couche (profondeur) */}
      <div className="animate-float absolute -left-4 top-16 hidden rounded-2xl border bg-card px-3 py-2 shadow-xl [animation-delay:1.5s] lg:flex lg:items-center lg:gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Bell className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold leading-none">Pointage validé</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Camille · 09:02
          </p>
        </div>
      </div>

      <div className="animate-float absolute -bottom-5 -right-3 hidden rounded-2xl border bg-card px-3 py-2 shadow-xl [animation-delay:3s] lg:flex lg:items-center lg:gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <TrendingUp className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold leading-none">+12 % de productivité</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">ce mois-ci</p>
        </div>
      </div>
    </div>
  );
}
