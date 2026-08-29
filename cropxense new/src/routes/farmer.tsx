/**
 * /farmer layout — Responsive Farmer Web Application.
 *
 * Powered by the canonical RoleAppShell with "FIELD HEALTH" identity.
 */

import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sprout,
  ScanLine,
  CloudSun,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { RequireAuth, RequireRole } from "@/auth/guards";
import { RoleAppShell, type RoleShellConfig } from "@/components/Chrome/RoleAppShell";

export const Route = createFileRoute("/farmer")({
  head: () => ({
    meta: [
      { title: "CropXense Field Health — Farmer Platform" },
      {
        name: "description",
        content: "District crop surveillance, parcel-level disease detection, and IPM advisories for farmers.",
      },
      { property: "og:title", content: "CropXense Field Health — Farmer Platform" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: FarmerAppRoute,
});

const FARMER_SHELL_CONFIG: RoleShellConfig = {
  role: "farmer",
  appSubtitle: "FIELD HEALTH",
  eyebrowTitle: "FARMER PORTAL",
  homePath: "/farmer",
  notificationPath: "/farmer/crop-care",
  notificationCount: 2,
  navItems: [
    { to: "/farmer", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/farmer/fields", label: "My Fields", icon: Sprout },
    { to: "/farmer/scan", label: "Scan Crop", icon: ScanLine },
    { to: "/farmer/forecast", label: "Weather & Risk", icon: CloudSun },
    { to: "/farmer/crop-care", label: "Crop Care", icon: ShieldCheck },
    { to: "/farmer/profile", label: "Profile & Help", icon: UserCheck },
  ],
  mobileTabs: [
    { to: "/farmer", label: "Home", icon: LayoutDashboard, exact: true },
    { to: "/farmer/scan", label: "Scan", icon: ScanLine },
    { to: "/farmer/crop-care", label: "Crop Care", icon: ShieldCheck },
    { to: "/farmer/fields", label: "Fields", icon: Sprout },
    { to: "/farmer/profile", label: "Profile", icon: UserCheck },
  ],
};

function FarmerAppRoute() {
  return (
    <RequireAuth>
      <RequireRole roles={["farmer"]}>
        <RoleAppShell config={FARMER_SHELL_CONFIG}>
          <Outlet />
        </RoleAppShell>
      </RequireRole>
    </RequireAuth>
  );
}
