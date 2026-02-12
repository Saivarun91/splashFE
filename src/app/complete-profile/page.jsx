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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      
          {/* Invitation Message */}
          <div className="w-full max-w-6xl mb-6">
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl p-4 text-center">
              <p className="font-semibold text-lg">
  You have been invited to Splash by {" "}
  <span className="font-bold">
    {profileData.organization?.name || "Splash"}
  </span>{" "}
  Organization— please complete your profile to continue.
</p>

            </div>
          </div>
      
          <div className="w-full max-w-6xl">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      
              {/* Header */}
              <div className="p-8 border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800">
                  Complete Your Profile
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Just a few details to activate your account
                </p>
              </div>
      
              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
      
                {/* Account Info */}
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Account Information
                  </h3>
      
                  <div className="grid md:grid-cols-2 gap-6">
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={profileData.email || ""}
                        disabled
                        className="bg-gray-100 border-gray-200 text-gray-600"
                      />
                    </div>
      
                    {profileData.organization && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization
                        </label>
                        <Input
                          type="text"
                          value={profileData.organization.name || ""}
                          disabled
                          className="bg-gray-100 border-gray-200 text-gray-600"
                        />
                      </div>
                    )}
      
                    {profileData.organization_role && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <Input
                          type="text"
                          value={
                            profileData.organization_role
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())
                          }
                          disabled
                          className="bg-gray-100 border-gray-200 text-gray-600"
                        />
                      </div>
                    )}
      
                  </div>
                </div>
      
                {/* Personal Info */}
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Personal Information
                  </h3>
      
                  <div className="grid md:grid-cols-2 gap-6">
      
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
      
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username (Optional)
                      </label>
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Set Password *
                      </label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
      
                  </div>
                </div>
      
                {/* Submit */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
                  >
                    {loading ? "Completing..." : "Complete Profile"}
                  </Button>
      
                  <p className="text-xs text-gray-500 text-center mt-3">
                    By completing your profile, you agree to our terms of service.
                  </p>
                </div>
      
              </form>
            </div>
          </div>
        </div>
      );
}
