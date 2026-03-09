"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Mail, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiService } from "@/lib/api";

import Navigation from "@/components/home/Navigation";
import LoginImage from "@/components/login-image";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await apiService.forgotPassword(email);
            setSubmitted(true);
            toast.success("Password reset link sent to your email!");
        } catch (error) {
            toast.error(error.message || "Failed to send reset email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Top Navigation */}
            <Navigation />

            <main className="pt-30 pb-8 flex items-center justify-center ">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                    {/* LEFT SIDE - FORM */}
                    <div className="w-full max-w-md m-auto pt-15">
                        {!submitted ? (
                            <>
                                <div className="mb-8">
                                    <h1 className="text-4xl font-bold text-[#0c1421] mb-2">
                                        Forgot Password?
                                    </h1>
                                    <p className="text-lg text-[#313957]">
                                        Enter your email and we'll send a reset link.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-[#0c1421]">
                                            Email
                                        </label>

                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] w-5 h-5" />

                                            <Input
                                                type="email"
                                                placeholder="example@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="pl-10 py-3 bg-[#f3f9fa] border border-[#e6e6e6] rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-[#5533ff] hover:bg-[#4422dd] text-white rounded-full"
                                    >
                                        {loading ? "Sending..." : "Send Reset Link"}
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 text-sm font-medium text-[#5533ff]"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Login
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <div className="mb-6">
                                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <Mail className="w-8 h-8 text-green-600" />
                                    </div>

                                    <h2 className="text-2xl font-bold text-[#0c1421] mb-2">
                                        Check Your Email
                                    </h2>

                                    <p className="text-[#313957]">
                                        Reset link sent to <strong>{email}</strong>
                                    </p>

                                    <p className="text-sm text-[#737373] mt-2">
                                        Check inbox or spam folder.
                                    </p>
                                </div>

                                <Button
                                    onClick={() => setSubmitted(false)}
                                    variant="outline"
                                    className="w-full mb-4"
                                >
                                    Try Another Email
                                </Button>

                                <Link
                                    href="/login"
                                    className="text-sm text-[#5533ff]"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE - IMAGE */}
                    <div className="hidden lg:block">
                        <LoginImage />
                    </div>

                </div>
            </main>
        </div>
    );
}