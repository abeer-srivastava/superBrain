import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,600px)]">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <Link href="/" className="self-start" aria-label="SuperBrain home">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px] animate-fade-up">{children}</div>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">Private by default · Export anytime</p>
      </div>
      <aside className="band-invert relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="dither pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-[0.18] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <p className="eyebrow relative">— SuperBrain</p>
        <blockquote className="relative">
          <p className="text-[44px] font-bold leading-[1.02] tracking-[-0.04em]">
            “The palest ink is better than the <span className="text-accent">best memory</span>.”
          </p>
          <footer className="eyebrow mt-6">Chinese proverb</footer>
          <p className="mt-12 max-w-sm border-t border-line pt-5 text-[15px] leading-relaxed text-ink-2">
            SuperBrain keeps the ink, and gives it a memory: everything you save is read, connected, and ready to answer you, with citations.
          </p>
        </blockquote>
      </aside>
    </div>
  );
}
