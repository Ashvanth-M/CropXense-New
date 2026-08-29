import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/advisories")({
  component: () => <Navigate to="/app" />,
});
