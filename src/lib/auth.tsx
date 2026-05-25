/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { io } from "socket.io-client";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const AUTH_STORAGE_KEY = "eethal-erp-auth";

import type { PopulatedRoleRef } from "@/lib/rbac-types";

export type UserRole = "admin" | "user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  roleName?: string;
  /** Populated custom role from RBAC (sidebar + permissions). */
  roleId?: PopulatedRoleRef;
  /** Present for non-admin accounts; controls sidebar links shown in the workspace. */
  sidebarSections?: string[];
  /** Workspace action permissions per module (legacy / override) */
  roleBasedActions?: Record<string, Record<string, boolean>>;
}

interface StoredAuth {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: { usernameOrEmail: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => readStoredAuth());

  useEffect(() => {
    const token = auth?.token;
    const isAdminAccount = auth?.user?.role === "admin";

    if (!token || typeof window === "undefined" || isAdminAccount) {
      return;
    }

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const updateWorkspaceAccess = (payload: {
      roleId?: PopulatedRoleRef;
      roleName?: string;
      sidebarSections?: string[];
      roleBasedActions?: Record<string, Record<string, boolean>>;
    }) => {
      setAuth((prev) => {
        if (!prev?.user || prev.user.role !== "user") return prev;

        const nextSections =
          Array.isArray(payload.sidebarSections) && payload.sidebarSections.length > 0
            ? payload.sidebarSections
            : prev.user.sidebarSections;

        const nextActions =
          payload.roleBasedActions && typeof payload.roleBasedActions === "object"
            ? payload.roleBasedActions
            : prev.user.roleBasedActions;

        const merged = {
          ...prev,
          user: {
            ...prev.user,
            ...(payload.roleId ? { roleId: payload.roleId } : {}),
            ...(payload.roleName ? { roleName: payload.roleName } : {}),
            sidebarSections: nextSections,
            roleBasedActions: nextActions,
          },
        };

        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });
    };

    socket.on("user:sidebar-access", updateWorkspaceAccess);
    socket.on("user:workspace-access", updateWorkspaceAccess);

    return () => {
      socket.disconnect();
    };
  }, [auth?.token, auth?.user?.role]);

  const login = useCallback(async (credentials: { usernameOrEmail: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.message || "Unable to sign in");
    }

    const nextAuth = {
      token: payload.token,
      user: payload.user,
    };

    setAuth(nextAuth);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: auth?.token ?? null,
      user: auth?.user ?? null,
      isAuthenticated: Boolean(auth?.token),
      isAdmin:
        auth?.user.role === "admin" ||
        auth?.user.roleName?.trim().toLowerCase() === "administrator",
      login,
      logout,
    }),
    [auth, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
