import { useQuery } from "@tanstack/react-query";

import { API_BASE_URL } from "@/lib/auth";
import type { CustomRole } from "@/lib/rbac-types";

async function fetchRoles(token: string): Promise<CustomRole[]> {
  const res = await fetch(`${API_BASE_URL}/api/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.message || `Failed to load roles (${res.status})`);
  }
  const roles = payload?.roles ?? payload;
  return Array.isArray(roles) ? roles : [];
}

export function useRoles(token: string | null) {
  return useQuery({
    queryKey: ["roles", token],
    queryFn: () => fetchRoles(token!),
    enabled: Boolean(token) && typeof window !== "undefined",
    staleTime: 60_000,
    retry: 1,
  });
}
