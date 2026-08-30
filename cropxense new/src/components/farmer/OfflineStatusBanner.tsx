/**
 * OfflineStatusBanner — Connection status indicator.
 *
 * Shows: Online ✅ / Offline 📴 / Syncing 🔄 / Synced ✓ / Sync Failed ⚠️
 */

import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Check, AlertTriangle } from "lucide-react";
import { getOfflineStatus, onStatusChange, syncPendingRecords, getPendingCount, type OfflineStatus } from "@/services/offlineService";
import { cx } from "@/lib/cx";

const STATUS_CONFIG: Record<OfflineStatus, { icon: typeof Wifi; label: string; color: string; bg: string }> = {
  online: { icon: Wifi, label: "Online", color: "text-leaf", bg: "bg-leaf/10 border-leaf/30" },
  offline: { icon: WifiOff, label: "Offline — data saved locally", color: "text-amber", bg: "bg-amber/10 border-amber/30" },
  syncing: { icon: RefreshCw, label: "Syncing...", color: "text-forest", bg: "bg-forest/10 border-forest/30" },
  synced: { icon: Check, label: "Synced successfully", color: "text-leaf", bg: "bg-leaf/10 border-leaf/30" },
  sync_failed: { icon: AlertTriangle, label: "Sync failed — will retry", color: "text-alert", bg: "bg-alert/10 border-alert/30" },
};

export function OfflineStatusBanner() {
  const [status, setStatus] = useState<OfflineStatus>(getOfflineStatus());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsub = onStatusChange((s) => {
      setStatus(s);
      getPendingCount().then(setPendingCount).catch(() => {});
    });
    getPendingCount().then(setPendingCount).catch(() => {});
    return unsub;
  }, []);

  // Don't show banner when online with nothing pending
  if (status === "online" && pendingCount === 0) return null;

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={cx("border px-4 py-2.5 flex items-center justify-between gap-3", config.bg)}>
      <div className="flex items-center gap-2.5">
        <Icon className={cx("size-4", config.color, status === "syncing" && "animate-spin")} />
        <span className={cx("text-sm font-semibold", config.color)}>{config.label}</span>
        {pendingCount > 0 && status !== "syncing" && (
          <span className="text-xs text-ink-2">({pendingCount} pending)</span>
        )}
      </div>
      {(status === "offline" || status === "sync_failed") && (
        <button
          onClick={() => syncPendingRecords()}
          className="text-xs font-semibold text-forest hover:underline"
        >
          Retry Sync
        </button>
      )}
    </div>
  );
}
