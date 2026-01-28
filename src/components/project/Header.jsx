"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Edit2, Trash2, CheckCircle, Clock, Loader2 } from "lucide-react"
import { apiService } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import toast from "react-hot-toast"

export function Header({ project, onProjectUpdate }) {
    const router = useRouter()
    const { t } = useLanguage()
    const [updating, setUpdating] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editName, setEditName] = useState("")
    const [editDescription, setEditDescription] = useState("")

    // Normalize incoming data
    const projectData = {
        id: project?.id,
        title: project?.title || project?.name || t("images.untitledProject"),
        description: project?.description || project?.about || "",
        status: project?.status?.toLowerCase() || "progress",
        userRole: project?.userRole || "owner",
    }

    const getInitial = (title) => (title ? title.charAt(0).toUpperCase() : "?")

    const isCompleted = projectData.status === "completed"

    // Update edit fields when project prop changes
    useEffect(() => {
        if (project) {
            const currentTitle = project?.title || project?.name || t("images.untitledProject")
            const currentDescription = project?.description || project?.about || ""
            setEditName(currentTitle)
            setEditDescription(currentDescription)
        }
    }, [project])

    // Toggle between only "progress" and "completed"
    const handleStatusToggle = async () => {
        const newStatus = isCompleted ? "progress" : "completed"
        setUpdating(true)

        try {
            const token = localStorage.getItem("token")
            const response = await apiService.updateProjectStatus(projectData.id, newStatus, token)

            if (response.status || response.id) {
                onProjectUpdate?.({ ...projectData, status: newStatus })
            }
        } catch (error) {
            console.error("Error updating project status:", error)
            toast.error(t("images.failedToUpdate"))
        } finally {
            setUpdating(false)
        }
    }

    // Styling based on status
    const getStatusStyle = () => {
        if (isCompleted) {
            return {
                border: "border-green-500",
                bg: "bg-green-50",
                dot: "bg-green-500",
                text: "text-green-700",
            }
        }
        return {
            border: "border-amber-500",
            bg: "bg-amber-50",
            dot: "bg-amber-500",
            text: "text-amber-700",
        }
    }

    const statusStyle = getStatusStyle()

    // Human-readable display label
    const displayStatus =
        projectData.status === "progress" ? t("images.inProgress") : t("images.completed")

    // Handle edit button click
    const handleEditClick = () => {
        // Use the latest project data when opening the modal
        const currentTitle = project?.title || project?.name || "Untitled Project"
        const currentDescription = project?.description || project?.about || ""
        setEditName(currentTitle)
        setEditDescription(currentDescription)
        setIsEditModalOpen(true)
    }

    // Handle save project changes
    const handleSaveProject = async () => {
        if (!editName.trim()) {
            toast.error(t("images.projectNameRequired"))
            return
        }

        setIsSaving(true)
        try {
            const token = localStorage.getItem("token")
            const response = await apiService.updateProject(
                projectData.id,
                {
                    name: editName.trim(),
                    about: editDescription.trim(),
                },
                token
            )

            if (response.id || response.name) {
                // Update parent with backend response format
                onProjectUpdate?.({
                    ...project,
                    name: response.name || editName.trim(),
                    about: response.about || editDescription.trim(),
                    status: response.status || projectData.status,
                })
                setIsEditModalOpen(false)
                toast.success(t("images.projectUpdated"))
            }
        } catch (error) {
            console.error("Error updating project:", error)
            toast.error(t("images.failedToUpdate"))
        } finally {
            setIsSaving(false)
        }
    }

    // Handle delete project
    const handleDeleteProject = async () => {
        if (!confirm(t("images.deleteConfirm"))) {
            return
        }

        setIsDeleting(true)
        try {
            const token = localStorage.getItem("token")
            await apiService.deleteProject(projectData.id, token)

            toast.success("Project deleted successfully")
            router.push("/dashboard/projects")
        } catch (error) {
            console.error("Error deleting project:", error)
            toast.error("Failed to delete project. Please try again.")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="border-b border-[#e6e6e6] bg-white px-8 py-6">
            <div className="flex items-center justify-between">
                {/* Left section: Title + Status */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#884cff] rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                                {getInitial(projectData.title)}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-[#1a1a1a]">
                            {projectData.title}
                        </h1>
                    </div>

                    {/* Status badge */}
                    <div className="ml-4">
                        <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${statusStyle.border} ${statusStyle.bg}`}
                        >
                            <div
                                className={`w-2 h-2 ${statusStyle.dot} rounded-full ${isCompleted ? "" : "animate-pulse"
                                    }`}
                            ></div>
                            <span className={`text-sm font-medium ${statusStyle.text}`}>
                                {displayStatus}
                            </span>
                        </span>
                    </div>
                </div>

                {/* Right section: Action buttons */}
                {projectData.userRole === "owner" && (
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className={`gap-2 ${isCompleted
                                ? "border-green-500 text-green-700 hover:bg-green-50"
                                : "border-amber-500 text-amber-700 hover:bg-amber-50"
                                }`}
                            onClick={handleStatusToggle}
                            disabled={updating}
                        >
                            {isCompleted ? (
                                <>
                                    <Clock className="w-4 h-4" />
                                    {updating ? t("common.loading") : t("images.markAsInProgress")}
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    {updating ? t("common.loading") : t("images.markAsCompleted")}
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-transparent"
                            onClick={handleEditClick}
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </Button>
                        {/* 
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                            <Download className="w-4 h-4" />
                            Download
                        </Button> */}

                        <Button
                            size="sm"
                            className="gap-2 bg-[#f05656] hover:bg-[#e04545] text-white"
                            onClick={handleDeleteProject}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t("images.deleting")}
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    {t("images.deleteProject")}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Edit Project Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                            {t("images.updateProjectDetails")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="project-name" className="text-sm font-medium">
                                {t("images.projectName")}
                            </label>
                            <Input
                                id="project-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder={t("images.enterProjectName")}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="project-description" className="text-sm font-medium">
                                {t("images.projectDescription")}
                            </label>
                            <Textarea
                                id="project-description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder={t("images.enterProjectDescription")}
                                rows={4}
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                            disabled={isSaving}
                        >
                            {t("images.cancel")}
                        </Button>
                        <Button
                            onClick={handleSaveProject}
                            disabled={isSaving || !editName.trim()}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t("profile.saving")}
                                </>
                            ) : (
                                t("images.saveChanges")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
