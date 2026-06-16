import { Mail, Phone, CalendarPlus } from "lucide-react";

import type { EmployeeContext } from "@/lib/auth/employee-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PinCodeCard } from "./profil/pin-code-card";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Section « Mon profil » : identité, code de badgeuse et coordonnées.
 * Le matricule n'est volontairement pas exposé à l'employé.
 */
export function ProfilSection({ ctx }: { ctx: EmployeeContext }) {
  const infos: { icon: typeof Mail; label: string; value: string | null }[] = [
    { icon: Mail, label: "Email", value: ctx.email || null },
    { icon: Phone, label: "Téléphone", value: ctx.phone },
    {
      icon: CalendarPlus,
      label: "Date d'entrée",
      value: ctx.hireDate ? formatDate(ctx.hireDate) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Mon profil</h2>

      <div className="flex items-center gap-4">
        <Avatar className="size-16 shrink-0">
          {ctx.avatarUrl && (
            <AvatarImage src={ctx.avatarUrl} alt={ctx.fullName} />
          )}
          <AvatarFallback className="bg-primary text-lg text-primary-foreground">
            {initials(ctx.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{ctx.fullName}</p>
          <p className="truncate text-sm text-muted-foreground">{ctx.orgName}</p>
        </div>
      </div>

      <PinCodeCard pinCode={ctx.pinCode} />

      <div className="rounded-lg border">
        {infos.map((info, i) => (
          <div key={info.label}>
            {i > 0 && <Separator />}
            <div className="flex items-center gap-3 p-4">
              <info.icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="w-28 shrink-0 text-sm text-muted-foreground">
                {info.label}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {info.value ?? "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
