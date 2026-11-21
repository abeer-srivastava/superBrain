import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { PrintIn } from "@/components/motion/print-in";
import type { PublicBrain } from "@/lib/types";

const BACKEND = (process.env.BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");

async function load(hash: string): Promise<PublicBrain | null> {
  try {
    const res = await fetch(`${BACKEND}/api/v1/public/${encodeURIComponent(hash)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as PublicBrain;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ hash: string }> }): Promise<Metadata> {
  const data = await load((await params).hash);
  if (!data) return { title: "Not found" };
  const name = data.owner.displayName || data.owner.username;
  return {
    title: `${name}’s reading list`,
    description: `${data.items.length} things ${name} found worth saving, curated with SuperBrain.`,
    robots: { index: false },
  };
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default async function SharedPage({ params }: { params: Promise<{ hash: string }> }) {
  const data = await load((await params).hash);
  if (!data) notFound();
  const name = data.owner.displayName || data.owner.username;

  const groups = new Map<string, PublicBrain["items"]>();
  for (const item of data.items) {
    const key = new Date(item.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" });
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const tags = [...new Set(data.items.flatMap((i) => i.tags))].slice(0, 16);

  return (
    <div className="min-h-dvh">
      <SmoothScroll />
      <PrintIn />
      <div className="tide-sheet">
      <header className="sticky top-0 z-30 border-b border-line-strong bg-paper/95 backdrop-blur-sm"><div className="mx-auto flex h-16 max-w-[900px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="SuperBrain">
          <Logo />
        </Link>
        <Link href="/signup" className="btn-slab flex h-10 items-center px-5 text-sm font-semibold">
          Start your own
        </Link>
      </div></header>

      <main className="mx-auto max-w-[900px] px-5 pb-24 pt-14 sm:px-8">
        <p className="eyebrow">— Reading list</p>
        <h1 className="mt-4 font-display text-[52px] leading-[1] text-ink sm:text-[76px]">
          {name}’s <span className="text-accent">library</span>.
        </h1>
        <p className="mt-6 border-t border-ink pt-4 font-mono text-xs uppercase tracking-[0.06em] text-ink-2">
          {data.items.length} {data.items.length === 1 ? "thing" : "things"} worth reading, saved with SuperBrain.
        </p>
        {tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="border border-line-strong px-2 py-0.5 font-mono text-[11.5px] text-ink-2">
                #{t}
              </span>
            ))}
          </div>
        )}

        {data.items.length === 0 ? (
          <p className="mt-16 border border-dashed border-line-strong p-10 text-center text-ink-3">Nothing has been shared here yet.</p>
        ) : (
          [...groups.entries()].map(([month, items]) => (
            <section key={month} className="mt-14">
              <h2 className="eyebrow sticky top-16 z-10 border-b border-ink bg-paper py-2 text-ink">{month}</h2>
              <ul data-reveal="stagger" className="divide-y divide-line border-b border-line">
                {items.map((item) => (
                  <li key={item.id}>
                    <a href={item.originalLink} target="_blank" rel="noopener noreferrer nofollow" className="group flex gap-5 py-6">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-ink-3">{item.siteName || host(item.originalLink)}</p>
                        <h3 className="mt-1 flex items-start gap-1.5 font-display text-[24px] leading-snug text-ink group-hover:text-accent">
                          {item.title || host(item.originalLink)}
                          <ArrowUpRight className="mt-1.5 size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                        </h3>
                        {item.summary && <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink-2">{item.summary}</p>}
                        {item.tags.length > 0 && <p className="mt-2 text-xs text-ink-3">{item.tags.slice(0, 5).map((t) => `#${t}`).join("  ")}</p>}
                      </div>
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="hidden h-24 w-36 shrink-0 border border-ink object-cover grayscale transition-[filter] duration-300 group-hover:grayscale-0 sm:block" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
      </div>

      <footer className="tide-band band-invert">
        <div className="mx-auto flex min-h-[60svh] max-w-[900px] flex-col justify-center px-5 py-20 sm:px-8">
          <p className="eyebrow">— Curated with SuperBrain</p>
          <p className="mt-5 text-[44px] font-bold leading-[1] tracking-[-0.045em] sm:text-[64px]">
            Keep your own <span className="text-accent">library</span>.
          </p>
          <p className="mt-5 max-w-[44ch] text-ink-2">Save what you read. Ask it questions. Get answers cited from your own sources.</p>
          <Link href="/signup" className="mt-9 self-start border border-ink px-6 py-3 text-[15px] font-semibold text-ink wipe">
            Start remembering
          </Link>
        </div>
      </footer>
    </div>
  );
}
