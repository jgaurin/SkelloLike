"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Clock,
  ScanLine,
  Users,
  CalendarOff,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

import { LocationSwitcher } from "@/components/layout/location-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const mainNav: NavItem[] = [
  { label: "Planning", href: "/planning", icon: CalendarDays },
  { label: "Pointage", href: "/pointage", icon: Clock },
  { label: "Badgeuse", href: "/badgeuse", icon: ScanLine },
  { label: "Employés", href: "/employes", icon: Users },
  { label: "Absences", href: "/absences", icon: CalendarOff },
];

const manageNav: NavItem[] = [
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Rapports", href: "/rapports", icon: BarChart3 },
  { label: "Paramètres", href: "/parametres", icon: Settings },
];

export function AppSidebar({
  orgName,
  locations,
  currentLocationId,
}: {
  orgName: string;
  locations: { id: string; name: string }[];
  currentLocationId: string;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Replie, le <li> est pleine largeur : sans ce centrage le bouton size-10 se
  // cale a gauche, decale par rapport au monogramme.
  // On vise l'attribut du wrapper plutot que `group-data-[…]` : le <li> porte
  // deja `group/menu-item`, ce qui casse la resolution du groupe anonyme.
  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <SidebarMenuItem
        key={item.href}
        className="in-data-[collapsible=icon]:flex in-data-[collapsible=icon]:justify-center"
      >
        <SidebarMenuButton
          asChild
          isActive={isActive(item.href)}
          tooltip={item.label}
          onClick={() => setOpenMobile(false)}
          className="relative h-10 gap-3 rounded-lg px-3 font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! [&_svg]:size-[1.125rem]"
        >
          <Link href={item.href}>
            {/* Barre d'accent : repere l'onglet courant. Masquee replie, ou le
                bouton centre est deja lisible et la barre toucherait le bord. */}
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-0 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-[height] duration-200 ease-(--ease-out-quint) group-data-active/menu-button:h-5 group-data-[collapsible=icon]:hidden"
            />
            <item.icon className="shrink-0 transition-transform duration-200 ease-(--ease-out-quint) group-hover/menu-button:scale-110" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 px-3 pt-3 pb-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        {/* Monogramme : seul repere de marque une fois replie. */}
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          {/* Meme gabarit que les boutons de nav (size-10) : les deux doivent
              tomber sur le meme axe vertical une fois replie.
              rounded-lg et pas -xl : avec --radius a 0.875rem, un -xl sur 40px
              arrondit jusqu'au cercle. */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-base font-bold text-sidebar-primary-foreground">
            R
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              Ritem
            </p>
            <p className="truncate text-[0.6875rem] text-sidebar-foreground/50">
              {orgName}
            </p>
          </div>
        </div>

        {/* Etablissement : masque replie, faute de place pour un select. */}
        <div className="group-data-[collapsible=icon]:hidden">
          <LocationSwitcher
            locations={locations}
            currentId={currentLocationId}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-2 px-2 pt-1 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="h-7 px-3 text-[0.625rem] font-semibold tracking-[0.08em] text-sidebar-foreground/40 uppercase">
            Pilotage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="h-7 px-3 text-[0.625rem] font-semibold tracking-[0.08em] text-sidebar-foreground/40 uppercase">
            Gestion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{renderItems(manageNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden">
        <div className="rounded-xl bg-sidebar-accent/40 p-3 group-data-[collapsible=icon]:hidden">
          <p className="text-[0.6875rem] font-medium text-sidebar-foreground/80">
            Version d&apos;essai
          </p>
          <p className="mt-0.5 text-[0.625rem] text-sidebar-foreground/50">
            Phase 1 · MVP
          </p>
        </div>
      </SidebarFooter>

      {/* Bord cliquable : replier/deplier sans viser le bouton du header. */}
      <SidebarRail />
    </Sidebar>
  );
}
