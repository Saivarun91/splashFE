"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/lib/api";

/**
 * ProfileCompletionGuard - Redirects users with incomplete profiles to complete-profile page
 * This component should wrap protected routes to ensure profile completion
 */
export function ProfileCompletionGuard({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, token, isAuthenticated, isLoading } = useAuth();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Skip check if not authenticated or still loading
        if (isLoading || !isAuthenticated) {
            setChecking(false);
            return;
        }

        // Allow access to complete-profile page
        if (pathname === "/complete-profile") {
            setChecking(false);
            return;
        }

        // Allow access to login, signup, forgot-password, reset-password pages
        const publicPages = ["/login", "/signup", "/forgot-password", "/reset-password"];
        if (publicPages.includes(pathname)) {
            setChecking(false);
            return;
        }

        // Check profile completion status
        const checkProfileCompletion = async () => {
            try {
                // First check localStorage
                const savedUser = localStorage.getItem("user");
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    if (!userData.profile_completed) {
                        router.push("/complete-profile");
                        return;
                    }
                }

                // Also verify with API to ensure data is up-to-date
                if (token) {
                    try {
                        const response = await apiService.getUserProfile(token);
                        if (response.success && response.user) {
                            if (!response.user.profile_completed) {
                                // Update localStorage
                                localStorage.setItem("user", JSON.stringify(response.user));
                                router.push("/complete-profile");
                                return;
                            }
                        }
                    } catch (error) {
                        console.error("Failed to verify profile:", error);
                        // If API fails, rely on localStorage check
                    }
                }
            } catch (error) {
                console.error("Profile check error:", error);
            } finally {
                setChecking(false);
            }
        };

        checkProfileCompletion();
    }, [user, token, isAuthenticated, isLoading, pathname, router]);

    // Show loading while checking
    if (checking || isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
