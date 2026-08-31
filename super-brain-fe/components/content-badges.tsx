"use client";

import { Badge } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Globe,
  FileText,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";
import type { Content } from "@/types/content";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const TYPE_STYLES: Record<string, { variant: BadgeVariant; icon: React.ReactNode }> = {
  link: { variant: "default", icon: <Globe className="h-3 w-3" /> },
  pdf: { variant: "danger", icon: <FileText className="h-3 w-3" /> },
  image: { variant: "green", icon: <ImageIcon className="h-3 w-3" /> },
  note: { variant: "cyan", icon: <MessageSquare className="h-3 w-3" /> },
};

export function TypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLES[type] || { variant: "default" as const, icon: null };
  return (
    <Badge variant={style.variant}>
      {style.icon}
      {type}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: Content["status"] }) {
  switch (status) {
    case "processing":
      return (
        <Badge variant="yellow" className="animate-pulse">
          <Clock className="h-3 w-3" /> Processing
        </Badge>
      );
    case "ready":
      return (
        <Badge variant="green">
          <CheckCircle2 className="h-3 w-3" /> Ready
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="danger">
          <AlertCircle className="h-3 w-3" /> Failed
        </Badge>
      );
    default:
      return null;
  }
}

export function TagPill({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center rounded-full border-2 border-border bg-secondary-background px-2 py-0.5 text-[10px] font-base font-bold text-foreground/70">
      #{tag}
    </span>
  );
}
