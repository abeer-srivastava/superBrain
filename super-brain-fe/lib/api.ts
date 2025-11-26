import axios, { AxiosError } from "axios";
import type {
    Content,
    AuthResponse,
    SearchResult,
    ShareBrainResponse,
    SharedBrain,
} from "@/types/content";

// Create axios instance with base configuration
export const api = axios.create({
    baseURL: "http://localhost:3000/api/v1/user",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        console.log("Interceptor - token from localStorage:", token);
        console.log("Interceptor - token type:", typeof token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("Interceptor - Authorization header:", config.headers.Authorization);
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
            console.log("Signup - calling API with:", { username, email, password });
            // Backend returns { message, userId } - need to signin after signup
            const response = await api.post<{ message: string; userId: string }>("/signup", {
                username,
                email,
                password,
            });
            console.log("Signup - signup response:", response.data);

            // After successful signup, automatically sign in to get token
            console.log("Signup - now calling signin...");
            const signinResponse = await api.post("/signin", {
                email,
                password,
            });
            console.log("Signup - signin response:", signinResponse);
            console.log("Signup - signin response.data:", signinResponse.data);
            console.log("Signup - signin response.data type:", typeof signinResponse.data);

            // Backend returns token as plain string
            const token = typeof signinResponse.data === 'string' ? signinResponse.data : signinResponse.data.token;
            console.log("Signup - extracted token:", token);
            console.log("Signup - token type:", typeof token);

            if (!token || token === 'undefined') {
                throw new Error("No valid token received from server after signup");
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

    signin: async (email: string, password: string) => {
        try {
            console.log("Signin - calling API with:", { email, password });
            // Backend returns token as plain string wrapped in JSON response
            const response = await api.post("/signin", {
                email,
                password,
            });
            console.log("Signin - full response:", response);
            console.log("Signin - response.data:", response.data);
            console.log("Signin - response.data type:", typeof response.data);

            // response.data will be the token string directly
            const token = typeof response.data === 'string' ? response.data : response.data.token;
            console.log("Signin - extracted token:", token);
            console.log("Signin - token type:", typeof token);

            if (!token || token === 'undefined') {
                throw new Error("No valid token received from server");
            }

            return {
                token: token,
                user: { email, username: email.split('@')[0] }
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
        // Backend returns { contentData } not { contents }
        const response = await api.get<{ contentData: Content[] }>("/content");
        return response.data.contentData;
    },

    add: async (title: string, link: string, type: string) => {
        const response = await api.post<{ content: Content }>("/content", {
            title,
            link,
            type,
        });
        return response.data.content;
    },

    delete: async (contentId: string) => {
        const response = await api.delete("/content", {
            data: { contentId },
        });
        return response.data;
    },
};

// Search API
export const searchAPI = {
    search: async (query: string) => {
        const response = await api.post<{ results: SearchResult[] }>("/search", {
            query,
        });
        return response.data.results;
    },
};

// Share Brain API
export const shareBrainAPI = {
    toggleShare: async (share: boolean) => {
        const response = await api.post<{ message?: string; hash?: string }>("/share/brain", {
            share,
        });
        // Backend returns { hash } if existing, or { message: "Link created" + hash } if new
        if (response.data.hash) {
            return { hash: response.data.hash, message: "Sharing enabled" };
        } else if (response.data.message) {
            // Extract hash from message like "Link createdABC123"
            const hash = response.data.message.replace("Link created", "").trim();
            return { hash, message: response.data.message };
        }
        return response.data;
    },

    getSharedBrain: async (hash: string) => {
        // Backend returns { username, content } not { username, contents }
        const response = await api.get<{ username: string; content: Content[] }>(`/brain/${hash}`);
        return {
            username: response.data.username,
            contents: response.data.content
        };
    },
};
