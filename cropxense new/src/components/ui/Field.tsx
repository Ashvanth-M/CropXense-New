import { forwardRef, useId } from "react";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { cx } from "@/lib/cx";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const areaId = id ?? auto;
  return (
    <div>
      {label ? <Label htmlFor={areaId}>{label}</Label> : null}
      <textarea
        ref={ref}
        id={areaId}
        className={cx(
          "w-full min-h-[88px] rounded-[var(--r)] border border-line bg-surface px-3 py-2 text-ink",
          "placeholder:text-ink-2/70 transition-colors hover:border-ink-2",
          className,
        )}
        {...rest}
      />
      {hint ? <p className="mt-1 text-[0.75rem] text-ink-2">{hint}</p> : null}
    </div>
  );
});


export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-caption block mb-1">
      {children}
    </label>
  );
}

const control =
  "w-full min-h-[44px] rounded-[var(--r)] border border-line bg-surface px-3 text-ink " +
  "placeholder:text-ink-2/70 transition-colors hover:border-ink-2 " +
  "disabled:bg-surface-2 disabled:text-ink-2 disabled:cursor-not-allowed";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, mono, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${inputId}-desc` : undefined}
        className={cx(control, mono && "num", error && "border-alert", className)}
        {...rest}
      />
      {hint || error ? (
        <p
          id={`${inputId}-desc`}
          className={cx("mt-1 text-[0.75rem]", error ? "text-alert" : "text-ink-2")}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div>
      {label ? <Label htmlFor={selectId}>{label}</Label> : null}
      <select ref={ref} id={selectId} className={cx(control, "pr-8", className)} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
});

export function DateRange({
  label = "Date range",
  from,
  to,
  onChange,
}: {
  label?: string;
  from: string;
  to: string;
  onChange?: (next: { from: string; to: string }) => void;
}) {
  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="text-caption mb-1">{label}</legend>
      <div className="flex items-center gap-2">
        <input
          type="date"
          aria-label={`${label} start`}
          value={from}
          onChange={(e) => onChange?.({ from: e.target.value, to })}
          className={cx(control, "num")}
        />
        <span aria-hidden className="text-ink-2">
          –
        </span>
        <input
          type="date"
          aria-label={`${label} end`}
          value={to}
          onChange={(e) => onChange?.({ from, to: e.target.value })}
          className={cx(control, "num")}
        />
      </div>
    </fieldset>
  );
}

export function Checkbox({
  label,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <label
      htmlFor={rest.id ?? id}
      className="flex min-h-[44px] items-center gap-2 text-[0.9375rem]"
    >
      <input
        id={rest.id ?? id}
        type="checkbox"
        className="size-[18px] rounded-[var(--r)] border border-ink-2 accent-[var(--forest)]"
        {...rest}
      />
      {label}
    </label>
  );
}

export function Radio({
  label,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <label
      htmlFor={rest.id ?? id}
      className="flex min-h-[44px] items-center gap-2 text-[0.9375rem]"
    >
      <input
        id={rest.id ?? id}
        type="radio"
        className="size-[18px] accent-[var(--forest)]"
        {...rest}
      />
      {label}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-[44px] items-center gap-3 text-[0.9375rem] disabled:opacity-45"
    >
      <span
        aria-hidden
        className={cx(
          "flex h-6 w-11 items-center rounded-[var(--r)] border p-[2px] transition-colors",
          checked ? "border-forest bg-forest" : "border-line bg-surface-2",
        )}
      >
        <span
          className={cx(
            "size-5 rounded-[var(--r)] bg-surface transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
      {label}
    </button>
  );
}
