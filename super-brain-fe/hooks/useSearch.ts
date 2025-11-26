"use client";

import { useState, useCallback, useEffect } from "react";
import { searchAPI } from "@/lib/api";
import type { SearchResult } from "@/types/content";

const LAST_QUERY_KEY = "lastSearchQuery";

export function useSearch() {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastQuery, setLastQuery] = useState<string>("");

    // Load last query from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(LAST_QUERY_KEY);
        if (saved) {
            setLastQuery(saved);
        }
    }, []);

    const search = useCallback(async (query: string) => {
        if (!query.trim()) {
            setError("Please enter a search query");
            return { success: false };
        }

        try {
            setLoading(true);
            setError(null);
            const data = await searchAPI.search(query);
            setResults(data);
            setLastQuery(query);
            localStorage.setItem(LAST_QUERY_KEY, query);
            return { success: true };
        } catch (err: any) {
            console.error("Search failed:", err);
            const errorMsg = err.response?.data?.message || "Search failed";
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const clearResults = useCallback(() => {
        setResults([]);
        setError(null);
    }, []);

    return {
        results,
        loading,
        error,
        lastQuery,
        search,
        clearResults,
    };
}
