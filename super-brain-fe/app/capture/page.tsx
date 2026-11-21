"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Link2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import { hostname } from "@/lib/format";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

/** Bookmarklet target: a small popup that saves the page you were on. */
function Capture() {
  const params = useSearchParams();
  const url = params.get("url") ?? "";
  const pageTitle = params.get("title") ?? "";
  const { user, isLoading } = useMe();
  const [title, setTitle] = useState(pageTitle);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("saving");
    setError("");
    try {
      await api.content.createLink(url, {
        title: title.trim() || undefined,
        annotation: note.trim() || undefined,
        tags: tags.split(/[,\s]+/).map((t) => t.replace(/^#/, "")).filter(Boolean),
      });
      setState("saved");
      setTimeout(() => window.close(), 1400);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this page");
      setState("idle");
    }
  };

  if (isLoading) return <div className="h-40 skeleton" />;

  if (!user) {
    return (
      <div className="text-center">
        <p className="font-display text-2xl text-ink">Sign in to save this page</p>
        <a href={`/signin?next=${encodeURIComponent(`/capture?${params.toString()}`)}`} className="mt-5 inline-block">
          <Button>Sign in</Button>
        </a>
      </div>
    );
  }

  if (!url) return <p className="text-center text-ink-2">Nothing to save: no page address was provided.</p>;

  if (state === "saved") {
    return (
      <div className="py-10 text-center animate-fade-up">
        <span className="mx-auto flex size-12 items-center justify-center bg-success/15 text-success">
          <Check className="size-6" />
        </span>
        <p className="mt-4 font-display text-3xl text-ink">Saved.</p>
        <p className="mt-1 text-sm text-ink-3">SuperBrain is reading it now.</p>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex items-center gap-2 border border-line bg-paper-2 px-3 py-2.5 text-[13px] text-ink-2">
        <Link2 className="size-4 shrink-0 text-kind-link" />
        <span className="truncate">{hostname(url) || url}</span>
      </div>
      <div>
        <Label htmlFor="t">Title</Label>
        <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Leave empty to detect automatically" />
      </div>
      <div>
        <Label htmlFor="n" hint="Optional">Why are you saving this?</Label>
        <Textarea id="n" rows={3} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
      </div>
      <div>
        <Label htmlFor="g" hint="Optional">Tags</Label>
        <Input id="g" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="reading, ideas" />
      </div>
      {error && <p className="bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}
      <Button type="submit" className="w-full" size="lg" loading={state === "saving"}>
        Save to SuperBrain
      </Button>
    </form>
  );
}

export default function CapturePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col px-6 py-6">
      <Logo />
      <div className="flex flex-1 flex-col justify-center py-6">
        <Suspense>
          <Capture />
        </Suspense>
      </div>
    </div>
  );
}
