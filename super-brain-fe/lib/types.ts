export type ContentKind = "link" | "note" | "pdf" | "image";
export type ContentStatus = "processing" | "ready" | "failed";

export interface Item {
  _id: string;
  type: ContentKind;
  title?: string;
  originalLink?: string;
  summary?: string;
  keyPoints: string[];
  tags: string[];
  annotation?: string;
  extractedText?: string;
  siteName?: string;
  author?: string;
  imageUrl?: string;
  wordCount?: number;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  status: ContentStatus;
  error?: string;
  favorite: boolean;
  isPrivate: boolean;
  lastViewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface Stats {
  total: number;
  favorites: number;
  processing: number;
  failed: number;
  words: number;
  thisWeek: number;
  byType: Partial<Record<ContentKind, number>>;
  tags: { tag: string; count: number }[];
}

export interface SearchHit {
  item: Item;
  score: number;
  snippet: string;
  matched: ("semantic" | "keyword" | "title")[];
}

export interface Related {
  item: Item;
  score: number;
  passage: string;
}

export interface Source {
  n: number;
  contentId: string;
  title: string;
  type: ContentKind;
  url?: string | null;
  siteName?: string | null;
  snippet?: string;
  createdAt?: string | null;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources: Source[];
  createdAt?: string;
}

export interface ThreadSummary {
  _id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface Thread {
  _id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

export interface ShareState {
  enabled: boolean;
  hash: string | null;
}

export interface Features {
  ai: "ok" | "missing" | "rejected";
  ask: boolean;
  enrichment: boolean;
  imageReading: boolean;
}

export interface PublicItem {
  id: string;
  title?: string;
  type: ContentKind;
  originalLink: string;
  summary?: string;
  tags: string[];
  siteName?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface PublicBrain {
  owner: { username: string; displayName: string | null };
  items: PublicItem[];
}
