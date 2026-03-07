"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  Brain, 
  LayoutDashboard, 
  Search, 
  Youtube, 
  FileText, 
  MessageSquare, 
  Image as ImageIcon, 
  Share2, 
  User, 
  HelpCircle, 
  LogOut,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) return null;

  const mainNav = [
    { href: "/dashboard", label: "All Content", icon: LayoutDashboard, color: "bg-main" },
    { href: "/search", label: "AI Search", icon: Search, color: "bg-chart-4" },
    { href: "/dashboard?type=link", label: "Links", icon: Youtube, color: "bg-[#FF0000]" },
    { href: "/dashboard?type=pdf", label: "PDFs", icon: FileText, color: "bg-chart-3" },
    { href: "/dashboard?type=note", label: "Notes", icon: MessageSquare, color: "bg-main" },
    { href: "/dashboard?type=image", label: "Images", icon: ImageIcon, color: "bg-chart-2" },
  ];

  const secondaryNav = [
    { href: "/account", label: "Account", icon: User },
    { href: "/help", label: "Help", icon: HelpCircle },
  ];

  return (
    <aside className="w-72 h-screen sticky top-0 border-r-4 border-border bg-background flex flex-col p-6 hidden lg:flex">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-3 mb-10 group">
        <div className="p-2 bg-main rounded-[var(--radius-base)] border-4 border-border shadow-[4px_4px_0px_0px_var(--border)] group-hover:translate-y-[-2px] group-hover:shadow-[6px_6px_0px_0px_var(--border)] transition-all">
          <Brain className="w-8 h-8 text-main-foreground" />
        </div>
        <span className="text-2xl font-heading font-bold text-foreground tracking-tighter uppercase">
          SuperBrain
        </span>
      </Link>

      {/* Main Navigation */}
      <div className="flex-1 space-y-2">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.label} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[var(--radius-base)] border-4 border-transparent font-heading font-bold transition-all mb-2",
                isActive 
                  ? `${item.color} border-border shadow-[4px_4px_0px_0px_var(--border)] text-white` 
                  : "hover:bg-secondary-background hover:border-border/50"
              )}>
                <Icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          );
        })}

        <div className="my-6 border-t-4 border-border/10 pt-6">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-base)] font-base font-bold text-foreground/70 hover:text-foreground hover:bg-secondary-background transition-all">
                  <Icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User & Sign Out */}
      <div className="mt-auto space-y-4">
        <div className="p-4 rounded-[var(--radius-base)] border-4 border-border bg-secondary-background flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-border bg-main flex items-center justify-center font-bold">
                {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-heading font-bold truncate">{user?.username}</p>
                <p className="text-[10px] font-base text-foreground/50 truncate">{user?.email}</p>
            </div>
        </div>

        <Button
          variant="danger"
          className="w-full justify-start gap-3 py-6 shadow-[4px_4px_0px_0px_var(--border)] hover:shadow-[2px_2px_0px_0px_var(--border)]"
          onClick={logout}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
