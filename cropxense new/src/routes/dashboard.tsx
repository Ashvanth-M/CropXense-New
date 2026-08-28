/**
 * /dashboard → /app redirect.
 *
 * The old /dashboard route has been replaced by the canonical /app
 * officer application. This redirect ensures any old links or
 * bookmarks continue to work.
 */

import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: () => <Navigate to="/app" />,
});
