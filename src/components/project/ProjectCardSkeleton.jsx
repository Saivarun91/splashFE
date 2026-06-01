/**
 * Skeleton loader for project cards
 * Shows immediately while data loads - zero perceived loading
 */
export function ProjectCardSkeleton() {
    return (
        <div className="bg-card rounded-2xl p-6 border border-border animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted"></div>
                <div className="w-6 h-6 rounded bg-muted"></div>
            </div>
            <div className="h-6 bg-muted rounded mb-3 w-3/4"></div>
            <div className="h-5 bg-muted rounded mb-3 w-1/2"></div>
            <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-muted"></div>
                    <div className="w-8 h-8 rounded-full bg-muted"></div>
                </div>
                <div className="h-4 bg-muted rounded w-12"></div>
            </div>
        </div>
    )
}
