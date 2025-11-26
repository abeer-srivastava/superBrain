"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { shareBrainAPI } from "@/lib/api";
import { SharedView } from "@/components/SharedView";
import type { SharedBrain } from "@/types/content";
import { motion } from "framer-motion";

export default function SharedBrainPage() {
  const params = useParams();
  const hash = params.hash as string;
  const [data, setData] = useState<SharedBrain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedBrain = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await shareBrainAPI.getSharedBrain(hash);
        setData(result);
      } catch (err: any) {
        console.error("Failed to fetch shared brain:", err);
        setError(
          err.response?.data?.message || "Failed to load shared brain"
        );
      } finally {
        setLoading(false);
      }
    };

    if (hash) {
      fetchSharedBrain();
    }
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-border border-t-main rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground font-base font-semibold">
            Loading shared brain...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full p-8 rounded-[var(--radius-base)] border-4 border-border bg-secondary-background shadow-[var(--shadow)] text-center"
        >
          <h1 className="text-2xl font-heading font-bold text-foreground mb-4">
            Brain Not Found
          </h1>
          <p className="text-foreground/70 font-base mb-6">
            {error || "This brain is not available or has been made private."}
          </p>
          <a
            href="/auth/signin"
            className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-[var(--radius-base)] border-4 border-border bg-main text-main-foreground font-heading font-bold shadow-[var(--shadow)] hover:translate-y-[-2px] hover:shadow-[6px_4px_0px_0px_var(--border)] transition-all"
          >
            Go to Sign In
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SharedView username={data.username} contents={data.contents} />
        </motion.div>
      </div>
    </div>
  );
}
