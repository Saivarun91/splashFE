/**
 * Skeleton loader for project detail page
 * Renders shell immediately - zero blocking
 */
export function ProjectDetailSkeleton() {
    return (
        <div className="flex h-screen bg-[#fcfcfc]">
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header Skeleton */}
                <div className="h-20 bg-white border-b border-gray-200 animate-pulse">
                    <div className="h-full flex items-center justify-between px-6">
                        <div className="h-8 bg-gray-200 rounded w-48"></div>
                        <div className="flex gap-3">
                            <div className="h-10 bg-gray-200 rounded w-24"></div>
                            <div className="h-10 bg-gray-200 rounded w-24"></div>
                        </div>
                    </div>
                </div>
                
                {/* Tabs Skeleton */}
                <div className="border-b border-[#e6e6e6] bg-white">
                    <div className="flex gap-6 px-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 w-24 bg-gray-100 rounded-t animate-pulse"></div>
                        ))}
                    </div>
                </div>
                
                {/* Content Skeleton */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="space-y-6">
                        <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
                        <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
                        <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
