import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--r)] font-sans font-semibold " +
  "transition-colors select-none disabled:opacity-45 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  sm: "min-h-[36px] px-3 text-[0.875rem]",
  md: "min-h-[44px] px-4 text-[0.9375rem]",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-forest text-surface border border-forest hover:bg-[#0e2b20] active:bg-[#0a2118]",
  secondary:
    "bg-surface text-ink border border-ink/70 hover:bg-surface-2 active:bg-line",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-surface-2 active:bg-line",
  danger: "bg-alert text-surface border border-alert hover:bg-[#8c2a19] active:bg-[#742216]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(base, sizes[size], variants[variant], className)}
      {...rest}
    >
      {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  label: string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = "ghost", label, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cx(
        base,
        "size-11 shrink-0 p-0",
        variants[variant],
        variant === "ghost" && "border-transparent",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
