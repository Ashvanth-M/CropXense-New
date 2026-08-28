/**
 * Route guard components for CropXense.
 *
 * These are thin wrappers that check auth state and redirect when needed.
 * Used inside layout routes to protect entire route subtrees.
 */

import { Navigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { ROLE_REDIRECT, type UserRole } from "./roles";

/**
 * Redirects unauthenticated users to /login.
 * Wraps the children of a layout route.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!isAuthenticated) {
    // Only redirect with target pathname if not already on an auth page
    const target = pathname && !pathname.startsWith("/login") && !pathname.startsWith("/signup") ? pathname : undefined;
    return <Navigate to="/login" search={target ? { redirect: target } : {}} />;
  }

  return <>{children}</>;
}

/**
 * Checks the current user's role against an allow-list.
 * If the role isn't permitted, redirect to their correct application.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user) return null; // RequireAuth should catch this first

  if (!roles.includes(user.role)) {
    const redirect = ROLE_REDIRECT[user.role] ?? "/";
    return <Navigate to={redirect} />;
  }

  return <>{children}</>;
}

/**
 * Redirects already-authenticated users away from auth pages
 * (login, signup) to their role-appropriate application.
 */
export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    const redirect = ROLE_REDIRECT[user.role] ?? "/app";
    return <Navigate to={redirect} />;
  }

  return <>{children}</>;
}
