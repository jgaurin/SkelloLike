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
          className="h-9 gap-3 font-medium text-sidebar-foreground/80 transition-colors hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:shadow-sm"
        >
          <Link href={item.href}>
            <item.icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-0 border-b border-sidebar-border/60 pb-2">
        {/* Logo + sélecteur d'établissement sur une seule ligne */}
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground shadow-sm">
            R
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <LocationSwitcher
              locations={locations}
              currentId={currentLocationId}
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[0.6875rem] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
            Pilotage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[0.6875rem] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
            Gestion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(manageNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        <p className="px-2 py-1 text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          Phase 1 · MVP
        </p>
      </SidebarFooter>

      {/* Bord cliquable : replier/deplier sans viser le bouton du header. */}
      <SidebarRail />
    </Sidebar>
  );
}
