import Link from "next/link";
import { cookies } from "next/headers";
import { Logo } from "@/components/brand/logo";
import { HeroField } from "@/components/brand/hero-field";
import { ScrollRail } from "@/components/ui/scroll-rail";

const SECTIONS = [
  { id: "top", label: "Start" },
  { id: "product", label: "Product" },
  { id: "how", label: "How it works" },
  { id: "trust", label: "Privacy" },
  { id: "start", label: "Begin" },
];

function SectionHead({ claim, tail, label }: { claim: string; tail: string; label: string }) {
  return (
    <header className="border-t border-ink pt-5">
      <p className="eyebrow">— {label}</p>
      <h2 className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <span className="claim text-[40px] leading-[1.05] text-ink sm:text-[56px]">{claim}</span>
        <span className="claim-tail text-xl sm:text-2xl">{tail}</span>
      </h2>
    </header>
  );
}

function Cite({ n }: { n: number }) {
  return (
    <span className="mx-0.5 inline-flex h-[17px] min-w-[17px] -translate-y-[2px] items-center justify-center bg-highlight px-1 font-mono text-[10px] font-medium text-highlight-ink">
      {n}
    </span>
  );
}

/** A still life of the product: a pile of saved sheets and a cited answer. */
function ProductStill() {
  const sheets = [
    { kind: "LINK", site: "paulgraham.com", title: "How to Do Great Work", when: "3 WEEKS AGO" },
    { kind: "NOTE", site: "Note", title: "Pick problems I can’t stop thinking about", when: "YESTERDAY" },
    { kind: "PDF", site: "hamming-talk.pdf", title: "You and Your Research", when: "2021" },
  ];
  return (
    <div className="grid gap-px border border-ink bg-ink lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" aria-hidden>
      <div className="relative bg-paper-2 p-6 sm:p-8">
        <p className="eyebrow">Saved · 3 of 128</p>
        <div className="relative mt-6 h-[300px]">
          {sheets.map((s, i) => (
            <div key={s.title} className="absolute w-[86%] border border-ink bg-paper p-4" style={{ top: i * 74, left: i * 18, zIndex: i }}>
              <div className="flex items-center justify-between font-mono text-[10.5px] tracking-[0.04em] text-ink-3">
                <span>
                  {s.kind} · {s.site}
                </span>
                <span>{s.when}</span>
              </div>
              <p className="mt-2 text-[17px] font-bold leading-snug tracking-[-0.02em] text-ink">{s.title}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-paper p-6 sm:p-8">
        <p className="eyebrow">Ask</p>
        <p className="mt-4 text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-ink">What have I saved about choosing what to work on?</p>
        <div className="mt-5 flex flex-wrap gap-px border border-line-strong bg-line-strong">
          {["How to Do Great Work", "Pick problems I can’t…", "You and Your Research"].map((t, i) => (
            <span key={t} className="flex min-w-0 flex-1 items-center gap-2 bg-paper px-2.5 py-2 text-[12px] text-ink-2">
              <span className="flex size-4 shrink-0 items-center justify-center bg-highlight font-mono text-[10px] text-highlight-ink">{i + 1}</span>
              <span className="truncate">{t}</span>
            </span>
          ))}
        </div>
        <p className="mt-5 text-[16px] leading-relaxed text-ink">
          Follow what you’re <span className="mark">excessively curious</span> about
          <Cite n={1} />, and favour problems that keep pulling you back when no one is watching
          <Cite n={2} />. Work on the important problems in your field, not just the comfortable ones
          <Cite n={3} />.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
          <span>Read 3 sources</span>
          <span>Cited 3</span>
          <span className="text-accent">Invented 0</span>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { title: "Capture", q: "Saw something worth keeping?", body: "Paste a link, drop a PDF, add a screenshot, or click the bookmarklet on any page. One box takes everything, and #tags work inline." },
  { title: "Connect", q: "How does it fit with what you know?", body: "Every item is read, summarized and tagged, then linked to related things you saved weeks or years ago." },
  { title: "Recall", q: "Need it again?", body: "Search by meaning or exact words, ask questions in plain language, and get answers cited back to your own sources." },
  { title: "Resurface", q: "Forgot you had it?", body: "Each day a few older saves come back to you, so your library compounds instead of collecting dust." },
];

const PRIVACY: [string, boolean][] = [
  ["Your notes", false],
  ["Uploaded PDFs and images", false],
  ["Full saved text", false],
  ["Your annotations", false],
  ["Conversations with Ask", false],
  ["Web links: title, summary, tags", true],
];

function Header({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line-strong bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-10">
        <Link href="/" aria-label="SuperBrain home">
          <Logo />
        </Link>
        <nav className="flex items-center text-sm">
          <a href="#how" className="wipe hidden px-3 py-2 text-ink sm:block">
            How it works
          </a>
          <a href="#trust" className="wipe hidden px-3 py-2 text-ink sm:block">
            Privacy
          </a>
          {signedIn ? (
            <Link href="/library" className="btn-slab ml-3 flex h-10 items-center px-5 font-semibold">
              Open library
            </Link>
          ) : (
            <>
              <Link href="/signin" className="wipe px-3 py-2 text-ink">
                Sign in
              </Link>
              <Link href="/signup" className="btn-slab ml-3 flex h-10 items-center px-5 font-semibold">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default async function Landing() {
  const signedIn = (await cookies()).has("sb_session");

  return (
    <div className="min-h-dvh overflow-x-clip">
      <Header signedIn={signedIn} />
      <ScrollRail sections={SECTIONS} />

      <main className="mx-auto max-w-[1240px] px-5 sm:px-10">
        <section id="top" className="scroll-mt-20 pb-24 pt-16 sm:pt-28">
          <p className="eyebrow animate-fade-up">— A commonplace book with perfect recall</p>
          <h1 className="mt-6 max-w-[15ch] text-[52px] font-bold leading-[0.98] tracking-[-0.045em] text-ink animate-fade-up sm:text-[88px] lg:text-[104px]">
            Remember <span className="text-accent">everything</span> you read.
          </h1>
          <div className="mt-10 grid gap-10 border-t border-ink pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:items-start">
            <p className="max-w-[46ch] text-lg leading-relaxed text-ink-2">
              Save links, PDFs, notes and screenshots. SuperBrain reads them, connects them, and answers your questions with citations from your own library.
            </p>
            <HeroField signedIn={signedIn} />
          </div>
        </section>
      </main>

      <div className="border-y border-ink">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-x-8 gap-y-2 px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-ink sm:px-10">
          <span>Private by default</span>
          <span>Cited, never invented</span>
          <span>Search by meaning and words</span>
          <span>Export anytime</span>
        </div>
      </div>

      <main className="mx-auto max-w-[1240px] px-5 sm:px-10">
        <section id="product" className="scroll-mt-20 py-24 sm:py-32">
          <SectionHead label="What you get" claim="Answers you can check." tail="Every sentence points back to something you saved." />
          <div className="mt-12">
            <ProductStill />
          </div>
        </section>

        <section id="how" className="scroll-mt-20 pb-24 sm:pb-32">
          <SectionHead label="How it works" claim="Four verbs." tail="Capture, connect, recall, resurface." />
          <div className="mt-12 grid gap-px border border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <article key={s.title} className="flex flex-col bg-paper p-6 transition-colors duration-300 hover:bg-paper-2">
                <p className="flex justify-between font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
                  <span>
                    Step {i + 1} of {STEPS.length}
                  </span>
                  <span className="text-ink">{String(i + 1).padStart(2, "0")}</span>
                </p>
                <h3 className="mt-10 text-[28px] font-bold leading-tight tracking-[-0.03em] text-ink">{s.title}</h3>
                <p className="mt-1 text-[15px] text-ink-3">{s.q}</p>
                <p className="mt-6 border-t border-line pt-4 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="trust" className="scroll-mt-20 pb-24 sm:pb-32">
          <SectionHead label="Privacy" claim="Built to be trusted." tail="Here is exactly who can see what." />
          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-ink font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
                  <th className="py-3 pr-4 font-normal">What you save</th>
                  <th className="w-24 py-3 font-normal">You</th>
                  <th className="w-36 py-3 font-normal">Public page*</th>
                </tr>
              </thead>
              <tbody>
                {PRIVACY.map(([label, pub]) => (
                  <tr key={label} className="border-b border-line">
                    <td className="py-3.5 pr-4 text-[15px] text-ink">{label}</td>
                    <td className="py-3.5 font-mono text-sm text-ink">Yes</td>
                    <td className={`py-3.5 font-mono text-sm ${pub ? "text-accent" : "text-ink-3"}`}>{pub ? "If you opt in" : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-6 text-[15px] leading-relaxed text-ink-2">
              <p>
                <span className="font-semibold text-ink">Indexing stays in-house.</span> Search runs on a local embedding model, so your library isn’t shipped to a third party to be indexed. AI features only see the few excerpts needed to answer you.
              </p>
              <p>
                <span className="font-semibold text-ink">Yours to take, yours to erase.</span> Export everything as JSON at any time. Delete your account and every item, file, index entry and conversation goes with it.
              </p>
              <p className="font-mono text-xs text-ink-3">* The public page is off until you turn it on, and you can hide any link from it.</p>
            </div>
          </div>
        </section>
      </main>

      <footer id="start" className="band-invert flex min-h-[92svh] flex-col">
        <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col justify-center px-5 py-24 sm:px-10">
          <p className="eyebrow">— Begin</p>
          <h2 className="mt-6 max-w-[14ch] text-[52px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[88px]">
            Start with <span className="text-accent">one link</span>.
          </h2>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-ink-2">In a month you’ll have a library that thinks with you.</p>
          <div className="mt-10">
            <HeroField signedIn={signedIn} inverted />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-6 font-mono text-xs uppercase tracking-[0.06em] text-ink-3 sm:px-10">
          <span>© {new Date().getFullYear()} SuperBrain</span>
          <nav className="flex gap-1">
            <Link href="/signin" className="wipe px-2 py-1 text-ink-2">
              Sign in
            </Link>
            <Link href="/signup" className="wipe px-2 py-1 text-ink-2">
              Create account
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
