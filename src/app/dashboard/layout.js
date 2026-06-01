"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ImageGenerationProvider } from "@/context/ImageGenerationContext";
import { NavigationBlocker } from "@/components/NavigationBlocker";
import { ProfileCompletionGuard } from "@/components/ProfileCompletionGuard";
import { Topbar } from "@/components/Topbar";
import { usePathname } from "next/navigation";

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
    const pathname = usePathname();
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
    const isViewerRoute = pathname === "/dashboard/images/view";

    // Shell renders immediately - children handle their own data fetching
    return (
        <div className="dark flex h-screen min-h-screen bg-surface-gradient">
            {/* Sidebar - renders instantly, no data dependencies */}
            {!isViewerRoute && (
                <Sidebar
                    collapsed={collapsed}
                    hovered={hovered}
                    setHovered={handleSetHovered}
                    setCollapsed={handleSetCollapsed}
                    isMobile={isMobile}
                />
            )}

            <div className="flex-1 flex flex-col">
                {/* Topbar - renders instantly */}
                {!isViewerRoute && <Topbar collapsed={collapsed && !hovered} />}

                {/* Main content - pages fetch data independently */}
                <main
                    className={`flex-1 overflow-y-auto transition-all duration-300 ${
                        isViewerRoute ? "p-0 mt-0" : "p-8 mt-16"
                    }`}
                    style={{
                        marginLeft: isViewerRoute ? 0 : `${isMobile ? 0 : sidebarWidth}px`,
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
