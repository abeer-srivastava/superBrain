"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, RotateCw, Star } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useRefreshLibrary } from "@/lib/hooks";
import { itemTitle, readingTime, relativeTime, sourceLabel } from "@/lib/format";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { KindIcon } from "@/components/ui/misc";

function Thumb({ item }: { item: Item }) {
  const [failed, setFailed] = useState(false);
  const src = item.type === "image" && item.status !== "failed" ? api.content.fileUrl(item._id) : item.imageUrl;
  if (!src || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("w-full border-b border-line object-cover", item.type === "image" ? "max-h-72" : "aspect-[2/1]")}
    />
  );
}

export function ItemCard({ item, compact }: { item: Item; compact?: boolean }) {
  const refresh = useRefreshLibrary();
  const [retrying, setRetrying] = useState(false);
  const processing = item.status === "processing";
  const failed = item.status === "failed";
  const preview = item.type === "note" ? item.summary || "" : item.summary;

  const retry = async (e: React.MouseEvent) => {
    e.preventDefault();
    setRetrying(true);
    try {
      await api.content.reprocess(item._id);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not retry");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Link
      href={`/item/${item._id}`}
      className={cn(
        "group relative block break-inside-avoid overflow-hidden border border-line-strong bg-card transition-colors duration-200",
        "hover:border-ink hover:outline hover:outline-1 hover:outline-ink",
        compact ? "mb-0" : "mb-4",
      )}
    >
      {!compact && (item.imageUrl || item.type === "image") && <Thumb item={item} />}

      <div className="p-4">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-3">
          <KindIcon kind={item.type} />
          <span className="truncate">{sourceLabel(item) || item.type}</span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {item.favorite && <Star className="size-3.5 fill-accent text-accent" aria-label="Favorite" />}
            <span>{relativeTime(item.createdAt)}</span>
          </span>
        </div>

        <h3 className={cn("mt-2.5 font-display leading-[1.2] tracking-[-0.02em] text-ink", compact ? "text-lg line-clamp-2" : "text-[20px] line-clamp-3")}>{itemTitle(item)}</h3>

        {processing ? (
          <div className="mt-3" aria-label="Processing">
            {preview ? <p className="line-clamp-3 text-[14px] leading-relaxed text-ink-2">{preview}</p> : <div className="space-y-2"><div className="h-2.5 w-full skeleton" /><div className="h-2.5 w-4/5 skeleton" /></div>}
            <p className="pt-2 text-xs text-ink-3">
              {item.type === "image" ? "Looking at the image…" : item.type === "note" ? "Indexing…" : "Finishing summary and search…"}
            </p>
          </div>
        ) : failed ? (
          <div className="mt-3 flex items-start gap-2 bg-danger-soft px-3 py-2 text-[13px] text-danger">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span className="flex-1">{item.error || "Could not process this item."}</span>
            <button onClick={retry} disabled={retrying} className="flex shrink-0 items-center gap-1 font-medium hover:underline disabled:opacity-50">
              <RotateCw className={cn("size-3", retrying && "animate-spin")} /> Retry
            </button>
          </div>
        ) : (
          preview && !compact && <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-ink-2">{preview}</p>
        )}

        {!compact && (item.tags.length > 0 || item.wordCount) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-line pt-2.5 font-mono text-[11px] text-ink-3">
            {item.tags.slice(0, 4).map((t) => (
              <span key={t}>#{t}</span>
            ))}
            {item.type !== "note" && item.type !== "image" && item.wordCount ? <span className="ml-auto font-mono text-[11px]">{readingTime(item.wordCount)}</span> : null}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="mb-4 break-inside-avoid border border-line-strong bg-card p-4">
      <div className="h-3 w-24 skeleton" />
      <div className="mt-3 h-5 w-full skeleton" />
      <div className="mt-2 h-5 w-2/3 skeleton" />
      <div className="mt-4 h-3 w-full skeleton" />
      <div className="mt-2 h-3 w-5/6 skeleton" />
    </div>
  );
}
