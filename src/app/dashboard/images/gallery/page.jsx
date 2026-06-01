"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Grid, Download, Trash2, Filter, Calendar, Tag, RefreshCw, Loader2, X, Sparkles, AlertCircle, Eye } from "lucide-react"
import Image from "next/image"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import toast from "react-hot-toast"
import { openImageViewer } from "@/lib/openImageViewer"

export default function GalleryPage() {
    const router = useRouter()
    const { token } = useAuth()
    const { t } = useLanguage()
    const [images, setImages] = useState([])
    const [filter, setFilter] = useState("all")
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [regenerateModal, setRegenerateModal] = useState({
        isOpen: false,
        image: null,
        prompt: '',
        loading: false,
        error: null
    })

    // Map filter categories to image types for API
    const getFilterType = (filterCategory) => {
        if (filterCategory === "all") return null
        if (filterCategory === "plain") return "white_background"
        if (filterCategory === "themed") return "background_change"
        if (filterCategory === "model") return null // Will need to filter both model types
        if (filterCategory === "campaign") return "campaign_shot_advanced"
        return null
    }

    // Map image types to filter categories
    const getImageCategory = (imageType) => {
        if (imageType === "white_background") return t("images.plain")
        if (imageType === "background_change") return t("images.themed")
        if (imageType === "model_with_ornament" || imageType === "real_model_with_ornament") return t("images.model")
        if (imageType === "campaign_shot_advanced") return t("images.campaign")
        return t("images.plain") // default
    }

    // Calculate days ago
    const getDaysAgo = (dateString) => {
        if (!dateString) return t("images.recently")
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now - date)
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays === 0) return t("images.justNow")
        if (diffDays === 1) return `1 ${t("images.dayAgo")}`
        return `${diffDays} ${t("images.daysAgo")}`
    }

    useEffect(() => {
        loadImages()
    }, [filter, page])

    const loadImages = async () => {
        setLoading(true)
        try {
            const filterType = getFilterType(filter)
            // For "model" filter, we need to load all and filter client-side
            const response = await apiService.getUserImages(filterType, page, 20)

            if (response.success) {
                console.log("API Images:", response.images)
                let filtered = response.images
                // Client-side filter for "model" category (both model types)
                if (filter === "model") {
                    filtered = response.images.filter(img => 
                        img.type === "model_with_ornament" || img.type === "real_model_with_ornament"
                    )
                }
                setImages(filtered)
                setTotalPages(response.pagination.pages)
            }
        } catch (error) {
            console.error("Error loading images:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredImages = images

    const handleDelete = async (imageId) => {
        if (!confirm(t("images.confirmDelete") || "Are you sure you want to delete this image?")) {
            return
        }

        try {
            const response = await apiService.deleteUserImage(imageId, token)
            if (response && response.success) {
                // Remove the image from the current list immediately for better UX
                setImages(prevImages => prevImages.filter(img => img.id !== imageId))
                
                // Move back a page if last image was deleted
                if (images.length === 1 && page > 1) {
                    setPage(prev => prev - 1)
                } else {
                    // Reload images to refresh the list
                    await loadImages()
                }
    
                toast.success(t("images.imageDeletedSuccess") || "Image deleted successfully")
            } else {
                throw new Error(response?.error || "Failed to delete image")
            }
        } catch (error) {
            console.error("Error deleting image:", error)
            toast.error(error.message || t("images.failedToDeleteImage") || "Failed to delete image")
        }
    }
    



    // Download image function using blob approach
    const downloadImage = async (url, filename = "image.png") => {
        try {
            const response = await fetch(url, {
                mode: 'cors',
                cache: 'no-cache'
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`)
            }

            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)

            const link = document.createElement("a")
            link.href = blobUrl
            link.download = filename
            link.style.display = 'none'

            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                link.remove()
                window.URL.revokeObjectURL(blobUrl)
            }, 100)
        } catch (error) {
            console.error('Error downloading image:', error)
            // Fallback: open in new tab
            window.open(url, '_blank')
            toast.error(t("images.downloadFailed"))
        }
    }

    const handleDownload = (image) => {
        const imageType = getImageCategory(image.type).toLowerCase().replace(/\s+/g, '-')
        const timestamp = image.created_at ? new Date(image.created_at).getTime() : Date.now()
        const filename = `image-${imageType}-${timestamp}.png`
        downloadImage(image.generated_image_url, filename)
    }

    const handleView = (image) => {
        const viewerItems = filteredImages.map((img, idx) => ({
            url: img.generated_image_url,
            label: `${getImageCategory(img.type)} ${idx + 1}`
        }))
        const activeIndex = filteredImages.findIndex((img) => img.id === image.id)
        openImageViewer(viewerItems, activeIndex >= 0 ? activeIndex : 0)
    }
      

    const handleRegenerate = (image) => {
        setRegenerateModal({
            isOpen: true,
            image,
            prompt: '',
            loading: false,
            error: null
        })
    }

    const submitRegenerate = async () => {
        if (!regenerateModal.prompt.trim()) {
            setRegenerateModal(prev => ({
                ...prev,
                error: t("images.pleaseEnterPrompt")
            }))
            return
        }
        console.log(regenerateModal.prompt)

        setRegenerateModal(prev => ({ ...prev, loading: true, error: null }))

        try {
            const response = await apiService.regenerateImage(
                regenerateModal.image.id,
                regenerateModal.prompt, token
            )

            if (response.success) {
                // Refresh the gallery
                await loadImages()

                // Close modal and show success
                setRegenerateModal({
                    isOpen: false,
                    image: null,
                    prompt: '',
                    loading: false,
                    error: null
                })

                toast.success(t("images.imageRegeneratedSuccess"))
            } else {
                throw new Error(response.error || 'Regeneration failed')
            }
        } catch (error) {
            console.error("Error regenerating image:", error)
            setRegenerateModal(prev => ({
                ...prev,
                loading: false,
                error: error.response?.data?.error || error.message || t("images.failedToRegenerate")
            }))
        }
    }

    const closeRegenerateModal = () => {
        if (!regenerateModal.loading) {
            setRegenerateModal({
                isOpen: false,
                image: null,
                prompt: '',
                loading: false,
                error: null
            })
        }
    }


    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-4xl font-bold text-foreground">{t("dashboard.myImages")}</h1>
                    <p className="text-muted-foreground text-lg">{t("images.allVisualsInOnePlace")}</p>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => {
                            setFilter("all")
                            setPage(1)
                        }}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                            filter === "all"
                                ? "bg-gold-gradient text-primary-foreground"
                                : "bg-secondary text-foreground hover:bg-accent border border-border"
                        }`}
                    >
                        {t("images.all")}
                    </button>
                    <button
                        onClick={() => {
                            setFilter("plain")
                            setPage(1)
                        }}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                            filter === "plain"
                                ? "bg-gold-gradient text-primary-foreground"
                                : "bg-secondary text-foreground hover:bg-accent border border-border"
                        }`}
                    >
                        {t("images.plain")}
                    </button>
                    <button
                        onClick={() => {
                            setFilter("themed")
                            setPage(1)
                        }}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                            filter === "themed"
                                ? "bg-gold-gradient text-primary-foreground"
                                : "bg-secondary text-foreground hover:bg-accent border border-border"
                        }`}
                    >
                        {t("images.themed")}
                    </button>
                    <button
                        onClick={() => {
                            setFilter("model")
                            setPage(1)
                        }}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                            filter === "model"
                                ? "bg-gold-gradient text-primary-foreground"
                                : "bg-secondary text-foreground hover:bg-accent border border-border"
                        }`}
                    >
                        {t("images.model")}
                    </button>
                    <button
                        onClick={() => {
                            setFilter("campaign")
                            setPage(1)
                        }}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                            filter === "campaign"
                                ? "bg-gold-gradient text-primary-foreground"
                                : "bg-secondary text-foreground hover:bg-accent border border-border"
                        }`}
                    >
                        {t("images.campaign")}
                    </button>
                </div>

                {/* Gallery Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-gold-solid animate-spin mx-auto mb-4" />
                            <p className="text-muted-foreground">{t("images.loadingImages")}</p>
                        </div>
                    </div>
                ) : filteredImages.length === 0 ? (
                    <div className="bg-card rounded-xl p-16 border border-border text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-gold-from/10 to-gold-to/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Grid className="w-12 h-12 text-gold-solid" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">No Images Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            {filter === "all"
                                ? "Start generating images to see them here"
                                : t("images.noImagesFound")}
                        </p>
                        <button
                            onClick={() => router.push("/dashboard/")}
                            className="px-8 py-3 bg-gold-gradient text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg"
                        >
                            Start Creating
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {filteredImages.map((image) => (
                                <div
                                    key={image.id}
                                    className="group cursor-pointer"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                                    <Image
  src={`${image.generated_image_url}?v=${image.id}`}
  alt={image.prompt || "Generated image"}
  fill
  className="object-cover"
            />

    {/* Dark hover overlay */}
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

    {/* ✅ DELETE BUTTON (TOP RIGHT) */}
    <button
        onClick={(e) => {
            e.stopPropagation()
            handleDelete(image.id)
        }}
        className="
            absolute top-2 right-2 z-10
            opacity-0 group-hover:opacity-100
            p-2 rounded-full
            bg-card hover:bg-red-500/10 border border-border
            text-red-600 hover:text-red-400
            shadow-md transition-all
        "
        title={t("images.delete") || "Delete"}
    >
        <Trash2 size={16} />
    </button>

    {/* Hover Actions (center buttons) */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 bg-black/40">
        <button
            onClick={(e) => {
                e.stopPropagation()
                handleView(image)
            }}
            className="p-2 rounded-full bg-card hover:bg-accent text-foreground hover:text-gold-solid border border-border shadow-md transition-all"
            title={t("images.view") || "View"}
        >
            <Eye size={18} />
        </button>
        <button
            onClick={(e) => {
                e.stopPropagation()
                handleDownload(image)
            }}
            className="p-2 rounded-full bg-card hover:bg-accent text-foreground hover:text-gold-solid border border-border shadow-md transition-all"
            title={t("images.download") || "Download"}
        >
            <Download size={18} />
        </button>
        <button
            onClick={(e) => {
                e.stopPropagation()
                handleRegenerate(image)
            }}
            className="p-2 rounded-full bg-card hover:bg-accent text-foreground hover:text-gold-solid border border-border shadow-md transition-all"
            title={t("images.regenerate") || "Regenerate"}
        >
            <RefreshCw size={18} />
        </button>
    </div>

    {/* Parent indicator */}
    {image.parent_image_id && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <RefreshCw size={10} />
            {t("images.regenerated")}
        </div>
    )}
</div>


                                    {/* Details */}
                                    <div className="bg-card rounded-lg p-2 border border-border">
                                        <p className="text-sm font-medium text-foreground mb-1">
                                            {getImageCategory(image.type)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Generated {getDaysAgo(image.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-foreground font-medium">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Info Note */}
                <div className="mt-12 bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        ✨ Regeneration Feature
                    </h4>
                    <p className="text-green-400 text-sm">
                        Click the "Regen" button on any image to regenerate it with modifications. The system will combine your original prompt with the new one to maintain context while applying your changes!
                    </p>
                </div>
            </div>

            {/* Regenerate Modal */}
            {regenerateModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex-shrink-0 border-b border-border bg-card p-6 rounded-t-xl z-10 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gold-gradient rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{t("images.regenerateImage")}</h2>
                                        <p className="text-sm text-muted-foreground">Modify and regenerate this image</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeRegenerateModal}
                                    disabled={regenerateModal.loading}
                                    className="p-2 hover:bg-accent rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <X className="w-6 h-6 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
                            {/* Current Image */}
                            <div>
                                <p className="text-sm font-semibold text-foreground mb-3">Current Image:</p>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-border">
                                    <Image
                                        src={regenerateModal.image.generated_image_url}
                                        alt="Current image"
                                        fill
                                        className="object-contain bg-secondary/30"
                                    />
                                </div>
                            </div>

                            {/* Original Prompt */}
                            {/* {regenerateModal.image.original_prompt && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-900 mb-2">Original Prompt:</p>
                                    <p className="text-sm text-blue-700">
                                        {regenerateModal.image.original_prompt}
                                    </p>
                                </div>
                            )} */}

                            {/* New Prompt Input */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-gold-solid" />
                                    What would you like to change?
                                </label>
                                <textarea
                                    value={regenerateModal.prompt}
                                    onChange={(e) => setRegenerateModal(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={t("images.regeneratePromptPlaceholder")}
                                    className="w-full px-4 py-3 border border-border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                                    rows="4"
                                    disabled={regenerateModal.loading}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    💡 Your modification will be combined with the original prompt to maintain context
                                </p>
                            </div>

                            {/* Error Message */}
                            {regenerateModal.error && (
                                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-400 text-sm">{regenerateModal.error}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button
                                    onClick={closeRegenerateModal}
                                    disabled={regenerateModal.loading}
                                    className="flex-1 px-6 py-3 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-secondary/30 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitRegenerate}
                                    disabled={regenerateModal.loading || !regenerateModal.prompt.trim()}
                                    className="flex-1 px-6 py-3 bg-gold-gradient text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {regenerateModal.loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Regenerating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5" />
                                            {t("images.regenerateImage")}
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Loading Info */}
                            {regenerateModal.loading && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-yellow-800 text-sm text-center">
                                        ⏱️ This may take 10-30 seconds. Please wait...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
