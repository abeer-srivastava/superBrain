import { cn } from "@/lib/utils";
import type { ContentKind } from "@/lib/types";
import { FileText, Image as ImageIcon, Link2, StickyNote } from "lucide-react";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center border border-line-strong bg-paper px-1 font-mono text-[10.5px] font-medium text-ink-3",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function Tag({ children, active, onClick, className, count }: { children: React.ReactNode; active?: boolean; onClick?: () => void; className?: string; count?: number }) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[11.5px] transition-colors",
        active ? "border-ink bg-ink text-paper" : "border-line-strong bg-transparent text-ink-2",
        onClick && !active && "wipe hover:border-ink",
        className,
      )}
    >
      <span className="opacity-50">#</span>
      {children}
      {count !== undefined ? <span className="ml-0.5 font-mono text-[10px] opacity-60">{count}</span> : null}
    </Comp>
  );
}

const KIND_ICON = { link: Link2, note: StickyNote, pdf: FileText, image: ImageIcon } as const;
const KIND_COLOR = { link: "text-kind-link", note: "text-kind-note", pdf: "text-kind-pdf", image: "text-kind-image" } as const;
const KIND_BG = { link: "bg-kind-link", note: "bg-kind-note", pdf: "bg-kind-pdf", image: "bg-kind-image" } as const;

export function KindIcon({ kind, className }: { kind: ContentKind; className?: string }) {
  const Icon = KIND_ICON[kind] ?? Link2;
  return <Icon className={cn("size-3.5", KIND_COLOR[kind], className)} strokeWidth={2} aria-hidden />;
}

export function KindDot({ kind, className }: { kind: ContentKind; className?: string }) {
  return <span className={cn("inline-block size-2", KIND_BG[kind], className)} aria-hidden />;
}

export function EmptyState({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-ink/40 px-6 py-16 text-center animate-fade-up">
      {icon ? <div className="mb-4 text-ink-3">{icon}</div> : null}
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {children ? <div className="mt-2 max-w-sm text-sm leading-relaxed text-ink-2">{children}</div> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center border border-ink transition-colors duration-200 disabled:opacity-50",
        checked ? "bg-ink" : "bg-transparent",
      )}
    >
      <span className={cn("inline-block size-4 transition-transform duration-300 ease-[cubic-bezier(.35,0,.15,1)]", checked ? "translate-x-[23px] bg-paper" : "translate-x-[3px] bg-ink")} />
    </button>
  );
}
