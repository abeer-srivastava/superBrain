import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full border border-line-strong bg-card px-3.5 text-[15px] text-ink placeholder:text-ink-3 transition-colors outline-none",
        "focus:border-ink focus:outline-1 focus:outline-ink focus:outline-offset-0",
        invalid && "border-danger focus:border-danger focus:outline-danger",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full border border-line-strong bg-card px-3.5 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-3 transition-colors outline-none resize-none",
        "focus:border-ink focus:outline-1 focus:outline-ink focus:outline-offset-0",
        className,
      )}
      {...props}
    />
  );
});

export function Label({ children, htmlFor, hint }: { children: React.ReactNode; htmlFor?: string; hint?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <label htmlFor={htmlFor} className="font-mono text-xs uppercase tracking-[0.06em] text-ink-2">
        {children}
      </label>
      {hint ? <span className="text-xs text-ink-3">{hint}</span> : null}
    </div>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-[13px] text-danger">{children}</p>;
}
