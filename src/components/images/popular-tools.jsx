// popular-tools.jsx
"use client"

import { Zap, ImageIcon, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/context/LanguageContext"
import { Badge } from "@/components/ui/badge"

export function PopularTools() {
    const router = useRouter()
    const { t } = useLanguage()

    const tools = [
        {
            icon: Zap,
            title: t("images.plainBackground"),
            description: t("images.cleanProductShots"),
            popular: true,
            path: "/dashboard/images/white-bg"
        },
        {
            icon: ImageIcon,
            title: t("images.backgroundReplace"),
            description: t("images.aiPoweredTransformation"),
            popular: true,
            path: "/dashboard/images/replace-bg"
        },
    ]

    return (
        <div>
            <div className="flex items-center gap-3 mb-6 fade-in">
                <h2 className="text-2xl font-extrabold text-foreground">{t("images.popularTools")}</h2>
                <Badge variant="brand" className="gap-1.5">
                    <Star size={14} className="fill-current" />
                    {t("images.mostUsed")}
                </Badge>
            </div>
            <div className="grid grid-cols-2 gap-6">
                {tools.map((tool, idx) => (
                    <div
                        key={idx}
                        className="bg-card rounded-xl p-8 border border-border hover:border-gold-muted transition-all duration-300 cursor-pointer group relative overflow-hidden scale-in"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        {tool.popular && (
                            <div className="absolute top-5 right-5">
                                <Badge variant="brand" className="gap-1">
                                    <Star size={12} className="fill-current" />
                                    {t("images.popular")}
                                </Badge>
                            </div>
                        )}
                        <div className="flex items-start gap-5">
                            <div className="p-4 bg-gold-gradient rounded-2xl text-primary-foreground shadow-xl group-hover:scale-110 transition-all duration-300">
                                <tool.icon size={32} strokeWidth={2} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-extrabold text-foreground text-xl mb-2 group-hover:text-gold-solid transition-colors">{tool.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed font-medium mb-4">{tool.description}</p>
                                <button
                                    onClick={() => router.push(tool.path)}
                                    className="text-sm font-bold text-gold-solid hover:brightness-110 transition-all group-hover:translate-x-2 inline-flex items-center gap-1"
                                >
                                    {t("images.tryNow")} <span className="text-lg">→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
