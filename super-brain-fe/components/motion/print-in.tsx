"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll-triggered "print-in" for elements marked `data-reveal`:
 *   print   → stepped left-to-right wipe, like a line going through a printer
 *   rise    → stepped fade
 *   words   → each `.rw` child steps in, one word after another
 *   stagger → each direct child prints in turn
 *
 * Content is never hidden by default. Only elements that start below the fold
 * are armed (hidden) after hydration, so server HTML, no-JS visitors and
 * anything already on screen stay put. Reduced motion skips it entirely.
 */
export function PrintIn() {
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Not an IntersectionObserver: Chrome treats a clip-path on the target as
    // clipping its visibility, so a fully clipped element would never report
    // itself as entering. A rect check per frame over the handful of armed
    // elements is cheap and reads the real layout box.
    let armed: HTMLElement[] = [];
    let frame = 0;

    const check = () => {
      frame = 0;
      const line = window.innerHeight * 0.9;
      armed = armed.filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < line && r.bottom > 0) {
          el.dataset.state = "shown";
          return false;
        }
        if (r.bottom <= 0) {
          // Jumped past it (anchor, drag): show without making anyone wait.
          el.dataset.state = "shown";
          return false;
        }
        return true;
      });
      if (!armed.length) removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };

    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-state])")];
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) continue; // already visible: leave it alone
      if (el.dataset.reveal === "stagger") {
        [...el.children].forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(Math.min(i, 8))));
      }
      el.dataset.state = "armed";
      armed.push(el);
    }
    if (armed.length) addEventListener("scroll", onScroll, { passive: true });

    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      // Never leave anything hidden when the page changes underneath us.
      for (const el of armed) el.dataset.state = "shown";
    };
  }, [pathname]);

  return null;
}
