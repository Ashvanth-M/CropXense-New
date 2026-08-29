/**
 * /app layout — Field Extension Officer Workspace.
 *
 * Powered by the canonical RoleAppShell with "FIELD OPERATIONS" identity.
 * Replaces old dark green top navigation with the unified CropXense left sidebar
 * and white top header.
 */

import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sprout,
  ScanLine,
  Map,
  CloudSun,
  Bug,
  Activity,
  AlertCircle,
  FileBarChart,
  CheckCircle2,
} from "lucide-react";
import { RequireAuth, RequireRole } from "@/auth/guards";
import { RoleAppShell, type RoleShellConfig } from "@/components/Chrome/RoleAppShell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Field Operations — CropXense" },
      {
        name: "description",
        content: "Field Extension Officer dashboard for district crop surveillance, case prioritization, and field visits.",
      },
      { property: "og:title", content: "Field Operations — CropXense" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: OfficerAppRoute,
});

const OFFICER_SHELL_CONFIG: RoleShellConfig = {
  role: "officer",
  appSubtitle: "FIELD OPERATIONS",
  eyebrowTitle: "FIELD OPERATIONS",
  homePath: "/app",
  // DemoPanel only shown in development or when VITE_DEMO_MODE=true
  showDemoPanel: import.meta.env.DEV || import.meta.env['VITE_DEMO_MODE'] === "true",
  notificationPath: "/app/crop-health",
  notificationCount: 3,
  navItems: [
    { to: "/app", label: "Priority Cases", icon: LayoutDashboard, exact: true },
    { to: "/app/fields", label: "Farms & Plots", icon: Sprout },
    { to: "/app/crop-health", label: "Crop Health", icon: ScanLine },
    { to: "/app/map", label: "Surveillance Map", icon: Map },
    { to: "/app/forecast", label: "Forecast & Risk", icon: CloudSun },
    { to: "/app/traps", label: "Pest Traps", icon: Bug },
    { to: "/app/sensors", label: "Canopy Sensors", icon: Activity },
    { to: "/app/reports", label: "Reports & Validations", icon: FileBarChart },
  ],
  mobileTabs: [
    { to: "/app", label: "Cases", icon: LayoutDashboard, exact: true },
    { to: "/app/fields", label: "Fields", icon: Sprout },
    { to: "/app/map", label: "Map", icon: Map },
    { to: "/app/crop-health", label: "Health", icon: ScanLine },
    { to: "/app/reports", label: "Reports", icon: FileBarChart },
  ],
};

function OfficerAppRoute() {
  return (
    <RequireAuth>
      <RequireRole roles={["officer"]}>
        <RoleAppShell config={OFFICER_SHELL_CONFIG}>
          <Outlet />
        </RoleAppShell>
      </RequireRole>
    </RequireAuth>
  );
}
