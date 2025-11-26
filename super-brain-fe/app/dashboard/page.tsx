"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AddContentForm } from "@/components/AddContentForm";
import { ContentCard } from "@/components/ContentCard";
import { useContent } from "@/hooks/useContent";
import { useShareBrain } from "@/hooks/useShareBrain";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Share2, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";

export default function DashboardPage() {
  const { contents, loading, addContent, deleteContent } = useContent();
  const { isShared, shareLink, loading: shareLoading, toggleShare } = useShareBrain();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
              Dashboard
            </h1>
            <p className="text-foreground/70 font-base">
              Manage your knowledge collection
            </p>
          </div>

          {/* Add Content Form */}
          <AddContentForm onAdd={addContent} />

          {/* Share Brain Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-6 h-6" />
                Share Your Brain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground/70 font-base">
                {isShared
                  ? "Your brain is currently public. Anyone with the link can view your content."
                  : "Make your brain public and share your knowledge with others."}
              </p>

              <div className="flex items-center gap-3">
                <Button
                  onClick={toggleShare}
                  disabled={shareLoading}
                  variant={isShared ? "danger" : "default"}
                  className="gap-2"
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
            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              Your Content
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-border border-t-main rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-foreground/70 font-base">Loading content...</p>
              </div>
            ) : contents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-foreground/70 font-base text-lg">
                    No content yet. Add your first item above!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {contents.map((content, index) => (
                  <motion.div
                    key={content.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ContentCard
                      content={content}
                      onDelete={deleteContent}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}