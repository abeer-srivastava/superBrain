import type { ContentKind, Item } from "./types";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function relativeTime(date: string | Date | undefined | null): string {
  if (!date) return "";
  const d = new Date(date).getTime();
  const diff = (d - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return "just now";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), "day");
  return new Date(date).toLocaleDateString("en", { month: "short", day: "numeric", year: abs > 86400 * 300 ? "numeric" : undefined });
}

export function longDate(date: string | Date | undefined | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" });
}

export function hostname(url?: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function readingTime(words?: number): string {
  if (!words) return "";
  const m = Math.max(1, Math.round(words / 230));
  return `${m} min read`;
}

export function compactNumber(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function fileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const KIND_LABEL: Record<ContentKind, string> = { link: "Link", note: "Note", pdf: "PDF", image: "Image" };
export const KIND_PLURAL: Record<ContentKind, string> = { link: "Links", note: "Notes", pdf: "PDFs", image: "Images" };

export function itemTitle(item: Pick<Item, "title" | "type" | "originalLink" | "fileName" | "status">): string {
  if (item.title) return item.title;
  if (item.status === "processing") return item.originalLink ? hostname(item.originalLink) || "Reading…" : item.fileName || "Reading…";
  return item.fileName || hostname(item.originalLink) || "Untitled";
}

export function sourceLabel(item: Pick<Item, "type" | "siteName" | "originalLink" | "fileName">): string {
  if (item.type === "note") return "Note";
  if (item.siteName) return item.siteName;
  if (item.originalLink) return hostname(item.originalLink);
  if (item.fileName) return item.fileName;
  return "";
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function looksLikeUrl(text: string): boolean {
  const t = text.trim();
  if (/\s/.test(t) || t.length < 4) return false;
  return /^https?:\/\//i.test(t) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(t);
}
