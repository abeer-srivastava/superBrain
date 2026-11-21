"use client";

import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-[fade-up_0.2s_ease]" />
        <D.Content
          className={cn(
            "fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-32px)] max-w-md -translate-x-1/2 border border-ink bg-card p-6 shadow-lg animate-fade-up focus:outline-none",
            className,
          )}
        >
          <D.Title className="font-display text-2xl text-ink">{title}</D.Title>
          {description ? <D.Description className="mt-1.5 text-sm leading-relaxed text-ink-2">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          <div className="mt-5">{children}</div>
          <D.Close className="absolute right-4 top-4 p-1 text-ink-3 hover:bg-paper-2 hover:text-ink" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
