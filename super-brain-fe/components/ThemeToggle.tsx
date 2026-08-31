"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="secondary"
      size={compact ? "icon" : "default"}
      onClick={toggleTheme}
      className="gap-2 shadow-[var(--shadow-sm)]"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!compact && (
        <span className="font-display text-xs uppercase tracking-wide">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </Button>
  );
}
