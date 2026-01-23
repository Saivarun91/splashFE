"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { apiService } from "@/lib/api";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

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

    const validatePassword = (pwd) => {
        return pwd.length >= 8;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error("Invalid reset link. Please request a new one.");
            return;
        }

        if (!validatePassword(password)) {
            toast.error("Password must be at least 8 characters long.");
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
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (error) {
            toast.error(error.message || "Failed to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0c1421] mb-2">Password Reset Successful!</h2>
                        <p className="text-[#313957]">
                            Your password has been reset successfully. You can now log in with your new password.
                        </p>
                    </div>
                    <Link href="/login">
                        <Button className="w-full bg-[#5533ff] hover:bg-[#4422dd] text-white">
                            Go to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-[#0c1421] mb-2">Reset Password</h1>
                    <p className="text-lg text-[#313957]">
                        Enter your new password below.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label
                            htmlFor="password"
                            className="block text-sm font-semibold text-[#0c1421]"
                        >
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373] w-5 h-5" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-10 px-4 py-3 bg-[#f3f9fa] border border-[#e6e6e6] rounded-lg text-[#313957] placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#5533ff]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373] hover:text-[#0c1421]"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {password && !validatePassword(password) && (
                            <p className="text-sm text-red-600">Password must be at least 8 characters long.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-semibold text-[#0c1421]"
                        >
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373] w-5 h-5" />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-10 px-4 py-3 bg-[#f3f9fa] border border-[#e6e6e6] rounded-lg text-[#313957] placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#5533ff]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373] hover:text-[#0c1421]"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-sm text-red-600">Passwords do not match.</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full py-3 bg-[#5533ff] hover:bg-[#4422dd] text-white font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !token}
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                </form>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-[#5533ff] hover:opacity-80 transition-opacity"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
