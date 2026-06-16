"use client";

import Image from "next/image";

// Photos Unsplash (licence libre, usage commercial). Recadrées via paramètres
// d'URL. q=75 (qualité autorisée par défaut côté Next 16).
const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&h=1000&q=75`;

const SECTORS = [
  { label: "Restauration", img: IMG("photo-1517248135467-4c7edcad34c4") },
  { label: "Commerce", img: IMG("photo-1441986300917-64674bd600d8") },
  { label: "Hôtellerie", img: IMG("photo-1566073771259-6a8506099945") },
  { label: "Santé", img: IMG("photo-1576091160550-2173dba999ef") },
  { label: "Industrie", img: IMG("photo-1581091226825-a6a2a5aee158") },
  { label: "Logistique", img: IMG("photo-1553413077-190dd305871c") },
  { label: "Café & Bar", img: IMG("photo-1554118811-1e0d58224f24") },
  { label: "Retail", img: IMG("photo-1513104890138-7c749659a591") },
  { label: "Sport & Loisirs", img: IMG("photo-1534438327276-14e5300c3a48") },
  { label: "Beauté", img: IMG("photo-1560066984-138dadb4c035") },
];

function Card({ label, img }: { label: string; img: string }) {
  return (
    <div className="group/card relative h-80 w-60 shrink-0 overflow-hidden rounded-3xl shadow-md ring-1 ring-border/50 transition-shadow duration-300 hover:shadow-xl sm:h-96 sm:w-72">
      <Image
        src={img}
        alt={label}
        fill
        sizes="(max-width: 640px) 15rem, 18rem"
        className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
      />
      {/* Voile dégradé pour la lisibilité du label */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <span className="text-lg font-semibold text-white drop-shadow-sm">
          {label}
        </span>
        <div className="mt-2 h-1 w-10 rounded-full bg-primary transition-all duration-300 group-hover/card:w-16" />
      </div>
    </div>
  );
}

/**
 * Carrousel de secteurs en défilement continu (marquee), avec photos.
 * Se met en pause au survol. La piste est dupliquée pour une boucle sans
 * couture.
 */
export function SectorsCarousel() {
  return (
    <div className="group relative overflow-hidden py-2">
      {/* Dégradés de bord pour un fondu propre */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent sm:w-32" />

      <div className="animate-marquee flex w-max gap-6 group-hover:[animation-play-state:paused]">
        {[...SECTORS, ...SECTORS].map((s, i) => (
          <Card key={`${s.label}-${i}`} label={s.label} img={s.img} />
        ))}
      </div>
    </div>
  );
}
