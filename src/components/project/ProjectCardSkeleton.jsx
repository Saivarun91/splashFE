/**
 * Skeleton loader for project cards
 * Shows immediately while data loads - zero perceived loading
 */
export function ProjectCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                <div className="w-6 h-6 rounded bg-gray-200"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
            <div className="h-5 bg-gray-200 rounded mb-3 w-1/2"></div>
            <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
        </div>
    )
}
