"use client";

import { cn } from "@/lib/utils";

interface RetroGridProps {
  className?: string;
}

export function RetroGrid({ className }: RetroGridProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_2px,transparent_2px),linear-gradient(to_bottom,var(--border)_2px,transparent_2px)] bg-[size:44px_44px]" />
    </div>
  );
}
