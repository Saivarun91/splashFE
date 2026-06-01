/**
 * Skeleton loader for project detail page
 * Renders shell immediately - zero blocking
 */
export function ProjectDetailSkeleton() {
    return (
        <div className="flex flex-col overflow-hidden -m-8">
            {/* Header Skeleton */}
            <div className="h-20 bg-card border-b border-border animate-pulse">
                <div className="h-full flex items-center justify-between px-6">
                    <div className="h-8 bg-muted rounded w-48"></div>
                    <div className="flex gap-3">
                        <div className="h-10 bg-muted rounded w-24"></div>
                        <div className="h-10 bg-muted rounded w-24"></div>
                    </div>
                </div>
            </div>
            
            {/* Tabs Skeleton */}
            <div className="border-b border-border bg-card">
                <div className="flex gap-6 px-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 w-24 bg-muted rounded-t animate-pulse"></div>
                    ))}
                </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="flex-1 overflow-auto p-6">
                <div className="space-y-6">
                    <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
                    <div className="h-48 bg-muted rounded-lg animate-pulse"></div>
                    <div className="h-48 bg-muted rounded-lg animate-pulse"></div>
                </div>
            </div>
        </div>
    )
}
