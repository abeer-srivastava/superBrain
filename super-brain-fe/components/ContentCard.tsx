"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2 } from "lucide-react";
import type { Content } from "@/types/content";

interface ContentCardProps {
  content: Content;
  onDelete: (id: string) => void;
}

export function ContentCard({ content, onDelete }: ContentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    
    setIsDeleting(true);
    await onDelete(content.id);
    setIsDeleting(false);
  };

  return (
    <Card className="group">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-heading font-bold text-foreground mb-2 truncate">
              {content.title}
            </h3>
            
            <a
              href={content.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-foreground/70 hover:text-main transition-colors mb-3 group/link"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span className="truncate group-hover/link:underline">
                {content.link}
              </span>
            </a>

            <div className="inline-flex items-center px-3 py-1 rounded-[var(--radius-base)] border-4 border-border bg-main text-main-foreground text-xs font-heading font-bold shadow-[2px_2px_0px_0px_var(--border)]">
              {content.type}
            </div>
          </div>

          <Button
            variant="danger"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
