/**
 * /farmer/voice-report — Dedicated Voice & Rural Access Reporting Page
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { VoiceReportSection } from "@/components/farmer/VoiceReportSection";
import { NoInternetHelpSection } from "@/components/farmer/NoInternetHelpSection";
import { OfflineStatusBanner } from "@/components/farmer/OfflineStatusBanner";
import { CropAbnormalitySection } from "@/components/farmer/CropAbnormalitySection";
import { getFarmerFarms, subscribe } from "@/services";
import { useAuth } from "@/auth/AuthContext";
import type { Farm } from "@/types";

export const Route = createFileRoute("/farmer/voice-report")({
  head: () => ({
    meta: [
      { title: "Speak Your Problem — CropXense Voice Support" },
      {
        name: "description",
        content: "Speak your crop health problem in your own language. No smartphone typing or technical knowledge required.",
      },
    ],
  }),
  component: FarmerVoiceReportPage,
});

function FarmerVoiceReportPage() {
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
      <OfflineStatusBanner />
      <VoiceReportSection farms={farms} />
      <CropAbnormalitySection farms={farms} />
      <NoInternetHelpSection />
    </div>
  );
}
