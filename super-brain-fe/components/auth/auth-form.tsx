"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/library";
}

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { mutate } = useSWRConfig();
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);
  const next = safeNext(params.get("next"));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = mode === "signin" ? await api.auth.signin(identifier, password) : await api.auth.signup(username, email, password);
      await mutate("auth/me", r, { revalidate: false });
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "Something went wrong"));
      setLoading(false);
    }
  };

  const general = error && (!error.errors || mode === "signin") ? error.message : undefined;

  return (
    <div>
      <h1 className="font-display text-[48px] leading-[1] text-ink">{mode === "signin" ? "Welcome back." : "Start remembering."}</h1>
      <p className="mt-3 text-[15px] text-ink-2">
        {mode === "signin" ? "Sign in to your library." : "Create your SuperBrain. It’s private by default."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        {mode === "signin" ? (
          <div>
            <Label htmlFor="identifier">Username or email</Label>
            <Input id="identifier" autoComplete="username" autoFocus value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} required invalid={!!error?.fieldError("username")} />
              <FieldError>{error?.fieldError("username")}</FieldError>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required invalid={!!error?.fieldError("email")} />
              <FieldError>{error?.fieldError("email")}</FieldError>
            </div>
          </>
        )}
        <div>
          <Label htmlFor="password" hint={mode === "signup" ? "At least 8 characters" : undefined}>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            invalid={!!error?.fieldError("password")}
          />
          <FieldError>{error?.fieldError("password")}</FieldError>
        </div>

        {general && <p className="bg-danger-soft px-3 py-2.5 text-[13px] text-danger" role="alert">{general}</p>}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-3">
        {mode === "signin" ? (
          <>
            New to SuperBrain?{" "}
            <Link href={`/signup${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="wipe px-1 font-medium text-ink underline decoration-line-strong underline-offset-4">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/signin${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="wipe px-1 font-medium text-ink underline decoration-line-strong underline-offset-4">
              Sign in
            </Link>
          </>
        )}
      </p>
      {mode === "signup" && (
        <p className="mt-4 text-center text-xs leading-relaxed text-ink-3">Your library is private. You can export or delete everything at any time.</p>
      )}
    </div>
  );
}
