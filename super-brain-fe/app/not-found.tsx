import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo compact />
      <p className="mt-8 eyebrow">404</p>
      <h1 className="mt-2 font-display text-5xl text-ink">Nothing remembered here.</h1>
      <p className="mt-3 text-ink-2">This page doesn’t exist, or it’s no longer shared.</p>
      <Link href="/" className="mt-8 bg-ink px-5 py-2.5 text-sm font-medium text-paper">
        Go home
      </Link>
    </div>
  );
}
