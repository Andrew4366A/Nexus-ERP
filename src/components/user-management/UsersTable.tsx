import { PencilLine, Trash2, Users } from "lucide-react";

import PermissionGuard from "@/components/PermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuthUser } from "@/lib/auth";
import { getAccountRoleLabel } from "@/lib/rbac-utils";
import { SECTION_LABEL, normalizeUserSections, type SidebarSectionId } from "@/lib/sidebar-access";

export type ListedUser = AuthUser & { sidebarSections?: string[] };

interface UsersTableProps {
  users: ListedUser[];
  loading: boolean;
  error: string | null;
  selectedUserId: string | null;
  onSelect: (id: string) => void;
  onDeleteRequest: (user: ListedUser) => void;
}

function moduleSummary(user: ListedUser): string {
  const sections = normalizeUserSections(user);
  return sections.map((id: SidebarSectionId) => SECTION_LABEL[id]).join(" · ") || "—";
}

export function UsersTable({
  users,
  loading,
  error,
  selectedUserId,
  onSelect,
  onDeleteRequest,
}: UsersTableProps) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3">
        <p className="text-sm font-medium">All accounts</p>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {users.length}
        </Badge>
      </div>

      {error && (
        <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading accounts…</p>
      ) : users.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">No accounts found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="pr-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((row) => (
              <TableRow
                key={row.id}
                className={selectedUserId === row.id ? "bg-muted/40" : undefined}
                onClick={() => onSelect(row.id)}
              >
                <TableCell className="pl-4 font-medium">{row.name}</TableCell>
                <TableCell>{row.username}</TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {row.email}
                </TableCell>
                <TableCell>
                  <Badge variant={row.role === "admin" ? "default" : "secondary"}>
                    {getAccountRoleLabel(row)}
                  </Badge>
                  <span className="mt-2 block max-w-[18rem] text-xs text-muted-foreground">
                    {moduleSummary(row)}
                  </span>
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-2">
                    <PermissionGuard module="User Access" action="edit">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(row.id);
                        }}
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                        Manage
                      </Button>
                    </PermissionGuard>
                    <PermissionGuard module="User Access" action="delete">
                      <Button
                        variant="destructive"
                        size="sm"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteRequest(row);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </PermissionGuard>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
