"use client"
import { Header } from "@/components/project/Header"
import { WorkflowContent } from "@/components/project/workflow-content"
import { ProjectDetailSkeleton } from "@/components/project/ProjectDetailSkeleton"
import Link from "next/link"
import { useState, useEffect, use, useCallback } from "react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { dataCache, cacheKeys } from "@/lib/data-cache"

export default function ProjectPageBySlug({ params }) {
    const { token } = useAuth()
    // Unwrap params Promise using React.use()
    const resolvedParams = use(params)
    const projectSlug = resolvedParams.slug
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [permissions, setPermissions] = useState(null)

    // Fetch project and role in parallel with caching for instant loading
    const fetchProject = useCallback(async () => {
        if (!projectSlug || !token) return;
        
        try {
            setLoading(true)
            
            // Try cache first for instant display
            const projectCacheKey = cacheKeys.project(projectSlug);
            const roleCacheKey = cacheKeys.projectRole(projectSlug);
            const cachedProject = dataCache.get(projectCacheKey);
            const cachedRole = dataCache.get(roleCacheKey);
            
            if (cachedProject) {
                setProject(cachedProject);
                if (cachedRole) {
                    setUserRole(cachedRole.role);
                    setPermissions(cachedRole.permissions);
                }
                setLoading(false);
            }

            // Fetch fresh data in parallel - instant data loading
            const [projectResult, roleResult] = await Promise.allSettled([
                dataCache.getOrFetch(
                    projectCacheKey,
                    () => apiService.getProject(projectSlug, token),
                    3 * 60 * 1000 // 3 minutes cache
                ),
                dataCache.getOrFetch(
                    roleCacheKey,
                    () => apiService.getUserRole(projectSlug, token).then(r => r.success ? r : null),
                    3 * 60 * 1000
                ).catch(() => null)
            ])

            // Handle project data
            if (projectResult.status === 'fulfilled') {
                const projectData = projectResult.value
                setProject(projectData)

                // Handle role data
                if (roleResult.status === 'fulfilled' && roleResult.value?.success) {
                    setUserRole(roleResult.value.role)
                    setPermissions(roleResult.value.permissions)
                } else if (projectData?.id) {
                    // Fallback to ID if slug lookup fails
                    try {
                        const roleData = await apiService.getUserRole(projectData.id, token)
                        if (roleData.success) {
                            setUserRole(roleData.role)
                            setPermissions(roleData.permissions)
                            dataCache.set(roleCacheKey, roleData, 3 * 60 * 1000);
                        }
                    } catch (fallbackErr) {
                        console.error('Error fetching user role with ID fallback:', fallbackErr)
                    }
                }
            } else {
                throw new Error(projectResult.reason?.message || 'Failed to load project')
            }
        } catch (err) {
            console.error('Error fetching project:', err)
            setError(err.message || 'Failed to load project')
        } finally {
            setLoading(false)
        }
    }, [projectSlug, token])

    useEffect(() => {
        fetchProject()
    }, [fetchProject])

    const handleProjectUpdate = async (updatedProject) => {
        // Refetch the project to ensure we have the latest data from the backend
        try {
            const token = localStorage.getItem('token')
            const projectData = await apiService.getProject(projectSlug, token)
            setProject(projectData)
            
            // Update cache with fresh data
            dataCache.set(cacheKeys.project(projectSlug), projectData, 3 * 60 * 1000);
        } catch (err) {
            console.error('Error refetching project:', err)
            // Fallback to using the updated project data if refetch fails
            setProject(updatedProject)
            // Still update cache with optimistic data
            dataCache.set(cacheKeys.project(projectSlug), updatedProject, 3 * 60 * 1000);
        }
    }

    // Render shell immediately - never block navigation
    // Show skeleton while data loads - zero perceived loading
    if (loading && !project) {
        return <ProjectDetailSkeleton />
    }

    if (error || !project) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-4">
                        {error ? 'Error loading project' : 'Project not found'}
                    </h1>
                    {error && (
                        <p className="text-red-400 mb-4">{error}</p>
                    )}
                    <Link href="/dashboard/projects" className="text-gold-solid hover:underline">
                        Back to Projects
                    </Link>
                </div>
            </div>
        )
    }

    // Transform backend data to match frontend expectations
    const transformedProject = {
        id: project.id,
        slug: project.slug || projectSlug, // Include slug in transformed project
        title: project.name,
        status: project.status,
        description: project.about,
        collection: project.collection,
        created_at: project.created_at,
        updated_at: project.updated_at,
        userRole: userRole,
        permissions: permissions,
    }

    // Render shell immediately even if data is still loading
    // This ensures instant navigation - data streams in progressively
    if (!project && !error) {
        return <ProjectDetailSkeleton />
    }

    return (
        <div className="flex flex-col overflow-hidden -m-8 min-h-[calc(100vh-4rem)]">
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header project={transformedProject} onProjectUpdate={handleProjectUpdate} />
                <WorkflowContent project={transformedProject} />
            </div>
        </div>
    )
}
