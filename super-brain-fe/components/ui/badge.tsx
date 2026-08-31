import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[var(--radius-base)] border-2 border-border font-display uppercase tracking-wide text-[10px] px-2.5 py-1 font-bold transition-all select-none",
  {
    variants: {
      variant: {
        default: "bg-main text-main-foreground shadow-[var(--shadow-sm)]",
        outline: "bg-background text-foreground shadow-[var(--shadow-sm)]",
        secondary: "bg-secondary-background text-foreground shadow-[var(--shadow-sm)]",
        cyan: "bg-accent-cyan text-white shadow-[var(--shadow-sm)]",
        pink: "bg-accent-pink text-white shadow-[var(--shadow-sm)]",
        green: "bg-accent-green text-black shadow-[var(--shadow-sm)]",
        yellow: "bg-accent-yellow text-black shadow-[var(--shadow-sm)]",
        violet: "bg-accent-violet text-white shadow-[var(--shadow-sm)]",
        orange: "bg-accent-orange text-white shadow-[var(--shadow-sm)]",
        danger: "bg-accent-orange text-white shadow-[var(--shadow-sm)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
