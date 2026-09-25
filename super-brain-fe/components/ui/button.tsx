import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-base)] text-sm font-heading font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-4 border-border active:translate-y-1 active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-main text-main-foreground shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[6px_4px_0px_0px_var(--border)]",
        secondary:
          "bg-secondary-background text-foreground shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[6px_4px_0px_0px_var(--border)]",
        danger:
          "bg-chart-3 text-main-foreground shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[6px_4px_0px_0px_var(--border)]",
        outline:
          "bg-background text-foreground shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[6px_4px_0px_0px_var(--border)]",
        ghost: "border-0 shadow-none hover:bg-secondary-background",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[var(--radius-base)] px-3",
        lg: "h-11 rounded-[var(--radius-base)] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
