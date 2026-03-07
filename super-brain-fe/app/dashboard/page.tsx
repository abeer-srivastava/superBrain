"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AddContentForm } from "@/components/AddContentForm";
import { ContentCard } from "@/components/ContentCard";
import { useContent } from "@/hooks/useContent";
import { useShareBrain } from "@/hooks/useShareBrain";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Share2, Copy, Check, Filter, Slack } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const { contents, loading, addContent, deleteContent } = useContent();
  const { isShared, shareLink, loading: shareLoading, toggleShare } = useShareBrain();
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type");

  const filteredContents = useMemo(() => {
    if (!typeFilter) return contents;
    return contents.filter(c => c.type === typeFilter);
  }, [contents, typeFilter]);

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ProtectedRoute>
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-heading font-bold text-foreground mb-2 uppercase tracking-tighter flex items-center gap-2">
                <div className="p-2 bg-main rounded-[var(--radius-base)] border-4 border-border shadow-[4px_4px_0px_0px_var(--border)] group-hover:translate-y-[-2px] group-hover:shadow-[6px_6px_0px_0px_var(--border)] transition-all">
          <Slack className="w-8 h-8 text-main-foreground" />
        </div>
                {typeFilter ? `${typeFilter}s` : "Your Brain"}
              </h1>
              <p className="text-foreground/70 font-base">
                {typeFilter 
                  ? `Viewing all ${typeFilter} content in your second brain` 
                  : "Manage and organize your personal knowledge collection"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
                {typeFilter && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="font-bold underline"
                        onClick={() => window.location.href = '/dashboard'}
                    >
                        Clear Filter
                    </Button>
                )}
            </div>
          </div>

          {/* Add Content Form */}
          <AddContentForm onAdd={addContent} />

          {/* Share Brain Section */}
          <Card className="border-4 border-border shadow-[var(--shadow)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-6 h-6" />
                Public Brain Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground/70 font-base">
                {isShared
                  ? "Your brain is currently public. Anyone with the link can view your content."
                  : "Generate a public link to share your knowledge collection with others."}
              </p>

              <div className="flex items-center gap-3">
                <Button
                  onClick={toggleShare}
                  disabled={shareLoading}
                  variant={isShared ? "danger" : "default"}
                  className="gap-2 shadow-[4px_4px_0px_0px_var(--border)] active:translate-y-1"
                >
                  <Share2 className="w-4 h-4" />
                  {shareLoading
                    ? "Processing..."
                    : isShared
                    ? "Disable Sharing"
                    : "Enable Sharing"}
                </Button>

                {isShared && shareLink && (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 h-10 rounded-[var(--radius-base)] border-4 border-border bg-background px-3 py-2 text-sm font-base font-semibold text-foreground"
                    />
                    <Button
                      onClick={handleCopyLink}
                      variant="secondary"
                      size="icon"
                      className="shadow-[2px_2px_0px_0px_var(--border)]"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content List */}
          <div>
            <div className="flex items-center gap-2 mb-6">
                <Filter className="w-6 h-6 text-main" />
                <h2 className="text-2xl font-heading font-bold text-foreground">
                Filtered Content ({filteredContents.length})
                </h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-border border-t-main rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-foreground/70 font-base">Syncing with your brain...</p>
              </div>
            ) : filteredContents.length === 0 ? (
              <Card className="border-4 border-dashed border-border/50 bg-secondary-background/30">
                <CardContent className="p-12 text-center">
                  <p className="text-foreground/70 font-base text-lg italic">
                    {typeFilter 
                        ? `No ${typeFilter}s found. Try adding some!` 
                        : "Your brain is empty. Start by adding some content above!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence mode="popLayout">
                    {filteredContents.map((content, index) => (
                    <motion.div
                        key={content._id || content.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ContentCard
                        content={content}
                        onDelete={deleteContent}
                        />
                    </motion.div>
                    ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
