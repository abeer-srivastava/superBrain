"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Menu as MenuIcon, UploadCloud, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useFeatures, useMe, useRefreshLibrary } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";

interface ShellContextValue {
  openPalette: (initial?: string) => void;
  uploadFiles: (files: File[]) => Promise<void>;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside AppShell");
  return ctx;
}

const ACCEPTED = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, error, isLoading } = useMe();
  const features = useFeatures();
  const refresh = useRefreshLibrary();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteInitial, setPaletteInitial] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const dragDepth = useRef(0);

  // Expired/invalid session: clear the cookie and go to sign-in.
  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      api.auth.signout().finally(() => router.replace(`/signin?next=${encodeURIComponent(pathname)}`));
    }
  }, [error, pathname, router]);

  useEffect(() => setMobileNav(false), [pathname]);

  const openPalette = useCallback((initial = "") => {
    setPaletteInitial(initial);
    setPaletteOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        setPaletteInitial("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const valid = files.filter((f) => ACCEPTED.includes(f.type));
      if (valid.length < files.length) toast.error("Some files were skipped. SuperBrain accepts PDFs and images.");
      for (const file of valid) {
        const id = toast.loading(`Uploading ${file.name}…`);
        try {
          await api.content.upload(file);
          toast.success(`Saved ${file.name}`, { id, description: "Reading it now. It will be searchable in a moment." });
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Upload failed", { id });
        }
      }
      if (valid.length) refresh();
    },
    [refresh],
  );

  // Drop files anywhere in the app to save them.
  const onDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    dragDepth.current++;
    setDragging(true);
  };
  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    void uploadFiles(Array.from(e.dataTransfer.files));
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-up">
          <Logo compact />
          <div className="h-1 w-24 overflow-hidden skeleton" />
        </div>
      </div>
    );
  }

  const aiOff = features && features.ai !== "ok" && !bannerDismissed;

  return (
    <ShellContext.Provider value={{ openPalette, uploadFiles }}>
      <div
        className="flex min-h-dvh"
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-[252px] shrink-0 border-r border-line-strong bg-paper lg:block">
          <Sidebar user={user} />
        </aside>

        {/* Mobile nav */}
        <div className={cn("fixed inset-0 z-40 lg:hidden", mobileNav ? "pointer-events-auto" : "pointer-events-none")}>
          <div className={cn("absolute inset-0 bg-ink/30 transition-opacity", mobileNav ? "opacity-100" : "opacity-0")} onClick={() => setMobileNav(false)} />
          <aside
            className={cn(
              "absolute inset-y-0 left-0 w-[280px] border-r border-line bg-paper shadow-lg transition-transform duration-200",
              mobileNav ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <Sidebar user={user} />
          </aside>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/85 px-4 backdrop-blur lg:hidden">
            <Button variant="ghost" size="icon-sm" onClick={() => setMobileNav(true)} aria-label="Open navigation">
              <MenuIcon className="size-5" />
            </Button>
            <Logo />
            <span className="w-8" />
          </header>

          {aiOff && (
            <div className="flex items-start gap-3 border-b border-line-strong bg-paper-2 px-4 py-2.5 text-[13px] text-ink-2 sm:px-8">
              <span className="mt-0.5 shrink-0 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-accent">Notice</span>
              <p className="flex-1">
                <span className="font-medium text-ink">AI features are paused.</span>{" "}
                {features.ai === "rejected"
                  ? "The server's language-model key was rejected, so summaries and answers are off."
                  : "No language-model key is configured, so summaries and answers are off."}{" "}
                Saving, search and connections still work normally.
              </p>
              <button onClick={() => setBannerDismissed(true)} className="text-ink-3 hover:text-ink" aria-label="Dismiss">
                <X className="size-4" />
              </button>
            </div>
          )}

          <main className="flex-1">{children}</main>
        </div>
      </div>

      {dragging && (
        <div className="pointer-events-none fixed inset-3 z-50 flex items-center justify-center border border-dashed border-ink bg-paper/90 animate-fade-up">
          <div className="text-center">
            <UploadCloud className="mx-auto size-10 text-ink" strokeWidth={1.25} />
            <p className="mt-3 font-display text-3xl">Drop to save</p>
            <p className="mt-1 text-sm text-ink-2">PDFs and images are read, indexed, and made searchable.</p>
          </div>
        </div>
      )}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} initialQuery={paletteInitial} />
    </ShellContext.Provider>
  );
}
