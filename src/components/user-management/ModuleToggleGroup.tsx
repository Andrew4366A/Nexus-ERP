import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ModulePermission } from "@/lib/rbac-types";
import {
  SECTION_LABEL,
  USER_SIDEBAR_SECTION_ORDER,
  type ActionType,
  type SidebarSectionId,
} from "@/lib/sidebar-access";

interface ModuleToggleGroupProps {
  selected: Set<SidebarSectionId>;
  onToggle: (id: SidebarSectionId) => void;
  disabled?: boolean;
  layout?: "row" | "stack";
}

export function ModuleToggleGroup({
  selected,
  onToggle,
  disabled = false,
  layout = "row",
}: ModuleToggleGroupProps) {
  const wrapperClass =
    layout === "row" ? "flex flex-wrap gap-2" : "mt-4 space-y-3";

  return (
    <div className={wrapperClass}>
      {USER_SIDEBAR_SECTION_ORDER.map((id) => (
        <label
          key={id}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
            selected.has(id) ? "border-primary/40 bg-primary/5" : "border-border"
          } ${disabled ? "pointer-events-none opacity-60" : ""}`}
        >
          <Checkbox
            checked={selected.has(id)}
            disabled={disabled}
            onCheckedChange={() => onToggle(id)}
          />
          {SECTION_LABEL[id]}
        </label>
      ))}
    </div>
  );
}

const CRUD_ACTIONS: ActionType[] = ["create", "read", "edit", "delete"];
type LegacyModulePermission = ModulePermission & Partial<Record<ActionType, boolean>>;

const ACTION_LABEL: Record<ActionType, string> = {
  create: "Create",
  read: "Read",
  edit: "Edit",
  delete: "Delete",
};

interface PermissionPreviewProps {
  permissions: ModulePermission[];
}

export function PermissionPreview({ permissions }: PermissionPreviewProps) {
  return (
    <div className="mt-4 rounded-md border border-border/80 bg-muted/30 p-3">
      <p className="mb-2 text-sm font-medium text-foreground">Role permissions preview</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 min-w-32 text-xs">Module</TableHead>
            {CRUD_ACTIONS.map((action) => (
              <TableHead key={action} className="h-8 text-center text-xs">
                {ACTION_LABEL[action]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={CRUD_ACTIONS.length + 1}
                className="py-4 text-center text-xs text-muted-foreground"
              >
                No module permissions configured for this role.
              </TableCell>
            </TableRow>
          ) : (
            permissions.map((permission) => {
              const legacy = permission as LegacyModulePermission;
              const hasLegacyActions =
                legacy.create !== undefined ||
                legacy.read !== undefined ||
                legacy.edit !== undefined ||
                legacy.delete !== undefined;
              const actions = hasLegacyActions ? legacy : permission.actions;
              return (
                <TableRow key={permission.module}>
                  <TableCell className="py-2 text-xs font-medium text-foreground">
                    {permission.module}
                  </TableCell>
                  {CRUD_ACTIONS.map((action) => (
                    <TableCell key={action} className="py-2 text-center">
                      <Checkbox checked={Boolean(actions[action])} disabled />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
