import { useEffect, useMemo, useState } from "react";
import { KeyRound, UserCog, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleToggleGroup } from "@/components/user-management/ModuleToggleGroup";
import { RoleSelect } from "@/components/user-management/RoleSelect";
import type { ListedUser } from "@/components/user-management/UsersTable";
import type { CustomRole, LegacyAccountRole } from "@/lib/rbac-types";
import { isLegacyRoleSelection } from "@/lib/rbac-utils";
import type { SidebarSectionId } from "@/lib/sidebar-access";

function resolveRoleDraft(user: ListedUser): string {
  if (user.roleId && typeof user.roleId === "object") return user.roleId._id;
  return user.role;
}

interface ManageUserPanelProps {
  selectedUser: ListedUser;
  roles: CustomRole[];
  rolesLoading: boolean;
  draftSections: Set<SidebarSectionId>;
  saving: boolean;
  onToggleSection: (id: SidebarSectionId) => void;
  onClose: () => void;
  onUpdateModules: () => void;
  onSaveCredentials: (payload: { confirmAccount: string; email: string; username: string }) => void;
  onResetPassword: (payload: { confirmAccount: string; generate: boolean }) => void;
  onChangeRole: (payload: {
    confirmAccount: string;
    role?: LegacyAccountRole;
    roleId?: string;
  }) => void;
}

export function ManageUserPanel({
  selectedUser,
  roles,
  rolesLoading,
  draftSections,
  saving,
  onToggleSection,
  onClose,
  onUpdateModules,
  onSaveCredentials,
  onResetPassword,
  onChangeRole,
}: ManageUserPanelProps) {
  const [confirmAccount, setConfirmAccount] = useState(selectedUser.username);
  const [email, setEmail] = useState(selectedUser.email);
  const [username, setUsername] = useState(selectedUser.username);
  const [roleDraft, setRoleDraft] = useState(resolveRoleDraft(selectedUser));

  const selectedRole = useMemo(
    () => roles.find((r) => r._id === roleDraft) ?? null,
    [roles, roleDraft],
  );

  const isWorkspaceAccount = selectedUser.role !== "admin";

  useEffect(() => {
    setConfirmAccount(selectedUser.username);
    setEmail(selectedUser.email);
    setUsername(selectedUser.username);
    setRoleDraft(resolveRoleDraft(selectedUser));
  }, [selectedUser]);

  const roleChanged =
    roleDraft !== resolveRoleDraft(selectedUser) &&
    !(roleDraft === selectedUser.role && !selectedUser.roleId);

  return (
    <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-card)] lg:sticky lg:top-6">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-muted/30 px-5 py-4">
        <Badge className="gap-1 bg-primary px-2.5 py-1 font-semibold hover:bg-primary">
          <UserCog className="h-3.5 w-3.5" aria-hidden />
          Manage account
        </Badge>
        <button
          type="button"
          className="inline-flex rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="border-b border-border/60 px-5 py-3">
        <p className="font-medium">{selectedUser.name}</p>
        <p className="text-xs text-muted-foreground">
          @{selectedUser.username} · {selectedUser.email}
        </p>
      </div>

      <Tabs defaultValue="credentials" className="p-5">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="role">Role</TabsTrigger>
          <TabsTrigger value="modules" disabled={selectedUser.role === "admin"}>
            Modules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Confirm the account before saving. Enter the exact current username or email.
          </p>
          <div className="space-y-2">
            <Label htmlFor="confirm-account">Confirm account</Label>
            <Input
              id="confirm-account"
              value={confirmAccount}
              onChange={(e) => setConfirmAccount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-username">Username</Label>
            <Input
              id="edit-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={saving}
              onClick={() =>
                onSaveCredentials({
                  confirmAccount: confirmAccount.trim(),
                  email: email.trim(),
                  username: username.trim(),
                })
              }
            >
              Save credentials
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() =>
                onResetPassword({ confirmAccount: confirmAccount.trim(), generate: true })
              }
            >
              <KeyRound className="h-3.5 w-3.5" />
              Reset password
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="role" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-confirm">Confirm account</Label>
            <Input
              id="role-confirm"
              value={confirmAccount}
              onChange={(e) => setConfirmAccount(e.target.value)}
            />
          </div>
          <RoleSelect
            id="role-select"
            label="Role"
            value={roleDraft}
            onChange={setRoleDraft}
            roles={roles}
            loading={rolesLoading}
          />
          {selectedRole?.description && (
            <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
          )}
          <Button
            type="button"
            disabled={saving || !roleChanged}
            onClick={() =>
              onChangeRole(
                isLegacyRoleSelection(roleDraft)
                  ? { confirmAccount: confirmAccount.trim(), role: roleDraft }
                  : { confirmAccount: confirmAccount.trim(), roleId: roleDraft },
              )
            }
          >
            Update role
          </Button>
        </TabsContent>

        <TabsContent value="modules" className="mt-4 space-y-3">
          <ModuleToggleGroup
            selected={draftSections}
            onToggle={onToggleSection}
            layout="stack"
            disabled={Boolean(selectedUser.roleId)}
          />
          {selectedUser.roleId && (
            <p className="text-xs text-muted-foreground">
              Modules and CRUD permissions are driven by the assigned role master.
            </p>
          )}
          <Button
            type="button"
            className="w-full"
            disabled={saving || draftSections.size === 0 || Boolean(selectedUser.roleId)}
            onClick={onUpdateModules}
          >
            Update modules
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
