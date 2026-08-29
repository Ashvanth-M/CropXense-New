import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/validation")({
  component: () => <Navigate to="/app/reports" />,
});
