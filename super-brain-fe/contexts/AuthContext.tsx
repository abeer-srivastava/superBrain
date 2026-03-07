"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import type { User } from "@/types/content";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Failed to parse user data:", error);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    const signup = useCallback(async (username: string, email: string, password: string) => {
        try {
            const data = await authAPI.signup(username, email, password);
            localStorage.setItem("token", String(data.token));
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
            setIsAuthenticated(true);
            router.push("/dashboard");
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.message || "Signup failed" };
        }
    }, [router]);

    const signin = useCallback(async (username: string, password: string) => {
        try {
            const data = await authAPI.signin(username, password);
            localStorage.setItem("token", String(data.token));
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
            setIsAuthenticated(true);
            router.push("/dashboard");
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.message || "Invalid credentials" };
        }
    }, [router]);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
        router.push("/auth/signin");
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, signup, signin, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
}
