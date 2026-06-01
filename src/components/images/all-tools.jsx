// all-tools.jsx
"use client"

import { Zap, ImageIcon, Wand2, Users, Camera, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/context/LanguageContext"
import { Button } from "@/components/ui/button"

export function AllTools() {
    const router = useRouter()
    const { t } = useLanguage()

    const tools = [
        {
            icon: Zap,
            title: t("images.plainBackground"),
            description: t("images.cleanProductShots"),
            status: "active",
            path: "/dashboard/images/white-bg"
        },
        {
            icon: ImageIcon,
            title: t("images.backgroundReplace"),
            description: t("images.aiPoweredTransformation"),
            status: "active",
            path: "/dashboard/images/replace-bg"
        },
        {
            icon: Wand2,
            title: t("images.aiModel"),
            description: t("images.generateWithAIModel"),
            status: "active",
            path: "/dashboard/images/ai-model"
        },
        {
            icon: Users,
            title: t("images.realModel"),
            description: t("images.lifestyleShot"),
            status: "active",
            path: "/dashboard/images/real-model"
        },
        {
            icon: Camera,
            title: t("images.campaignShots"),
            description: t("images.marketingReady"),
            status: "active",
            path: "/dashboard/images/campaign"
        },
    ]

    const getStatusBadge = (status) => {
        const styles = {
            active: "bg-green-500/10 text-green-400 border-green-500/30",
            new: "bg-blue-500/10 text-blue-400 border-blue-500/30",
            coming: "bg-secondary text-muted-foreground border-border"
        }

        const labels = {
            active: t("images.available"),
            new: t("images.new"),
            coming: t("images.comingSoon")
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
                {labels[status]}
            </span>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6 fade-in">
                <h2 className="text-2xl font-extrabold text-foreground">{t("images.allTools")}</h2>
                <button className="flex items-center gap-2 text-sm font-bold text-gold-solid hover:brightness-110 transition-all group">
                    {t("images.viewAllTools")}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            <div className="grid grid-cols-3 gap-6">
                {tools.map((tool, idx) => (
                    <div
                        key={idx}
                        className="bg-card rounded-xl p-7 border border-border hover:border-gold-muted transition-all duration-300 cursor-pointer group scale-in"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div className="flex items-start justify-between mb-5">
                            <div className="p-4 bg-gold-gradient rounded-2xl text-primary-foreground shadow-lg group-hover:scale-110 transition-all duration-300">
                                <tool.icon size={28} strokeWidth={2} />
                            </div>
                            {getStatusBadge(tool.status)}
                        </div>
                        <h3 className="font-extrabold text-foreground mb-3 text-xl group-hover:text-gold-solid transition-colors">{tool.title}</h3>
                        <p className="text-sm text-muted-foreground mb-5 leading-relaxed font-medium">{tool.description}</p>
                        {tool.status === "coming" ? (
                            <button
                                disabled
                                className="w-full py-3 px-5 rounded-xl text-sm font-bold bg-secondary text-muted-foreground cursor-not-allowed border border-border"
                            >
                                {t("images.comingSoon")}
                            </button>
                        ) : (
                            <Button
                                variant="brand"
                                className="w-full py-3 h-auto rounded-xl text-sm"
                                onClick={() => tool.path && router.push(tool.path)}
                            >
                                {t("images.getStarted")}
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
