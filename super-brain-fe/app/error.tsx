"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-4xl text-ink">Something went sideways.</h1>
      <p className="mt-3 max-w-sm text-ink-2">An unexpected error occurred. Your library is safe. Try again, or reload the page.</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
