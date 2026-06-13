"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Clock,
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
} from "@/components/ui/sidebar";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const mainNav: NavItem[] = [
  { label: "Planning", href: "/planning", icon: CalendarDays },
  { label: "Pointage", href: "/pointage", icon: Clock },
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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild isActive={isActive(item.href)}>
          <Link href={item.href}>
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        {/* Logo + sélecteur d'établissement sur une seule ligne */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            S
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <LocationSwitcher
              locations={locations}
              currentId={currentLocationId}
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pilotage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(manageNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 py-1 text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          Phase 1 · MVP
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
