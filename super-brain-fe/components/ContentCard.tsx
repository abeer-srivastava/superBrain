"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TypeBadge, StatusBadge, TagPill } from "@/components/content-badges";
import {
  ExternalLink,
  Trash2,
  Youtube,
  Twitter,
  Github,
  Globe,
} from "lucide-react";
import type { Content } from "@/types/content";

interface ContentCardProps {
  content: Content;
  onDelete: (id: string) => void;
}

export function ContentCard({ content, onDelete }: ContentCardProps) {
  const contentId = content._id || content.id;

  const getSourceIcon = () => {
    const url = (content.originalLink || "").toLowerCase();

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return <Youtube className="h-5 w-5 text-[#FF0000]" />;
    }
    if (url.includes("twitter.com") || url.includes("x.com")) {
      return <Twitter className="h-5 w-5 text-[#1DA1F2]" />;
    }
    if (url.includes("github.com")) {
      return <Github className="h-5 w-5 text-foreground" />;
    }
    return <Globe className="h-5 w-5 text-foreground/50" />;
  };

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex h-full flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-base)] border-2 border-border bg-background shadow-[var(--shadow-sm)]">
              {getSourceIcon()}
            </div>
            <div className="min-w-0">
              <h3
                className="mb-1 truncate font-display text-base uppercase tracking-tight text-foreground"
                title={content.title}
              >
                {content.title || "Untitled"}
              </h3>
              <StatusBadge status={content.status} />
            </div>
          </div>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <DeleteConfirmDialog
                    trigger={
                      <Button variant="danger" size="icon" className="h-9 w-9 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                    title={`Delete "${content.title || "Untitled"}"?`}
                    onConfirm={() => onDelete(contentId)}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {content.summary && (
          <p className="mb-4 flex-1 text-sm italic leading-relaxed text-foreground/70 line-clamp-3">
            &quot;{content.summary}&quot;
          </p>
        )}

        {content.originalLink && (
          <a
            href={content.originalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 mt-auto flex items-center gap-2 truncate rounded-[var(--radius-base)] border-2 border-border bg-background p-2 text-xs font-base font-semibold text-foreground/70 transition-colors hover:text-main"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{content.originalLink}</span>
          </a>
        )}

        <div className="flex items-center justify-between border-t-2 border-border/20 pt-3">
          <TypeBadge type={content.type} />
          {content.tags && content.tags.length > 0 && (
            <div className="flex gap-1 overflow-hidden">
              {content.tags.slice(0, 2).map((tag) => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
