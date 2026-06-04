import Link from "next/link";
import { CalendarDays, CalendarOff } from "lucide-react";

import { getEmployeeContext } from "@/lib/auth/employee-context";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getEmployeeContext();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-4 px-4">
          <Link href="/mon-espace" className="font-bold text-primary">
            SkelloLike
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mon-espace">
                <CalendarDays className="size-4" />
                Mon planning
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mon-espace/absences">
                <CalendarOff className="size-4" />
                Mes absences
              </Link>
            </Button>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {ctx.orgName}
            </span>
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials(ctx.fullName)}
              </AvatarFallback>
            </Avatar>
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                Déconnexion
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
