"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ImageGenerationProvider } from "@/context/ImageGenerationContext";
import { NavigationBlocker } from "@/components/NavigationBlocker";
import { ProfileCompletionGuard } from "@/components/ProfileCompletionGuard";
import { Topbar } from "@/components/Topbar";

/**
 * Dashboard Layout - Shell-first architecture
 * 
 * OPTIMIZATIONS:
 * - Renders shell (sidebar, topbar) immediately - no blocking
 * - Uses useCallback to prevent unnecessary re-renders
 * - Removed duplicate AuthProvider (already in root layout)
 * - Layout never waits for data - pages handle their own data fetching
 * 
 * This ensures instant UI appearance with progressive data loading.
 */
export default function DashboardLayout({ children }) {
    const [collapsed, setCollapsed] = useState(true);
    const [hovered, setHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Memoize resize handler to prevent unnecessary re-renders
    const handleResize = useCallback(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    useEffect(() => {
        // Set initial mobile state immediately (no delay)
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [handleResize]);

    // Memoize sidebar handlers to prevent re-renders
    const handleSetCollapsed = useCallback((value) => {
        setCollapsed(value);
    }, []);

    const handleSetHovered = useCallback((value) => {
        setHovered(value);
    }, []);

    // Compute sidebar width dynamically - no blocking
    const sidebarWidth = isMobile ? 0 : collapsed && !hovered ? 80 : 256; // px

    // Shell renders immediately - children handle their own data fetching
    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/20">
            {/* Sidebar - renders instantly, no data dependencies */}
            <Sidebar
                collapsed={collapsed}
                hovered={hovered}
                setHovered={handleSetHovered}
                setCollapsed={handleSetCollapsed}
                isMobile={isMobile}
            />

            <div className="flex-1 flex flex-col">
                {/* Topbar - renders instantly */}
                <Topbar collapsed={collapsed && !hovered} />

                {/* Main content - pages fetch data independently */}
                <main
                    className="flex-1 overflow-y-auto p-8 transition-all duration-300 mt-16"
                    style={{
                        marginLeft: `${isMobile ? 0 : sidebarWidth}px`,
                    }}
                >
                    {/* AuthProvider removed - already in root layout for global access */}
                    <ProfileCompletionGuard>
                        <ImageGenerationProvider>
                            <NavigationBlocker />
                            {children}
                        </ImageGenerationProvider>
                    </ProfileCompletionGuard>
                </main>
            </div>
        </div>
    );
}
