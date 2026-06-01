"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiService } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const inputClassName =
    "w-full px-4 py-3 bg-input border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function SignupForm() {
    const { language, changeLanguage, t } = useLanguage();
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        email: "",
        password: "",
        confirm_password: "",
        acceptTerms: false,
        acceptPrivacy: false,
        acceptGDPR: false,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [legalContent, setLegalContent] = useState({});
    const [selectedContent, setSelectedContent] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();
    const [step, setStep] = useState("signup");
    const [otp, setOtp] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);



    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const formatContent = (content) => {
        if (!content) return '';

        // Check if content is already HTML (contains HTML tags)
        const isHTML = /<[a-z][\s\S]*>/i.test(content);

        if (isHTML) {
            // Content is already HTML, return as-is
            return content;
        } else {
            // Content is plain text, convert line breaks to HTML
            // Convert double line breaks to paragraphs
            let formatted = content
                .split(/\n\n+/)
                .map(paragraph => paragraph.trim())
                .filter(paragraph => paragraph.length > 0)
                .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`)
                .join('');

            // If no paragraphs were created, treat single line breaks as <br>
            if (!formatted) {
                formatted = content.replace(/\n/g, '<br/>');
            }

            return formatted;
        }
    };

    const handleViewContent = async (contentType) => {
        try {
            const response = await apiService.getLegalContent(contentType);
            if (response && response.success && response.content) {
                setSelectedContent({
                    type: contentType,
                    title: response.content.title,
                    content: response.content.content
                });
                setIsDialogOpen(true);
            }
        } catch (err) {
            console.error("Failed to fetch legal content:", err);
            setMessage(t("legal.failedToLoad"));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        if (formData.password !== formData.confirm_password) {
            setMessage(t("auth.passwordsNotMatch"));
            setLoading(false);
            return;
        }

        if (!formData.acceptTerms) {
            setMessage(t("auth.acceptAllTerms") || "Please accept all terms and conditions to continue");
            setLoading(false);
            return;
        }

        try {
            await apiService.register(
                formData.full_name,
                formData.username,
                formData.email,
                formData.password
            );

            // ✅ Move to OTP step
            setStep("otp");
            setMessage(t("auth.otpSent"));

        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };
    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            setMessage(t("auth.pleaseEnterValidOtp") || "Please enter a valid 6-digit OTP");
            return;
        }

        setOtpLoading(true);
        setMessage("");

        try {
            const response = await apiService.verifyEmailOtp(
                formData.email,
                otp
            );

            // Check if verification was successful
            if (response && (response.token || response.message)) {
                // ✅ Save token if returned
                if (response.token) {
                    localStorage.setItem("token", response.token);
                }

                // Show success message
                setMessage(response.message || t("auth.emailVerified") || "Email verified successfully!");

                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    router.push("/login");
                }, 1000);
            } else {
                throw new Error(response?.error || t("auth.invalidOtp") || "Invalid OTP");
            }

        } catch (err) {
            console.error("OTP verification error:", err);
            const errorMessage = err.message || err.response?.data?.error || t("auth.invalidOtp") || "Failed to verify OTP. Please try again.";
            setMessage(errorMessage);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setOtpLoading(true);
        setMessage("");

        try {
            const response = await apiService.resendEmailOtp(formData.email);

            if (response && (response.success || response.message)) {
                setMessage(response.message || t("auth.otpResent") || "OTP has been resent to your email");
                // Clear the OTP input
                setOtp("");
            } else {
                throw new Error(response?.error || t("auth.failedToResendOtp") || "Failed to resend OTP");
            }
        } catch (err) {
            console.error("Resend OTP error:", err);
            const errorMessage = err.message || err.response?.data?.error || t("auth.failedToResendOtp") || "Failed to resend OTP. Please try again.";
            setMessage(errorMessage);
        } finally {
            setOtpLoading(false);
        }
    };



    return (
        <div className="w-full max-w-md">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-foreground mb-2">{t("auth.signup")}</h1>
                <p className="text-lg text-muted-foreground">{t("auth.createAccount")}</p>
            </div>

            {/* Language Selector */}
            {/* <div className="mb-6">
                <Label className="block text-sm font-semibold text-foreground mb-2">
                    {t("signup.selectLanguage")}
                </Label>
                <Select value={language} onValueChange={changeLanguage}>
                    <SelectTrigger className="w-full bg-input border border-input">
                        <SelectValue placeholder={t("signup.selectLanguage")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">{t("common.english")}</SelectItem>
                        <SelectItem value="es">{t("common.spanish")}</SelectItem>
                    </SelectContent>
                </Select>
            </div> */}
            {step === "signup" ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-foreground">{t("auth.fullName")}</label>
                        <Input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder={t("auth.johnDoe")}
                            required
                            className={inputClassName}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground">{t("auth.username")}</label>
                        <Input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder={t("auth.johndoe123")}
                            required
                            className={inputClassName}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground">{t("auth.email")}</label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t("auth.exampleEmail")}
                            required
                            className={inputClassName}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground">{t("auth.password")}</label>
                        <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={t("auth.atLeast8Chars")}
                            required
                            className={inputClassName}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground">{t("auth.confirmPassword")}</label>
                        <Input
                            type="password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            placeholder={t("auth.confirmYourPassword")}
                            required
                            className={inputClassName}
                        />
                    </div>

                    {/* Legal Compliance Checkboxes */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="acceptTerms"
                                name="acceptTerms"
                                checked={formData.acceptTerms}
                                onChange={handleChange}
                                required
                                className="mt-1 h-4 w-4 accent-[#cd9639] border-border rounded focus:ring-ring"
                            />
                            <label htmlFor="acceptTerms" className="text-sm text-muted-foreground">
                                {t("signup.agreeTo")}{" "}
                                <button
                                    type="button"
                                    onClick={() => handleViewContent('terms')}
                                    className="text-gold-solid hover:underline font-semibold"
                                >
                                    {t("signup.termsAndConditions")} {" "}
                                </button>
                                {" AND "}
                                <button
                                    type="button"
                                    onClick={() => handleViewContent('privacy')}
                                    className="text-gold-solid hover:underline font-semibold"
                                >
                                    {t("signup.privacyPolicy")}
                                </button>
                            </label>
                        </div>




                    </div>

                    <Button
                        type="submit"
                        variant="brand"
                        disabled={loading}
                        className="w-full py-3 h-auto font-semibold rounded-full"
                    >
                        {loading ? t("auth.signingUp") : t("auth.signup")}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <h2 className="text-3xl font-bold text-foreground">
                        {t("auth.verifyEmail")}
                    </h2>

                    <p className="text-sm text-muted-foreground">
                        {t("auth.otpSentTo")} <strong>{formData.email}</strong>
                    </p>

                    <Input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        maxLength={6}
                        placeholder={t("auth.enterOtp")}
                        className={`${inputClassName} text-center tracking-widest text-lg`}
                        required
                    />

                    <Button
                        type="submit"
                        variant="brand"
                        disabled={otpLoading || otp.length !== 6}
                        className="w-full py-3 h-auto font-semibold rounded-full"
                    >
                        {otpLoading ? t("auth.verifying") : t("auth.verifyOtp")}
                    </Button>

                    <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpLoading}
                        className="text-sm text-gold-solid hover:underline block mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {otpLoading ? t("auth.sending") || "Sending..." : t("auth.resendOtp") || "Resend OTP"}
                    </button>
                </form>
            )}

            {message && (
                <p className={`mt-4 text-center text-sm ${message.includes("successfully") || message.includes("sent") || message.includes("verified")
                        ? "text-green-400"
                        : "text-red-400"
                    }`}>
                    {message}
                </p>
            )}

            <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                    {t("auth.alreadyHaveAccount")}{" "}
                    <Link href="/login" className="font-semibold text-gold-solid hover:opacity-80">
                        {t("auth.login")}
                    </Link>
                </p>
            </div>

            {/* Legal Content Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-card border-border">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedContent?.title || t("legal.legalDocument")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("legal.readCarefully")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {selectedContent?.content ? (
                            <div
                                className="prose prose-sm max-w-none text-muted-foreground prose-invert"
                                dangerouslySetInnerHTML={{
                                    __html: formatContent(selectedContent.content)
                                }}
                            />
                        ) : (
                            <p className="text-muted-foreground">{t("legal.loadingContent")}</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
