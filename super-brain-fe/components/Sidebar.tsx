"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Brain,
  LayoutDashboard,
  Search,
  Youtube,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type");
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) return null;

  const mainNav = [
    { href: "/dashboard", label: "All Content", icon: LayoutDashboard, color: "bg-main text-main-foreground" },
    { href: "/search", label: "AI Search", icon: Search, color: "bg-accent-green text-black" },
    { href: "/dashboard?type=link", label: "Links", icon: Youtube, color: "bg-[#FF0000] text-white" },
    { href: "/dashboard?type=pdf", label: "PDFs", icon: FileText, color: "bg-accent-orange text-white" },
    { href: "/dashboard?type=note", label: "Notes", icon: MessageSquare, color: "bg-accent-cyan text-white" },
    { href: "/dashboard?type=image", label: "Images", icon: ImageIcon, color: "bg-accent-violet text-white" },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r-[3px] border-border bg-background p-6 lg:flex">
      {/* Logo */}
      <Link href="/dashboard" className="group mb-10 flex items-center gap-3">
        <div className="bg-chrome flex items-center rounded-[var(--radius-base)] border-[3px] border-border p-2 text-foreground shadow-[var(--shadow)] transition-all group-hover:-translate-y-[2px] group-hover:shadow-[var(--shadow-lg)]">
          <Brain className="h-8 w-8" />
        </div>
        <span className="font-display text-2xl uppercase tracking-tighter text-foreground">
          SuperBrain
        </span>
      </Link>

      {/* Main Navigation */}
      <div className="flex-1 space-y-2">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = (() => {
            const url = new URL(item.href, "http://localhost");
            const targetPath = url.pathname;
            const targetType = url.searchParams.get("type");
            if (pathname !== targetPath) return false;
            return currentType === targetType;
          })();

          return (
            <Link key={item.label} href={item.href}>
              <div
                className={cn(
                  "mb-2 flex items-center gap-3 rounded-[var(--radius-base)] border-[3px] border-transparent px-4 py-3 font-display text-sm uppercase tracking-wide transition-all",
                  isActive
                    ? `border-border shadow-[var(--shadow)] ${item.color}`
                    : "hover:border-border/50 hover:bg-secondary-background"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      {/* User + Theme */}
      <div className="mt-auto space-y-4">
        <div className="flex items-center gap-2 rounded-[var(--radius-base)] border-[3px] border-border bg-secondary-background p-2.5 shadow-[var(--shadow-sm)]">
          <Link href="/account" className="group flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-base)] p-1.5 transition-colors hover:bg-background">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-border bg-main font-display font-bold text-main-foreground">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm uppercase tracking-wide text-foreground">
                {user?.username}
              </p>
              <p className="truncate text-[10px] font-base text-foreground/50">
                {user?.email}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-foreground/40 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <ThemeToggle compact />
        </div>

        <Button
          variant="danger"
          className="w-full justify-start gap-3 py-5"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
