"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import type { Content } from "@/types/content";

interface SharedViewProps {
  username: string;
  contents: Content[];
}

export function SharedView({ username, contents }: SharedViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-heading font-bold text-foreground capitalize">
          {username}'s SecondBrain
        </h1>
        <p className="text-foreground/70 font-base">
          Explore this curated knowledge collection.
        </p>
      </div>

      {/* Content Grid */}
      {contents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-foreground/70 font-base">
              No content shared yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contents.map((content) => (
            <Card key={content._id || content.id} className="h-full flex flex-col">
              <CardContent className="p-4 flex flex-col h-full">
                <h3 className="text-lg font-heading font-bold text-foreground mb-2 truncate" title={content.title}>
                  {content.title || "Untitled"}
                </h3>
                
                {content.originalLink && (
                    <a
                      href={content.originalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-foreground/70 hover:text-main transition-colors mb-3 group mt-auto"
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate group-hover:underline">
                        {content.originalLink}
                      </span>
                    </a>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                    <div className="inline-flex items-center px-3 py-1 rounded-[var(--radius-base)] border-4 border-border bg-main text-main-foreground text-xs font-heading font-bold shadow-[2px_2px_0px_0px_var(--border)]">
                      {content.type}
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
