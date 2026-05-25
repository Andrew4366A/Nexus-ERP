import type { ActionType, SidebarSectionId } from "@/lib/sidebar-access";

export interface ModulePermission {
  module: string;
  actions: {
    create: boolean;
    read: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export interface CustomRole {
  _id: string;
  name: string;
  description?: string;
  sidebarSections: string[];
  permissions: ModulePermission[];
  isCustom?: boolean;
}

export interface PopulatedRoleRef {
  _id: string;
  name: string;
  description?: string;
  sidebarSections: string[];
  permissions: ModulePermission[];
  isCustom?: boolean;
}

export type LegacyAccountRole = "admin" | "user";

export type RoleSelection = string;

export type RoleBasedActionsMap = Partial<Record<SidebarSectionId, Partial<Record<ActionType, boolean>>>>;
