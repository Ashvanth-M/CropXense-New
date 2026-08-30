/**
 * NoInternetHelpSection — "Need Help Without Internet?"
 *
 * Provides alternative access methods for farmers without smartphone/internet.
 */

import { Phone, Building2, UserCheck, ClipboardList, Radio } from "lucide-react";

export function NoInternetHelpSection() {
  return (
    <section className="border border-line bg-surface p-5 md:p-6 shadow-panel">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex size-10 items-center justify-center bg-amber/10 shrink-0">
          <Radio className="size-5 text-amber" />
        </div>
        <div>
          <h3 className="font-expanded text-lg font-bold text-ink">Need Help Without Internet?</h3>
          <p className="text-sm text-ink-2 mt-0.5">
            You can report a crop problem through an agriculture officer or supported phone service.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Call Agriculture Support */}
        <a
          href="tel:1800-180-1551"
          className="flex items-center gap-3 border border-forest/20 bg-forest/5 px-4 py-4 hover:bg-forest/10 transition-colors group"
        >
          <div className="flex size-10 items-center justify-center bg-forest/10 shrink-0 group-hover:bg-forest/20 transition-colors">
            <Phone className="size-5 text-forest" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink">📞 Call Agriculture Support</p>
            <p className="text-xs text-ink-2 mt-0.5">Kisan Call Centre: 1800-180-1551 (Toll Free)</p>
          </div>
        </a>

        {/* Visit Agriculture Office */}
        <div className="flex items-center gap-3 border border-line bg-surface-2 px-4 py-4">
          <div className="flex size-10 items-center justify-center bg-surface shrink-0">
            <Building2 className="size-5 text-ink-2" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink">🏢 Visit Agriculture Office</p>
            <p className="text-xs text-ink-2 mt-0.5">Your district agriculture office can register your problem</p>
          </div>
        </div>

        {/* Ask Field Officer */}
        <div className="flex items-center gap-3 border border-line bg-surface-2 px-4 py-4">
          <div className="flex size-10 items-center justify-center bg-surface shrink-0">
            <UserCheck className="size-5 text-ink-2" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink">👨‍🌾 Ask Field Officer</p>
            <p className="text-xs text-ink-2 mt-0.5">Request your local extension officer to enter a report on your behalf</p>
          </div>
        </div>

        {/* Assisted Farmer Report */}
        <div className="flex items-center gap-3 border border-line bg-surface-2 px-4 py-4">
          <div className="flex size-10 items-center justify-center bg-surface shrink-0">
            <ClipboardList className="size-5 text-ink-2" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink">📋 Assisted Farmer Report</p>
            <p className="text-xs text-ink-2 mt-0.5">An officer can submit a crop-health case on your behalf through the CropXense officer portal</p>
          </div>
        </div>
      </div>

      {/* SMS/IVR Note */}
      <div className="mt-4 border-t border-line pt-3">
        <p className="text-xs text-ink-2">
          📱 <strong>SMS/IVR Integration:</strong> Phone/IVR based reporting can be connected during deployment.
          This architecture supports SMS, USSD, and voice call centre integration with partner telecom providers.
        </p>
      </div>
    </section>
  );
}
