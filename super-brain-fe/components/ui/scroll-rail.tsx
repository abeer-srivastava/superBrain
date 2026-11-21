"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface RailSection {
  id: string;
  label: string;
}

/**
 * "On this page" rail pinned to the right edge. One tick per section; the
 * section in view is filled in ink and labelled. Hover reveals every label.
 * Desktop only. Purely navigational, so hidden from assistive tech (each
 * section keeps its own heading).
 */
export function ScrollRail({ sections, className }: { sections: RailSection[]; className?: string }) {
  const [active, setActive] = useState(sections[0]?.id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [sections]);

  return (
    <nav aria-hidden className={cn("group fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 pr-3 lg:block", className)}>
      <div className="relative flex flex-col items-end gap-3 py-2">
        <span className="absolute right-[3px] top-0 h-full w-px bg-line-strong" />
        <span className="absolute right-[3px] top-0 w-px bg-ink transition-[height] duration-150" style={{ height: `${progress * 100}%` }} />
        {sections.map((s, i) => {
          const on = s.id === active;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              tabIndex={-1}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="relative flex items-center gap-2.5"
            >
              <span
                className={cn(
                  "whitespace-nowrap bg-paper px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-[opacity,transform] duration-300 ease-[cubic-bezier(.35,0,.15,1)]",
                  on ? "translate-x-0 text-ink opacity-100" : "translate-x-2 text-ink-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                )}
              >
                {String(i + 1).padStart(2, "0")} {s.label}
              </span>
              <span className={cn("relative size-[7px] border border-ink transition-colors", on ? "bg-ink" : "bg-paper")} />
            </a>
          );
        })}
      </div>
    </nav>
  );
}
