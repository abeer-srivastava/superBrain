"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SearchBar } from "@/components/SearchBar";
import { useSearch } from "@/hooks/useSearch";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchPage() {
  const { results, loading, error, lastQuery, search } = useSearch();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 bg-main rounded-[var(--radius-base)] border-4 border-border shadow-[var(--shadow)] mb-2">
              <Sparkles className="w-8 h-8 text-main-foreground" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-foreground">
              Semantic Search
            </h1>
            <p className="text-foreground/70 font-base max-w-2xl mx-auto">
              Search your brain using natural language. Our AI understands context and meaning.
            </p>
          </div>

          {/* Search Bar */}
          <SearchBar
            onSearch={search}
            initialQuery={lastQuery}
            loading={loading}
          />

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-[var(--radius-base)] border-4 border-border bg-chart-3/20 text-chart-3 font-base font-semibold">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-border border-t-main rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-foreground/70 font-base">Searching your brain...</p>
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-heading font-bold text-foreground">
                Results ({results.length})
              </h2>

              <div className="space-y-3">
                {results.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-heading font-bold text-foreground mb-2 truncate">
                              {result.title}
                            </h3>

                            <a
                              href={result.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-foreground/70 hover:text-main transition-colors mb-3 group"
                            >
                              <ExternalLink className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate group-hover:underline">
                                {result.link}
                              </span>
                            </a>

                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center px-3 py-1 rounded-[var(--radius-base)] border-4 border-border bg-main text-main-foreground text-xs font-heading font-bold shadow-[2px_2px_0px_0px_var(--border)]">
                                {result.type}
                              </div>
                            </div>
                          </div>

                          {/* Relevance Score */}
                          <div className="flex-shrink-0 text-center">
                            <div className="px-3 py-2 rounded-[var(--radius-base)] border-4 border-border bg-chart-4 text-main-foreground shadow-[var(--shadow)]">
                              <div className="text-2xl font-heading font-bold">
                                {Math.round(result.score * 100)}%
                              </div>
                              <div className="text-xs font-base">
                                Match
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && lastQuery && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-foreground/70 font-base text-lg">
                  No results found for "{lastQuery}"
                </p>
              </CardContent>
            </Card>
          )}

          {/* Initial State */}
          {!loading && !error && results.length === 0 && !lastQuery && (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
                <p className="text-foreground/70 font-base text-lg">
                  Enter a search query to find relevant content
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
