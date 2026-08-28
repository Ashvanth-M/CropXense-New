import { cx } from "@/lib/cx";

type MarkProps = { size?: number; className?: string; title?: string };

/**
 * Survey crosshair over a plot of land.
 * The crossing diagonals are the X in CropXense.
 */
export function LogoMark({ size = 24, className, title = "CropXense" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
    >
      {/* plot under observation: lower-left triangle */}
      <path d="M3 3 L29 29 L3 29 Z" fill="var(--leaf)" fillOpacity="0.15" />
      <rect x="3" y="3" width="26" height="26" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 3 L29 29 M29 3 L3 29" stroke="currentColor" strokeWidth="1" />
      <circle cx="14.5" cy="17.5" r="2.6" fill="currentColor" />
    </svg>
  );
}

export function LogoHorizontal({ className, size = 24 }: MarkProps) {
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <Wordmark style={{ fontSize: size * 0.72 }} />
    </span>
  );
}

export function LogoStacked({ className, size = 40 }: MarkProps) {
  return (
    <span className={cx("inline-flex flex-col items-center gap-2", className)}>
      <LogoMark size={size} />
      <Wordmark style={{ fontSize: size * 0.4 }} />
    </span>
  );
}

function Wordmark({ style }: { style?: React.CSSProperties }) {
  return (
    <span
      className="font-display font-semibold tracking-[-0.02em] leading-none"
      style={style}
    >
      Crop
      <span className="font-medium text-amber">X</span>
      ense
    </span>
  );
}
