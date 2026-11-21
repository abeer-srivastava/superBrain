"use client";

import { useEffect } from "react";
import type Lenis from "lenis";

// The running instance, if any (Lenis reserves `window.lenis` for itself).
let current: Lenis | null = null;
export const activeLenis = () => current;

/**
 * Weighted wheel scrolling for long-form pages.
 *
 * Only for a mouse or trackpad (touch keeps native momentum), never when the
 * visitor prefers reduced motion, and not in Safari, whose own wheel easing
 * already does this and fights a second layer. Lenis drives the real document
 * scroll, so the keyboard, find-in-page, focus and anchors keep working.
 * Elements that scroll on their own opt out with `data-lenis-prevent`.
 */
export function SmoothScroll() {
  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const apple = navigator.vendor.startsWith("Apple");
    let lenis: Lenis | null = null;
    let cancelled = false;

    const sync = async () => {
      const want = fine.matches && !reduce.matches && !apple;
      if (want && !lenis) {
        const { default: L } = await import("lenis");
        if (cancelled || lenis) return;
        lenis = new L({
          autoRaf: true,
          smoothWheel: true,
          syncTouch: false,
          lerp: 0.12,
          // Same-page links glide; offset clears the sticky header.
          anchors: { offset: -72 },
        });
        current = lenis;
      } else if (!want && lenis) {
        lenis.destroy();
        lenis = null;
        current = null;
      }
    };

    // Keyboard users tabbing into a footer band that's still tucked under the
    // page (see .tide-band) get it scrolled fully into view.
    const onFocus = (e: FocusEvent) => {
      const band = (e.target as HTMLElement | null)?.closest?.(".tide-band");
      if (!band) return;
      const sheet = band.previousElementSibling;
      if (sheet && sheet.getBoundingClientRect().bottom > band.getBoundingClientRect().top + 1) {
        const top = document.documentElement.scrollHeight - innerHeight;
        if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
        else window.scrollTo({ top });
      }
    };
    addEventListener("focusin", onFocus);

    void sync();
    fine.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      cancelled = true;
      removeEventListener("focusin", onFocus);
      fine.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
      lenis?.destroy();
      current = null;
    };
  }, []);

  return null;
}

/** Scroll to an element, through Lenis when it's running. */
export function scrollToElement(el: HTMLElement, offset = -72) {
  if (current) {
    current.scrollTo(el, { offset });
    return;
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce ? "auto" : "smooth" });
}
