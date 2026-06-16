import Link from "next/link";
import { LogOut } from "lucide-react";

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
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-2 px-3 sm:gap-4 sm:px-4">
          <Link href="/mon-espace" className="shrink-0 font-bold text-primary">
            Ritem
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">
              {ctx.orgName}
            </span>
            <Link href="/mon-espace/profil" aria-label="Mon profil">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials(ctx.fullName)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <form action={logout}>
              <Button
                variant="outline"
                size="sm"
                type="submit"
                className="px-2 sm:px-3"
              >
                <LogOut className="size-4 sm:hidden" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-3 py-5 sm:px-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
