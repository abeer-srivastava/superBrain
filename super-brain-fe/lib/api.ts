import axios, { AxiosError } from "axios";
import type {
    Content,
    AuthResponse,
    SearchResult,
    ShareBrainResponse,
    SharedBrain,
} from "@/types/content";

// Create axios instance with base configuration
const DEFAULT_API_URL = "http://localhost:3000/api/v1/";
const API_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;

export const api = axios.create({
    baseURL: API_URL.endsWith("/") ? API_URL : `${API_URL}/`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (typeof window !== "undefined") {
                window.location.href = "/auth/signin";
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: async (username: string, email: string, password: string) => {
        try {
            const response = await api.post<{ token: string }>("signup", {
                username,
                email,
                password,
            });

            const token = response.data.token;
            if (!token) {
                throw new Error("No token received from server after signup");
            }

            return {
                token: token,
                user: { username, email }
            };
        } catch (error) {
            console.error("Signup API error:", error);
            throw error;
        }
    },

    signin: async (username: string, password: string) => {
        try {
            const response = await api.post<{ token: string }>("signin", {
                username,
                password,
            });

            const token = response.data.token;
            if (!token) {
                throw new Error("No token received from server");
            }

            return {
                token: token,
                user: { username, email: "" }
            };
        } catch (error) {
            console.error("Signin API error:", error);
            throw error;
        }
    },
};

// Content API
export const contentAPI = {
    getAll: async () => {
        const response = await api.get<Content[]>("content");
        return response.data;
    },

    add: async (title: string, link: string, type: string, extractedText?: string, file?: File) => {
        if (file) {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("type", type);
            if (extractedText) formData.append("extractedText", extractedText);
            formData.append("file", file);

            const response = await api.post<Content>("content/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } else {
            const response = await api.post<Content>("content", {
                title,
                originalLink: link,
                type,
                extractedText,
            });
            return response.data;
        }
    },

    delete: async (contentId: string) => {
        const response = await api.delete(`content/${contentId}`);
        return response.data;
    },
};

// Search API
export const searchAPI = {
    search: async (query: string) => {
        const response = await api.get<any[]>(`ai/search`, {
            params: { q: query }
        });
        
        return response.data.map(item => ({
            id: item.id,
            score: item.score,
            title: item.payload?.title || "Untitled",
            link: item.payload?.link || "#",
            type: item.payload?.type || "unknown"
        }));
    },
    ask: async (query: string) => {
        const response = await api.post<{ answer: string; sources: any[] }>(`ai/ask`, {
            query,
        });
        return response.data;
    }
};

// Share Brain API
export const shareBrainAPI = {
    toggleShare: async (share: boolean) => {
        const response = await api.post<{ hash?: string; message?: string }>("brain/share", {
            share,
        });
        return response.data;
    },

    getSharedBrain: async (hash: string) => {
        const response = await api.get<{ username: string; content: Content[] }>(`brain/${hash}`);
        return {
            username: response.data.username,
            contents: response.data.content
        };
    },
};
