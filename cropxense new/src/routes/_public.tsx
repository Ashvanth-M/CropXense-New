/**
 * Pathless layout route for the public marketing website.
 * Renders the public marketing navigation (PublicNav) and footer.
 */

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PublicNav } from "@/components/Chrome/PublicNav";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <PublicNav />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
