/**
 * /farmer/schemes — Government Agricultural Schemes & Benefits
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FarmerSchemesSection } from "@/components/farmer/FarmerSchemesSection";
import { getFarmerFarms, subscribe } from "@/services";
import { useAuth } from "@/auth/AuthContext";
import type { Farm } from "@/types";

export const Route = createFileRoute("/farmer/schemes")({
  head: () => ({
    meta: [
      { title: "Government Schemes & Benefits — CropXense" },
      {
        name: "description",
        content: "Explore verified agricultural schemes, subsidies, insurance, and benefits for farmers with eligibility checker.",
      },
    ],
  }),
  component: FarmerSchemesPage,
});

function FarmerSchemesPage() {
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);

  useEffect(() => {
    getFarmerFarms(user).then(setFarms);
    return subscribe(() => {
      getFarmerFarms(user).then(setFarms);
    });
  }, [user]);

  return (
    <div className="space-y-6 pb-8">
      <FarmerSchemesSection farms={farms} compact={false} />
    </div>
  );
}
