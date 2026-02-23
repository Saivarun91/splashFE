"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Search,
    Bell,
    User,
    X,
    Check,
    Mail,
    Clock,
    Loader2,
    Building2,
    ChevronDown,
    LogOut,
    Coins
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCredits } from "@/context/CreditsContext";
import { apiService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { switchToOrganizationPortal } from "@/lib/portalSwitch";

export function Topbar({ collapsed }) {
    const { token, user, logout, isGenerating } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();

    const [showNotifications, setShowNotifications] = useState(false);
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingInvite, setProcessingInvite] = useState(null);
    const notificationRef = useRef(null);

    const [organizationInfo, setOrganizationInfo] = useState(null);
    const [loadingOrg, setLoadingOrg] = useState(true);

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef(null);

    const { organizationCredits, userCredits, creditsLoading } = useCredits();
    const liveCredits = organizationCredits?.balance ?? userCredits?.balance ?? null;

    /* -------------------- Fetch Invites -------------------- */
    const fetchInvites = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await apiService.getAllInvites(token);
            const normalizedInvites = (data.pending_invites || []).map((invite) => ({
                ...invite,
                invite_id: invite.invite_id || invite.id || null,
            }));
            setInvites(normalizedInvites);
        } catch (err) {
            console.error("Error fetching invites:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);



    const getUserDisplayName = () => {
        if (user?.full_name) return user.full_name;
       
        if (user?.email) return user.email.split("@")[0];
        return "User";
    };
    const isOrganizationOwner = (user) => {
        return user?.organization_role === 'owner';
    };

    const getUserInitials = () => {
        const name = getUserDisplayName();
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    /* -------------------- Fetch Organization -------------------- */
    useEffect(() => {
        const fetchOrganizationInfo = async () => {
            if (!token) {
                setLoadingOrg(false);
                return;
            }

            try {
                setLoadingOrg(true);
                const userProfile = await apiService.getUserProfile(token);

                if (userProfile?.success && userProfile?.user) {
                    const currentUser = userProfile.user;
                    let organizationId = null;

                    if (currentUser?.organization) {
                        if (typeof currentUser.organization === "object") {
                            organizationId = currentUser.organization.id;
                        } else {
                            organizationId = currentUser.organization;
                        }
                    } else if (currentUser?.organization_id) {
                        organizationId = currentUser.organization_id;
                    }

                    if (!organizationId) {
                        setOrganizationInfo(null);
                        return;
                    }

                    const orgData = await apiService.getOrganization(organizationId, token);
                    if (orgData) {
                        setOrganizationInfo({
                            name: orgData.name,
                            role: currentUser.organization_role
                        });
                    }
                }
            } catch (error) {
                console.error("Organization fetch error:", error);
                setOrganizationInfo(null);
            } finally {
                setLoadingOrg(false);
            }
        };

        fetchOrganizationInfo();
    }, [token]);

    /* -------------------- Outside Click Handlers -------------------- */
    useEffect(() => {
        const handleOutside = (e) => {
            if (notificationRef.current && !notificationRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    /* -------------------- Helpers -------------------- */
    const getRoleBadgeColor = (role) => {
        switch (role?.toLowerCase()) {
            case "owner":
                return "bg-purple-600 text-white";
            case "admin":
                return "bg-indigo-600 text-white";
            case "editor":
                return "bg-blue-600 text-white";
            default:
                return "bg-gray-500 text-white";
        }
    };

    const getTimeAgo = (dateString) => {
        const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const pendingCount = invites.length;

    const handleInviteAction = async (inviteId, action) => {
        if (!token || !inviteId || !action) return;
        try {
            setProcessingInvite(inviteId);
            if (action === "accept") {
                await apiService.acceptInviteById(inviteId, token);
            } else {
                await apiService.rejectInvite(inviteId, token);
            }
            await fetchInvites();
        } catch (err) {
            console.error(`Failed to ${action} invite:`, err);
        } finally {
            setProcessingInvite(null);
        }
    };

    /* ======================= JSX ======================= */
    return (
        <header
            className={`fixed top-0 right-0 z-30 h-16 flex items-center bg-white border-b shadow px-6 transition-all ${
                collapsed ? "left-16" : "left-64"
            }`}
        >
            {/* Organization */}
            {!loadingOrg && organizationInfo && (
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border rounded-lg">
                    <Building2 className="text-indigo-600" />
                    <span className="font-semibold">{organizationInfo.name}</span>
                    <Badge className={getRoleBadgeColor(organizationInfo.role)}>
                        {organizationInfo.role}
                    </Badge>
                </div>
            )}

            {/* Search */}
            <div className="flex-1 flex justify-center">
                <div className="relative w-1/3">
                    <input
                        placeholder="Search..."
                        className="w-full border-b px-4 py-2 focus:outline-none"
                    />
                    <Search className="absolute right-3 top-3 w-4 h-4" />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">

               
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 hover:bg-gray-100 rounded"
                        aria-label="Open notifications"
                    >
                        <Bell />
                        {pendingCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-xs text-white rounded-full flex items-center justify-center">
                                {pendingCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-96 bg-white border rounded-lg shadow z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-indigo-600" />
                                    <span className="font-semibold text-sm">Project Invites</span>
                                </div>
                                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                                    {pendingCount}
                                </Badge>
                            </div>

                            <div className="max-h-80 overflow-y-auto">
                                {loading ? (
                                    <div className="p-4 flex items-center gap-2 text-sm text-gray-600">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading invites...
                                    </div>
                                ) : invites.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-600">
                                        No pending invites.
                                    </div>
                                ) : (
                                    invites.map((invite) => (
                                        <div key={invite.invite_id || invite.id || `${invite.project_id}-${invite.created_at}`} className="p-4 border-b last:border-b-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {invite.project_name || "Project invite"}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        Role: <span className="font-medium">{invite.role || "viewer"}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        From {invite.inviter_name || invite.inviter_email || "Team member"}
                                                    </p>
                                                    {invite.created_at && (
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {getTimeAgo(invite.created_at)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleInviteAction(invite.invite_id, "accept")}
                                                    disabled={!invite.invite_id || processingInvite === invite.invite_id}
                                                >
                                                    {processingInvite === invite.invite_id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Check className="w-3 h-3" />
                                                    )}
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 px-3 border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleInviteAction(invite.invite_id, "reject")}
                                                    disabled={!invite.invite_id || processingInvite === invite.invite_id}
                                                >
                                                    <X className="w-3 h-3" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Live credits */}
                {token && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                        {creditsLoading ? (
                            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                        ) : (
                            <>
                                <Coins className="w-4 h-4 text-amber-600" />
                                <span className="text-sm font-semibold text-amber-800">
                                    {liveCredits != null ? liveCredits.toLocaleString() : "—"} credits
                                </span>
                            </>
                        )}
                    </div>
                )}

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)} 
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                        
                    >
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                            {getUserInitials()}
                        </div>
                        <span className="text-gray-900 text-sm hidden md:inline">
                            {getUserDisplayName()}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow z-50">
                            <div className="px-4 py-3 border-b bg-gray-50"> 
                                <p className="font-semibold">{getUserDisplayName()}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>

                            <button
                                onClick={() => router.push("/dashboard/my-account/profile")}
                                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-indigo-50"
                            >
                                <User className="w-4 h-4 text-indigo-600" />
                                Profile
                            </button>

                            {organizationInfo && isOrganizationOwner(user) && (
                                <button
                                onClick={switchToOrganizationPortal}
                                    className="w-full px-4 py-2 flex items-center gap-2 hover:bg-purple-50"
                                >
                                    <Building2  className="w-4 h-4 text-purple-600" />
                                    Organization Panel
                                </button>
                            )}
                            
                            <button
                                onClick={() => !isGenerating && logout()}
                                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4 text-red-600" /> <span>{t("dashboard.logout")}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
