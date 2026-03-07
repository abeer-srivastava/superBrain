"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Youtube, 
  Twitter, 
  Github, 
  FileText, 
  Globe, 
  Image as ImageIcon,
  MessageSquare,
  FileCode
} from "lucide-react";
import type { Content } from "@/types/content";

interface ContentCardProps {
  content: Content;
  onDelete: (id: string) => void;
}

export function ContentCard({ content, onDelete }: ContentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const contentId = content._id || content.id;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    
    setIsDeleting(true);
    await onDelete(contentId);
    setIsDeleting(false);
  };

  const getSourceIcon = () => {
    const url = (content.originalLink || "").toLowerCase();
    
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return <Youtube className="w-5 h-5 text-[#FF0000]" />;
    }
    if (url.includes("twitter.com") || url.includes("x.com")) {
      return <Twitter className="w-5 h-5 text-[#1DA1F2]" />;
    }
    if (url.includes("github.com")) {
      return <Github className="w-5 h-5 text-foreground" />;
    }
    
    // Fallback based on type
    switch (content.type) {
      case 'note':
        return <MessageSquare className="w-5 h-5 text-main" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-chart-3" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-chart-4" />;
      default:
        return <Globe className="w-5 h-5 text-foreground/50" />;
    }
  };

  const StatusIcon = () => {
    switch (content.status) {
      case 'processing':
        return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="group h-full flex flex-col border-4 border-border shadow-[var(--shadow)] hover:translate-y-[-4px] hover:shadow-[8px_6px_0px_0px_var(--border)] transition-all">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start gap-4 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-secondary-background rounded-[var(--radius-base)] border-2 border-border flex-shrink-0">
              {getSourceIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-heading font-bold text-foreground mb-1 truncate" title={content.title}>
                {content.title || "Untitled"}
              </h3>
              <div className="flex items-center gap-2">
                  <StatusIcon />
                  <span className="text-[10px] font-base text-foreground/50 uppercase tracking-wider font-bold">{content.status}</span>
              </div>
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

        <div className="flex-1 mt-2">
          {content.summary && (
            <p className="text-sm font-base text-foreground/70 line-clamp-3 mb-4 italic">
              "{content.summary}"
            </p>
          )}
        </div>

        {content.originalLink && (
            <a
              href={content.originalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-foreground/70 hover:text-main transition-colors mb-4 group/link mt-auto bg-secondary-background p-2 rounded-[var(--radius-base)] border-2 border-border truncate"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span className="truncate group-hover/link:underline font-base">
                {content.originalLink}
              </span>
            </a>
        )}

        <div className="flex items-center justify-between pt-2 border-t-2 border-border/20">
            <div className="inline-flex items-center px-3 py-1 rounded-[var(--radius-base)] border-2 border-border bg-main text-main-foreground text-[10px] font-heading font-bold shadow-[2px_2px_0px_0px_var(--border)] uppercase">
              {content.type}
            </div>
            {content.tags && content.tags.length > 0 && (
              <div className="flex gap-1 overflow-hidden">
                {content.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[10px] bg-secondary-background px-2 py-0.5 rounded-full border border-border font-bold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
