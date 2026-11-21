import { cn } from "@/lib/utils";

/** The mark: two thoughts, connected. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <rect width="32" height="32" fill="var(--ink)" />
      <path d="M11 20.5c2.5-6 7.5-9 10-9" stroke="var(--paper)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
      <circle cx="10.5" cy="21" r="3.2" fill="var(--paper)" />
      <circle cx="21.5" cy="11" r="3.2" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && <span className="text-[19px] font-bold leading-none tracking-[-0.04em] text-ink">SuperBrain</span>}
    </span>
  );
}
