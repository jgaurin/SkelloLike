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
  Building2,
} from "lucide-react";

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
  { label: "Établissements", href: "/etablissements", icon: Building2 },
  { label: "Paramètres", href: "/parametres", icon: Settings },
];

export function AppSidebar({ orgName }: { orgName: string }) {
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
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            S
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">{orgName}</span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              SkelloLike
            </span>
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
