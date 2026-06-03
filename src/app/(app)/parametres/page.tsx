import Link from "next/link";
import { Briefcase, Building2, Coffee, ChevronRight } from "lucide-react";

import { getAppContext } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const settings = [
  {
    href: "/parametres/postes",
    icon: Briefcase,
    title: "Postes & qualifications",
    description: "Gérez les postes (Serveur, Cuisinier…) et leurs couleurs.",
  },
  {
    href: "/parametres/pauses",
    icon: Coffee,
    title: "Pauses automatiques",
    description: "Pré-remplissage des pauses selon la durée des shifts.",
  },
  {
    href: "/etablissements",
    icon: Building2,
    title: "Établissements",
    description: "Vos sites, leurs horaires et leurs paramètres.",
  },
];

export default async function ParametresPage() {
  const ctx = await getAppContext();

  return (
    <>
      <AppHeader title="Paramètres" fullName={ctx.fullName} email={ctx.email} />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Paramètres</h2>
          <p className="text-sm text-muted-foreground">
            Configurez {ctx.orgName}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {settings.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="transition hover:border-primary/40 hover:shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <item.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
