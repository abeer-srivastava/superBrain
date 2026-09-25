"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Search, 
  Zap, 
  Globe, 
  FileText, 
  MessageSquare, 
  Share2, 
  ArrowRight,
  Plus,
  Shield,
  Monitor,
  Check
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
      title: "SMART INGESTION",
      desc: "Paste any link, upload a PDF, or drop an image. Our engine parses it instantly.",
      icon: Zap,
      color: "bg-main"
    },
    {
      id: "02",
      title: "SEMANTIC SEARCH",
      desc: "Search by meaning, not keywords. Our AI understands the context of your data.",
      icon: Search,
      color: "bg-chart-4"
    },
    {
      id: "03",
      title: "EASY SHARING",
      desc: "Toggle your brain to public and share your curated knowledge via link or QR.",
      icon: Share2,
      color: "bg-chart-1"
    },
    {
      id: "04",
      title: "PDF & OCR",
      desc: "Full text extraction from documents and images using local processing.",
      icon: FileText,
      color: "bg-chart-3"
    },
    {
      id: "05",
      title: "PRIVACY FIRST",
      desc: "Your data is yours. Isolated vector storage and secure authentication.",
      icon: Shield,
      color: "bg-chart-2"
    },
    {
      id: "06",
      title: "ASK YOUR BRAIN",
      desc: "Chat with your data. Get answers grounded only in the sources you've saved.",
      icon: MessageSquare,
      color: "bg-main"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black font-base overflow-x-hidden">
      {/* Top Nav */}
      <nav className="border-b-4 border-black bg-secondary-background/50 backdrop-blur-sm sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-main rounded-[var(--radius-base)] border-4 border-black shadow-[4px_4px_0px_0px_#000]">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-heading font-bold uppercase tracking-tighter">SuperBrain</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
                <Button variant="ghost" className="font-heading font-bold uppercase">Login</Button>
            </Link>
            <Link href="/auth/signup">
                <Button className="font-heading font-bold uppercase shadow-[4px_4px_0px_0px_#000]">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 border-b-4 border-black bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-block px-4 py-2 border-4 border-black bg-yellow-300 font-heading font-bold uppercase shadow-[4px_4px_0px_0px_#000]">
                V1.0 is Live! 🚀
            </div>
            <h1 className="text-7xl md:text-8xl font-heading font-bold leading-[0.9] tracking-tighter uppercase">
              DIVE INTO YOUR <span className="text-main underline decoration-black underline-offset-4">SECOND BRAIN</span>
            </h1>
            <p className="text-2xl font-base font-bold text-black/70 max-w-xl">
              SuperBrain - Where your digital life becomes searchable. 
              Store links, parse PDFs, and ask AI questions about your own data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth/signup">
                    <Button className="h-16 px-10 text-xl font-heading font-bold uppercase shadow-[8px_8px_0px_0px_#000] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_#000] transition-all">
                        Build Your Brain <ArrowRight className="ml-2 w-6 h-6" />
                    </Button>
                </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, rotate: 5, scale: 0.9 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            className="relative"
          >
            <div className="border-4 border-black bg-pink-400 p-2 shadow-[12px_12px_0px_0px_#000] rounded-[var(--radius-base)]">
                <div className="border-4 border-black bg-white p-6 rounded-[var(--radius-base)] space-y-4">
                    <div className="flex items-center gap-2 border-b-4 border-black pb-2 mb-4">
                        <Search className="w-5 h-5" />
                        <span className="font-heading font-bold uppercase">Ask Your Brain</span>
                    </div>
                    <div className="p-4 bg-gray-100 border-4 border-black rounded-[var(--radius-base)] italic font-bold">
                        "What were my notes on vector databases from that blog post?"
                    </div>
                    <div className="p-4 bg-main text-white border-4 border-black rounded-[var(--radius-base)] shadow-[4px_4px_0px_0px_#000]">
                        <p className="font-bold">AI: Vector databases store data as high-dimensional points. According to the article you saved yesterday, they use Cosine Similarity for retrieval...</p>
                    </div>
                    <div className="flex justify-end">
                        <div className="px-3 py-1 bg-yellow-300 border-2 border-black font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_#000]">
                            Source: pincone.io/blog
                        </div>
                    </div>
                </div>
            </div>
            {/* Sticker Decor */}
            <div className="absolute -top-6 -right-6 px-4 py-2 bg-blue-500 text-white border-4 border-black font-heading font-bold uppercase rotate-12 shadow-[4px_4px_0px_0px_#000]">
                AI Powered!
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works Grid */}
      <section className="py-32 bg-gray-50 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-5xl font-heading font-bold uppercase tracking-tighter">HOW IT WORKS</h2>
            <div className="w-32 h-2 bg-main mx-auto border-2 border-black"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => {
                const Icon = f.icon;
                return (
                    <div key={f.id} className="group border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_#000] transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 border-4 border-black rounded-[var(--radius-base)] ${f.color} text-white shadow-[4px_4px_0px_0px_#000]`}>
                                <Icon className="w-8 h-8" />
                            </div>
                            <span className="text-4xl font-heading font-bold text-black/10">{f.id}</span>
                        </div>
                        <h3 className="text-2xl font-heading font-bold uppercase mb-4">{f.title}</h3>
                        <p className="text-lg font-base font-bold text-black/60">{f.desc}</p>
                    </div>
                );
            })}
          </div>
        </div>
      </section>

      {/* Knowledge Engine Section */}
      <section className="py-32 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-6xl font-heading font-bold uppercase tracking-tighter leading-none">
                THE KNOWLEDGE <br/> <span className="text-pink-500">ENGINE</span>
            </h2>
            <p className="text-xl font-base font-bold text-black/70">
                Control exactly how your knowledge is processed. SuperBrain uses local embedding models to ensure your data stays private while remaining searchable.
            </p>
            <div className="space-y-4">
                {[
                    "Local Embedding Processing",
                    "Automated Link Scraping",
                    "Semantic Vector Retrieval",
                    "Grounded AI Responses"
                ].map(item => (
                    <div key={item} className="flex items-center gap-4">
                        <div className="p-1 bg-green-400 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                            <Check className="w-4 h-4" />
                        </div>
                        <span className="font-heading font-bold uppercase">{item}</span>
                    </div>
                ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000] font-heading font-bold uppercase">
                📥 URL / FILE ARRIVES
            </div>
            <div className="flex justify-center py-2">
                <ArrowRight className="w-8 h-8 rotate-90" />
            </div>
            <div className="p-6 border-4 border-black bg-green-400 shadow-[8px_8px_0px_0px_#000] font-heading font-bold uppercase">
                ✨ AUTO EXTRACTION & CHUNKING
            </div>
            <div className="flex justify-center py-2">
                <ArrowRight className="w-8 h-8 rotate-90" />
            </div>
            <div className="p-6 border-4 border-black bg-blue-400 shadow-[8px_8px_0px_0px_#000] font-heading font-bold uppercase text-white">
                🧠 VECTOR EMBEDDING STORED
            </div>
            <div className="flex justify-center py-2">
                <ArrowRight className="w-8 h-8 rotate-90" />
            </div>
            <div className="p-6 border-4 border-black bg-main shadow-[8px_8px_0px_0px_#000] font-heading font-bold uppercase text-white">
                💬 AI ANSWERS READY
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-yellow-300 border-b-4 border-black">
        <div className="max-w-5xl mx-auto px-4 text-center">
            <Card className="p-12 border-4 border-black bg-white shadow-[16px_16px_0px_0px_#000]">
                <h2 className="text-5xl md:text-6xl font-heading font-bold uppercase tracking-tighter mb-6">READY TO DIVE IN?</h2>
                <p className="text-xl font-base font-bold text-black/70 mb-10">Join 5,000+ developers and researchers building their second brain.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                    <Link href="/auth/signup">
                        <Button className="h-16 px-12 text-xl font-heading font-bold uppercase shadow-[8px_8px_0px_0px_#000]">CLAIM YOUR BRAIN</Button>
                    </Link>
                </div>
            </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-main rounded-[var(--radius-base)] border-2 border-white">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-heading font-bold uppercase tracking-tighter">SuperBrain</span>
            </div>
            <p className="font-base font-bold text-white/50 text-sm">© 2026 SuperBrain. All rights reserved.</p>
            <div className="flex gap-8 font-heading font-bold uppercase text-sm">
                <a href="#" className="hover:text-main">Twitter</a>
                <a href="#" className="hover:text-main">Github</a>
                <a href="#" className="hover:text-main">Terms</a>
            </div>
        </div>
      </footer>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`border-4 border-black rounded-[var(--radius-base)] ${className}`}>
            {children}
        </div>
    );
}
