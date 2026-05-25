import { Label } from "@/components/ui/label";
import type { CustomRole } from "@/lib/rbac-types";
import { isLegacyRoleSelection } from "@/lib/rbac-utils";

interface RoleSelectProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  roles: CustomRole[];
  loading?: boolean;
  error?: string | null;
  includeLegacy?: boolean;
  disabled?: boolean;
}

export function RoleSelect({
  id,
  label = "Role",
  value,
  onChange,
  roles,
  loading = false,
  error = null,
  includeLegacy = true,
  disabled = false,
}: RoleSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
      >
        <option value="">{loading ? "Loading roles…" : "Select role"}</option>
        {!loading &&
          roles.map((role) => (
            <option key={role._id} value={role._id}>
              {role.name}
            </option>
          ))}
        {includeLegacy && !loading && (
          <>
            <option value="user">Workspace user (legacy)</option>
            <option value="admin">Administrator (legacy)</option>
          </>
        )}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {value && isLegacyRoleSelection(value) && (
        <p className="text-xs text-muted-foreground">
          Legacy role selected. Module toggles use defaults until a custom role is assigned.
        </p>
      )}
    </div>
  );
}
