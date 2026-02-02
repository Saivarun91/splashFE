"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Image as ImageIcon, FolderKanban, Zap, TrendingUp, Mail } from "lucide-react";
import { FaCoins } from "react-icons/fa";
import { RiAiGenerate2 } from "react-icons/ri";
import PendingInvitations from "@/components/PendingInvitations";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { dataCache, cacheKeys } from "@/lib/data-cache";

export default function Dashboard() {
    const { user, token } = useAuth();
    const { t } = useLanguage();
    const [recentImages, setRecentImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [organizationCredits, setOrganizationCredits] = useState(null);
    const [userCredits, setUserCredits] = useState(null);
    const [creditsLoading, setCreditsLoading] = useState(true);
    const [stats, setStats] = useState({
        activeProjects: 0,
        inProgressProjects: 0,
        completedProjects: 0,
        totalImages: 0,
        imagesGenerated: 0
    });

    const currentHour = new Date().getHours();
    let greeting;
    if (currentHour < 12) {
        greeting = t("dashboard.goodMorning");
    } else if (currentHour < 18) {
        greeting = t("dashboard.goodAfternoon");
    } else {
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

    // Fetch organization credits
    useEffect(() => {
        const fetchCredits = async () => {
          if (!token) {
            setCreditsLoading(false);
            return;
          }
      
          try {
            // Always get fresh user profile
            const userProfile = await apiService.getUserProfile(token);
            console.log("userProfile", userProfile);
            if (userProfile?.success && userProfile?.user) {
              const currentUser = userProfile.user;
      
              let organizationId = null;
      
              if (currentUser.organization) {
                if (typeof currentUser.organization === "object" && currentUser.organization.id) {
                  organizationId = currentUser.organization.id;
                } else {
                  organizationId = String(currentUser.organization);
                }
              }
      
              // ✅ CASE 1: Organization user
              if (organizationId) {
                const orgData = await apiService.getOrganization(organizationId, token);
      
                setOrganizationCredits({
                  balance: orgData.credit_balance || 0,
                  organizationName: orgData.name || "Organization"
                });
      
                setUserCredits(null);
              } 
              // ✅ CASE 2: Individual user
              else {
                setUserCredits({
                  balance: currentUser.credit_balance || 0
                });
                console.log("userCredits", currentUser.credit_balance);
      
                setOrganizationCredits(null);
              }
            }
          } catch (error) {
            console.error("Error fetching credits:", error);
          } finally {
            setCreditsLoading(false);
          }
        };
      
        fetchCredits();
      }, [token]);
      
    // Fetch dashboard data - OPTIMIZED with parallel fetching and caching
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // Try cache first for instant display
                const projectsCacheKey = cacheKeys.projectsList();
                const imagesCacheKey = `recent-images-${token}`;
                
                const cachedProjects = dataCache.get(projectsCacheKey);
                const cachedImages = dataCache.get(imagesCacheKey);
                
                if (cachedProjects) {
                    // Calculate stats from cached data
                    const activeProjects = cachedProjects.length;
                    const inProgress = cachedProjects.filter(p => p.status === 'in_progress' || p.status === 'active').length;
                    const completed = cachedProjects.filter(p => p.status === 'completed').length;
                    const totalImages = cachedProjects.reduce((sum, p) => sum + (p.total_images || 0), 0);
                    
                    setStats({
                        activeProjects,
                        inProgressProjects: inProgress,
                        completedProjects: completed,
                        totalImages,
                        imagesGenerated: totalImages
                    });
                    setLoading(false);
                }
                
                if (cachedImages) {
                    setRecentImages(cachedImages);
                }

                // Fetch all data in parallel - 50-60% faster than sequential
                const [projectsResult, imagesResult] = await Promise.allSettled([
                    dataCache.getOrFetch(
                        projectsCacheKey,
                        async () => {
                            const response = await apiService.getProjects(token);
                            return response?.projects || [];
                        },
                        2 * 60 * 1000 // 2 minutes cache
                    ),
                    dataCache.getOrFetch(
                        imagesCacheKey,
                        async () => {
                            const response = await apiService.getRecentImages(token, 5);
                            return response?.success && response?.images ? response.images : [];
                        },
                        30 * 1000 // 30 seconds cache
                    ).catch(() => [])
                ]);

                // Process projects data
                if (projectsResult.status === 'fulfilled') {
                    const projectsData = projectsResult.value;
                    const activeProjects = projectsData.length;
                    const inProgress = projectsData.filter(p => p.status === 'in_progress' || p.status === 'active').length;
                    const completed = projectsData.filter(p => p.status === 'completed').length;
                    const totalImages = projectsData.reduce((sum, p) => sum + (p.total_images || 0), 0);

                    setStats({
                        activeProjects,
                        inProgressProjects: inProgress,
                        completedProjects: completed,
                        totalImages,
                        imagesGenerated: totalImages
                    });
                }

                // Process images data
                if (imagesResult.status === 'fulfilled') {
                    setRecentImages(imagesResult.value);
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
        <div className="space-y-6 animate-fadeIn p-6 bg-gray-50 text-gray-900">
            {/* Welcome Section */}
            <div className="relative p-4 rounded-xl bg-white shadow-md border border-gray-200 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-tr from-indigo-500 to-purple-500 opacity-10 rounded-full blur-3xl" />
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold">{greeting}, {getUserDisplayName()}</h1>
                </div>
            </div>

            {/* Credits & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Credits */}
                <Link href="/my-account/billing">
                    <div className="p-4 bg-white border border-indigo-100 rounded-xl shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-300 cursor-pointer">
                        <div className="flex justify-between items-center pb-2">
                            <span className="text-sm font-medium text-gray-500">{t("dashboard.remainingCredits")}</span>
                            <FaCoins className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            {creditsLoading ? (
                                <div className="text-2xl font-bold text-gray-900">...</div>
                            ) : organizationCredits ? (
                                <>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {organizationCredits.balance.toLocaleString()}
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                                        <div 
                                            className="bg-indigo-500 h-2 rounded-full transition-all"
                                            style={{ 
                                                width: organizationCredits.balance > 0 
                                                    ? `${Math.min((organizationCredits.balance / 10000) * 100, 100)}%` 
                                                    : '0%' 
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {organizationCredits.organizationName} • {t("dashboard.organizationCredits")}
                                    </p>
                                </>
                            ) : userCredits ? (
                                <>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {userCredits.balance.toLocaleString()}
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                                        <div 
                                            className="bg-indigo-500 h-2 rounded-full transition-all"
                                            style={{ 
                                                width: userCredits.balance && userCredits.balance > 0 
                                                    ? `${Math.min((userCredits.balance / 10000) * 100, 100)}%` 
                                                    : '0%' 
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
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
                </Link>

                {/* Images Generated */}
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center pb-2">
                        <span className="text-sm font-medium text-gray-500">{t("dashboard.imagesGenerated")}</span>
                        <RiAiGenerate2  className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        {loading && !stats.imagesGenerated ? (
                            <div className="animate-pulse">
                                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-gray-900">
                                    {stats.imagesGenerated}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-green-500" />
                                    {t("dashboard.totalImagesGenerated")}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Active Projects */}
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center pb-2">
                        <span className="text-sm font-medium text-gray-500">{t("dashboard.activeProjects")}</span>
                        <FolderKanban className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        {loading && !stats.activeProjects ? (
                            <div className="animate-pulse">
                                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-40"></div>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-gray-900">
                                    {stats.activeProjects}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {`${stats.inProgressProjects} ${t("dashboard.inProgress")} • ${stats.completedProjects} ${t("dashboard.completed")}`}
                                </p>
                            </>
                        )}
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
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("dashboard.quickActions")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Plain Image */}
                    <Link href="/dashboard/images/white-bg" prefetch={true}>
                        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group text-center">
                            <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition">
                                <ImageIcon className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{t("dashboard.plainImage")}</h3>
                            <p className="text-xs text-gray-500">{t("dashboard.cleanProductShots")}</p>
                        </div>
                    </Link>

                    {/* Themed Image */}
                    <Link href="/dashboard/images/replace-bg" prefetch={true}>
                        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group text-center">
                            <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center rounded-xl bg-yellow-50 group-hover:bg-yellow-100 transition">
                                <Sparkles className="w-5 h-5 text-yellow-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{t("dashboard.themedImage")}</h3>
                            <p className="text-xs text-gray-500">{t("dashboard.lifestyleShots")}</p>
                        </div>
                    </Link>

                    {/* Model Images */}
                    <Link href="/dashboard/images/model-generation" prefetch={true}>
                        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group text-center">
                            <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition">
                                <ImageIcon className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{t("dashboard.modelImages")}</h3>
                            <p className="text-xs text-gray-500">{t("dashboard.aiOrHumanModels")}</p>
                        </div>
                    </Link>

                    {/* New Project */}
                    <Link href="/dashboard/projects/create" prefetch={true}>
                        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group text-center">
                            <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center rounded-xl bg-yellow-50 group-hover:bg-yellow-100 transition">
                                <FolderKanban className="w-5 h-5 text-yellow-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{t("dashboard.newProject")}</h3>
                            <p className="text-xs text-gray-500">{t("dashboard.fullCampaignPhotoshoots")}</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Images */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("dashboard.myRecentImages")}</h2>
                {(() => {
                    if (loading) {
                        return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="aspect-square overflow-hidden rounded-xl bg-gray-200 border border-gray-200 animate-pulse"
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
                                        className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                                    >
                                            {/* Use Next.js Image for optimization */}
                                            <Image
                                                src={imageSrc}
                                                alt={image.prompt || "Generated content"}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                                unoptimized={imageSrc?.includes('cloudinary') || imageSrc?.includes('imagekit')}
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
                        <div className="text-center py-8 text-gray-500">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p>{t("dashboard.noRecentImages")}</p>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
