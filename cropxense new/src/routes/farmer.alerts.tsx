/**
 * /farmer/alerts -> Redirect to canonical /farmer/advisories.
 */

import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/farmer/alerts")({
  component: () => <Navigate to="/farmer/advisories" />,
});
