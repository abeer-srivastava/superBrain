"use client";

import * as M from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const Menu = M.Root;
export const MenuTrigger = M.Trigger;

export function MenuContent({ children, align = "end", className }: { children: React.ReactNode; align?: "start" | "end" | "center"; className?: string }) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={6}
        className={cn("z-50 min-w-[200px] border border-ink bg-card p-1 shadow-lg animate-fade-up", className)}
      >
        {children}
      </M.Content>
    </M.Portal>
  );
}

export function MenuItem({ children, onSelect, danger, className }: { children: React.ReactNode; onSelect?: () => void; danger?: boolean; className?: string }) {
  return (
    <M.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 px-2.5 py-2 text-sm outline-none select-none",
        danger ? "text-danger data-[highlighted]:bg-danger-soft" : "text-ink-2 data-[highlighted]:bg-ink data-[highlighted]:text-paper",
        className,
      )}
    >
      {children}
    </M.Item>
  );
}

export function MenuSeparator() {
  return <M.Separator className="my-1 h-px bg-line" />;
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <M.Label className="px-2.5 pb-1 pt-2 text-xs text-ink-3">{children}</M.Label>;
}
