"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const inputClassName =
    "w-full px-4 py-3 bg-input border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function LoginForm() {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const router = useRouter();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const handleSignIn = async (e) => {
        e.preventDefault();
        // Handle sign in logic
        setLoading(true);
        setMessage(""); // Clear previous messages
        console.log("Sign in with:", { email, password });
        try {
            await login(email, password);
            // Navigation is handled in AuthContext.login on success
        } catch (err) {

            setMessage(t("auth.loginFailed"));
        } finally {
            setLoading(false);
        }
    };

    // const handleGoogleSignIn = () => {
    //     // Handle Google sign in logic
    //     console.log("Sign in with Google");
    // };

    return (
        <div className="w-full max-w-md pt-15">
            {/* Header */}
            <div className="mb-8 ">
                <h1 className="text-4xl font-bold text-foreground mb-2">{t("auth.login")}</h1>
                <p className="text-lg text-muted-foreground">
                    {t("auth.stayConnected")}
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-foreground"
                    >
                        {t("auth.email")}
                    </label>
                    <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.exampleEmail")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClassName}
                    />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-foreground"
                    >
                        {t("auth.password")}
                    </label>
                    <Input
                        id="password"
                        type="password"
                        placeholder={t("auth.atLeast8Chars")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClassName}
                    />
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                    <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-gold-solid hover:brightness-110 transition-opacity"
                    >
                        {t("auth.forgotPassword")}
                    </Link>
                </div>

                {/* Error Message */}
                {message && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-400">{message}</p>
                    </div>
                )}

                {/* Sign In Button */}
                <Button
                    type="submit"
                    variant="brand"
                    className="w-full py-3 h-auto rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? t("auth.signingIn") : t("auth.signin")}
                </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                    {t("auth.dontHaveAccount")}{" "}
                    <Link href="/signup" className="font-semibold text-gold-solid hover:brightness-110">
                        {t("auth.signup")}
                    </Link>
                </p>
            </div>
        </div>
    );
}
