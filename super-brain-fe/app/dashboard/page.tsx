"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AddContentForm } from "@/components/AddContentForm";
import { ContentCard } from "@/components/ContentCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useContent } from "@/hooks/useContent";
import { useShareBrain } from "@/hooks/useShareBrain";
import { Share2, Copy, Check, Hash, Slack, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function DashboardContent() {
  const { contents, loading, addContent, deleteContent } = useContent();
  const { isShared, shareLink, loading: shareLoading, toggleShare } = useShareBrain();
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    contents.forEach(c => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach(t => tagsSet.add(t.toLowerCase()));
      }
    });
    return Array.from(tagsSet).sort();
  }, [contents]);

  // Adjust state during render: reset tag filter when the type filter changes
  const [prevTypeFilter, setPrevTypeFilter] = useState(typeFilter);
  if (prevTypeFilter !== typeFilter) {
    setPrevTypeFilter(typeFilter);
    setSelectedTag(null);
  }

  const filteredContents = useMemo(() => {
    let result = contents;
    if (typeFilter) {
      result = result.filter(c => c.type === typeFilter);
    }
    if (selectedTag) {
      result = result.filter(c => c.tags?.map(t => t.toLowerCase()).includes(selectedTag.toLowerCase()));
    }
    return result;
  }, [contents, typeFilter, selectedTag]);

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <SectionHeading
          title={typeFilter ? `${typeFilter}s` : "Your Brain"}
          subtitle={
            typeFilter
              ? `Viewing all ${typeFilter} content in your second brain`
              : "Manage and organize your personal knowledge collection"
          }
          icon={<Slack className="h-8 w-8" />}
          accent="chrome"
        />

        {typeFilter && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/dashboard")}
              className="gap-1.5"
            >
              <X className="h-4 w-4" /> Clear Filter
            </Button>
          </div>
        )}

        {/* Add Content Form */}
        <AddContentForm onAdd={addContent} />

        {/* Share Brain Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-base)] border-[3px] border-border bg-accent-cyan text-white shadow-[var(--shadow-sm)]">
                <Share2 className="h-4 w-4" />
              </span>
              Public Brain Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-base text-sm text-foreground/70">
              {isShared
                ? "Your brain is currently public. Anyone with the link can view your content."
                : "Generate a public link to share your knowledge collection with others."}
            </p>

            <div className="flex items-center gap-3">
              <Button
                onClick={toggleShare}
                disabled={shareLoading}
                variant={isShared ? "danger" : "default"}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                {shareLoading
                  ? "Processing..."
                  : isShared
                  ? "Disable Sharing"
                  : "Enable Sharing"}
              </Button>

              {isShared && shareLink && (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="h-11 flex-1 rounded-[var(--radius-base)] border-[3px] border-border bg-background px-3 py-2 text-sm font-base font-semibold text-foreground shadow-[var(--shadow-sm)]"
                  />
                  <Button onClick={handleCopyLink} variant="secondary" size="icon">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tags Filter Cloud */}
        {allTags.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-base)] border-2 border-border bg-accent-yellow text-black shadow-[var(--shadow-sm)]">
                  <Hash className="h-4 w-4" />
                </span>
                Filter by Tag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`rounded-[var(--radius-base)] border-2 border-border px-3 py-1 font-display text-xs uppercase tracking-wide shadow-[var(--shadow-sm)] transition-all active:translate-y-[2px] active:shadow-none ${
                    selectedTag === null
                      ? "bg-main text-main-foreground"
                      : "bg-background text-foreground hover:bg-secondary-background"
                  }`}
                >
                  All Tags
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`rounded-[var(--radius-base)] border-2 border-border px-3 py-1 font-display text-xs uppercase tracking-wide shadow-[var(--shadow-sm)] transition-all active:translate-y-[2px] active:shadow-none ${
                      selectedTag === tag
                        ? "bg-main text-main-foreground"
                        : "bg-background text-foreground hover:bg-secondary-background"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content List */}
        <div>
          <h2 className="mb-6 flex items-center gap-2 font-display text-2xl uppercase tracking-tight text-foreground">
            Filtered Content ({filteredContents.length})
          </h2>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : filteredContents.length === 0 ? (
            <Card className="border-dashed bg-secondary-background/40">
              <CardContent className="p-12 text-center">
                <p className="font-base text-lg italic text-foreground/70">
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
                {filteredContents.map((content) => (
                  <motion.div
                    key={content._id || content.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ContentCard content={content} onDelete={deleteContent} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-border border-t-main"></div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
