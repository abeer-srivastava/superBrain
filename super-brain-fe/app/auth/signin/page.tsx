"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Brain, LogIn } from "lucide-react";
import { motion } from "framer-motion";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    setIsLoading(true);
    const result = await signin(email, password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-main rounded-[var(--radius-base)] border-4 border-border shadow-[var(--shadow)] mb-4">
            <Brain className="w-12 h-12 text-main-foreground" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
            SuperBrain
          </h1>
          <p className="text-foreground/70 font-base">
            Welcome back to your second brain
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-6 h-6" />
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-heading font-bold mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-heading font-bold mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-[var(--radius-base)] border-4 border-border bg-chart-3/20 text-chart-3 text-sm font-base font-semibold">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2"
              >
                <LogIn className="w-4 h-4" />
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="text-center text-sm font-base">
                <span className="text-foreground/70">Don`t have an account? </span>
                <Link
                  href="/auth/signup"
                  className="text-main font-bold hover:underline"
                >
                  Sign Up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
