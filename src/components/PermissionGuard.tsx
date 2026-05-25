import type { ReactNode } from "react";

import type { ActionType } from "@/lib/sidebar-access";
import { usePermissions } from "@/lib/usePermissions";

export function PermissionGuard({
  module: moduleName,
  action,
  children,
  fallback = null,
}: {
  module: string;
  action: ActionType;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = usePermissions();
  return can(moduleName, action) ? <>{children}</> : <>{fallback}</>;
}

export default PermissionGuard;
