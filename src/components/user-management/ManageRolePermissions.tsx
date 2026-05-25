import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_BASE_URL } from "@/lib/auth";
import { sectionsFromRole } from "@/lib/rbac-utils";
import type { CustomRole, ModulePermission } from "@/lib/rbac-types";
import {
  SECTION_LABEL,
  USER_SIDEBAR_SECTION_ORDER,
  type ActionType,
  type SidebarSectionId,
} from "@/lib/sidebar-access";

const ACTIONS: ActionType[] = ["create", "read", "edit", "delete"];

type PermissionMatrix = Record<SidebarSectionId, Record<ActionType, boolean>>;
type LegacyModulePermission = ModulePermission & Partial<Record<ActionType, boolean>>;

function createMatrix(permissions: ModulePermission[] = []): PermissionMatrix {
  const matrix = USER_SIDEBAR_SECTION_ORDER.reduce((acc, moduleId) => {
    acc[moduleId] = { create: false, read: false, edit: false, delete: false };
    return acc;
  }, {} as PermissionMatrix);

  for (const permission of permissions) {
    const legacy = permission as LegacyModulePermission;
    const hasLegacyActions =
      legacy.create !== undefined ||
      legacy.read !== undefined ||
      legacy.edit !== undefined ||
      legacy.delete !== undefined;
    const actions = hasLegacyActions ? legacy : permission.actions;
    const moduleId = USER_SIDEBAR_SECTION_ORDER.find(
      (id) =>
        id === permission.module?.toLowerCase() ||
        SECTION_LABEL[id].toLowerCase() === permission.module?.toLowerCase(),
    );
    if (!moduleId) continue;
    matrix[moduleId] = {
      create: Boolean(actions.create),
      read: Boolean(actions.read),
      edit: Boolean(actions.edit),
      delete: Boolean(actions.delete),
    };
  }

  return matrix;
}

function matrixToPermissions(matrix: PermissionMatrix): ModulePermission[] {
  return USER_SIDEBAR_SECTION_ORDER.map((moduleId) => ({
    module: SECTION_LABEL[moduleId],
    actions: {
      create: matrix[moduleId].create,
      read: matrix[moduleId].read,
      edit: matrix[moduleId].edit,
      delete: matrix[moduleId].delete,
    },
  }));
}

interface ManageRolePermissionsProps {
  token: string;
  role: CustomRole | null;
  onSaved: (role: CustomRole) => void;
}

export function ManageRolePermissions({ token, role, onSaved }: ManageRolePermissionsProps) {
  const [roleName, setRoleName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [matrix, setMatrix] = useState<PermissionMatrix>(() => createMatrix(role?.permissions));
  const [enabledModules, setEnabledModules] = useState<Set<SidebarSectionId>>(() =>
    role ? sectionsFromRole(role) : new Set(["inventory"]),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRoleName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setMatrix(createMatrix(role?.permissions));
    setEnabledModules(role ? sectionsFromRole(role) : new Set(["inventory"]));
  }, [role]);

  const isCreating = !role;
  const title = isCreating ? "Create custom role" : "Manage role master matrix";
  const subtitle = isCreating
    ? "Define a reusable role with visible modules and CRUD permissions."
    : `Changes apply to every user assigned to ${role.name}.`;

  const visibleModuleList = useMemo(
    () => USER_SIDEBAR_SECTION_ORDER.filter((moduleId) => enabledModules.has(moduleId)),
    [enabledModules],
  );

  const toggle = (moduleId: SidebarSectionId, action: ActionType, checked: boolean) => {
    setMatrix((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: checked,
      },
    }));
  };

  const toggleModule = (moduleId: SidebarSectionId, checked: boolean) => {
    setEnabledModules((current) => {
      const next = new Set(current);
      if (checked) next.add(moduleId);
      else next.delete(moduleId);
      return next;
    });
  };

  const save = async () => {
    if (!roleName.trim()) {
      toast.error("Role name is required.");
      return;
    }
    if (visibleModuleList.length === 0) {
      toast.error("Select at least one visible module.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        isCreating ? `${API_BASE_URL}/api/roles` : `${API_BASE_URL}/api/roles/${role._id}`,
        {
          method: isCreating ? "POST" : "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: roleName.trim(),
            description: description.trim(),
            isCustom: true,
            sidebarSections: visibleModuleList,
            permissions: matrixToPermissions(matrix),
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save role.");
      }
      toast.success(isCreating ? "Custom role created." : "Role master permissions updated.");
      onSaved(payload.role);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save role.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-border/60 p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button type="button" disabled={isSaving} onClick={() => void save()}>
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : isCreating ? "Create role" : "Save changes"}
        </Button>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role-master-name">Role name</Label>
          <Input
            id="role-master-name"
            value={roleName}
            onChange={(event) => setRoleName(event.target.value)}
            placeholder="Regional Manager"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-master-description">Description</Label>
          <Input
            id="role-master-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48">Module</TableHead>
              <TableHead className="text-center">Visible</TableHead>
              {ACTIONS.map((action) => (
                <TableHead key={action} className="text-center capitalize">
                  {action}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {USER_SIDEBAR_SECTION_ORDER.map((moduleId) => (
              <TableRow key={moduleId}>
                <TableCell className="font-medium">{SECTION_LABEL[moduleId]}</TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={enabledModules.has(moduleId)}
                    onCheckedChange={(checked) => toggleModule(moduleId, checked === true)}
                    aria-label={`${SECTION_LABEL[moduleId]} visible`}
                  />
                </TableCell>
                {ACTIONS.map((action) => (
                  <TableCell key={action} className="text-center">
                    <Checkbox
                      checked={matrix[moduleId][action]}
                      onCheckedChange={(checked) => toggle(moduleId, action, checked === true)}
                      aria-label={`${SECTION_LABEL[moduleId]} ${action}`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
