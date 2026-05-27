import { useMemo } from "react";
import { Plus } from "lucide-react";

import PermissionGuard from "@/components/PermissionGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ModuleToggleGroup,
  PermissionPreview,
} from "@/components/user-management/ModuleToggleGroup";
import { RoleSelect } from "@/components/user-management/RoleSelect";
import type { CustomRole } from "@/lib/rbac-types";
import { isWorkspaceRoleSelection, sectionsFromRole } from "@/lib/rbac-utils";
import { SECTION_LABEL, type SidebarSectionId } from "@/lib/sidebar-access";

export interface AddUserFormState {
  name: string;
  username: string;
  email: string;
  password: string;
  roleSelection: string;
  modules: Set<SidebarSectionId>;
}

interface AddUserFormProps {
  state: AddUserFormState;
  roles: CustomRole[];
  rolesLoading: boolean;
  rolesError: string | null;
  creating: boolean;
  onChange: (patch: Partial<AddUserFormState>) => void;
  onToggleModule: (id: SidebarSectionId) => void;
  onSubmit: () => void;
}

export function AddUserForm({
  state,
  roles,
  rolesLoading,
  rolesError,
  creating,
  onChange,
  onToggleModule,
  onSubmit,
}: AddUserFormProps) {
  const selectedRole = useMemo(
    () => roles.find((r) => r._id === state.roleSelection) ?? null,
    [roles, state.roleSelection],
  );

  const showWorkspaceModules = isWorkspaceRoleSelection(state.roleSelection, roles);

  const selectedRoleSections = useMemo(() => sectionsFromRole(selectedRole), [selectedRole]);

  const handleRoleChange = (roleSelection: string) => {
    const role = roles.find((r) => r._id === roleSelection) ?? null;
    const sections = sectionsFromRole(role);

    onChange({
      roleSelection,
      ...(sections.size > 0 ? { modules: sections } : {}),
    });
  };

  return (
    <Card className="border-border/60 p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center gap-2">
        <Plus className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-base font-semibold">Add new user</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="new-name">Full name</Label>
          <Input
            id="new-name"
            value={state.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-username">Username</Label>
          <Input
            id="new-username"
            value={state.username}
            onChange={(e) => onChange({ username: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-email">Email</Label>
          <Input
            id="new-email"
            type="email"
            value={state.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Password</Label>
          <Input
            id="new-password"
            type="password"
            value={state.password}
            onChange={(e) => onChange({ password: e.target.value })}
            placeholder="Auto-generate if empty"
          />
        </div>
        <RoleSelect
          id="new-role"
          value={state.roleSelection}
          onChange={handleRoleChange}
          roles={roles}
          loading={rolesLoading}
          error={rolesError}
        />
      </div>

      {selectedRole?.description && (
        <p className="mt-3 text-sm text-muted-foreground">{selectedRole.description}</p>
      )}

      {selectedRole && (
        <div className="mt-3 rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-sm">
          <span className="font-medium text-foreground">Sidebar access from role: </span>
          <span className="text-muted-foreground">
            {selectedRoleSections.size > 0
              ? [...selectedRoleSections].map((id) => SECTION_LABEL[id]).join(", ")
              : "None configured"}
          </span>
        </div>
      )}

      {showWorkspaceModules && (
        <>
          <ModuleToggleGroup
            selected={state.modules}
            onToggle={onToggleModule}
            disabled={Boolean(selectedRole)}
          />
          {selectedRole && (
            <p className="mt-2 text-xs text-muted-foreground">
              Modules are driven by the selected role. Choose a legacy workspace user to customize
              modules manually.
            </p>
          )}
          <PermissionPreview permissions={selectedRole?.permissions ?? []} />
        </>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Leave password empty to auto-generate a secure temporary password (shown once).
      </p>

      <PermissionGuard module="User Access" action="create">
        <Button className="mt-4" type="button" disabled={creating} onClick={onSubmit}>
          {creating ? "Creating…" : "Create user"}
        </Button>
      </PermissionGuard>
    </Card>
  );
}
