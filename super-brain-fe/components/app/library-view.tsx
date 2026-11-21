"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Star, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useLibrary, useMe, useRefreshLibrary, useResurfaced, useStats } from "@/lib/hooks";
import { compactNumber, greeting, KIND_PLURAL } from "@/lib/format";
import type { ContentKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, KindDot } from "@/components/ui/misc";
import { CaptureBar, type CaptureBarHandle } from "./capture-bar";
import { ItemCard, ItemCardSkeleton } from "./item-card";
import { useShell } from "./shell";

const KINDS: ContentKind[] = ["link", "note", "pdf", "image"];

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      data-active={active}
      className={cn("wipe -ml-px inline-flex h-9 items-center gap-1.5 border border-ink px-3.5 text-[13px]", active ? "text-paper" : "text-ink")}
    >
      {children}
    </Link>
  );
}

export function LibraryView() {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get("type") ?? undefined;
  const tag = params.get("tag") ?? undefined;
  const favorite = params.get("favorite") === "1";
  const filtered = !!(type || tag || favorite);

  const { user } = useMe();
  const { data: stats } = useStats();
  const { data: resurfaced } = useResurfaced();
  const { items, isLoading, hasMore, loadMore, isValidating, size } = useLibrary({ type, tag, favorite });
  const capture = useRef<CaptureBarHandle>(null);
  const { openPalette } = useShell();

  // A link handed over from the landing page (possibly through sign-up).
  const refresh = useRefreshLibrary();
  const savedFromParam = useRef(false);
  useEffect(() => {
    const link = params.get("save");
    if (!link || savedFromParam.current) return;
    savedFromParam.current = true;
    router.replace("/library", { scroll: false });
    api.content
      .createLink(link)
      .then(() => {
        toast.success("Saved", { description: "Reading it now. It’ll be searchable in a moment." });
        refresh();
      })
      .catch((e) => toast.error(e instanceof ApiError ? e.message : "Could not save that link"));
  }, [params, router, refresh]);

  // "Write a note" from the command palette lands here.
  useEffect(() => {
    if (params.get("capture")) {
      capture.current?.focus();
      router.replace("/library", { scroll: false });
    }
  }, [params, router]);

  // Press "c" to capture, "/" to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "c") {
        e.preventDefault();
        capture.current?.focus();
      } else if (e.key === "/") {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette]);

  const heading = favorite ? "Favorites" : type ? KIND_PLURAL[type as ContentKind] : tag ? `#${tag}` : null;
  const name = user?.displayName || user?.username;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-8 sm:px-8 lg:pt-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-fade-up">
          {heading ? (
            <>
              <p className="eyebrow">Library</p>
              <h1 className="mt-1 font-display text-4xl text-ink sm:text-5xl">{heading}</h1>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl leading-[1.05] text-ink sm:text-[64px]">
                {greeting()}
                {name ? `, ${name}` : ""}.
              </h1>
              {stats && stats.total > 0 && (
                <p className="mt-4 inline-flex border-y border-line-strong py-1.5 font-mono text-xs uppercase tracking-[0.06em] text-ink-2">
                  {compactNumber(stats.total)} {stats.total === 1 ? "item" : "items"} · {compactNumber(stats.words)} words remembered
                  {stats.thisWeek > 0 ? ` · ${stats.thisWeek} saved this week` : ""}
                </p>
              )}
            </>
          )}
        </div>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={() => router.push("/library", { scroll: false })}>
            <X className="size-3.5" /> Clear filter
          </Button>
        )}
      </div>

      {/* Capture */}
      {!filtered && (
        <div className="mt-8">
          <CaptureBar ref={capture} />
        </div>
      )}

      {/* Resurfaced */}
      {!filtered && resurfaced && resurfaced.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-baseline gap-3 border-t border-ink pt-4">
            <h2 className="flex flex-wrap items-baseline gap-x-3 text-ink">
              <span className="claim text-3xl">Worth revisiting.</span>
              <span className="claim-tail text-lg">Saved a while ago, chosen for today.</span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {resurfaced.map((item) => (
              <ItemCard key={item._id} item={item} compact />
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="mt-12 flex flex-wrap items-center pl-px">
        <FilterPill href="/library" active={!filtered}>
          All
        </FilterPill>
        {KINDS.map((k) => (
          <FilterPill key={k} href={`/library?type=${k}`} active={type === k && !tag && !favorite}>
            <KindDot kind={k} className="!bg-kind-pdf" /> {KIND_PLURAL[k]}
            {stats?.byType[k] ? <span className="font-mono text-[11px] opacity-60">{stats.byType[k]}</span> : null}
          </FilterPill>
        ))}
        <FilterPill href="/library?favorite=1" active={favorite}>
          <Star className="size-3" /> Favorites
        </FilterPill>
      </div>

      {/* Grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          filtered ? (
            <EmptyState icon={<BookOpen className="size-8" strokeWidth={1.5} />} title="Nothing here yet">
              No saved items match this filter.
            </EmptyState>
          ) : (
            <EmptyState
              icon={<BookOpen className="size-8" strokeWidth={1.5} />}
              title="Your library is empty — for now"
              action={
                <Button onClick={() => capture.current?.focus()}>Save your first link</Button>
              }
            >
              Paste a link to an article you liked, drop in a PDF, or jot down a thought. SuperBrain reads it, summarizes it, and connects it to everything else you save.
            </EmptyState>
          )
        ) : (
          <>
            <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
              {items.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button variant="secondary" onClick={loadMore} loading={isValidating && size > 1}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
