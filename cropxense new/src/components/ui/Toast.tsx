import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { StatusShape } from "./Status";

type Toast = { id: number; message: string; tone: "healthy" | "watch" | "critical" };
type Ctx = { toast: (message: string, tone?: Toast["tone"]) => void };

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((message: string, tone: Toast["tone"] = "healthy") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, message, tone }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 5000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-2 border border-line bg-surface p-3 overlay-shadow rounded-[var(--r)]"
          >
            <span className="mt-[6px]">
              <StatusShape status={t.tone} />
            </span>
            <p className="flex-1 text-[0.875rem]">{t.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}
              className="text-ink-2 hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
