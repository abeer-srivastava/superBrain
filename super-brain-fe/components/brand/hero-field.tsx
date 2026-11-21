"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { looksLikeUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Landing-page capture field. A real entry point, not decoration: the link is
 * carried through sign-up (or straight into the library when signed in) and
 * saved automatically on arrival.
 */
export function HeroField({ signedIn, inverted }: { signedIn: boolean; inverted?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (v && !looksLikeUrl(v)) {
      setInvalid(true);
      return;
    }
    const link = v && !/^https?:\/\//i.test(v) ? `https://${v}` : v;
    const target = link ? `/library?save=${encodeURIComponent(link)}` : "/library";
    router.push(signedIn ? target : `/signup?next=${encodeURIComponent(target)}`);
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className={cn("flex min-h-14 flex-col gap-1 sm:flex-row sm:items-stretch", invalid && "outline outline-1 outline-accent")}>
        <label htmlFor={inverted ? "hero-url-2" : "hero-url"} className="sr-only">
          A link you want to remember
        </label>
        {!/^https?:\/\//i.test(value) && <span className="flex h-12 shrink-0 items-center bg-ink px-3 font-mono text-sm text-paper sm:h-auto sm:px-4">https://</span>}
        <input
          id={inverted ? "hero-url-2" : "hero-url"}
          inputMode="url"
          autoComplete="url"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setInvalid(false);
          }}
          placeholder="your-article.com"
          className="min-h-12 min-w-0 flex-1 border-b border-line-strong bg-transparent px-3 text-[16px] text-ink outline-none placeholder:text-ink-3 focus:border-ink sm:min-h-0"
        />
        <button type="submit" className="btn-slab mt-3 flex h-12 shrink-0 items-center justify-center px-6 text-[15px] font-semibold sm:mt-0">
          {signedIn ? "Save it" : "Start remembering"}
        </button>
      </div>
      <p className={cn("mt-2.5 font-mono text-xs", invalid ? "text-accent" : "text-ink-3")}>
        {invalid ? "That doesn’t look like a link. Try something like example.com/article." : signedIn ? "Saved straight into your library." : "Free to start. Private by default. No card required."}
      </p>
    </form>
  );
}
