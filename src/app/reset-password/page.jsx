"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { apiService } from "@/lib/api";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

import Navigation from "@/components/home/Navigation";
import LoginImage from "@/components/login-image";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const tokenParam = searchParams.get("token");
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            toast.error("Invalid reset link. Please request a new one.");
        }
    }, [searchParams]);

    const validatePassword = (pwd) => pwd.length >= 8;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error("Invalid reset link.");
            return;
        }

        if (!validatePassword(password)) {
            toast.error("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await apiService.resetPassword(token, password);
            setSuccess(true);
            toast.success("Password reset successfully!");

            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (error) {
            toast.error(error.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white">
                <Navigation />

                <main className="pt-20 pb-8 flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                        <div className="max-w-md mx-auto text-center">
                            <div className="mb-6">
                                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>

                                <h2 className="text-2xl font-bold text-[#0c1421] mb-2">
                                    Password Reset Successful!
                                </h2>

                                <p className="text-[#313957]">
                                    Your password has been reset successfully.
                                </p>
                            </div>

                            <Link href="/login">
                                <Button className="w-full bg-[#5533ff] hover:bg-[#4422dd] text-white">
                                    Go to Login
                                </Button>
                            </Link>
                        </div>

                        <div className="hidden lg:block">
                            <LoginImage />
                        </div>

                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            <main className="pt-34 pb-8 flex items-center justify-center p-4">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                    {/* LEFT SIDE FORM */}
                    <div className="w-full max-w-md mx-auto pt-17">

                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-[#0c1421] mb-2">
                                Reset Password
                            </h1>
                            <p className="text-lg text-[#313957]">
                                Enter your new password below.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#0c1421]">
                                    New Password
                                </label>

                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />

                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="At least 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 py-3 bg-[#f3f9fa] border border-[#e6e6e6]"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#0c1421]">
                                    Confirm Password
                                </label>

                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />

                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 pr-10 py-3 bg-[#f3f9fa] border border-[#e6e6e6]"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || !token}
                                className="w-full py-3 bg-[#5533ff] hover:bg-[#4422dd] text-white rounded-full"
                            >
                                {loading ? "Resetting..." : "Reset Password"}
                            </Button>

                        </form>

                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-[#5533ff]"
                            >
                                Back to Login
                            </Link>
                        </div>

                    </div>

                    {/* RIGHT IMAGE */}
                    <div className="hidden lg:block">
                        <LoginImage />
                    </div>

                </div>
            </main>
        </div>
    );
}