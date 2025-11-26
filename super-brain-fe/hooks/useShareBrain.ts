"use client";

import { useState, useCallback, useEffect } from "react";
import { shareBrainAPI } from "@/lib/api";

const SHARE_STATE_KEY = "shareBrainState";

export function useShareBrain() {
    const [isShared, setIsShared] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Load share state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(SHARE_STATE_KEY);
        if (saved) {
            try {
                const { isShared: shared, shareLink: link } = JSON.parse(saved);
                setIsShared(shared);
                setShareLink(link);
            } catch (error) {
                console.error("Failed to parse share state:", error);
            }
        }
    }, []);

    const toggleShare = useCallback(async () => {
        try {
            setLoading(true);
            const newShareState = !isShared;
            const data = await shareBrainAPI.toggleShare(newShareState);

            setIsShared(newShareState);

            if (newShareState && data.hash) {
                const link = `${window.location.origin}/share/${data.hash}`;
                setShareLink(link);
                localStorage.setItem(
                    SHARE_STATE_KEY,
                    JSON.stringify({ isShared: true, shareLink: link })
                );
            } else {
                setShareLink(null);
                localStorage.setItem(
                    SHARE_STATE_KEY,
                    JSON.stringify({ isShared: false, shareLink: null })
                );
            }

            return { success: true, message: data.message };
        } catch (err: any) {
            console.error("Failed to toggle share:", err);
            return {
                success: false,
                error: err.response?.data?.message || "Failed to toggle share",
            };
        } finally {
            setLoading(false);
        }
    }, [isShared]);

    return {
        isShared,
        shareLink,
        loading,
        toggleShare,
    };
}
