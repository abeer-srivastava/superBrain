"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as D from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { Library, Link2, MessageSquareText, Moon, Search, Settings, Sparkles, StickyNote, Sun } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useDebounced, useRefreshLibrary } from "@/lib/hooks";
import { useTheme } from "@/lib/theme";
import { hostname, itemTitle, looksLikeUrl, relativeTime, sourceLabel } from "@/lib/format";
import type { SearchHit } from "@/lib/types";
import { Kbd, KindIcon } from "@/components/ui/misc";
import { Spinner } from "@/components/ui/spinner";

function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query.trim().split(/\s+/).filter((t) => t.length > 2).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!terms.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${terms.join("|")})`, "ig"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="mark">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

const itemClass =
  "flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm text-ink-2 outline-none data-[selected=true]:bg-ink data-[selected=true]:text-paper [&[data-selected=true]_*]:!text-paper";

export function CommandPalette({ open, onOpenChange, initialQuery }: { open: boolean; onOpenChange: (o: boolean) => void; initialQuery: string }) {
  const router = useRouter();
  const refresh = useRefreshLibrary();
  const { pref, setPref } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const debounced = useDebounced(query, 180);

  useEffect(() => {
    if (open) setQuery(initialQuery);
    else setResults([]);
  }, [open, initialQuery]);

  useEffect(() => {
    const q = debounced.trim();
    if (!q || looksLikeUrl(q)) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    api
      .search(q)
      .then((r) => !cancelled && setResults(r.results))
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setSearching(false));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const q = query.trim();
  const isUrl = looksLikeUrl(q);

  const saveLink = async () => {
    onOpenChange(false);
    try {
      await api.content.createLink(q);
      toast.success("Saved", { description: `Reading ${hostname(q.startsWith("http") ? q : `https://${q}`)}…` });
      refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save that link");
    }
  };

  const saveNote = async () => {
    onOpenChange(false);
    try {
      await api.content.createNote(q);
      toast.success("Note saved");
      refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save that note");
    }
  };

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <D.Content className="fixed left-1/2 top-[10vh] z-50 w-[calc(100vw-24px)] max-w-[640px] -translate-x-1/2 overflow-hidden border border-ink bg-card shadow-lg animate-fade-up focus:outline-none">
          <D.Title className="sr-only">Search or ask</D.Title>
          <D.Description className="sr-only">Search your library, ask a question, or run a command.</D.Description>
          <Command shouldFilter={false} loop className="flex max-h-[min(70vh,560px)] flex-col">
            <div className="flex items-center gap-3 border-b border-line px-4">
              {searching ? <Spinner className="size-4 text-ink-3" /> : <Search className="size-4 text-ink-3" />}
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search your library, ask a question, or paste a link…"
                className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
              />
              <Kbd>esc</Kbd>
            </div>

            <Command.List className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {q && (
                <Command.Group>
                  {isUrl ? (
                    <Command.Item value="save-link" onSelect={saveLink} className={itemClass}>
                      <Link2 className="size-4 text-accent" />
                      <span className="flex-1 truncate">
                        Save link <span className="text-ink">{hostname(q.startsWith("http") ? q : `https://${q}`)}</span>
                      </span>
                      <Kbd>↵</Kbd>
                    </Command.Item>
                  ) : (
                    <>
                      <Command.Item value="ask" onSelect={() => go(`/ask?q=${encodeURIComponent(q)}`)} className={itemClass}>
                        <Sparkles className="size-4 text-accent" />
                        <span className="flex-1 truncate">
                          Ask SuperBrain: <span className="text-ink">“{q}”</span>
                        </span>
                        <Kbd>↵</Kbd>
                      </Command.Item>
                      {q.split(/\s+/).length >= 3 && (
                        <Command.Item value="note" onSelect={saveNote} className={itemClass}>
                          <StickyNote className="size-4 text-kind-note" />
                          <span className="flex-1 truncate">Save as a note</span>
                        </Command.Item>
                      )}
                    </>
                  )}
                </Command.Group>
              )}

              {results.length > 0 && (
                <Command.Group heading="From your library" className="mt-1 [&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2">
                  {results.map((r) => (
                    <Command.Item key={r.item._id} value={`item-${r.item._id}`} onSelect={() => go(`/item/${r.item._id}`)} className={`${itemClass} items-start`}>
                      <KindIcon kind={r.item.type} className="mt-1 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate font-medium text-ink">
                            <Highlight text={itemTitle(r.item)} query={q} />
                          </span>
                          <span className="shrink-0 text-xs text-ink-3">{sourceLabel(r.item)}</span>
                        </div>
                        {r.snippet && (
                          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-3">
                            <Highlight text={r.snippet} query={q} />
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 pt-0.5 font-mono text-[11px] text-ink-3">{relativeTime(r.item.createdAt)}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {q && !searching && !isUrl && debounced === query && results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-ink-3">No saved items match. Try asking instead: it searches by meaning.</p>
              )}

              {!q && (
                <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2">
                  <Command.Item onSelect={() => go("/library")} className={itemClass}>
                    <Library className="size-4" /> Library
                  </Command.Item>
                  <Command.Item onSelect={() => go("/ask")} className={itemClass}>
                    <MessageSquareText className="size-4" /> Ask your library
                  </Command.Item>
                  <Command.Item onSelect={() => go("/library?capture=note")} className={itemClass}>
                    <StickyNote className="size-4" /> Write a note
                  </Command.Item>
                  <Command.Item onSelect={() => go("/settings")} className={itemClass}>
                    <Settings className="size-4" /> Settings
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      setPref(pref === "dark" ? "light" : "dark");
                      onOpenChange(false);
                    }}
                    className={itemClass}
                  >
                    {pref === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />} Switch to {pref === "dark" ? "light" : "dark"} theme
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>

            <div className="flex items-center gap-4 border-t border-line bg-paper-2/50 px-4 py-2 text-[11px] text-ink-3">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd> open
              </span>
              <span className="ml-auto hidden sm:inline">Searches by meaning and keywords</span>
            </div>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
