"use client"
import { Header } from "@/components/project/Header"
import { WorkflowContent } from "@/components/project/workflow-content"
import Link from "next/link"
import { useState, useEffect, use } from "react"
import { apiService } from "@/lib/api"

export default function ProjectPageBySlug({ params }) {
    // Unwrap params Promise using React.use()
    const resolvedParams = use(params)
    const projectSlug = resolvedParams.slug
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [permissions, setPermissions] = useState(null)

    const fetchProject = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            // API service getProject now supports both ID and slug (backend handles both)
            const projectData = await apiService.getProject(projectSlug, token)
            setProject(projectData)
            console.log("projectData", projectData)
            // Get user role and permissions (backend supports both ID and slug)
            if (token) {
                try {
                    // Use slug since backend supports it, fallback to ID if needed
                    const roleData = await apiService.getUserRole(projectSlug, token)
                    if (roleData.success) {
                        setUserRole(roleData.role)
                        setPermissions(roleData.permissions)
                    }
                } catch (roleErr) {
                    console.error('Error fetching user role:', roleErr)
                    // Fallback to using project ID if slug lookup fails
                    if (projectData?.id) {
                        try {
                            const roleData = await apiService.getUserRole(projectData.id, token)
                            if (roleData.success) {
                                setUserRole(roleData.role)
                                setPermissions(roleData.permissions)
                            }
                        } catch (fallbackErr) {
                            console.error('Error fetching user role with ID fallback:', fallbackErr)
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching project:', err)
            setError(err.message || 'Failed to load project')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (projectSlug) {
            fetchProject()
        }
    }, [projectSlug])

    const handleProjectUpdate = async (updatedProject) => {
        // Refetch the project to ensure we have the latest data from the backend
        try {
            const token = localStorage.getItem('token')
            const projectData = await apiService.getProject(projectSlug, token)
            setProject(projectData)
        } catch (err) {
            console.error('Error refetching project:', err)
            // Fallback to using the updated project data if refetch fails
            setProject(updatedProject)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen bg-[#fcfcfc] items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7753ff] mx-auto mb-4"></div>
                    <p className="text-lg text-[#1a1a1a]">Loading project...</p>
                </div>
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="flex h-screen bg-[#fcfcfc] items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[#1a1a1a] mb-4">
                        {error ? 'Error loading project' : 'Project not found'}
                    </h1>
                    {error && (
                        <p className="text-red-600 mb-4">{error}</p>
                    )}
                    <Link href="/dashboard/projects" className="text-[#7753ff] hover:underline">
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

    return (
        <div className="flex h-screen bg-[#fcfcfc]">
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header project={transformedProject} onProjectUpdate={handleProjectUpdate} />
                <WorkflowContent project={transformedProject} />
            </div>
        </div>
    )
}
