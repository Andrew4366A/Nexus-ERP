import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Package, Wallet, Truck, Settings, Users, ShieldCheck } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { hasModulePermission } from "@/lib/rbac-utils";
import {
  ADMIN_ONLY_PATH,
  SECTION_LABEL,
  SECTION_PATH,
  USER_SIDEBAR_SECTION_ORDER,
  normalizeUserSections,
  userHasFullSidebarAccess,
  type SidebarSectionId,
} from "@/lib/sidebar-access";

const SECTION_ICONS: Record<SidebarSectionId, LucideIcon> = {
  dashboard: LayoutDashboard,
  inventory: Package,
  payroll: Wallet,
  logistics: Truck,
  staff: Users,
  settings: Settings,
};

export function filterSidebarNavItems(user: ReturnType<typeof useAuth>["user"], isAdmin: boolean) {
  const fullAccess = userHasFullSidebarAccess(user) || isAdmin;
  const allowedSections = fullAccess ? USER_SIDEBAR_SECTION_ORDER : normalizeUserSections(user ?? undefined);

  const workspaceItems = USER_SIDEBAR_SECTION_ORDER.filter((id) => allowedSections.includes(id)).map(
    (id) => ({
      key: id,
      title: SECTION_LABEL[id],
      url: SECTION_PATH[id],
      icon: SECTION_ICONS[id],
    }),
  );

  const nav = workspaceItems.map(({ title, url, icon }) => ({ title, url, icon }));

  const showUserAccess =
    fullAccess || hasModulePermission(user, isAdmin, "User Access", "read");

  if (showUserAccess) {
    nav.push({ title: "User Access", url: ADMIN_ONLY_PATH, icon: ShieldCheck });
  }

  return nav;
}

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { isAdmin, user } = useAuth();
  const items = filterSidebarNavItems(user, isAdmin);

  return (
    <Sidebar collapsible="none" className="sticky top-0 h-svh">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            N
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Nexus ERP</span>
            <span className="text-xs text-muted-foreground">Operations</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No workspace modules assigned. Ask an admin to grant access.
                </div>
              ) : (
                items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={currentPath === item.url}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
