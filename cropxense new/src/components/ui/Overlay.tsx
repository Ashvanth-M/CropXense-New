import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/cx";
import { IconButton } from "./Button";

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg border border-line bg-surface overlay-shadow rounded-[var(--r)]"
      >
        <header className="flex items-center justify-between border-b border-line px-3 py-2">
          <h2 className="text-[1.25rem]">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-4" aria-hidden />
          </IconButton>
        </header>
        <div className="p-4">{children}</div>
        {footer ? (
          <footer className="flex justify-end gap-2 border-t border-line px-3 py-2">{footer}</footer>
        ) : null}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-surface overlay-shadow",
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-3 py-2">
          <h2 className="text-[1.25rem]">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-4" aria-hidden />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? (
          <footer className="flex justify-end gap-2 border-t border-line px-3 py-2">{footer}</footer>
        ) : null}
      </aside>
    </div>
  );
}
