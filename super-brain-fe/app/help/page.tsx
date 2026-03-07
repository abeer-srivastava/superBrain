"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  HelpCircle, 
  Search, 
  Upload, 
  Share2, 
  Brain, 
  MessageSquare,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I add content?",
      answer: "Click the 'Add New Content' button on your dashboard. You can paste a link, upload a PDF/Image, or write a manual note. Our system will automatically process and index the content for AI search.",
      icon: Upload,
      color: "bg-main"
    },
    {
      question: "What is Semantic Search?",
      answer: "Unlike traditional keyword search, semantic search understands the meaning behind your query. Asking 'Where did I read about vector DBs?' will find relevant content even if the exact phrase isn't present.",
      icon: Search,
      color: "bg-chart-4"
    },
    {
      question: "How does 'Ask Your Brain' work?",
      answer: "When you use the AI Search, you can ask direct questions. The AI retrieves the most relevant chunks of your saved knowledge and synthesizes an answer grounded ONLY in your data.",
      icon: Brain,
      color: "bg-chart-3"
    },
    {
      question: "Is my data private?",
      answer: "Yes. All your content is private by default. Vectors are isolated per user, and only the 'Public Brain' toggle can make selected metadata visible to others via your hash link.",
      icon: MessageSquare,
      color: "bg-chart-2"
    },
    {
      question: "How do I share my knowledge?",
      answer: "Go to your Dashboard or Account page and enable 'Share Brain'. This generates a unique link (and QR code) that you can send to others so they can browse your public collection.",
      icon: Share2,
      color: "bg-chart-1"
    }
  ];

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12 pb-24">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-6xl font-heading font-bold text-foreground tracking-tighter uppercase">
            Help Center
          </h1>
          <p className="text-xl text-foreground/70 font-base">
            Everything you need to know about mastering your SecondBrain.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid gap-8">
          {faqs.map((faq, index) => {
            const Icon = faq.icon;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--border)] group hover:translate-x-2 transition-transform">
                  <CardHeader className="border-b-4 border-border flex flex-row items-center gap-4 bg-secondary-background/50">
                    <div className={`p-3 border-4 border-border rounded-[var(--radius-base)] ${faq.color} text-white shadow-[4px_4px_0px_0px_var(--border)]`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl uppercase tracking-tight">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <p className="text-lg font-base leading-relaxed text-foreground/80">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Support Section */}
        <section className="pt-12">
            <Card className="border-4 border-border bg-main text-white shadow-[12px_12px_0px_0px_var(--border)] p-12 text-center">
                <HelpCircle className="w-16 h-16 mx-auto mb-6" />
                <h2 className="text-4xl font-heading font-bold uppercase mb-4 tracking-tighter">Still Need Help?</h2>
                <p className="text-xl font-base mb-8 opacity-90 max-w-2xl mx-auto">
                    If you encounter any bugs or have feature requests, feel free to reach out to our team.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <a 
                        href="mailto:support@superbrain.ai" 
                        className="h-14 px-8 bg-white text-main border-4 border-border rounded-[var(--radius-base)] font-heading font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_var(--border)] hover:translate-y-[-2px] transition-all"
                    >
                        EMAIL SUPPORT <ChevronRight className="w-5 h-5" />
                    </a>
                    <a 
                        href="https://docs.superbrain.ai" 
                        target="_blank"
                        className="h-14 px-8 bg-chart-4 text-white border-4 border-border rounded-[var(--radius-base)] font-heading font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_var(--border)] hover:translate-y-[-2px] transition-all"
                    >
                        READ DOCS <ExternalLink className="w-5 h-5" />
                    </a>
                </div>
            </Card>
        </section>

        {/* Tips Footer */}
        <div className="text-center pt-8">
            <p className="text-sm font-base text-foreground/50 italic font-bold">
                Tip: Use natural language in the AI Search like "What are my notes on biology?" for best results.
            </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
