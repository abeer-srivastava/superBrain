"use client";

import { useState, useEffect, useCallback } from "react";
import { contentAPI } from "@/lib/api";
import type { Content } from "@/types/content";

export function useContent() {
    const [contents, setContents] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await contentAPI.getAll();
            setContents(data);
        } catch (err: any) {
            console.error("Failed to fetch contents:", err);
            setError(err.response?.data?.message || "Failed to fetch contents");
        } finally {
            setLoading(false);
        }
    }, []);

    const addContent = useCallback(
        async (title: string, link: string, type: string) => {
            try {
                const newContent = await contentAPI.add(title, link, type);
                setContents((prev) => [newContent, ...prev]);
                return { success: true };
            } catch (err: any) {
                console.error("Failed to add content:", err);
                return {
                    success: false,
                    error: err.response?.data?.message || "Failed to add content",
                };
            }
        },
        []
    );

    const deleteContent = useCallback(async (contentId: string) => {
        try {
            await contentAPI.delete(contentId);
            setContents((prev) => prev.filter((c) => c.id !== contentId));
            return { success: true };
        } catch (err: any) {
            console.error("Failed to delete content:", err);
            return {
                success: false,
                error: err.response?.data?.message || "Failed to delete content",
            };
        }
    }, []);

    // Fetch contents on mount
    useEffect(() => {
        fetchContents();
    }, [fetchContents]);

    return {
        contents,
        loading,
        error,
        addContent,
        deleteContent,
        fetchContents,
    };
}
