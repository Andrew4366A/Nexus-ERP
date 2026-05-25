import {
  SECTION_LABEL,
  USER_SIDEBAR_SECTION_ORDER,
  type ActionType,
  type SidebarSectionId,
} from "@/lib/sidebar-access";
import type { AuthUser } from "@/lib/auth";
import type { CustomRole, LegacyAccountRole, ModulePermission, PopulatedRoleRef } from "@/lib/rbac-types";

type PermissionActions = Record<ActionType, boolean>;
type LegacyModulePermission = ModulePermission & Partial<PermissionActions>;

function getPermissionActions(permission: ModulePermission): Partial<PermissionActions> {
  const legacy = permission as LegacyModulePermission;
  const hasLegacyActions =
    legacy.create !== undefined ||
    legacy.read !== undefined ||
    legacy.edit !== undefined ||
    legacy.delete !== undefined;
  return hasLegacyActions ? legacy : permission.actions;
}

const LABEL_TO_SECTION: Record<string, SidebarSectionId> = Object.fromEntries(
  USER_SIDEBAR_SECTION_ORDER.map((id) => [SECTION_LABEL[id], id]),
) as Record<string, SidebarSectionId>;

/** Maps API sidebar values ("Dashboard", "dashboard") to canonical section ids. */
export function toSectionId(value: string): SidebarSectionId | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase() as SidebarSectionId;
  if (USER_SIDEBAR_SECTION_ORDER.includes(lower)) return lower;
  return LABEL_TO_SECTION[trimmed] ?? null;
}

export function sectionsFromRole(role: Pick<CustomRole, "sidebarSections"> | null | undefined): Set<SidebarSectionId> {
  const ids = new Set<SidebarSectionId>();
  if (!role?.sidebarSections?.length) return ids;
  for (const entry of role.sidebarSections) {
    const id = toSectionId(entry);
    if (id) ids.add(id);
  }
  return ids;
}

export function actionsFromRole(
  role: Pick<CustomRole, "permissions"> | null | undefined,
): Map<SidebarSectionId, Record<ActionType, boolean>> {
  const map = new Map<SidebarSectionId, Record<ActionType, boolean>>();
  if (!role?.permissions?.length) return map;

  for (const perm of role.permissions) {
    const sectionId = toSectionId(perm.module);
    if (!sectionId) continue;
    const actions = getPermissionActions(perm);
    map.set(sectionId, {
      create: Boolean(actions.create),
      read: Boolean(actions.read),
      edit: Boolean(actions.edit),
      delete: Boolean(actions.delete),
    });
  }
  return map;
}

export function isLegacyRoleSelection(value: string): value is LegacyAccountRole {
  return value === "admin" || value === "user";
}

export function isWorkspaceRoleSelection(value: string, roles: CustomRole[]): boolean {
  if (value === "admin") return false;
  if (value === "user") return true;
  const role = roles.find((r) => r._id === value);
  if (!role) return false;
  return role.name.trim().toLowerCase() !== "administrator";
}

export function getAccountRoleLabel(user: {
  role: LegacyAccountRole;
  roleName?: string;
  roleId?: PopulatedRoleRef | string;
}): string {
  if (user.roleName) return user.roleName;
  if (typeof user.roleId === "object" && user.roleId?.name) return user.roleId.name;
  if (user.role === "admin") return "Administrator";
  return "Workspace user";
}

export function resolvePopulatedRole(user: AuthUser | null | undefined): PopulatedRoleRef | null {
  if (!user?.roleId || typeof user.roleId === "string") return null;
  return user.roleId;
}

export function hasModulePermission(
  user: AuthUser | null | undefined,
  isAdmin: boolean,
  module: string,
  action: ActionType,
): boolean {
  if (isAdmin || user?.role === "admin") return true;

  const moduleKey = module.trim().toLowerCase();
  const populated = resolvePopulatedRole(user);

  if (populated?.permissions?.length) {
    const match = populated.permissions.find(
      (p) => p.module.trim().toLowerCase() === moduleKey,
    );
    return Boolean(match && getPermissionActions(match)[action]);
  }

  const sectionId = toSectionId(module);
  if (sectionId && user?.roleBasedActions?.[sectionId]) {
    return Boolean(user.roleBasedActions[sectionId][action]);
  }

  const legacyKey = Object.keys(user?.roleBasedActions ?? {}).find(
    (k) => k.toLowerCase() === moduleKey,
  );
  if (legacyKey && user?.roleBasedActions?.[legacyKey as SidebarSectionId]) {
    return Boolean(user.roleBasedActions[legacyKey as SidebarSectionId]![action]);
  }

  return false;
}

export function permissionModuleForSection(sectionId: SidebarSectionId): string {
  return SECTION_LABEL[sectionId];
}

export function normalizePermissionsForApi(
  actions: Map<SidebarSectionId, Record<ActionType, boolean>>,
): ModulePermission[] {
  return Array.from(actions.entries()).map(([sectionId, flags]) => ({
    module: SECTION_LABEL[sectionId],
    actions: {
      create: Boolean(flags.create),
      read: Boolean(flags.read),
      edit: Boolean(flags.edit),
      delete: Boolean(flags.delete),
    },
  }));
}
