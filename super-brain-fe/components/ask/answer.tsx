"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "@/lib/types";
import { hostname, KIND_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { KindIcon } from "@/components/ui/misc";

/** Turn `[1]`, `[1][2]`, `[1, 3]` into citation links the renderer understands. */
export function linkCitations(text: string, max: number): string {
  return text.replace(/\[(\d+(?:\s*,\s*\d+)*)\](?!\()/g, (whole, nums: string) => {
    const ns = nums.split(/\s*,\s*/).map(Number).filter((n) => n >= 1 && n <= max);
    if (!ns.length) return whole;
    return ns.map((n) => `[${n}](#cite-${n})`).join("");
  });
}

function Citation({ n, source }: { n: number; source?: Source }) {
  if (!source) return <sup className="text-ink-3">[{n}]</sup>;
  return (
    <span className="group relative inline-block align-baseline">
      <Link
        href={`/item/${source.contentId}`}
        className="mx-0.5 inline-flex h-[18px] min-w-[18px] -translate-y-[2px] items-center justify-center bg-highlight px-1 font-mono text-[10.5px] font-semibold text-highlight-ink no-underline transition-transform hover:scale-110"
        aria-label={`Source ${n}: ${source.title}`}
      >
        {n}
      </Link>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 border border-ink bg-paper p-3 text-left opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        <span className="flex items-center gap-1.5 text-[11px] text-ink-3">
          <KindIcon kind={source.type} className="size-3" /> {source.siteName || hostname(source.url) || KIND_LABEL[source.type]}
        </span>
        <span className="mt-1 block text-[14px] font-semibold leading-snug text-ink">{source.title}</span>
        {source.snippet && <span className="mt-1.5 line-clamp-3 block text-xs leading-snug text-ink-2">{source.snippet}</span>}
      </span>
    </span>
  );
}

export function AnswerMarkdown({ text, sources, streaming }: { text: string; sources: Source[]; streaming?: boolean }) {
  const byN = new Map(sources.map((s) => [s.n, s]));
  return (
    <div className={cn("prose-sb", streaming && "[&>*:last-child]:after:ml-0.5 [&>*:last-child]:after:inline-block [&>*:last-child]:after:h-[1.05em] [&>*:last-child]:after:w-[2px] [&>*:last-child]:after:translate-y-[3px] [&>*:last-child]:after:bg-accent [&>*:last-child]:after:content-[''] [&>*:last-child]:after:animate-blink")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const m = href?.match(/^#cite-(\d+)$/);
            if (m) return <Citation n={Number(m[1])} source={byN.get(Number(m[1]))} />;
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          img: () => null,
        }}
      >
        {linkCitations(text, sources.length) || (streaming ? "​" : "")}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Sources as a pile of sheets (the reference's "result pile"): stacked and
 * offset, they fan out into a row on hover or keyboard focus.
 */
export function SourceList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <div className="group/pile -mx-1 flex snap-x overflow-x-auto px-1 pb-2 pt-1 scrollbar-thin">
      {sources.map((s, i) => (
        <Link
          key={s.n}
          href={`/item/${s.contentId}`}
          style={{ zIndex: sources.length - i }}
          className={cn(
            "relative flex w-56 shrink-0 snap-start flex-col border border-ink bg-paper p-3 transition-[margin,background-color] duration-[450ms] ease-[cubic-bezier(.35,0,.15,1)] hover:bg-paper-2 focus-visible:bg-paper-2",
            i > 0 && "-ml-48 group-hover/pile:ml-2 group-focus-within/pile:ml-2",
          )}
        >
          {/* Number sits in the strip that stays visible while the pile is stacked. */}
          <span className="flex items-center gap-1.5 pr-6 font-mono text-[10.5px] uppercase tracking-[0.04em] text-ink-3">
            <KindIcon kind={s.type} className="size-3 shrink-0" />
            <span className="truncate">{s.siteName || hostname(s.url) || KIND_LABEL[s.type]}</span>
          </span>
          <span className="absolute right-2 top-2.5 flex size-[18px] items-center justify-center bg-highlight font-mono text-[10.5px] font-medium text-highlight-ink">{s.n}</span>
          <span className="mt-2 line-clamp-2 text-[13.5px] font-semibold leading-snug tracking-[-0.01em] text-ink">{s.title}</span>
        </Link>
      ))}
    </div>
  );
}
