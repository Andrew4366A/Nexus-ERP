import { useMemo } from "react";

import { useAuth } from "@/lib/auth";
import type { ActionType } from "@/lib/sidebar-access";
import { hasModulePermission } from "@/lib/rbac-utils";

export function usePermissions() {
  const { user, isAdmin } = useAuth();

  const can = useMemo(
    () => (module: string, action: ActionType) =>
      hasModulePermission(user, isAdmin, module, action),
    [user, isAdmin],
  );

  return { can, user, isAdmin };
}
