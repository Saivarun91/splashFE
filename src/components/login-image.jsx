export default function LoginImage() {
    return (
        <div className="relative w-full h-full min-h-96">
            {/* Top left - Small jewelry image */}
            <div className="absolute bottom-50 left-10 w-48 h-48 rounded-2xl overflow-hidden shadow-lg z-10 border border-gold-muted/50">
                <img src="/images/login-1.jpg" alt="Diamond heart pendant" className="w-full h-full object-cover" />
            </div>

            {/* Bottom right - Large jewelry image */}
            <div className="absolute top-20 right-0 w-100 h-100 rounded-2xl overflow-hidden shadow-2xl border border-gold-muted/50">
                <img
                    src="/images/login-2.jpg"
                    alt="Woman wearing luxury jewelry"
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
    )
}
