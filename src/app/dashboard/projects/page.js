"use client";

import {
    Clock,
    FileText,
    CheckCircle,
    Zap,
    Search,
    Eye,
    Download,
    Plus,
    Trash2,
    Image as ImageIcon,
    FolderKanban,
    MoreVertical,
    BarChart3
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
import { dataCache, cacheKeys } from "@/lib/data-cache";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectCardSkeleton } from "@/components/project/ProjectCardSkeleton"

export default function Dashboard() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("All");

    useEffect(() => {
        const fetchProjects = async () => {
            if (!token) return;
            
            try {
                setLoading(true);
                
                // Use getOrFetch for automatic cache-first strategy + request deduplication
                const cacheKey = cacheKeys.projectsList();
                const projectsData = await dataCache.getOrFetch(
                    cacheKey,
                    async () => {
                        const response = await apiService.getProjects(token);
                        return response.projects || [];
                    },
                    2 * 60 * 1000 // 2 minutes cache
                );
                
                setProjects(projectsData);
                setLoading(false);

                // Prefetch project detail pages for instant navigation - batch prefetch
                // Prefetch top 5 projects immediately, rest in background
                const projectsToPrefetch = projectsData.slice(0, 5);
                projectsToPrefetch.forEach(project => {
                    const projectPath = `/dashboard/projects/${project.slug || project.id}`;
                    router.prefetch(projectPath);
                });
                
                // Prefetch remaining projects in background (non-blocking)
                setTimeout(() => {
                    projectsData.slice(5, 10).forEach(project => {
                        const projectPath = `/dashboard/projects/${project.slug || project.id}`;
                        router.prefetch(projectPath);
                    });
                }, 100);
            } catch (err) {
                console.error("Error fetching projects:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProjects();
    }, [token, router]);

    const handleDeleteProject = useCallback(async (projectId) => {
        if (!confirm(t("dashboard.deleteConfirm"))) return;
        try {
            await apiService.deleteProject(projectId, token);
            setProjects((prev) => prev.filter((p) => p.id !== projectId));
        } catch (err) {
            console.error("Error deleting project:", err);
            toast.error(t("dashboard.deleteFailed"));
        }
    }, [token, t]);

    // Format time ago - memoized
    const getTimeAgo = useCallback((dateString) => {
        if (!dateString) return t("dashboard.unknown");
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInHours < 1) {
            return t("dashboard.justNow");
        } else if (diffInHours < 24) {
            return `${diffInHours} ${diffInHours === 1 ? t("dashboard.hour") : t("dashboard.hours")} ${t("dashboard.ago")}`;
        } else if (diffInDays === 1) {
            return `1 ${t("dashboard.day")} ${t("dashboard.ago")}`;
        } else {
            return `${diffInDays} ${t("dashboard.days")} ${t("dashboard.ago")}`;
        }
    }, [t]);

    // --- Filter logic for Tabs + Search --- Memoized for performance
    const filteredProjects = useMemo(() => {
        const searchLower = searchQuery.toLowerCase();
        return projects.filter((project) => {
            const matchesSearch = project.name?.toLowerCase().includes(searchLower);

            const matchesTab =
                activeTab === t("dashboard.all") ||
                (activeTab === t("dashboard.inProgressTab") && project.status === "progress") ||
                (activeTab === t("dashboard.completed") && project.status === "completed") ||
                (activeTab === t("dashboard.draft") && project.status === "draft");

            return matchesSearch && matchesTab;
        });
    }, [projects, searchQuery, activeTab, t]);

    // Show skeleton immediately - never block the page
    const showSkeletons = loading && projects.length === 0;

    if (error) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-400 mb-2">
                        Error Loading Projects
                    </h2>
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground">{t("dashboard.projects")}</h1>
                        <p className="text-muted-foreground">{t("dashboard.organizeCampaigns")}</p>
                    </div>
                    <Link href="/dashboard/projects/create">
                        <Button variant="brand" className="font-medium px-6 py-3 h-auto rounded-xl shadow-md hover:shadow-lg flex items-center gap-2">
                            <Plus className="w-4 h-4" /> {t("dashboard.createNewProject")}
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t("dashboard.searchProjects")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-input border border-input rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground shadow-sm focus:ring-2 focus:ring-ring focus:border-ring transition"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-3 border-b border-border">
                    {[t("dashboard.all"), t("dashboard.inProgressTab"), t("dashboard.completed")].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-all duration-200
                    ${activeTab === tab
                                    ? "text-gold-solid border-b-2 border-gold-solid bg-card shadow-sm"
                                    : "text-muted-foreground hover:text-gold-solid hover:bg-card/60"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {/* Show skeletons while loading - zero blocking */}
                    {showSkeletons && (
                        <>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <ProjectCardSkeleton key={`skeleton-${i}`} />
                            ))}
                        </>
                    )}
                    
                    {/* Render projects as they load - progressive enhancement */}
                    {filteredProjects.map((project) => {
                        const statusText = project.status === "progress"
                            ? t("dashboard.inProgressTab")
                            : project.status === "completed"
                                ? t("dashboard.completed")
                                : t("dashboard.draft");

                        const statusBgColor = project.status === "progress"
                            ? "bg-amber-500/15 text-amber-400"
                            : project.status === "completed"
                                ? "bg-gold-solid/20 text-gold-solid"
                                : "bg-muted text-muted-foreground";

                        const updatedAt = project.updated_at || project.created_at;
                        const imageCount = project.total_images || project.collection?.items?.[0]?.product_images?.length || 0;
                        const collaborators = project.team_members || [];

                        return (
                            <Link
                                key={project.id}
                                href={`/dashboard/projects/${project.slug ? project.slug : project.id}`}
                                prefetch={true}
                                className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg hover:border-gold-muted transition-all duration-300 relative block cursor-pointer"
                            >
                                {/* Top Right Menu */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteProject(project.id);
                                    }}
                                    className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition z-10"
                                    aria-label="Delete project"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>

                                {/* Folder Icon */}
                                <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center mb-4">
                                    <BarChart3 className="w-6 h-6 text-primary-foreground" />
                                </div>

                                {/* Project Title */}
                                <h3 className="text-lg font-bold text-foreground mb-3">
                                    {project.name}
                                </h3>

                                {/* Status Badge */}
                                <div className="mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBgColor}`}>
                                        {statusText}
                                    </span>
                                </div>

                                {/* Images and Updated Time */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground">
                                        {imageCount} {imageCount === 1 ? 'image' : 'images'}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Updated {getTimeAgo(updatedAt)}
                                    </span>
                                </div>

                                {/* Collaborators and Open Button */}
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="flex items-center gap-1.5">
                                        {collaborators.length > 0 ? (
                                            <>
                                                {collaborators.slice(0, 3).map((member, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-gold-solid border-2 border-card"
                                                    >
                                                        {member.full_name?.[0]?.toUpperCase() || 'A'}
                                                    </div>
                                                ))}
                                                {collaborators.length > 3 && (
                                                    <span className="text-xs text-muted-foreground ml-1">
                                                        +{collaborators.length - 3}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-gold-solid border-2 border-card">
                                                A
                                            </div>
                                        )}
                                    </div>
                                    <span
                                        className="text-sm font-medium text-gold-solid hover:brightness-110 transition"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Open
                                    </span>
                                </div>
                            </Link>
                        );
                    })}

                    {/* Create New Card */}
                    <Link
                        href="/dashboard/projects/create"
                        className="border-2 border-dashed border-gold-muted rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-gold-solid/5 hover:border-gold-solid hover:bg-gold-solid/10 transition"
                    >
                        <div className="w-16 h-16 rounded-full bg-gold-solid/15 flex items-center justify-center mb-4">
                            <Plus className="w-8 h-8 text-gold-solid" />
                        </div>
                        <h3 className="font-bold text-foreground mb-2">Create New Project</h3>
                        <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
                            Start a new campaign photoshoot with multiple products and themes
                        </p>
                    </Link>
                </div>

                {/* Empty State */}
                {filteredProjects.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {searchQuery ? t("dashboard.noProjects") : t("dashboard.noProjects")}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery
                                ? "Try adjusting your search terms."
                                : "Create your first project to get started."}
                        </p>
                        {!searchQuery && (
                            <Link href="/dashboard/projects/create">
                                <Button variant="brand" className="px-6 py-3 h-auto rounded-lg">
                                    Create Project
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
        </div>
    );

}
