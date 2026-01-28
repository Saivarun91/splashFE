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

    useEffect(() => {
        // Fetch legal content on component mount
        const fetchLegalContent = async () => {
            try {
                const response = await apiService.getLegalContent();
                if (response.success && response.content) {
                    setLegalContent(response.content);
                }
            } catch (err) {
                console.error("Failed to fetch legal content:", err);
            }
        };
        fetchLegalContent();
    }, []);

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
            if (response.success) {
                setSelectedContent({
                    type: contentType,
                    title: response.title,
                    content: response.content
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

        if (!formData.acceptTerms || !formData.acceptPrivacy || !formData.acceptGDPR) {
            setMessage(t("auth.acceptAllTerms"));
            setLoading(false);
            return;
        }

        try {
            const response = await apiService.register(formData.full_name, formData.username, formData.email, formData.password);
            router.push("/login");
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#0c1421] mb-2">{t("auth.signup")}</h1>
                <p className="text-lg text-[#313957]">{t("auth.createAccount")}</p>
            </div>

            {/* Language Selector */}
            <div className="mb-6">
                <Label className="block text-sm font-semibold text-[#0c1421] mb-2">
                    {t("signup.selectLanguage")}
                </Label>
                <Select value={language} onValueChange={changeLanguage}>
                    <SelectTrigger className="w-full bg-[#f3f9fa] border border-[#e6e6e6]">
                        <SelectValue placeholder={t("signup.selectLanguage")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">{t("common.english")}</SelectItem>
                        <SelectItem value="es">{t("common.spanish")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-[#0c1421]">{t("auth.fullName")}</label>
                    <Input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder={t("auth.johnDoe")}
                        required
                        className="w-full px-4 py-3 bg-[#f3f9fa] border border-[#e6e6e6] rounded-lg"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#0c1421]">{t("auth.username")}</label>
                    <Input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder={t("auth.johndoe123")}
                        required
                        className="w-full px-4 py-3 bg-[#f3f9fa] border border-[#e6e6e6] rounded-lg"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#0c1421]">{t("auth.email")}</label>
                    <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t("auth.exampleEmail")}
                        required
                        className="w-full px-4 py-3 bg-[#f3f9fa] border border-[#e6e6e6] rounded-lg"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#0c1421]">{t("auth.password")}</label>
                    <Input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={t("auth.atLeast8Chars")}
                        required
                        className="w-full px-4 py-3 bg-[#f3f9fa] border border-[#e6e6e6] rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-[#0c1421]">{t("auth.confirmPassword")}</label>
                    <Input
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder={t("auth.confirmYourPassword")}
                        required
                        className="w-full px-4 py-3 bg-[#f3f9fa] border border-[#e6e6e6] rounded-lg"
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
                            className="mt-1 h-4 w-4 text-[#5533ff] border-gray-300 rounded focus:ring-[#5533ff]"
                        />
                        <label htmlFor="acceptTerms" className="text-sm text-[#313957]">
                            {t("signup.agreeTo")}{" "}
                            <button
                                type="button"
                                onClick={() => handleViewContent('terms')}
                                className="text-[#5533ff] hover:underline font-semibold"
                            >
                                {t("signup.termsAndConditions")}
                            </button>
                        </label>
                    </div>

                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="acceptPrivacy"
                            name="acceptPrivacy"
                            checked={formData.acceptPrivacy}
                            onChange={handleChange}
                            required
                            className="mt-1 h-4 w-4 text-[#5533ff] border-gray-300 rounded focus:ring-[#5533ff]"
                        />
                        <label htmlFor="acceptPrivacy" className="text-sm text-[#313957]">
                            {t("signup.agreeTo")}{" "}
                            <button
                                type="button"
                                onClick={() => handleViewContent('privacy')}
                                className="text-[#5533ff] hover:underline font-semibold"
                            >
                                {t("signup.privacyPolicy")}
                            </button>
                        </label>
                    </div>

                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="acceptGDPR"
                            name="acceptGDPR"
                            checked={formData.acceptGDPR}
                            onChange={handleChange}
                            required
                            className="mt-1 h-4 w-4 text-[#5533ff] border-gray-300 rounded focus:ring-[#5533ff]"
                        />
                        <label htmlFor="acceptGDPR" className="text-sm text-[#313957]">
                            {t("signup.agreeTo")}{" "}
                            <button
                                type="button"
                                onClick={() => handleViewContent('gdpr')}
                                className="text-[#5533ff] hover:underline font-semibold"
                            >
                                {t("signup.gdprCompliance")}
                            </button>
                        </label>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#5533ff] hover:bg-[#4422dd] text-white font-semibold rounded-full"
                >
                    {loading ? t("auth.signingUp") : t("auth.signup")}
                </Button>
            </form>

            {message && (
                <p className="mt-4 text-center text-sm text-red-600">{message}</p>
            )}

            <div className="mt-8 text-center">
                <p className="text-sm text-[#313957]">
                    {t("auth.alreadyHaveAccount")}{" "}
                    <Link href="/login" className="font-semibold text-[#5533ff] hover:opacity-80">
                        {t("auth.login")}
                    </Link>
                </p>
            </div>

            {/* Legal Content Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
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
                                className="prose prose-sm max-w-none text-[#313957]"
                                dangerouslySetInnerHTML={{ 
                                    __html: formatContent(selectedContent.content)
                                }}
                            />
                        ) : (
                            <p className="text-[#313957]">{t("legal.loadingContent")}</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
