"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import type { User } from "@/types/content";

export function useAuth() {
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window === "undefined") return null;
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return null;
        try {
            return JSON.parse(storedUser) as User;
        } catch (error) {
            console.error("Failed to parse user data:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            return null;
        }
    });
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return Boolean(localStorage.getItem("token") && localStorage.getItem("user"));
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const signup = useCallback(
        async (username: string, email: string, password: string) => {
            try {
                const data = await authAPI.signup(username, email, password);
                console.log("Signup response data:", data);
                console.log("Token type:", typeof data.token);
                console.log("Token value:", data.token);

                // Ensure token is a string
                const tokenString = String(data.token);
                console.log("Token string:", tokenString);

                localStorage.setItem("token", tokenString);
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                setIsAuthenticated(true);
                router.push("/dashboard");
                return { success: true };
            } catch (error: any) {
                console.error("Signup failed:", error);
                return {
                    success: false,
                    error: error.response?.data?.message || "Signup failed",
                };
            }
        },
        [router]
    );

    const signin = useCallback(
        async (email: string, password: string) => {
            try {
                const data = await authAPI.signin(email, password);
                console.log("Signin response data:", data);
                console.log("Token type:", typeof data.token);
                console.log("Token value:", data.token);

                // Ensure token is a string
                const tokenString = String(data.token);
                console.log("Token string:", tokenString);

                localStorage.setItem("token", tokenString);
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                setIsAuthenticated(true);
                router.push("/dashboard");
                return { success: true };
            } catch (error: any) {
                console.error("Signin failed:", error);
                return {
                    success: false,
                    error: error.response?.data?.message || "Invalid credentials",
                };
            }
        },
        [router]
    );

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
        router.push("/auth/signin");
    }, [router]);

    return {
        user,
        loading,
        isAuthenticated,
        signup,
        signin,
        logout,
    };
}
