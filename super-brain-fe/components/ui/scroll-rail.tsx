"use client";

import { useEffect, useRef, useState } from "react";
import { activeLenis, scrollToElement } from "@/components/motion/smooth-scroll";
import { cn } from "@/lib/utils";

export interface RailSection {
  id: string;
  label: string;
}

const HEADER = 72; // sticky header + breathing room
const MIN_THUMB = 28;

/**
 * Section-mapped scrollbar. Replaces the native scrollbar on desktop with a
 * hairline track where every section has a mark at its true position in the
 * document, so the scrollbar doubles as a table of contents. The thumb shows
 * the viewport; a plate beside it names the section you are in and re-prints
 * when that changes. Click a mark to jump, or drag anywhere on the track.
 *
 * Desktop with a fine pointer only; touch keeps the native scrollbar. Hidden
 * from assistive tech: every section keeps a real heading and the page still
 * scrolls natively.
 */
export function ScrollRail({ sections, className }: { sections: RailSection[]; className?: string }) {
  const nav = useRef<HTMLElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const plate = useRef<HTMLSpanElement>(null);
  const [marks, setMarks] = useState<number[]>([]);
  const [active, setActive] = useState(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    const on = () => setEnabled(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.dataset.scrollMap = "";

    let trackH = 0;
    let thumbH = MIN_THUMB;
    let max = 1;
    let points: number[] = []; // scroll offsets where each section begins
    let frame = 0;

    const els = () => sections.map((s) => document.getElementById(s.id));

    const measure = () => {
      const n = nav.current;
      if (!n) return;
      trackH = n.clientHeight;
      max = Math.max(1, root.scrollHeight - innerHeight);
      thumbH = Math.max(MIN_THUMB, Math.round((innerHeight / root.scrollHeight) * trackH));
      // A section marked data-map-end (e.g. a sticky footer band, whose box moves
      // while it's being uncovered) maps to the very end of the page.
      points = els().map((el) =>
        !el ? 0 : "mapEnd" in el.dataset ? max : Math.min(max, Math.max(0, el.getBoundingClientRect().top + scrollY - HEADER)),
      );
      setMarks(points.map((p) => Math.round((p / max) * (trackH - thumbH) + thumbH / 2)));
      paint();
    };

    const paint = () => {
      frame = 0;
      const p = Math.min(1, Math.max(0, scrollY / max));
      const top = p * (trackH - thumbH);
      if (thumb.current) {
        thumb.current.style.transform = `translateY(${top}px)`;
        thumb.current.style.height = `${thumbH}px`;
      }
      if (plate.current) plate.current.style.transform = `translateY(${top + thumbH / 2}px)`;
      // Over an inverted footer band, invert the map too. Measured from the
      // sheet above it: a sticky band's own box doesn't move while uncovered.
      const sheet = document.querySelector(".tide-sheet");
      const plateY = (nav.current?.getBoundingClientRect().top ?? 0) + top + thumbH / 2;
      nav.current?.toggleAttribute("data-inverted", !!sheet && sheet.getBoundingClientRect().bottom < plateY);
      // A section is current once its start crosses the top third of the
      // viewport; the last one also counts at the very bottom, however short.
      const reading = scrollY + innerHeight / 3 - HEADER;
      let i = 0;
      for (let k = 0; k < points.length; k++) if (reading >= points[k] || (k === points.length - 1 && scrollY >= max - 2)) i = k;
      setActive(i);
    };

    // The plate only shows while scrolling, so it never sits over content.
    let idle = 0;
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
      nav.current?.setAttribute("data-scrolling", "");
      clearTimeout(idle);
      idle = window.setTimeout(() => nav.current?.removeAttribute("data-scrolling"), 900);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", measure);
    return () => {
      delete root.dataset.scrollMap;
      ro.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", measure);
      cancelAnimationFrame(frame);
      clearTimeout(idle);
    };
  }, [enabled, sections]);

  // Drag (or click) the track to scroll proportionally, like a native bar.
  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const n = nav.current;
    if (!n) return;
    e.preventDefault();
    n.setPointerCapture(e.pointerId);
    const root = document.documentElement;
    const to = (y: number) => {
      const r = n.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (y - r.top) / r.height));
      const top = p * (root.scrollHeight - innerHeight);
      const lenis = activeLenis();
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo({ top, behavior: "auto" });
    };
    to(e.clientY);
    const move = (ev: PointerEvent) => to(ev.clientY);
    const up = () => {
      n.removeEventListener("pointermove", move);
      n.removeEventListener("pointerup", up);
      n.removeEventListener("pointercancel", up);
    };
    n.addEventListener("pointermove", move);
    n.addEventListener("pointerup", up);
    n.addEventListener("pointercancel", up);
  };

  if (!enabled) return null;
  const current = sections[active];

  return (
    <nav
      ref={nav}
      aria-hidden
      onPointerDown={onPointerDown}
      className={cn("scroll-map group fixed bottom-4 right-0 top-[84px] z-30 w-5 cursor-ns-resize touch-none select-none", className)}
    >
      <span className="absolute inset-y-0 right-[9px] w-px bg-line-strong" />
      <span ref={thumb} className="absolute right-[8px] top-0 w-[3px] bg-ink" style={{ height: MIN_THUMB }} />

      {sections.map((s, i) => (
        <button
          key={s.id}
          type="button"
          tabIndex={-1}
          onClick={() => {
            const el = document.getElementById(s.id);
            if (el) scrollToElement(el, -HEADER);
          }}
          style={{ top: marks[i] ?? 0 }}
          className="absolute right-[5px] flex -translate-y-1/2 items-center"
        >
          <span className="pointer-events-none absolute right-5 whitespace-nowrap border border-ink bg-paper px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {String(i + 1).padStart(2, "0")} {s.label}
          </span>
          <span className={cn("block size-[9px] border border-ink transition-colors duration-200", i <= active ? "bg-ink" : "bg-paper")} />
        </button>
      ))}

      {/* Section plate rides with the thumb; keyed so it re-prints on change. */}
      <span ref={plate} className="scroll-plate-rider pointer-events-none absolute right-6 top-0">
        <span key={current?.id} className="scroll-plate block -translate-y-1/2 whitespace-nowrap bg-ink px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-paper">
          {String(active + 1).padStart(2, "0")} / {current?.label}
        </span>
      </span>
    </nav>
  );
}
