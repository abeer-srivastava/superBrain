import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-base)] border-2 border-border bg-chrome/60",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
