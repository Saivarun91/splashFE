"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { User, Mail, Building2, Shield, Eye, EyeOff, Lock, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export default function CompleteProfilePage() {
    const router = useRouter();
    const { user, token, refreshUser } = useAuth();
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        // Redirect if already authenticated and profile is completed
        if (user && user.profile_completed) {
            router.push("/dashboard");
            return;
        }

        // Redirect if not authenticated
        if (!token) {
            router.push("/login");
            return;
        }

        // Fetch user profile data
        const fetchProfile = async () => {
            try {
                const response = await apiService.getUserProfile(token);
                if (response.success && response.user) {
                    setProfileData(response.user);
                    setFullName(response.user.full_name || "");
                    setUsername(response.user.username || "");
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
                toast.error("Failed to load profile data");
            }
        };

        fetchProfile();
    }, [user, token, router]);

    const validatePassword = (pwd) => {
        return pwd.length >= 8;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!fullName.trim()) {
            newErrors.fullName = "Full name is required";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (!validatePassword(password)) {
            newErrors.password = "Password must be at least 8 characters long";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const profileData = {
                full_name: fullName.trim(),
                username: username.trim(),
                new_password: password, // Password is now required
            };

            const response = await apiService.completeProfile(profileData, token);
            
            if (response.success) {
                toast.success("Profile completed successfully!");
                
                // Update user in localStorage
                const updatedUser = {
                    ...user,
                    profile_completed: true,
                    full_name: response.user.full_name,
                    username: response.user.username,
                    organization: response.user.organization,
                    organization_role: response.user.organization_role,
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                
                // Refresh user in AuthContext
                if (refreshUser) {
                    refreshUser();
                }
                
                // Redirect to dashboard
                router.push("/dashboard");
            }
        } catch (error) {
            toast.error(error.message || "Failed to complete profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!profileData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 py-12">
            <div className="w-full max-w-3xl">
                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-[#5533ff] to-[#7c5fff] p-8 text-white">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Complete Your Profile</h1>
                                <p className="text-blue-100 text-sm">
                                    Just a few more steps to get started
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-blue-100">
                            <CheckCircle className="w-4 h-4" />
                            <span>This will only take a minute</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Read-only Fields Section */}
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="w-5 h-5 text-gray-600" />
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                    Account Information
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">These fields are set by your organization and cannot be changed.</p>
                            
                            <div className="space-y-4">
                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="email"
                                            value={profileData.email || ""}
                                            disabled
                                            className="w-full pl-10 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-700 opacity-75 cursor-not-allowed font-medium"
                                        />
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    </div>
                                </div>

                                {/* Organization Name */}
                                {profileData.organization && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-gray-500" />
                                            Organization
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                value={profileData.organization.name || "N/A"}
                                                disabled
                                                className="w-full pl-10 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-700 opacity-75 cursor-not-allowed font-medium"
                                            />
                                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        </div>
                                    </div>
                                )}

                                {/* Role */}
                                {profileData.organization_role && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-gray-500" />
                                            Role
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                value={profileData.organization_role.charAt(0).toUpperCase() + profileData.organization_role.slice(1).replace(/_/g, " ") || "N/A"}
                                                disabled
                                                className="w-full pl-10 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-700 opacity-75 cursor-not-allowed font-medium"
                                            />
                                            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Editable Fields Section */}
                        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-5 h-5 text-[#5533ff]" />
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                    Personal Information
                                </h3>
                            </div>
                            
                            <div className="space-y-5">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="fullName"
                                        className="block text-sm font-semibold text-gray-700"
                                    >
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Input
                                            id="fullName"
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={fullName}
                                            onChange={(e) => {
                                                setFullName(e.target.value);
                                                if (errors.fullName) setErrors({...errors, fullName: ""});
                                            }}
                                            required
                                            className={`w-full pl-10 px-4 py-3 bg-gray-50 border-2 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5533ff] focus:border-[#5533ff] transition-all ${
                                                errors.fullName ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                                            }`}
                                        />
                                    </div>
                                    {errors.fullName && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.fullName}
                                        </p>
                                    )}
                                </div>

                                {/* Username */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="username"
                                        className="block text-sm font-semibold text-gray-700"
                                    >
                                        Username <span className="text-gray-400 text-xs">(Optional)</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="Enter your username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-10 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5533ff] focus:border-[#5533ff] transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-semibold text-gray-700"
                                    >
                                        Set Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="At least 8 characters"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (errors.password) setErrors({...errors, password: ""});
                                            }}
                                            required
                                            className={`w-full pl-10 pr-10 px-4 py-3 bg-gray-50 border-2 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5533ff] focus:border-[#5533ff] transition-all ${
                                                errors.password ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {errors.password ? (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.password}
                                        </p>
                                    ) : password && !validatePassword(password) ? (
                                        <p className="text-sm text-amber-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            Password must be at least 8 characters long
                                        </p>
                                    ) : password && validatePassword(password) ? (
                                        <p className="text-sm text-green-600 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            Password strength: Good
                                        </p>
                                    ) : null}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-semibold text-gray-700"
                                    >
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Re-enter your password"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                if (errors.confirmPassword) setErrors({...errors, confirmPassword: ""});
                                            }}
                                            required
                                            className={`w-full pl-10 pr-10 px-4 py-3 bg-gray-50 border-2 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5533ff] focus:border-[#5533ff] transition-all ${
                                                errors.confirmPassword ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword ? (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.confirmPassword}
                                        </p>
                                    ) : confirmPassword && password === confirmPassword && validatePassword(password) ? (
                                        <p className="text-sm text-green-600 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            Passwords match
                                        </p>
                                    ) : confirmPassword && password !== confirmPassword ? (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            Passwords do not match
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full py-4 bg-gradient-to-r from-[#5533ff] to-[#7c5fff] hover:from-[#4422dd] hover:to-[#6b4fee] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Completing Profile...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Complete Profile
                                    </span>
                                )}
                            </Button>
                            <p className="text-xs text-gray-500 text-center mt-3">
                                By completing your profile, you agree to our terms of service
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
