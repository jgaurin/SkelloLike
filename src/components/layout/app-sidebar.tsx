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

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.href)}
          tooltip={item.label}
          onClick={() => setOpenMobile(false)}
          className="relative h-10 gap-3 rounded-xl px-3 font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground group-data-[collapsible=icon]:px-0! [&_svg]:size-[1.125rem]"
        >
          <Link href={item.href}>
            {/* Barre d'accent : repere l'onglet courant, y compris replie. */}
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-0 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-[height] duration-200 ease-(--ease-out-quint) group-data-active/menu-button:h-5"
            />
            <item.icon className="shrink-0 transition-transform duration-200 ease-(--ease-out-quint) group-hover/menu-button:scale-110" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 px-3 pt-3 pb-2 group-data-[collapsible=icon]:px-2">
        {/* Monogramme : seul repere de marque une fois replie. */}
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-base font-bold text-sidebar-primary-foreground">
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

      <SidebarContent className="gap-2 px-2 pt-1">
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

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:px-2">
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
