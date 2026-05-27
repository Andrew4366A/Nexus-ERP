import type { AuthUser } from "@/lib/auth";
import { toSectionId } from "@/lib/rbac-utils";

export type SidebarSectionId =
  | "dashboard"
  | "inventory"
  | "payroll"
  | "logistics"
  | "staff"
  | "settings";

export type ActionType = "create" | "read" | "edit" | "delete";

export type RoleBasedActions = Record<SidebarSectionId, Record<ActionType, boolean>>;

export const ADMIN_ONLY_PATH = "/user-access";

/** Order used for sidebar and default landing when redirecting away from forbidden routes */
export const USER_SIDEBAR_SECTION_ORDER: SidebarSectionId[] = [
  "dashboard",
  "inventory",
  "payroll",
  "logistics",
  "staff",
  "settings",
];

export const SECTION_LABEL: Record<SidebarSectionId, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  payroll: "Payroll",
  logistics: "Logistics",
  staff: "Staff",
  settings: "Settings",
};

export const SECTION_PATH: Record<SidebarSectionId, string> = {
  dashboard: "/",
  inventory: "/inventory",
  payroll: "/payroll",
  logistics: "/logistics",
  staff: "/staff",
  settings: "/settings",
};

const PATH_TO_SECTION: Record<string, SidebarSectionId> = {
  "/": "dashboard",
  "/inventory": "inventory",
  "/payroll": "payroll",
  "/logistics": "logistics",
  "/staff": "staff",
  "/settings": "settings",
};

const VALID_IDS = new Set<string>(USER_SIDEBAR_SECTION_ORDER);

export function isSidebarSectionId(value: string): value is SidebarSectionId {
  return VALID_IDS.has(value);
}

export function getSectionForPath(pathname: string): SidebarSectionId | null {
  return PATH_TO_SECTION[pathname] ?? null;
}

function normalizeSectionList(values: string[] | undefined): SidebarSectionId[] {
  if (!values?.length) return [];
  const ids = new Set<SidebarSectionId>();
  for (const value of values) {
    const id = toSectionId(value);
    if (id) ids.add(id);
  }
  return USER_SIDEBAR_SECTION_ORDER.filter((id) => ids.has(id));
}

/** Legacy admins and Administrator roles see every workspace tab. */
export function userHasFullSidebarAccess(
  user: Pick<AuthUser, "role" | "roleName"> | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.roleName?.trim().toLowerCase() === "administrator";
}

export function normalizeUserSections(user: AuthUser | null | undefined): SidebarSectionId[] {
  if (!user) return [];
  if (userHasFullSidebarAccess(user)) return [...USER_SIDEBAR_SECTION_ORDER];

  const fromRole = normalizeSectionList(
    typeof user.roleId === "object" ? user.roleId.sidebarSections : undefined,
  );
  if (fromRole.length > 0) return fromRole;

  const fromUser = normalizeSectionList(user.sidebarSections);
  if (fromUser.length > 0) return fromUser;

  return ["inventory"];
}

export function canAccessUserAccessRoute(
  user: AuthUser | null | undefined,
  isAdmin: boolean,
): boolean {
  if (isAdmin || userHasFullSidebarAccess(user ?? null)) return true;
  return false;
}

export function getFirstAllowedUserPath(sections: SidebarSectionId[]): string {
  for (const id of USER_SIDEBAR_SECTION_ORDER) {
    if (sections.includes(id)) return SECTION_PATH[id];
  }
  return SECTION_PATH.inventory;
}
