import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Card({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("border border-line bg-surface rounded-[var(--r)]", className)}>
      {title ? (
        <header className="flex min-h-[36px] items-center justify-between gap-3 border-b border-line bg-surface-2 px-3 py-2">
          <span className="text-caption">{title}</span>
          {action}
        </header>
      ) : null}
      <div className={cx("p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-line bg-surface px-4 py-10 text-center rounded-[var(--r)]">
      <p className="font-display font-semibold text-[1.25rem]">{title}</p>
      {body ? <p className="mx-auto mt-1 max-w-sm text-[0.875rem] text-ink-2">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx("animate-pulse bg-surface-2 rounded-[var(--r)] h-4 w-full", className)}
    />
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-[0.875rem] text-ink-2">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>/</span>}
            {item.href ? (
              <a href={item.href} className="underline underline-offset-2 hover:text-ink">
                {item.label}
              </a>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Timeline({
  items,
}: {
  items: { time: string; title: string; body?: string; by?: string }[];
}) {
  return (
    <ol className="relative ml-2 border-l border-line pl-4">
      {items.map((it) => (
        <li key={it.time + it.title} className="relative pb-4 last:pb-0">
          <span className="absolute -left-[21px] top-[6px] size-2 rounded-full bg-forest" aria-hidden />
          <div className="num text-[0.75rem] text-ink-2">{it.time}</div>
          <div className="text-[0.9375rem] font-semibold">{it.title}</div>
          {it.body ? <p className="text-[0.875rem] text-ink-2">{it.body}</p> : null}
          {it.by ? <p className="text-[0.75rem] text-ink-2">{it.by}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      <span tabIndex={0} aria-describedby={undefined} title={label} className="inline-flex">
        {children}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap border border-line bg-ink px-2 py-1 text-[0.75rem] text-paper opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 rounded-[var(--r)]"
      >
        {label}
      </span>
    </span>
  );
}
