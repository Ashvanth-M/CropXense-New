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
} from "lucide-react";
import { RequireAuth, RequireRole } from "@/auth/guards";
import { RoleAppShell, type RoleShellConfig } from "@/components/Chrome/RoleAppShell";

export const Route = createFileRoute("/expert")({
  head: () => ({
    meta: [
      { title: "Expert Validation — CropXense" },
      {
        name: "description",
        content: "Plant Protection Expert validation dashboard for scientific crop disease verification.",
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
  statusBadge: "Diagnostic Center · Maharashtra State Lab",
  notificationPath: "/expert",
  notificationCount: 3,
  navItems: [
    { to: "/expert", label: "Pending Reviews", icon: FileCheck, exact: true },
    { to: "/expert/history", label: "Validation History", icon: History },
    { to: "/expert/knowledge", label: "Disease Knowledge Base", icon: BookOpen },
  ],
  mobileTabs: [
    { to: "/expert", label: "Reviews", icon: FileCheck, exact: true },
    { to: "/expert/history", label: "History", icon: History },
    { to: "/expert/knowledge", label: "Knowledge", icon: BookOpen },
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
