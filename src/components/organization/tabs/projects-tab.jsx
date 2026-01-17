"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FolderKanban, Calendar, User, Search, ExternalLink } from "lucide-react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"

export function ProjectsTab() {
    const { token, user } = useAuth()
    const [organizations, setOrganizations] = useState([])
    const [selectedOrgId, setSelectedOrgId] = useState(null)
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")

    const isAdmin = user?.role === "admin"

    useEffect(() => {
        if (isAdmin) {
            loadOrganizations()
        } else if (user?.organization) {
            setSelectedOrgId(user.organization.id || user.organization)
            loadOrganizationProjects(user.organization.id || user.organization)
        }
    }, [token, user, isAdmin])

    useEffect(() => {
        if (selectedOrgId) {
            loadOrganizationProjects(selectedOrgId)
        }
    }, [selectedOrgId, token])

    const loadOrganizations = async () => {
        try {
            const response = await apiService.listOrganizations(token)
            if (response.organizations) {
                setOrganizations(response.organizations)
                if (response.organizations.length > 0 && !selectedOrgId) {
                    setSelectedOrgId(response.organizations[0].id)
                }
            }
        } catch (err) {
            console.error("Error loading organizations:", err)
            setError(err.message || "Failed to load organizations")
        }
    }

    const loadOrganizationProjects = async (orgId) => {
        try {
            setLoading(true)
            setError(null)
            
            // Load all projects
            const projectsResponse = await apiService.getProjects(token)
            if (projectsResponse.projects) {
                // Filter projects that belong to this organization
                // Projects may have organization as ID or object
                const orgProjects = projectsResponse.projects.filter(project => {
                    const projectOrgId = project.organization?.id || project.organization_id || project.organization
                    return projectOrgId === orgId || String(projectOrgId) === String(orgId)
                })
                setProjects(orgProjects)
            } else {
                setProjects([])
            }
        } catch (err) {
            console.error("Error loading organization projects:", err)
            setError(err.message || "Failed to load projects")
            setProjects([])
        } finally {
            setLoading(false)
        }
    }

    const filteredProjects = projects.filter(project =>
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.about?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading && !projects.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-[#737373]">Loading projects...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-[#1a1a1a]">Projects</h2>
                <p className="text-sm text-[#737373] mt-1">View organization projects</p>
            </div>

            {/* Organization Selector (Admin only) */}
            {isAdmin && organizations.length > 0 && (
                <div>
                    <label className="text-sm font-medium text-[#1a1a1a] mb-2 block">Select Organization</label>
                    <select
                        value={selectedOrgId || ""}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e6e6e6] rounded-md"
                    >
                        {organizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373] w-4 h-4" />
                <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Projects List */}
            <div className="grid gap-4">
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-12 text-[#737373]">
                        <FolderKanban className="w-12 h-12 mx-auto mb-4 text-[#e6e6e6]" />
                        <p>No projects found</p>
                    </div>
                ) : (
                    filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            className="bg-white rounded-lg border border-[#e6e6e6] p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FolderKanban className="w-5 h-5 text-[#884cff]" />
                                        <h3 className="text-lg font-semibold text-[#1a1a1a]">{project.name}</h3>
                                    </div>
                                    {project.about && (
                                        <p className="text-sm text-[#737373] mb-4 line-clamp-2">{project.about}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-[#737373]">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {project.created_at
                                                    ? new Date(project.created_at).toLocaleDateString()
                                                    : "N/A"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                project.status === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : project.status === "completed"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}>
                                                {project.status || "active"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/dashboard/projects/${project.id}`}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[#884cff] hover:text-[#7a3ff0]"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        View
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

