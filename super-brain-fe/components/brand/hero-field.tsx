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
    const target = v ? `/library?save=${encodeURIComponent(v)}` : "/library";
    router.push(signedIn ? target : `/signup?next=${encodeURIComponent(target)}`);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-[560px]">
      <div className={cn("flex h-14 border border-ink bg-paper", invalid && "border-accent")}>
        <label htmlFor={inverted ? "hero-url-2" : "hero-url"} className="sr-only">
          A link you want to remember
        </label>
        <input
          id={inverted ? "hero-url-2" : "hero-url"}
          inputMode="url"
          autoComplete="url"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setInvalid(false);
          }}
          placeholder="https://an-article-worth-keeping.com"
          className="min-w-0 flex-1 bg-transparent px-4 text-[16px] text-ink outline-none placeholder:text-ink-3"
        />
        <button type="submit" className="btn-slab m-[-1px] shrink-0 px-6 text-[15px] font-semibold">
          {signedIn ? "Save it" : "Start remembering"}
        </button>
      </div>
      <p className={cn("mt-2.5 font-mono text-xs", invalid ? "text-accent" : "text-ink-3")}>
        {invalid ? "That doesn’t look like a link. Try something like example.com/article." : signedIn ? "Saved straight into your library." : "Free to start. Private by default. No card required."}
      </p>
    </form>
  );
}
