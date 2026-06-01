// header.jsx
"use client"

import { Sparkles, Grid } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/context/LanguageContext"

export function Header() {
    const router = useRouter()
    const { t } = useLanguage()

    return (
        <div className="relative border-b border-border px-8 py-8 overflow-hidden">
            <div className="flex items-center gap-4 mb-5 fade-in">
                <div className="w-14 h-14 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-lg">
                    <Sparkles size={24} className="text-primary-foreground" />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="scale-in">
                    <h1 className="text-4xl font-extrabold text-foreground mb-3">
                        {t("images.welcomeToGloAI")}, <span className="text-gold-solid">Ryagati</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium leading-relaxed">
                        {t("images.createStunningPhotography")}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard/images/gallery")}
                        className="flex items-center gap-2 px-6 py-3 bg-card rounded-2xl border border-gold-muted hover:bg-accent transition-all"
                    >
                        <Grid size={18} className="text-gold-solid" />
                        <span className="text-sm font-bold text-gold-solid">{t("images.gallery")}</span>
                    </button>
                    <div className="flex items-center gap-3 px-6 py-3 bg-card rounded-2xl border border-green-500/30">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-lg"></div>
                        <span className="text-sm font-bold text-green-400">{t("images.systemActive")}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
