/**
 * /expert layout — Plant Protection Expert Workspace.
 *
 * Powered by the canonical RoleAppShell with "EXPERT VALIDATION" identity.
 */

import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  FileCheck,
  History,
  BookOpen,
  Microscope,
  Activity,
} from "lucide-react";
import { RequireAuth, RequireRole } from "@/auth/guards";
import { RoleAppShell, type RoleShellConfig } from "@/components/Chrome/RoleAppShell";

export const Route = createFileRoute("/expert")({
  head: () => ({
    meta: [
      { title: "Expert Validation — CropXense" },
      {
        name: "description",
        content: "Plant Protection Expert scientific validation suite, digital pathology lab, and epidemiological intelligence.",
      },
      { property: "og:title", content: "Expert Validation — CropXense" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ExpertAppRoute,
});

const EXPERT_SHELL_CONFIG: RoleShellConfig = {
  role: "expert",
  appSubtitle: "EXPERT VALIDATION",
  eyebrowTitle: "EXPERT VALIDATION",
  homePath: "/expert",
  statusBadge: "National Diagnostic Center · Central Reference Lab",
  notificationPath: "/expert",
  notificationCount: 3,
  navItems: [
    { to: "/expert", label: "Pending Reviews", icon: FileCheck, exact: true },
    { to: "/expert/history", label: "Validation History", icon: History },
    { to: "/expert/knowledge", label: "Disease Knowledge Base", icon: BookOpen },
    { to: "/expert/lab", label: "Pathogen Lab Studio", icon: Microscope },
    { to: "/expert/epidemiology", label: "Outbreak Epidemiology", icon: Activity },
  ],
  mobileTabs: [
    { to: "/expert", label: "Reviews", icon: FileCheck, exact: true },
    { to: "/expert/history", label: "History", icon: History },
    { to: "/expert/knowledge", label: "Knowledge", icon: BookOpen },
    { to: "/expert/lab", label: "Lab Studio", icon: Microscope },
    { to: "/expert/epidemiology", label: "Epidemiology", icon: Activity },
  ],
};

function ExpertAppRoute() {
  return (
    <RequireAuth>
      <RequireRole roles={["expert"]}>
        <RoleAppShell config={EXPERT_SHELL_CONFIG}>
          <Outlet />
        </RoleAppShell>
      </RequireRole>
    </RequireAuth>
  );
}
