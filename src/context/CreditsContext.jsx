"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/lib/api";

const CreditsContext = createContext(null);

export function CreditsProvider({ children }) {
    const { token } = useAuth();
    const [organizationCredits, setOrganizationCredits] = useState(null);
    const [userCredits, setUserCredits] = useState(null);
    const [creditsLoading, setCreditsLoading] = useState(true);
    const [socketConnected, setSocketConnected] = useState(false);
    const socketRef = useRef(null);

    const fetchCredits = useCallback(async (showLoading = true) => {
        if (!token) {
            setCreditsLoading(false);
            return;
        }
        try {
            if (showLoading) setCreditsLoading(true);
            const userProfile = await apiService.getUserProfile(token);
            if (userProfile?.success && userProfile?.user) {
                const currentUser = userProfile.user;
                let organizationId = null;
                if (currentUser.organization) {
                    organizationId =
                        typeof currentUser.organization === "object" && currentUser.organization?.id
                            ? currentUser.organization.id
                            : String(currentUser.organization);
                }
                if (organizationId) {
                    const orgData = await apiService.getOrganization(organizationId, token);
                    setOrganizationCredits({
                        balance: orgData?.credit_balance ?? 0,
                        organizationName: orgData?.name || "Organization"
                    });
                    setUserCredits(null);
                } else {
                    setUserCredits({ balance: currentUser?.credit_balance ?? 0 });
                    setOrganizationCredits(null);
                }
            } else {
                setOrganizationCredits(null);
                setUserCredits(null);
            }
        } catch (err) {
            console.error("Error fetching credits:", err);
            setOrganizationCredits(null);
            setUserCredits(null);
        } finally {
            if (showLoading) setCreditsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchCredits(true);

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
        let pollInterval = null;

        if (token && socketUrl && typeof window !== "undefined") {
            import("socket.io-client").then(({ io }) => {
                const socket = io(socketUrl, {
                    auth: { token },
                    transports: ["websocket", "polling"]
                });
                socketRef.current = socket;

                socket.on("connect", () => setSocketConnected(true));
                socket.on("disconnect", () => setSocketConnected(false));

                socket.on("credits:updated", (payload) => {
                    const balance = payload?.balance ?? 0;
                    if (payload?.organizationName != null) {
                        setOrganizationCredits({
                            balance,
                            organizationName: payload.organizationName
                        });
                        setUserCredits(null);
                    } else {
                        setUserCredits({ balance });
                        setOrganizationCredits(null);
                    }
                });
            }).catch((e) => {
                console.warn("Socket.io client not available or connection failed:", e);
            });
        }

        // Fallback: poll every 10s (when socket not configured or as backup)
        pollInterval = setInterval(() => fetchCredits(false), 10000);

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            clearInterval(pollInterval);
        };
    }, [token, fetchCredits]);

    const value = {
        organizationCredits,
        userCredits,
        creditsLoading,
        refetchCredits: () => fetchCredits(true),
        socketConnected
    };

    return (
        <CreditsContext.Provider value={value}>
            {children}
        </CreditsContext.Provider>
    );
}

export function useCredits() {
    const ctx = useContext(CreditsContext);
    if (!ctx) {
        throw new Error("useCredits must be used within a CreditsProvider");
    }
    return ctx;
}
