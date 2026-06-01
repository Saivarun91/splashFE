"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Image, FolderKanban, Zap, TrendingUp, Mail } from "lucide-react";
import { FaCoins } from "react-icons/fa";
import { RiAiGenerate2 } from "react-icons/ri";
import PendingInvitations from "@/components/PendingInvitations";
import { useAuth } from "@/context/AuthContext";
import { useCredits } from "@/context/CreditsContext";
import { apiService } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export default function Dashboard() {
    const { user, token } = useAuth();
    const { t } = useLanguage();
    const [recentImages, setRecentImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const { organizationCredits, userCredits, creditsLoading } = useCredits();
    const [stats, setStats] = useState({
        activeProjects: 0,
        inProgressProjects: 0,
        completedProjects: 0,
        totalImages: 0,
        imagesGenerated: 0
    });

    const currentHour = new Date().getHours();

    let greeting = "";
    
    if (currentHour >= 0 && currentHour < 12) {
        greeting = t("dashboard.goodMorning");
    } 
    else if (currentHour >= 12 && currentHour < 18) {
        greeting = t("dashboard.goodAfternoon");
    } 
    else {
        greeting = t("dashboard.goodEvening");
    }

    // Get user display name
    const getUserDisplayName = () => {
        if (user?.full_name) {
            return user.full_name;
        }
        if (user?.username) {
            return user.username;
        }
        if (user?.email) {
            return user.email.split('@')[0];
        }
        return t("dashboard.user");
    };

    // Fetch projects data
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Fetch projects
                const projectsResponse = await apiService.getProjects(token);
                if (projectsResponse?.projects) {
                    const projectsData = projectsResponse.projects;

                    // Calculate stats
                    const activeProjects = projectsData.length;
                    const inProgressStatuses = new Set(["progress", "in_progress", "in-progress", "active"]);
                    const inProgress = projectsData.filter((p) =>
                        inProgressStatuses.has(String(p?.status || "").toLowerCase())
                    ).length;
                    const completed = projectsData.filter(
                        (p) => String(p?.status || "").toLowerCase() === "completed"
                    ).length;
                    const totalImages = projectsData.reduce((sum, p) => sum + (p.total_images || 0), 0);
                    const imagesGenerated = projectsData.reduce((sum, p) => sum + (p.images_generated || 0), 0);

                    setStats({
                        activeProjects: activeProjects,
                        inProgressProjects: inProgress,
                        completedProjects: completed,
                        totalImages: totalImages,
                        imagesGenerated: imagesGenerated
                    });
                
                }

                // Fetch recent images from ImageGenerationHistory
                const imagesResponse = await apiService.getRecentImages(token);
                if (imagesResponse?.success && imagesResponse?.images) {
                    setRecentImages(imagesResponse.images);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [token]);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Welcome Section */}
            <div className="relative p-4 rounded-xl bg-card shadow-md border border-border overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-tr from-gold-solid/20 to-gold-muted/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-foreground">{greeting}, {getUserDisplayName()}</h1>
                </div>
            </div>

            {/* Credits & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Credits */}
                {/* <Link href="/my-account/billing"> */}
                    <div className="p-4 bg-card border border-border rounded-xl shadow-sm transition-all duration-300 hover:border-gold-muted">
                        <div className="flex justify-between items-center pb-2">
                            <span className="text-sm font-medium text-muted-foreground">{t("dashboard.remainingCredits")}</span>
                            <FaCoins className="w-6 h-6 text-gold-solid" />
                        </div>
                        <div>
                            {creditsLoading ? (
                                <div className="text-2xl font-bold text-foreground">...</div>
                            ) : organizationCredits ? (
                                <>
                                    <div className="text-2xl font-bold text-gold-solid">
                                        {organizationCredits.balance.toLocaleString()}
                                    </div>
                                    <div className="w-full bg-muted h-2 rounded-full mt-2">
                                        <div 
                                            className="bg-gold-gradient h-2 rounded-full transition-all"
                                            style={{ 
                                                width: organizationCredits.balance > 0 
                                                    ? `${Math.min((organizationCredits.balance / 10000) * 100, 100)}%` 
                                                    : '0%' 
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {organizationCredits.organizationName} • {t("dashboard.organizationCredits")}
                                    </p>
                                </>
                            ) : userCredits ? (
                                <>
                                    <div className="text-2xl font-bold text-gold-solid">
                                        {userCredits.balance.toLocaleString()}
                                    </div>
                                    {/* <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                                        <div 
                                            className="bg-indigo-500 h-2 rounded-full transition-all"
                                            style={{ 
                                                width: userCredits.balance && userCredits.balance > 0 
                                                    ? `${Math.min((userCredits.balance / 10000) * 100, 100)}%` 
                                                    : '0%' 
                                            }}
                                        />
                                    </div> */}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t("dashboard.individualCredits") || "Individual user credits"}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-gray-900">0</div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                                        <div className="bg-indigo-500 h-2 rounded-full w-0" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {t("dashboard.noOrganizationAssigned")}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                {/* </Link> */}

                {/* Images Generated */}
                <div className="p-4 bg-card border border-border rounded-xl shadow-sm hover:border-gold-muted transition-colors">
                    <div className="flex justify-between items-center pb-2">
                        <span className="text-sm font-medium text-muted-foreground">{t("dashboard.imagesGenerated")}</span>
                        <RiAiGenerate2  className="w-6 h-6 text-gold-solid" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gold-solid">
                            {loading ? "..." : stats.imagesGenerated}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            {loading ? t("common.loading") : t("dashboard.totalImagesGenerated")}
                        </p>
                    </div>
                </div>

                {/* Active Projects */}
                <div className="p-4 bg-card border border-border rounded-xl shadow-sm hover:border-gold-muted transition-colors">
                    <div className="flex justify-between items-center pb-2">
                        <span className="text-sm font-medium text-muted-foreground">{t("dashboard.activeProjects")}</span>
                        <FolderKanban className="w-6 h-6 text-gold-solid" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gold-solid">
                            {loading ? "..." : stats.activeProjects}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {loading ? t("common.loading") : `${stats.inProgressProjects} ${t("dashboard.inProgress")} • ${stats.completedProjects} ${t("dashboard.completed")}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* ✅ Pending Invitations Section */}
            {/* <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-6 h-6 text-indigo-500" />
                    <div>
                        <h2 className="text-xl font-bold bg-[linear-gradient(135deg,hsl(250,70%,60%),hsl(260,75%,65%))] bg-clip-text text-transparent">
                            Pending Invitations
                        </h2>
                        <p className="text-gray-500 text-sm">Review and respond to project invitations</p>
                    </div>
                </div>

                <PendingInvitations /> {/* ✅ Plugged in full component */}
            {/* </div>  */}

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">{t("dashboard.quickActions")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Plain Image */}
                    <Link href="/dashboard/images/white-bg">
                        <div className="p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg hover:border-gold-muted transition-all duration-300 cursor-pointer group text-center">
                            <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center rounded-xl bg-secondary group-hover:bg-gold-solid/20 transition">
                                <Image className="w-5 h-5 text-gold-solid" />
                            </div>
                            <h3 className="font-semibold text-foreground text-sm mb-1">{t("dashboard.plainImage")}</h3>
                            <p className="text-xs text-muted-foreground">{t("dashboard.cleanProductShots")}</p>
                        </div>
                    </Link>

                    {/* Themed Image */}
                    <Link href="/dashboard/images/replace-bg">
                        <div className="p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg hover:border-gold-muted transition-all duration-300 cursor-pointer group text-center">
                            <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center rounded-xl bg-gold-solid/15 group-hover:bg-gold-solid/25 transition">
                                <Sparkles className="w-5 h-5 text-gold-solid" />
                            </div>
                            <h3 className="font-semibold text-foreground text-sm mb-1">{t("dashboard.themedImage")}</h3>
                            <p className="text-xs text-muted-foreground">{t("dashboard.lifestyleShots")}</p>
                        </div>
                    </Link>

                    {/* Model Images */}
                    <Link href="/dashboard/images/model-generation">
                        <div className="p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg hover:border-gold-muted transition-all duration-300 cursor-pointer group text-center">
                            <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center rounded-xl bg-secondary group-hover:bg-gold-solid/20 transition">
                                <Image className="w-5 h-5 text-gold-solid" />
                            </div>
                            <h3 className="font-semibold text-foreground text-sm mb-1">{t("dashboard.modelImages")}</h3>
                            <p className="text-xs text-muted-foreground">{t("dashboard.aiOrHumanModels")}</p>
                        </div>
                    </Link>

                    {/* New Project */}
                    <Link href="/dashboard/projects/create">
                        <div className="p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg hover:border-gold-muted transition-all duration-300 cursor-pointer group text-center">
                            <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center rounded-xl bg-gold-solid/15 group-hover:bg-gold-solid/25 transition">
                                <FolderKanban className="w-5 h-5 text-gold-solid" />
                            </div>
                            <h3 className="font-semibold text-foreground text-sm mb-1">{t("dashboard.newProject")}</h3>
                            <p className="text-xs text-muted-foreground">{t("dashboard.fullCampaignPhotoshoots")}</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Images */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">{t("dashboard.myRecentImages")}</h2>
                {(() => {
                    if (loading) {
                        return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div
                                        key={i}
                                        className="aspect-square overflow-hidden rounded-xl bg-muted border border-border animate-pulse"
                                    />
                                ))}
                            </div>
                        );
                    }
                    if (recentImages.length > 0) {
                        return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {recentImages.map((image) => {
                                    const imageSrc = image.image_url || "/placeholder.svg";
                                    return (
                                        <div
                                            key={image.id}
                                            className="aspect-square overflow-hidden rounded-xl bg-gray-100 border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                                        >
                                            <img
                                                src={imageSrc}
                                                alt={image.prompt || "Generated content"}
                                                loading="lazy"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = "/placeholder.svg";
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    }
                    return (
                        <div className="text-center py-8 text-muted-foreground">
                            <Image className="w-12 h-12 mx-auto mb-2 text-muted-foreground/60" />
                            <p>{t("dashboard.noRecentImages")}</p>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
