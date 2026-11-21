/**
 * Typed client for the SuperBrain API. All calls go to the same-origin
 * `/api/v1` proxy, so the httpOnly session cookie travels automatically and
 * no token is ever readable by page scripts.
 */
import type { Item, Page, PublicBrain, Related, SearchHit, ShareState, Source, Stats, Thread, ThreadSummary, User, Features } from "./types";

export const API_BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
  fieldError(path: string) {
    return this.errors?.find((e) => e.path === path)?.message;
  }
}

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${path.replace(/^\//, "")}`, {
      credentials: "same-origin",
      ...rest,
      headers: {
        Accept: "application/json",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError(0, "Can't reach SuperBrain. Check your connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data?.message || `Request failed (${res.status})`, data?.errors);
  }
  return data as T;
}

/** SWR fetcher. */
export const fetcher = <T,>(path: string) => request<T>(path);

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const api = {
  auth: {
    me: () => request<{ user: User }>("auth/me"),
    signin: (identifier: string, password: string) => request<{ user: User }>("auth/signin", { method: "POST", json: { identifier, password } }),
    signup: (username: string, email: string, password: string) =>
      request<{ user: User }>("auth/signup", { method: "POST", json: { username, email, password } }),
    signout: () => request<{ ok: true }>("auth/signout", { method: "POST" }),
    signoutAll: () => request<{ ok: true }>("auth/signout-all", { method: "POST" }),
  },
  account: {
    update: (data: { displayName: string | null }) => request<{ user: User }>("account", { method: "PATCH", json: data }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ ok: true }>("account/password", { method: "POST", json: { currentPassword, newPassword } }),
    delete: (password: string) => request<{ ok: true }>("account", { method: "DELETE", json: { password } }),
    exportUrl: `${API_BASE}/account/export`,
  },
  content: {
    listPath: (q: { type?: string; tag?: string; favorite?: boolean; cursor?: string | null; limit?: number }) =>
      `content${qs({ type: q.type, tag: q.tag, favorite: q.favorite ? "true" : undefined, cursor: q.cursor, limit: q.limit ?? 30 })}`,
    get: (id: string) => request<Item>(`content/${id}`),
    createLink: (originalLink: string, extra: { title?: string; tags?: string[]; annotation?: string } = {}) =>
      request<Item>("content", { method: "POST", json: { type: "link", originalLink, ...extra } }),
    createNote: (extractedText: string, extra: { title?: string; tags?: string[] } = {}) =>
      request<Item>("content", { method: "POST", json: { type: "note", extractedText, ...extra } }),
    upload: (file: File, extra: { title?: string; tags?: string[] } = {}) => {
      const form = new FormData();
      form.append("file", file);
      if (extra.title) form.append("title", extra.title);
      if (extra.tags?.length) form.append("tags", extra.tags.join(","));
      return request<Item>("content/upload", { method: "POST", body: form });
    },
    update: (id: string, data: Partial<Pick<Item, "title" | "tags" | "favorite" | "isPrivate" | "extractedText">> & { annotation?: string | null }) =>
      request<Item>(`content/${id}`, { method: "PATCH", json: data }),
    remove: (id: string) => request<{ ok: true }>(`content/${id}`, { method: "DELETE" }),
    reprocess: (id: string) => request<{ status: string }>(`content/${id}/reprocess`, { method: "POST" }),
    reindex: () => request<{ queued: number }>("content/reindex", { method: "POST" }),
    fileUrl: (id: string) => `${API_BASE}/content/${id}/file`,
    relatedPath: (id: string) => `content/${id}/related`,
  },
  search: (q: string, type?: string) => request<{ results: SearchHit[] }>(`search${qs({ q, type, limit: 12 })}`),
  share: {
    toggle: (enabled: boolean) => request<ShareState>("share", { method: "POST", json: { enabled } }),
    rotate: () => request<ShareState>("share/rotate", { method: "POST" }),
    public: (hash: string) => request<PublicBrain>(`public/${encodeURIComponent(hash)}`),
  },
  threads: {
    rename: (id: string, title: string) => request<Thread>(`ask/threads/${id}`, { method: "PATCH", json: { title } }),
    remove: (id: string) => request<{ ok: true }>(`ask/threads/${id}`, { method: "DELETE" }),
  },
};

export type { Item, Page, Related, Stats, ThreadSummary, Thread, ShareState, Features };

export interface AskHandlers {
  onSources?: (sources: Source[]) => void;
  onToken?: (delta: string) => void;
  onThread?: (thread: { id: string; title: string }) => void;
  onError?: (message: string) => void;
}

/** Streams an answer over server-sent events (POST, so EventSource can't be used). */
export async function askStream(
  question: string,
  opts: { threadId?: string; contentId?: string },
  handlers: AskHandlers,
  signal?: AbortSignal,
) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/ask`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ question, threadId: opts.threadId, contentId: opts.contentId }),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    handlers.onError?.("Can't reach SuperBrain. Check your connection and try again.");
    return;
  }
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    handlers.onError?.(data?.message || "Something went wrong. Please try again.");
    return;
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) >= 0) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const event = /^event: (.*)$/m.exec(raw)?.[1];
        const dataLine = /^data: (.*)$/m.exec(raw)?.[1];
        if (!event || dataLine === undefined) continue;
        const data = JSON.parse(dataLine);
        if (event === "sources") handlers.onSources?.(data);
        else if (event === "token") handlers.onToken?.(data);
        else if (event === "thread") handlers.onThread?.(data);
        else if (event === "error") handlers.onError?.(data.message);
      }
    }
  } catch (e) {
    if ((e as Error).name !== "AbortError") handlers.onError?.("The connection was interrupted.");
  }
}
