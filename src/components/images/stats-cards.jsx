// stats-cards.jsx
import { CheckCircle, RotateCw, Camera, TrendingUp } from "lucide-react"

export function StatsCards() {
    const stats = [
        {
            title: "Images Generated",
            value: "3",
            subtitle: "+2 this week",
            icon: Camera,
            trend: "up",
        },
        {
            title: "Avg. Processing Time",
            value: "23s",
            subtitle: "Faster than last week",
            icon: RotateCw,
            trend: "down",
        },
        {
            title: "Success Rate",
            value: "100%",
            subtitle: "Perfect results",
            icon: CheckCircle,
            trend: "up",
        },
    ]

    return (
        <div className="grid grid-cols-3 gap-6">
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    className="bg-card rounded-xl p-7 border border-border hover:border-gold-muted transition-all duration-300 group scale-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-muted-foreground font-bold uppercase tracking-wider text-sm">{stat.title}</h3>
                        <div className="p-3 bg-gold-gradient rounded-xl text-primary-foreground shadow-lg group-hover:scale-110 transition-all duration-300">
                            <stat.icon size={22} strokeWidth={2} />
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-5xl font-extrabold text-gold-solid mb-2">{stat.value}</p>
                            <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border">
                                <TrendingUp size={16} className={stat.trend === "up" ? "text-green-500" : "text-red-500"} />
                                <span className="text-xs text-muted-foreground font-semibold">{stat.subtitle}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
