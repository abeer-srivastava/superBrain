"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RetroGrid } from "@/components/RetroGrid";
import {
  Brain,
  Search,
  Zap,
  FileText,
  MessageSquare,
  Share2,
  ArrowRight,
  Shield,
  Monitor,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      id: "01",
      title: "Smart Ingestion",
      desc: "Paste any link, upload a PDF, or drop an image. Our engine parses it instantly.",
      icon: Zap,
      color: "bg-main text-main-foreground",
      border: "border-border",
    },
    {
      id: "02",
      title: "Semantic Search",
      desc: "Search by meaning, not keywords. Our AI understands the context of your data.",
      icon: Search,
      color: "bg-accent-green text-black",
      border: "border-border",
    },
    {
      id: "03",
      title: "Easy Sharing",
      desc: "Toggle your brain to public and share your curated knowledge via link or QR.",
      icon: Share2,
      color: "bg-accent-yellow text-black",
      border: "border-border",
    },
    {
      id: "04",
      title: "PDF & OCR",
      desc: "Full text extraction from documents and images using local processing.",
      icon: FileText,
      color: "bg-accent-orange text-white",
      border: "border-border",
    },
    {
      id: "05",
      title: "Privacy First",
      desc: "Your data is yours. Isolated vector storage and secure authentication.",
      icon: Shield,
      color: "bg-accent-cyan text-white",
      border: "border-border",
    },
    {
      id: "06",
      title: "Ask Your Brain",
      desc: "Chat with your data. Get answers grounded only in the sources you've saved.",
      icon: MessageSquare,
      color: "bg-accent-violet text-white",
      border: "border-border",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-base text-foreground">
      {/* Top Nav */}
      <nav className="sticky top-0 z-[100] border-b-[3px] border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="bg-chrome flex items-center rounded-[var(--radius-base)] border-[3px] border-border p-2 text-foreground shadow-[var(--shadow)]">
              <Brain className="h-6 w-6" />
            </div>
            <span className="font-display text-2xl uppercase tracking-tighter text-foreground">
              SuperBrain
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link href="/auth/signin">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b-[3px] border-border bg-background pb-32 pt-20">
        <RetroGrid />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="inline-block border-[3px] border-border bg-accent-yellow px-4 py-2 font-display text-xs uppercase tracking-wide text-black shadow-[var(--shadow)]">
              V1.0 is Live
            </div>
            <h1 className="font-display text-5xl uppercase leading-[0.9] tracking-tighter text-foreground sm:text-7xl md:text-8xl">
              Dive into your{" "}
              <span className="bg-main px-2 text-main-foreground">Second Brain</span>
            </h1>
            <p className="max-w-xl font-base text-lg font-semibold text-foreground/70">
              SuperBrain - Where your digital life becomes searchable. Store links, parse
              PDFs, and ask AI questions about your own data.
            </p>
            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Link href="/auth/signup">
                <Button className="h-16 px-10 text-xl shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)]">
                  Build Your Brain <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, rotate: 5, scale: 0.9 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            className="relative"
          >
            <div className="rounded-[var(--radius-lg)] border-[3px] border-border bg-accent-cyan p-2 shadow-[var(--shadow-xl)]">
              <div className="space-y-4 rounded-[var(--radius-base)] border-[3px] border-border bg-background p-6">
                <div className="mb-4 flex items-center gap-2 border-b-[3px] border-border pb-2">
                  <Search className="h-5 w-5" />
                  <span className="font-display text-sm uppercase">Ask Your Brain</span>
                </div>
                <div className="rounded-[var(--radius-base)] border-[3px] border-border bg-chrome/40 p-4 font-base italic">
                  &quot;What were my notes on vector databases from that blog post?&quot;
                </div>
                <div className="rounded-[var(--radius-base)] border-[3px] border-border bg-main p-4 text-main-foreground shadow-[var(--shadow)]">
                  <p className="font-base font-bold">
                    AI: Vector databases store data as high-dimensional points. According to
                    the article you saved yesterday, they use Cosine Similarity for retrieval...
                  </p>
                </div>
                <div className="flex justify-end">
                  <div className="rounded-[var(--radius-base)] border-2 border-border bg-accent-yellow px-3 py-1 text-[10px] font-display uppercase text-black shadow-[var(--shadow-sm)]">
                    Source: pincone.io/blog
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -top-6 rotate-12 rounded-[var(--radius-base)] border-[3px] border-border bg-accent-cyan px-4 py-2 font-display text-sm uppercase tracking-wide text-white shadow-[var(--shadow)]">
              AI Powered!
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works Grid */}
      <section className="border-b-[3px] border-border bg-background py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-20 space-y-4 text-center">
            <h2 className="font-display text-5xl uppercase tracking-tighter text-foreground">
              How It Works
            </h2>
            <div className="mx-auto h-2 w-32 border-2 border-border bg-main"></div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.id}
                  className="group rounded-[var(--radius-lg)] border-[3px] border-border bg-secondary-background p-8 shadow-[var(--shadow)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <div
                      className={`rounded-[var(--radius-base)] border-[3px] border-border p-4 shadow-[var(--shadow)] ${f.color}`}
                    >
                      <Icon className="h-8 w-8" />
                    </div>
                    <span className="font-display text-4xl text-foreground/10">{f.id}</span>
                  </div>
                  <h3 className="mb-4 font-display text-2xl uppercase text-foreground">{f.title}</h3>
                  <p className="font-base font-semibold text-foreground/60">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Knowledge Engine Section */}
      <section className="border-b-[3px] border-border bg-background py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-20 px-4 lg:grid-cols-2">
          <div className="space-y-8">
            <h2 className="font-display text-5xl uppercase leading-none tracking-tighter text-foreground sm:text-6xl">
              The Knowledge <br /> <span className="text-accent-pink">Engine</span>
            </h2>
            <p className="font-base text-lg font-semibold text-foreground/70">
              Control exactly how your knowledge is processed. SuperBrain uses local embedding
              models to ensure your data stays private while remaining searchable.
            </p>
            <div className="space-y-4">
              {[
                "Local Embedding Processing",
                "Automated Link Scraping",
                "Semantic Vector Retrieval",
                "Grounded AI Responses",
              ].map((item) => (
                <div key={item} className="flex items-center gap-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-base)] border-2 border-border bg-accent-green text-black shadow-[var(--shadow-sm)]">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="font-display text-sm uppercase text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: "URL / File Arrives", color: "bg-background text-foreground" },
              { label: "Auto Extraction & Chunking", color: "bg-accent-green text-black" },
              { label: "Vector Embedding Stored", color: "bg-accent-cyan text-white" },
              { label: "AI Answers Ready", color: "bg-main text-main-foreground" },
            ].map((step, i) => (
              <div key={step.label} className="space-y-4">
                <div
                  className={`rounded-[var(--radius-base)] border-[3px] border-border p-6 font-display uppercase tracking-wide shadow-[var(--shadow)] ${step.color}`}
                >
                  {i === 0 ? <Monitor className="mr-3 inline h-5 w-5" /> : null}
                  {step.label}
                </div>
                {i < 3 && (
                  <div className="flex justify-center py-1">
                    <ArrowRight className="h-6 w-6 rotate-90 text-foreground/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-b-[3px] border-border bg-accent-yellow py-32">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="rounded-[var(--radius-lg)] border-[3px] border-border bg-secondary-background p-12 text-foreground shadow-[var(--shadow-xl)]">
            <h2 className="mb-6 font-display text-5xl uppercase tracking-tighter sm:text-6xl">
              Ready to dive in?
            </h2>
            <p className="mb-10 font-base text-lg font-semibold text-foreground/70">
              Join 5,000+ developers and researchers building their second brain.
            </p>
            <div className="flex flex-col justify-center gap-6 sm:flex-row">
              <Link href="/auth/signup">
                <Button className="h-16 px-12 text-xl shadow-[var(--shadow-lg)]">Claim Your Brain</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-12 text-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="bg-chrome flex items-center rounded-[var(--radius-base)] border-2 border-border p-2 text-foreground">
              <Brain className="h-5 w-5" />
            </div>
            <span className="font-display text-xl uppercase tracking-tighter text-foreground">
              SuperBrain
            </span>
          </div>
          <p className="font-base text-sm font-bold text-foreground/50">
            © 2026 SuperBrain. All rights reserved.
          </p>
          <div className="flex gap-8 font-display text-sm uppercase">
            <a href="#" className="text-foreground/70 hover:text-main">Twitter</a>
            <a href="#" className="text-foreground/70 hover:text-main">Github</a>
            <a href="#" className="text-foreground/70 hover:text-main">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
