import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AdminNotificationsProvider } from "@/lib/admin-notifications";
import { AuthProvider, useAuth } from "@/lib/auth";
import { hasModulePermission } from "@/lib/rbac-utils";
import {
  ADMIN_ONLY_PATH,
  getFirstAllowedUserPath,
  getSectionForPath,
  normalizeUserSections,
} from "@/lib/sidebar-access";
import { UserProfileProvider } from "@/lib/user-profile";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nexus ERP - Operations Dashboard" },
      {
        name: "description",
        content: "Modern ERP dashboard for inventory, payroll, and logistics.",
      },
      { name: "author", content: "Nexus ERP" },
      { property: "og:title", content: "Nexus ERP" },
      {
        property: "og:description",
        content: "Modern ERP dashboard for inventory, payroll, and logistics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminNotificationsProvider>
          <UserProfileProvider>
            <AppFrame />
            <Toaster />
          </UserProfileProvider>
        </AdminNotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppFrame() {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isLoginRoute = pathname === "/login";
  const { isAuthenticated, isAdmin, logout, user } = useAuth();

  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/login" });
  };

  useEffect(() => {
    if (!isAuthenticated && !isLoginRoute) {
      router.navigate({ to: "/login" });
      return;
    }

    if (!isAuthenticated || isLoginRoute || isAdmin || !user || user.role !== "user") {
      return;
    }

    const allowed = normalizeUserSections(user);

    if (pathname === ADMIN_ONLY_PATH) {
      const canManageUsers = isAdmin || hasModulePermission(user, isAdmin, "User Access", "read");
      if (!canManageUsers) {
        router.navigate({ to: getFirstAllowedUserPath(allowed) });
      }
      return;
    }

    const requiredSection = getSectionForPath(pathname);
    if (requiredSection && !allowed.includes(requiredSection)) {
      router.navigate({ to: getFirstAllowedUserPath(allowed) });
    }
  }, [isAdmin, isAuthenticated, isLoginRoute, pathname, router, user]);

  return (
    <>
      {isLoginRoute || !isAuthenticated ? (
        <Outlet />
      ) : (
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="sticky top-0 z-20 flex h-16 items-center justify-end border-b border-border/60 bg-background/80 px-6 backdrop-blur">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="Open account menu">
                    <Avatar className="h-9 w-9 ring-1 ring-border">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 font-semibold text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{user?.name || "User"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user?.email || "Signed in"}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 text-destructive" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      )}
    </>
  );
}
