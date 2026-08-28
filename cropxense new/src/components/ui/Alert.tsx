import type { ReactNode } from "react";
import { Info, TriangleAlert, OctagonAlert, CircleCheck } from "lucide-react";
import { cx } from "@/lib/cx";

type Tone = "info" | "watch" | "critical" | "success";

const map: Record<Tone, { color: string; Icon: typeof Info }> = {
  info: { color: "var(--water)", Icon: Info },
  watch: { color: "var(--amber)", Icon: TriangleAlert },
  critical: { color: "var(--alert)", Icon: OctagonAlert },
  success: { color: "var(--leaf)", Icon: CircleCheck },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  const { color, Icon } = map[tone];
  return (
    <div
      role={tone === "critical" ? "alert" : "status"}
      className={cx(
        "flex gap-2 border border-line bg-surface p-3 rounded-[var(--r)] border-l-4",
        className,
      )}
      style={{ borderLeftColor: color }}
    >
      <Icon className="mt-[2px] size-4 shrink-0" style={{ color }} aria-hidden />
      <div>
        <p className="text-[0.9375rem] font-semibold">{title}</p>
        {children ? <div className="mt-1 text-[0.875rem] text-ink-2">{children}</div> : null}
      </div>
    </div>
  );
}
