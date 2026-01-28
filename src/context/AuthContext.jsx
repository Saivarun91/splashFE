"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Load saved token & user from localStorage (client-side only)
    useEffect(() => {
        if (typeof window !== "undefined") {
            // First check if token is passed via URL (from organization portal switch)
            const urlParams = new URLSearchParams(window.location.search);
            const tokenFromUrl = urlParams.get("token");
            const userFromUrl = urlParams.get("user");
            const fromPortal = urlParams.get("from");

            if (tokenFromUrl && fromPortal === "org") {
                // Token passed from organization portal - authenticate automatically
                try {
                    const decodedToken = decodeURIComponent(tokenFromUrl);
                    const decodedUser = userFromUrl ? JSON.parse(decodeURIComponent(userFromUrl)) : null;

                    if (decodedUser) {
                        localStorage.setItem("token", decodedToken);
                        localStorage.setItem("user", JSON.stringify(decodedUser));
                        setToken(decodedToken);
                        setUser(decodedUser);

                        // Set preferred language if available
                        if (decodedUser.preferred_language) {
                            localStorage.setItem('preferredLanguage', decodedUser.preferred_language);
                        }

                        // Clean URL
                        window.history.replaceState({}, document.title, window.location.pathname);

                        // Check if profile is incomplete and redirect if not on complete-profile page
                        if (!decodedUser.profile_completed && window.location.pathname !== "/complete-profile") {
                            const publicPages = ["/login", "/signup", "/forgot-password", "/reset-password", "/"];
                            if (!publicPages.includes(window.location.pathname)) {
                                router.push("/complete-profile");
                            }
                        }
                        setIsLoading(false);
                        return;
                    }
                } catch (error) {
                    console.error("Error processing token from URL:", error);
                }
            }

            // Check for existing token in localStorage
            const savedToken = localStorage.getItem("token");
            const savedUser = localStorage.getItem("user");

            if (savedToken && savedUser) {
                const userData = JSON.parse(savedUser);
                setToken(savedToken);
                setUser(userData);
                
                // Check if profile is incomplete and redirect if not on complete-profile page
                if (!userData.profile_completed && window.location.pathname !== "/complete-profile") {
                    // Don't redirect if on public pages
                    const publicPages = ["/login", "/signup", "/forgot-password", "/reset-password", "/"];
                    if (!publicPages.includes(window.location.pathname)) {
                        router.push("/complete-profile");
                    }
                }
            }
            setIsLoading(false);
        }
    }, [router]);

    // LOGIN function
    const login = async (email, password) => {
        try {
            const data = await apiService.login(email, password);

            if (data?.token) {
                setToken(data.token);
                setUser({
                    email: data.user.email,
                    role: data.user.role,
                    profile_completed: data.user.profile_completed,
                    organization: data.user.organization,
                    organization_role: data.user.organization_role,
                    preferred_language: data.user.preferred_language || 'en',
                });

                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                
                // Set language preference if available
                if (data.user.preferred_language && typeof window !== 'undefined') {
                    localStorage.setItem('preferredLanguage', data.user.preferred_language);
                }

                toast.success("Login successful");
                
                // Check if profile is completed
                if (!data.user.profile_completed) {
                    router.push("/complete-profile");
                } else {
                    router.push("/dashboard");
                }
                return data;
            } else {
                const errorMessage = "Invalid login response";
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            // Extract error message from API response if available
            const errorMessage = "Login failed. Please check your credentials.";
            toast.error(errorMessage);
            console.error("Login error:", error);
            throw error; // Re-throw so caller knows login failed
        }
    };

    // LOGOUT function
    const logout = () => {
        // Clear token and user first
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        toast.success("Logged out successfully");
        // Navigate to login page
        router.push("/login");
    };

    // Refresh user data from localStorage
    const refreshUser = () => {
        if (typeof window !== "undefined") {
            const savedUser = localStorage.getItem("user");
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                setUser(userData);
            }
        }
    };

    // Context value (only provide once token & user are loaded)
    const value = {
        user,
        token,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!token,
        isLoading,
    };

    // Wait until loading finishes before rendering children
    if (isLoading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
