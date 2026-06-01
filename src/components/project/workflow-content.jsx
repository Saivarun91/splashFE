"use client"

import { useState, Suspense, lazy } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkflowTab } from "@/components/project/tabs/workflow-tab"
import { useImageGeneration } from "@/context/ImageGenerationContext"

// Lazy load heavy tabs for code splitting
const OverviewTab = lazy(() => import("@/components/project/tabs/overview-tab").then(mod => ({ default: mod.default })))
const ResultsTab = lazy(() => import("@/components/project/tabs/results-tab").then(mod => ({ default: mod.default })))
const CollaboratorsTab = lazy(() => import("@/components/project/tabs/collaborators-tab").then(mod => ({ default: mod.default })))

// Loading skeleton component
function TabSkeleton() {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-solid mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
}

export function WorkflowContent({ project }) {
    const [activeTab, setActiveTab] = useState("workflow")
    const { isGenerating } = useImageGeneration()

    return (
        <div className="flex-1 overflow-auto">
            <Tabs value={activeTab} onValueChange={(value) => !isGenerating && setActiveTab(value)} className="w-full">
                <div className="border-b border-border bg-card sticky top-0 z-10">
                    <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto border-b border-border">
                        <TabsTrigger
                            value="workflow"
                            disabled={isGenerating}
                            className={`rounded-none cursor-pointer border-b-2 border-transparent px-6 py-4 text-muted-foreground data-[state=active]:border-gold-solid data-[state=active]:bg-gold-solid/10 data-[state=active]:text-gold-solid ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Workflow
                        </TabsTrigger>
                        <TabsTrigger
                            value="overview"
                            disabled={isGenerating}
                            className={`rounded-none cursor-pointer border-b-2 border-transparent px-6 py-4 text-muted-foreground data-[state=active]:border-gold-solid data-[state=active]:bg-gold-solid/10 data-[state=active]:text-gold-solid ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="results"
                            disabled={isGenerating}
                            className={`rounded-none cursor-pointer border-b-2 border-transparent px-6 py-4 text-muted-foreground data-[state=active]:border-gold-solid data-[state=active]:bg-gold-solid/10 data-[state=active]:text-gold-solid ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Results
                        </TabsTrigger>
                        <TabsTrigger
                            value="collaborators"
                            disabled={isGenerating}
                            className={`rounded-none cursor-pointer border-b-2 border-transparent px-6 py-4 text-muted-foreground data-[state=active]:border-gold-solid data-[state=active]:bg-gold-solid/10 data-[state=active]:text-gold-solid ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Collaborators
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="workflow" className="p-6 m-0">
                    <WorkflowTab project={project} />
                </TabsContent>

                <TabsContent value="overview" className="p-6 m-0">
                    <Suspense fallback={<TabSkeleton />}>
                        <OverviewTab project={project} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="results" className="p-6 m-0">
                    <Suspense fallback={<TabSkeleton />}>
                        <ResultsTab project={project} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="collaborators" className="m-0">
                    <Suspense fallback={<TabSkeleton />}>
                        <CollaboratorsTab projectId={project.id} projectData={project} />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    )
}
