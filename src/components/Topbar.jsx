"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
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
            className={`fixed top-0 right-0 z-30 h-16 flex items-center bg-card/90 backdrop-blur-md border-b border-border text-foreground px-6 transition-all ${
                collapsed ? "left-16" : "left-64"
            }`}
        >
            {/* Organization */}
            {!loadingOrg && organizationInfo && (
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/80 border border-border rounded-lg">
                    <Building2 className="text-gold-solid" />
                    <span className="font-semibold">{organizationInfo.name}</span>
                    <Badge className={getRoleBadgeColor(organizationInfo.role)}>
                        {organizationInfo.role}
                    </Badge>
                </div>
            )}

            <div className="flex-1" />

            {/* Right Section */}
            <div className="flex items-center gap-4">

               
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
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
                        <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-border bg-secondary/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gold-solid" />
                                    <span className="font-semibold text-sm">Project Invites</span>
                                </div>
                                <Badge variant="brand">
                                    {pendingCount}
                                </Badge>
                            </div>

                            <div className="max-h-80 overflow-y-auto">
                                {loading ? (
                                    <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading invites...
                                    </div>
                                ) : invites.length === 0 ? (
                                    <div className="p-4 text-sm text-muted-foreground">
                                        No pending invites.
                                    </div>
                                ) : (
                                    invites.map((invite) => (
                                        <div key={invite.invite_id || invite.id || `${invite.project_id}-${invite.created_at}`} className="p-4 border-b border-border last:border-b-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {invite.project_name || "Project invite"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Role: <span className="font-medium">{invite.role || "viewer"}</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        From {invite.inviter_name || invite.inviter_email || "Team member"}
                                                    </p>
                                                    {invite.created_at && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
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
                    <div className="flex items-center gap-2 px-3 py-2 bg-card/50 border border-gold-muted rounded-lg">
                        {creditsLoading ? (
                            <Loader2 className="w-4 h-4 text-gold-solid animate-spin" />
                        ) : (
                            <>
                                <Coins className="w-4 h-4 text-gold-solid" />
                                <span className="text-sm font-semibold text-gold-solid">
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
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
                        
                    >
                        <div className="w-8 h-8 bg-gold-gradient rounded-full flex items-center justify-center text-sm font-semibold text-primary-foreground">
                            {getUserInitials()}
                        </div>
                        <span className="text-foreground text-sm hidden md:inline">
                            {getUserDisplayName()}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
                            <div className="px-4 py-3 border-b border-border bg-secondary/50"> 
                                <p className="font-semibold">{getUserDisplayName()}</p>
                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>

                            <button
                                onClick={() => router.push("/dashboard/my-account/profile")}
                                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-accent text-foreground"
                            >
                                <User className="w-4 h-4 text-gold-solid" />
                                Profile
                            </button>

                            {organizationInfo && isOrganizationOwner(user) && (
                                <button
                                onClick={switchToOrganizationPortal}
                                    className="w-full px-4 py-2 flex items-center gap-2 hover:bg-accent text-foreground"
                                >
                                    <Building2  className="w-4 h-4 text-gold-solid" />
                                    Organization Panel
                                </button>
                            )}
                            
                            <button
                                onClick={() => !isGenerating && logout()}
                                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-destructive/10"
                            >
                                <LogOut className="w-4 h-4 text-destructive" /> <span>{t("dashboard.logout")}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
