import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { AddUserForm, type AddUserFormState } from "@/components/user-management/AddUserForm";
import { ManageRolePermissions } from "@/components/user-management/ManageRolePermissions";
import { ManageUserPanel } from "@/components/user-management/ManageUserPanel";
import { RoleSelect } from "@/components/user-management/RoleSelect";
import { UsersTable, type ListedUser } from "@/components/user-management/UsersTable";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, useAuth } from "@/lib/auth";
import {
  hasModulePermission,
  isLegacyRoleSelection,
  isWorkspaceRoleSelection,
  sectionsFromRole,
} from "@/lib/rbac-utils";
import { useRoles } from "@/lib/useRoles";
import {
  USER_SIDEBAR_SECTION_ORDER,
  normalizeUserSections,
  type SidebarSectionId,
} from "@/lib/sidebar-access";

export const Route = createFileRoute("/user-access")({
  head: () => ({
    meta: [
      { title: "User Management - Nexus ERP" },
      { name: "description", content: "RBAC user management for Nexus ERP." },
    ],
  }),
  component: UserAccessPage,
});

function authHeaders(token: string, json = false) {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function TempPasswordDialog({
  open,
  accountLabel,
  temporaryPassword,
  onClose,
}: {
  open: boolean;
  accountLabel: string;
  temporaryPassword: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Temporary password ready</DialogTitle>
          <DialogDescription>
            For <span className="font-medium text-foreground">{accountLabel}</span>. Share securely;
            shown only once.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 font-mono text-sm text-amber-950">
          {temporaryPassword}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(temporaryPassword);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy password"}
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserAccessPage() {
  const { token, isAdmin, user: currentUser } = useAuth();
  const {
    data: roles = [],
    isLoading: rolesLoading,
    isError: rolesError,
    error: rolesQueryError,
    refetch: refetchRoles,
  } = useRoles(token);

  const canViewPage =
    isAdmin || hasModulePermission(currentUser, isAdmin, "User Access", "read");

  const [users, setUsers] = useState<ListedUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRoleMasterId, setSelectedRoleMasterId] = useState("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [draftSections, setDraftSections] = useState<Set<SidebarSectionId>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ListedUser | null>(null);

  const [addForm, setAddForm] = useState<AddUserFormState>({
    name: "",
    username: "",
    email: "",
    password: "",
    roleSelection: "",
    modules: new Set(["inventory"]),
  });

  const [tempPasswordOpen, setTempPasswordOpen] = useState(false);
  const [tempPasswordValue, setTempPasswordValue] = useState("");
  const [tempPasswordAccount, setTempPasswordAccount] = useState("");

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: authHeaders(token),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Unable to load users.");
      const list = Array.isArray(payload?.users) ? (payload.users as ListedUser[]) : [];
      setUsers(list);
      setSelectedUserId((prev) => (prev && list.some((u) => u.id === prev) ? prev : null));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (canViewPage) void loadUsers();
  }, [canViewPage, loadUsers]);

  useEffect(() => {
    if (roles.length > 0 && !addForm.roleSelection) {
      const firstRole = roles[0];
      const roleSections = sectionsFromRole(firstRole);
      setAddForm((prev) => ({
        ...prev,
        roleSelection: firstRole._id,
        ...(roleSections.size > 0 ? { modules: roleSections } : {}),
      }));
    }
  }, [roles, addForm.roleSelection]);

  useEffect(() => {
    if (roles.length > 0 && !selectedRoleMasterId && !isCreatingRole) {
      setSelectedRoleMasterId(roles[0]._id);
    }
  }, [roles, selectedRoleMasterId, isCreatingRole]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const selectedRoleMaster = useMemo(
    () =>
      isCreatingRole ? null : roles.find((role) => role._id === selectedRoleMasterId) ?? null,
    [roles, selectedRoleMasterId, isCreatingRole],
  );

  useEffect(() => {
    if (!selectedUser) {
      setDraftSections(new Set());
      return;
    }
    setDraftSections(new Set(normalizeUserSections(selectedUser)));
  }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.name} ${u.username} ${u.email} ${u.role} ${u.roleName ?? ""}`.toLowerCase().includes(q),
    );
  }, [query, users]);

  const patchUser = async (id: string, body: Record<string, unknown>, successMessage: string) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: "PATCH",
      headers: authHeaders(token!, true),
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message || "Update failed.");
    if (payload?.user) {
      setUsers((current) => current.map((u) => (u.id === payload.user.id ? payload.user : u)));
    }
    toast.success(successMessage);
  };

  const handleCreateUser = async () => {
    if (!token) return;
    const { name, username, email, password, roleSelection, modules } = addForm;
    if (!name.trim() || !username.trim() || !email.trim() || !roleSelection) {
      toast.error("Full name, username, email, and role are required.");
      return;
    }
    if (isWorkspaceRoleSelection(roleSelection, roles) && modules.size === 0) {
      toast.error("Select at least one module.");
      return;
    }

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
      };

      if (password.trim()) {
        body.password = password;
      }

      if (isLegacyRoleSelection(roleSelection)) {
        body.role = roleSelection;
        if (roleSelection === "user") {
          body.sidebarSections = USER_SIDEBAR_SECTION_ORDER.filter((id) => modules.has(id));
        }
      } else {
        body.roleId = roleSelection;
      }

      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: authHeaders(token, true),
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Unable to create user.");

      if (payload?.user) setUsers((c) => [...c, payload.user]);
      else void loadUsers();

      if (payload?.temporaryPassword) {
        setTempPasswordAccount(username.trim());
        setTempPasswordValue(payload.temporaryPassword);
        setTempPasswordOpen(true);
      }

      toast.success(payload?.message || "User created.");
      setAddForm({
        name: "",
        username: "",
        email: "",
        password: "",
        roleSelection: roles[0]?._id ?? "",
        modules: roles[0] ? sectionsFromRole(roles[0]) : new Set(["inventory"]),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!token || !deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Unable to delete user.");

      setUsers((current) => current.filter((user) => user.id !== deleteTarget.id));
      setSelectedUserId((current) => (current === deleteTarget.id ? null : current));
      toast.success(payload?.message || "User deleted.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  if (!canViewPage) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        You do not have permission to view User Access. Contact an administrator.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provision accounts with custom RBAC roles, credentials, and workspace permissions.
        </p>
      </header>

      <AddUserForm
        state={addForm}
        roles={roles}
        rolesLoading={rolesLoading}
        rolesError={rolesError ? (rolesQueryError as Error)?.message ?? "Failed to load roles" : null}
        creating={creating}
        onChange={(patch) => setAddForm((prev) => ({ ...prev, ...patch }))}
        onToggleModule={(id) =>
          setAddForm((prev) => {
            const next = new Set(prev.modules);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return { ...prev, modules: next };
          })
        }
        onSubmit={() => void handleCreateUser()}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(260px,340px),minmax(0,1fr)]">
        <Card className="space-y-4 border-border/60 p-5 shadow-[var(--shadow-card)]">
          <RoleSelect
            id="role-master-select"
            label="Role master"
            value={selectedRoleMasterId}
            onChange={(value) => {
              setSelectedRoleMasterId(value);
              setIsCreatingRole(false);
            }}
            roles={roles}
            loading={rolesLoading}
            error={rolesError ? (rolesQueryError as Error)?.message ?? "Failed to load roles" : null}
            includeLegacy={false}
            disabled={isCreatingRole}
          />
          <Button
            type="button"
            variant={isCreatingRole ? "default" : "outline"}
            className="w-full"
            onClick={() => {
              setIsCreatingRole(true);
              setSelectedRoleMasterId("");
            }}
          >
            <Plus className="h-4 w-4" />
            New custom role
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Create a reusable role, then assign it when adding or editing users.
          </p>
        </Card>
        {token && (selectedRoleMaster || isCreatingRole) && (
          <ManageRolePermissions
            token={token}
            role={selectedRoleMaster}
            onSaved={(savedRole) => {
              setIsCreatingRole(false);
              setSelectedRoleMasterId(savedRole._id);
              void refetchRoles();
            }}
          />
        )}
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members…"
          className="pl-9"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(320px,420px)]">
        <UsersTable
          users={filteredUsers}
          loading={loading}
          error={loadError}
          selectedUserId={selectedUserId}
          onSelect={setSelectedUserId}
          onDeleteRequest={setDeleteTarget}
        />

        {!selectedUser ? (
          <Card className="flex min-h-[280px] items-center justify-center border-dashed p-8 text-center text-sm text-muted-foreground">
            Select an account to manage credentials, role, or permissions.
          </Card>
        ) : (
          <ManageUserPanel
            selectedUser={selectedUser}
            roles={roles}
            rolesLoading={rolesLoading}
            draftSections={draftSections}
            saving={saving}
            onToggleSection={(id) =>
              setDraftSections((current) => {
                const next = new Set(current);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            onClose={() => setSelectedUserId(null)}
            onUpdateModules={async () => {
              if (!selectedUser || draftSections.size === 0) return;
              setSaving(true);
              try {
                const response = await fetch(
                  `${API_BASE_URL}/api/users/${selectedUser.id}/sidebar-sections`,
                  {
                    method: "PATCH",
                    headers: authHeaders(token!, true),
                    body: JSON.stringify({
                      sidebarSections: USER_SIDEBAR_SECTION_ORDER.filter((id) =>
                        draftSections.has(id),
                      ),
                    }),
                  },
                );
                const payload = await response.json().catch(() => null);
                if (!response.ok) throw new Error(payload?.message || "Update failed.");
                if (payload?.user) {
                  setUsers((c) => c.map((u) => (u.id === payload.user.id ? payload.user : u)));
                }
                toast.success("Modules updated.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Update failed.");
              } finally {
                setSaving(false);
              }
            }}
            onSaveCredentials={async (payload) => {
              setSaving(true);
              try {
                await patchUser(selectedUser.id, payload, "Credentials updated.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Save failed.");
              } finally {
                setSaving(false);
              }
            }}
            onResetPassword={async (payload) => {
              setSaving(true);
              try {
                const response = await fetch(
                  `${API_BASE_URL}/api/users/${selectedUser.id}/password`,
                  {
                    method: "PATCH",
                    headers: authHeaders(token!, true),
                    body: JSON.stringify(payload),
                  },
                );
                const body = await response.json().catch(() => null);
                if (!response.ok) throw new Error(body?.message || "Reset failed.");
                if (body?.temporaryPassword) {
                  setTempPasswordAccount(selectedUser.username);
                  setTempPasswordValue(body.temporaryPassword);
                  setTempPasswordOpen(true);
                }
                toast.success(body?.message || "Password reset.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Reset failed.");
              } finally {
                setSaving(false);
              }
            }}
            onChangeRole={async ({ confirmAccount, role, roleId }) => {
              setSaving(true);
              try {
                const body: Record<string, unknown> = { confirmAccount };
                if (roleId) body.roleId = roleId;
                else if (role) body.role = role;
                await patchUser(selectedUser.id, body, "Role updated.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Role update failed.");
              } finally {
                setSaving(false);
              }
            }}
          />
        )}
      </div>

      <TempPasswordDialog
        open={tempPasswordOpen}
        accountLabel={tempPasswordAccount}
        temporaryPassword={tempPasswordValue}
        onClose={() => setTempPasswordOpen(false)}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete user account?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name || deleteTarget?.username}
              </span>{" "}
              and prevent this account from logging in again.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            This action cannot be undone.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              disabled={deleting}
              onClick={() => void handleDeleteUser()}
            >
              {deleting ? "Deleting..." : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
