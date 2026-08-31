import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-base)] text-sm font-display font-bold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-[3px] border-border active:translate-y-[2px] active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-main text-main-foreground shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[var(--shadow-lg)]",
        secondary:
          "bg-secondary-background text-foreground shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[var(--shadow-lg)]",
        danger:
          "bg-accent-orange text-white shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[var(--shadow-lg)]",
        outline:
          "bg-background text-foreground shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[var(--shadow-lg)]",
        ghost:
          "border-0 shadow-none bg-transparent hover:bg-secondary-background active:translate-y-0 active:shadow-none",
        chrome:
          "bg-chrome text-foreground shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[var(--shadow-lg)]",
        cyan:
          "bg-accent-cyan text-white shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[var(--shadow-lg)]",
        green:
          "bg-accent-green text-black shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[var(--shadow-lg)]",
        yellow:
          "bg-accent-yellow text-black shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[var(--shadow-lg)]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-13 px-8 text-base",
        icon: "h-11 w-11",
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
