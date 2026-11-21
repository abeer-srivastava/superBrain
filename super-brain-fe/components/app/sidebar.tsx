"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Library, MessageSquareText, Search, Settings, Star, LogOut, Monitor, Moon, Sun, ChevronsUpDown } from "lucide-react";
import { api } from "@/lib/api";
import { useIsMac, useStats } from "@/lib/hooks";
import { useTheme, type ThemePref } from "@/lib/theme";
import { compactNumber, KIND_PLURAL } from "@/lib/format";
import type { ContentKind, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Kbd, KindDot } from "@/components/ui/misc";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { useShell } from "./shell";

function NavLink({ href, active, icon, children, count }: { href: string; active: boolean; icon?: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <Link
      href={href}
      data-active={active}
      className={cn("wipe group flex h-8 items-center gap-2.5 px-2.5 text-[13.5px]", active ? "font-medium text-paper" : "text-ink-2")}
    >
      {icon}
      <span className="flex-1 truncate">{children}</span>
      {count !== undefined && count > 0 ? <span className="font-mono text-[11px] opacity-60">{compactNumber(count)}</span> : null}
    </Link>
  );
}

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const { data: stats } = useStats();
  const { openPalette } = useShell();
  const { pref, setPref } = useTheme();
  const mac = useIsMac();

  const onLibrary = pathname === "/library";
  const type = params.get("type");
  const tag = params.get("tag");
  const fav = params.get("favorite") === "1";
  const plainLibrary = onLibrary && !type && !tag && !fav;

  const signOut = async () => {
    await api.auth.signout().catch(() => undefined);
    router.replace("/signin");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/library" aria-label="SuperBrain home">
          <Logo />
        </Link>
      </div>

      <div className="px-3">
        <button
          onClick={() => openPalette()}
          className="flex h-9 w-full items-center gap-2 border border-line-strong bg-card px-3 text-[13px] text-ink-3 transition-colors hover:border-ink hover:text-ink"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search or ask…</span>
          <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-6 overflow-y-auto px-3 pb-4 scrollbar-thin">
        <div className="space-y-0.5">
          <NavLink href="/library" active={plainLibrary} icon={<Library className="size-4" />} count={stats?.total}>
            Library
          </NavLink>
          <NavLink href="/ask" active={pathname.startsWith("/ask")} icon={<MessageSquareText className="size-4" />}>
            Ask
          </NavLink>
          <NavLink href="/library?favorite=1" active={onLibrary && fav} icon={<Star className="size-4" />} count={stats?.favorites}>
            Favorites
          </NavLink>
        </div>

        <div>
          <p className="eyebrow mb-1.5 px-2.5">— Collections</p>
          <div className="space-y-0.5">
            {(["link", "note", "pdf", "image"] as ContentKind[]).map((k) => (
              <NavLink
                key={k}
                href={`/library?type=${k}`}
                active={onLibrary && type === k}
                icon={<span className="flex size-4 items-center justify-center z-1"><KindDot kind={k} className="size-2 z-1" /></span>}
                count={stats?.byType[k]}
              >
                {KIND_PLURAL[k]}
              </NavLink>
            ))}
          </div>
        </div>

        {stats && stats.tags.length > 0 && (
          <div>
            <p className="eyebrow mb-1.5 px-2.5">— Topics</p>
            <div className="space-y-0.5">
              {stats.tags.slice(0, 12).map((t) => (
                <NavLink
                  key={t.tag}
                  href={`/library?tag=${encodeURIComponent(t.tag)}`}
                  active={onLibrary && tag === t.tag}
                  icon={<span className="w-4 text-center font-mono opacity-50">#</span>}
                  count={t.count}
                >
                  {t.tag}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-line p-3">
        <Menu>
          <MenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 p-1.5 text-left transition-colors hover:bg-paper-2">
              <span className="flex size-8 items-center justify-center bg-ink font-mono text-[13px] font-medium text-paper">
                {(user.displayName || user.username).slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{user.displayName || user.username}</span>
                <span className="block truncate text-xs text-ink-3">{user.email}</span>
              </span>
              <ChevronsUpDown className="size-3.5 text-ink-3" />
            </button>
          </MenuTrigger>
          <MenuContent align="start" className="w-[228px]">
            <MenuItem onSelect={() => router.push("/settings")}>
              <Settings className="size-4" /> Settings
            </MenuItem>
            <MenuSeparator />
            <MenuLabel>Theme</MenuLabel>
            {(["system", "light", "dark"] as ThemePref[]).map((p) => {
              const Icon = { system: Monitor, light: Sun, dark: Moon }[p];
              return (
                <MenuItem key={p} onSelect={() => setPref(p)} className={cn(pref === p && "text-ink")}>
                  <Icon className="size-4" /> <span className="flex-1 capitalize">{p}</span>
                  {pref === p && <span className="size-1.5 bg-accent" />}
                </MenuItem>
              );
            })}
            <MenuSeparator />
            <MenuItem onSelect={signOut}>
              <LogOut className="size-4" /> Sign out
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </div>
  );
}
