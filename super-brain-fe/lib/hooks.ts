"use client";

import useSWR, { useSWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";
import { useCallback, useEffect, useState } from "react";
import { api, fetcher } from "./api";
import type { Features, Item, Page, Related, ShareState, Stats, Thread, ThreadSummary, User } from "./types";

export function useMe() {
  const { data, error, isLoading, mutate } = useSWR<{ user: User }>("auth/me", fetcher, { shouldRetryOnError: false });
  return { user: data?.user ?? null, error, isLoading, mutate };
}

export function useFeatures() {
  const { data } = useSWR<Features>("health/features", fetcher, { revalidateOnFocus: false, dedupingInterval: 60_000 });
  return data;
}

export function useStats() {
  return useSWR<Stats>("content/stats", fetcher);
}

export interface LibraryFilter {
  type?: string;
  tag?: string;
  favorite?: boolean;
}

/** Paginated library with live polling while anything is still processing. */
export function useLibrary(filter: LibraryFilter) {
  const getKey = (index: number, prev: Page<Item> | null) => {
    if (prev && !prev.nextCursor) return null;
    return api.content.listPath({ ...filter, cursor: index === 0 ? undefined : prev?.nextCursor });
  };
  const swr = useSWRInfinite<Page<Item>>(getKey, fetcher, {
    revalidateFirstPage: true,
    refreshInterval: (pages) => (pages?.some((p) => p.items.some((i) => i.status === "processing")) ? 2500 : 0),
  });
  const items = swr.data?.flatMap((p) => p.items) ?? [];
  const hasMore = !!swr.data?.[swr.data.length - 1]?.nextCursor;
  return { ...swr, items, hasMore, loadMore: () => swr.setSize(swr.size + 1) };
}

export function useItem(id: string | null) {
  return useSWR<Item>(id ? `content/${id}` : null, fetcher, {
    refreshInterval: (data) => (data?.status === "processing" ? 2500 : 0),
  });
}

export function useRelated(id: string | null, enabled: boolean) {
  return useSWR<Related[]>(id && enabled ? api.content.relatedPath(id) : null, fetcher, { revalidateOnFocus: false });
}

export function useResurfaced() {
  return useSWR<Item[]>("content/resurface", fetcher, { revalidateOnFocus: false });
}

export function useThreads() {
  return useSWR<ThreadSummary[]>("ask/threads", fetcher);
}

export function useThread(id: string | null) {
  return useSWR<Thread>(id ? `ask/threads/${id}` : null, fetcher, { revalidateOnFocus: false });
}

export function useShare() {
  return useSWR<ShareState>("share", fetcher);
}

/** Revalidate every library-shaped cache (lists, stats, resurfacing) after a mutation. */
export function useRefreshLibrary() {
  const { mutate } = useSWRConfig();
  return useCallback(
    () =>
      mutate(
        (key) => {
          const k = Array.isArray(key) ? String(key[0] ?? "") : typeof key === "string" ? key : "";
          // SWR Infinite stores each paginated resource under an internal
          // `$inf$...` key. Match that namespace so library pages revalidate
          // after a capture, alongside the stats and resurfacing resources.
          return k.startsWith("content") || k.startsWith("$inf$");
        },
        undefined,
        { revalidate: true },
      ),
    [mutate],
  );
}

export function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useIsMac() {
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);
  return mac;
}
