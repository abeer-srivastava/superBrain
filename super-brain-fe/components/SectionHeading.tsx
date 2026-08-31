import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  accent?: "chrome" | "main" | "cyan" | "pink" | "green" | "yellow";
}

const ACCENTS: Record<string, string> = {
  chrome: "bg-chrome text-foreground",
  main: "bg-main text-main-foreground",
  cyan: "bg-accent-cyan text-white",
  pink: "bg-accent-pink text-white",
  green: "bg-accent-green text-black",
  yellow: "bg-accent-yellow text-black",
};

export function SectionHeading({
  title,
  subtitle,
  icon,
  className,
  accent = "main",
}: SectionHeadingProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={cn(
                "flex items-center justify-center rounded-[var(--radius-base)] border-[3px] border-border p-2 shadow-[var(--shadow-sm)]",
                ACCENTS[accent]
              )}
            >
              {icon}
            </div>
          )}
          <h1 className="text-4xl font-display uppercase tracking-tighter text-foreground">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="mt-2 pl-1 font-base text-foreground/70">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
