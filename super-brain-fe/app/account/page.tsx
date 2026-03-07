"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useShareBrain } from "@/hooks/useShareBrain";
import { useContent } from "@/hooks/useContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Copy, 
  Check, 
  QrCode, 
  User as UserIcon, 
  Shield, 
  BarChart3, 
  Trash2,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

export default function AccountPage() {
  const { user } = useAuth();
  const { isShared, shareLink } = useShareBrain();
  const { contents } = useContent();
  const [copied, setCopied] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || "");

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stats = [
    { label: "Links", count: contents.filter(c => c.type === 'link').length, color: "bg-main" },
    { label: "PDFs", count: contents.filter(c => c.type === 'pdf').length, color: "bg-chart-3" },
    { label: "Notes", count: contents.filter(c => c.type === 'note').length, color: "bg-chart-4" },
    { label: "Images", count: contents.filter(c => c.type === 'image').length, color: "bg-chart-2" },
  ];

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12 pb-24">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-6xl font-heading font-bold text-foreground tracking-tighter uppercase">
            Account
          </h1>
          <p className="text-xl text-foreground/70 font-base">
            Manage your profile, sharing settings, and brain statistics.
          </p>
        </div>

        {/* Identity Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b-4 border-border pb-2">
            <h2 className="text-2xl font-heading font-bold uppercase tracking-tight">Identity</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--border)]">
              <CardHeader className="border-b-4 border-border">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg uppercase">Share Your Brain</CardTitle>
                    <span className="text-[10px] font-bold text-foreground/50">SCAN OR COPY</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-secondary-background border-4 border-border rounded-[var(--radius-base)] font-base font-bold truncate">
                   {isShared && shareLink ? shareLink : "Sharing is currently disabled"}
                </div>
                <Button 
                    className="w-full gap-2 py-6 text-lg shadow-[4px_4px_0px_0px_var(--border)] active:translate-y-1"
                    onClick={handleCopy}
                    disabled={!isShared}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? "COPIED!" : "COPY LINK"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--border)] flex flex-col items-center justify-center p-6 text-center">
                <div className={isShared ? "opacity-100" : "opacity-20 grayscale"}>
                    <div className="p-4 border-4 border-border rounded-[var(--radius-base)] bg-white mb-4">
                        <QrCode className="w-32 h-32 text-black" />
                    </div>
                    <p className="text-sm font-heading font-bold uppercase">Scan to Open</p>
                </div>
                {!isShared && <p className="mt-2 text-xs font-base text-rose-500 font-bold italic">Enable sharing to generate QR</p>}
            </Card>
          </div>
        </section>

        {/* Profile Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b-4 border-border pb-2">
            <h2 className="text-2xl font-heading font-bold uppercase tracking-tight">Username</h2>
          </div>
          
          <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--border)]">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-heading font-bold uppercase text-foreground/50">Current Username</label>
                <Input 
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="h-14 text-xl border-4"
                />
                <p className="text-xs font-base text-foreground/50 italic">3-20 characters. Use letters, numbers, or underscores.</p>
              </div>
              <Button className="w-full py-6 text-lg bg-chart-4 shadow-[4px_4px_0px_0px_var(--border)] active:translate-y-1">
                  UPDATE USERNAME
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Stats Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b-4 border-border pb-2">
            <h2 className="text-2xl font-heading font-bold uppercase tracking-tight">Brain Statistics</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-4 border-border shadow-[8px_8px_0px_0px_var(--border)] p-6 text-center">
                <div className="text-4xl font-heading font-bold mb-1">{stat.count}</div>
                <div className={`text-xs font-heading font-bold uppercase py-1 px-3 rounded-full border-2 border-border inline-block ${stat.color} text-white`}>
                    {stat.label}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Session Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b-4 border-border pb-2">
            <h2 className="text-2xl font-heading font-bold uppercase tracking-tight">Session</h2>
          </div>
          
          <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--border)] p-8 flex items-center gap-6">
            <div className="w-20 h-20 bg-main border-4 border-border rounded-[var(--radius-base)] flex items-center justify-center text-3xl font-heading font-bold text-white shadow-[4px_4px_0px_0px_var(--border)]">
                {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
                <h3 className="text-2xl font-heading font-bold uppercase">{user?.username}</h3>
                <p className="text-lg font-base text-foreground/70">{user?.email}</p>
            </div>
          </Card>
        </section>

        {/* Danger Zone */}
        <section className="space-y-6 pt-12">
            <div className="p-8 border-4 border-rose-500 bg-rose-500/10 rounded-[var(--radius-base)] flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-xl font-heading font-bold text-rose-500 uppercase">Danger Zone</h3>
                    <p className="text-sm font-base text-rose-500/70">Wipe all content and permanently delete your second brain.</p>
                </div>
                <Button variant="danger" className="py-6 px-10 shadow-[4px_4px_0px_0px_#000]">
                    DELETE ACCOUNT
                </Button>
            </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
