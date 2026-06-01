import { Upload, X, Eye, MessageCircle, Trash2 } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { useState, useEffect, useRef } from "react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { formatRelativeCommentTime } from "@/lib/comment-time"

export function ColorPalette({ showSuggestions = false, collectionData, project, onSave, onSelectionsChange, onImagesChange, canEdit = true }) {
    const { token } = useAuth()
    const [selectedOutfits, setSelectedOutfits] = useState([])
    const [selectedColors, setSelectedColors] = useState([])
    const [pickedColors, setPickedColors] = useState([])
    const [colorInstructions, setColorInstructions] = useState("")
    const [uploadedImages, setUploadedImages] = useState({
        outfits: [],
        colors: [],
    })
    const [uploading, setUploading] = useState({
        outfits: false,
        colors: false,
    })
    const [activeCommentField, setActiveCommentField] = useState(null)
    const [commentsByField, setCommentsByField] = useState({
        outfits: [],
        color_images: [],
    })
    const [draftComment, setDraftComment] = useState("")
    const [replyDraftByCommentId, setReplyDraftByCommentId] = useState({})
    const [replyingToCommentId, setReplyingToCommentId] = useState(null)
    const [commentError, setCommentError] = useState("")
    const [commentMessage, setCommentMessage] = useState("")
    const [savingComments, setSavingComments] = useState(false)
    const [nowMs, setNowMs] = useState(Date.now())
    const fileInputRefs = {
        outfits: useRef(null),
        colors: useRef(null),
    }

    // Get suggestions and selections from collection data
    const item = collectionData?.items?.[0]
    const aiOutfitSuggestions = (item?.suggested_outfits || []).slice(0, 10)
    const aiColorSuggestions = (item?.suggested_colors || []).slice(0, 10)

    // Debug: Log suggestions to help troubleshoot
    useEffect(() => {
        if (item) {
            console.log('Color Palette - Collection item:', item)
            console.log('Color Palette - Suggested colors:', item.suggested_colors)
            console.log('Color Palette - AI Color Suggestions:', aiColorSuggestions)
            console.log('Color Palette - AI Outfit Suggestions:', aiOutfitSuggestions)
            console.log('Color Palette - Show Suggestions prop:', showSuggestions)
        }
    }, [item, aiColorSuggestions, aiOutfitSuggestions, showSuggestions])

    // Load existing selections and uploaded images when collection data changes
    useEffect(() => {
        if (item) {
            setSelectedOutfits(item.selected_outfits || [])
            setSelectedColors(item.selected_colors || [])
            setPickedColors(item.picked_colors || [])
            setColorInstructions(item.color_instructions || "")

            const existingOutfitImages = (item.uploaded_outfit_images || []).map(img => ({
                id: img.id || Date.now() + Math.random(),
                local_path: img.local_path,
                cloud_url: img.cloud_url,
                original_filename: img.original_filename,
                uploaded_by: img.uploaded_by,
                uploaded_at: img.uploaded_at,
                file_size: img.file_size,
                category: img.category,
                url: img.cloud_url,
                name: img.original_filename,
                isFromServer: true
            }))
            const existingColorImages = (item.uploaded_color_images || []).map(img => ({
                id: img.id || Date.now() + Math.random(),
                local_path: img.local_path,
                cloud_url: img.cloud_url,
                original_filename: img.original_filename,
                uploaded_by: img.uploaded_by,
                uploaded_at: img.uploaded_at,
                file_size: img.file_size,
                category: img.category,
                url: img.cloud_url,
                name: img.original_filename,
                isFromServer: true
            }))

            setUploadedImages({
                outfits: existingOutfitImages,
                colors: existingColorImages,
            })
        }
    }, [item])

    const commentFieldConfig = {
        outfits: {
            payloadKey: "outfits_comments",
            title: "Outfits",
        },
        color_images: {
            payloadKey: "color_images_comments",
            title: "Upload Color Images",
        },
    }

    const activeCommentConfig = activeCommentField ? commentFieldConfig[activeCommentField] : null
    const currentComments = activeCommentField ? (commentsByField[activeCommentField] || []) : []

    useEffect(() => {
        setCommentsByField({
            outfits: Array.isArray(collectionData?.outfits_comments) ? collectionData.outfits_comments : [],
            color_images: Array.isArray(collectionData?.color_images_comments) ? collectionData.color_images_comments : [],
        })
    }, [collectionData?.outfits_comments, collectionData?.color_images_comments])

    const loadCommentsFromDb = async () => {
        if (!collectionData?.id || !token) return
        try {
            const latestCollection = await apiService.getCollection(collectionData.id, token, {
                cache: "no-store",
            })
            setCommentsByField({
                outfits: Array.isArray(latestCollection?.outfits_comments) ? latestCollection.outfits_comments : [],
                color_images: Array.isArray(latestCollection?.color_images_comments) ? latestCollection.color_images_comments : [],
            })
        } catch (error) {
            // Keep existing comments in UI if refresh fails.
        }
    }

    useEffect(() => {
        if (!activeCommentField) return
        loadCommentsFromDb()
        const intervalId = setInterval(() => {
            loadCommentsFromDb()
        }, 5000)
        return () => clearInterval(intervalId)
    }, [activeCommentField, collectionData?.id, token])

    useEffect(() => {
        if (!activeCommentField) return
        setNowMs(Date.now())
        const timerId = setInterval(() => {
            setNowMs(Date.now())
        }, 60000)
        return () => clearInterval(timerId)
    }, [activeCommentField])

    const persistComments = async (commentType, nextComments, successText = "Comments saved successfully.") => {
        if (!commentType || !project?.id || !collectionData?.id) {
            setCommentError("Unable to save comments for this project.")
            return false
        }

        setSavingComments(true)
        setCommentError("")
        setCommentMessage("")
        try {
            const response = await apiService.updateSelectionComments(
                project.id,
                collectionData.id,
                commentType,
                nextComments,
                token
            )
            if (!response?.success) {
                throw new Error(response?.error || "Failed to save comments")
            }

            const responseKey = commentFieldConfig[commentType]?.payloadKey
            const responseComments = responseKey && Array.isArray(response?.[responseKey]) ? response[responseKey] : []
            setCommentsByField((prev) => ({
                ...prev,
                [commentType]: responseComments,
            }))
            setCommentMessage(successText)
            return true
        } catch (error) {
            setCommentError(error?.message || "Failed to save comments")
            return false
        } finally {
            setSavingComments(false)
        }
    }

    const handleAddComment = async () => {
        const text = draftComment.trim()
        if (!text || !activeCommentField) return

        const newComment = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            comment: text,
            selection: "",
        }
        const nextComments = [...currentComments, newComment]
        setCommentsByField((prev) => ({
            ...prev,
            [activeCommentField]: nextComments,
        }))
        setDraftComment("")
        setCommentError("")
        setCommentMessage("")
        await persistComments(activeCommentField, nextComments, "Comment added.")
    }

    const handleDeleteComment = async (commentId) => {
        if (!activeCommentField) return

        const previousComments = currentComments
        const nextComments = currentComments.filter((comment) => comment.id !== commentId)
        setCommentsByField((prev) => ({
            ...prev,
            [activeCommentField]: nextComments,
        }))
        const deleted = await persistComments(activeCommentField, nextComments, "Comment deleted.")
        if (!deleted) {
            setCommentsByField((prev) => ({
                ...prev,
                [activeCommentField]: previousComments,
            }))
        }
    }

    const openComments = (fieldKey) => {
        setActiveCommentField(fieldKey)
        setDraftComment("")
        setCommentError("")
        setCommentMessage("")
    }

    const closeComments = () => {
        setActiveCommentField(null)
        setReplyDraftByCommentId({})
        setReplyingToCommentId(null)
    }

    const handleStartReply = (commentId) => {
        setReplyingToCommentId(commentId)
        setCommentError("")
        setCommentMessage("")
    }

    const handleReplyDraftChange = (commentId, value) => {
        setReplyDraftByCommentId((prev) => ({
            ...prev,
            [commentId]: value,
        }))
    }

    const handleAddReply = async (commentId) => {
        if (!activeCommentField) return
        const replyText = (replyDraftByCommentId[commentId] || "").trim()
        if (!replyText) return

        const nextComments = currentComments.map((comment) => {
            if (comment.id !== commentId) return comment
            const existingReplies = Array.isArray(comment.replies) ? comment.replies : []
            const newReply = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                comment: replyText,
                selection: "",
            }
            return {
                ...comment,
                replies: [...existingReplies, newReply],
            }
        })

        setCommentsByField((prev) => ({
            ...prev,
            [activeCommentField]: nextComments,
        }))
        setReplyDraftByCommentId((prev) => ({
            ...prev,
            [commentId]: "",
        }))
        setCommentError("")
        setCommentMessage("")
        const saved = await persistComments(activeCommentField, nextComments, "Reply added.")
        if (saved) {
            setReplyingToCommentId(null)
        }
    }

    const renderCommentButton = (fieldKey) => {
        const commentsCount = (commentsByField[fieldKey] || []).length
        const isActive = activeCommentField === fieldKey
        return (
            <button
                type="button"
                onClick={() => (isActive ? closeComments() : openComments(fieldKey))}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    commentsCount > 0
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gold-solid hover:bg-gold-solid/10"
                }`}
                aria-label="Open comments"
                title="Open comments"
            >
                <MessageCircle className="w-4 h-4" />
                {isActive ? "Hide comments" : "Comments"}
            </button>
        )
    }

    const handleFileUpload = async (category, files) => {
        if (!files || files.length === 0) return
        if (!project?.id || !collectionData?.id) return

        const uploadCategory = category === "outfits" ? "outfit" : "color"
        setUploading((prev) => ({ ...prev, [category]: true }))

        try {
            const response = await apiService.uploadWorkflowImage(
                project.id,
                collectionData.id,
                uploadCategory,
                Array.from(files),
                token
            )
            if (!response?.success) return

            const newImages = (response.uploaded_images || []).map((img) => ({
                id: img.id || Date.now() + Math.random(),
                local_path: img.local_path,
                cloud_url: img.cloud_url,
                original_filename: img.original_filename,
                uploaded_by: img.uploaded_by,
                uploaded_at: img.uploaded_at,
                file_size: img.file_size,
                category: img.category,
                url: img.cloud_url,
                name: img.original_filename,
                isFromServer: false,
            }))

            setUploadedImages((prev) => ({
                ...prev,
                [category]: [...prev[category], ...newImages],
            }))
        } finally {
            setUploading((prev) => ({ ...prev, [category]: false }))
        }
    }

    const removeUploadedImage = async (category, imageId) => {
        if (!project?.id || !collectionData?.id) return
        const image = uploadedImages[category]?.find((img) => img.id === imageId)
        if (!image) return

        const removeCategory = category === "outfits" ? "outfits" : "colors"
        const response = await apiService.removeWorkflowImage(
            project.id,
            collectionData.id,
            imageId,
            removeCategory,
            token,
            image.cloud_url || image.url
        )
        if (!response?.success) return

        setUploadedImages((prev) => ({
            ...prev,
            [category]: prev[category].filter((img) => img.id !== imageId),
        }))
    }

    const handleFileInputChange = async (category, event) => {
        const files = event.target.files
        await handleFileUpload(category, files)
        event.target.value = ""
    }

    const triggerFileInput = (category) => {
        if (fileInputRefs[category]?.current) fileInputRefs[category].current.click()
    }

    useEffect(() => {
        if (!onSelectionsChange) return
        onSelectionsChange({
            outfits: selectedOutfits,
            colors: selectedColors,
            pickedColors,
            colorInstructions,
        })
    }, [selectedOutfits, selectedColors, pickedColors, colorInstructions])

    useEffect(() => {
        if (!onImagesChange) return
        onImagesChange(uploadedImages)
    }, [uploadedImages])

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-gold-muted bg-card/40 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h3 className="font-bold text-foreground text-lg mb-1">Outfits</h3>
                            <p className="text-sm text-muted-foreground">Select outfit direction and upload outfit references</p>
                        </div>
                        {renderCommentButton("outfits")}
                    </div>

                    {showSuggestions && aiOutfitSuggestions.length > 0 && (
                        <div className="space-y-3">
                            <div className="bg-gold-solid/10 border border-gold-muted rounded-lg p-3">
                                <p className="text-gold-solid text-sm font-medium">AI Suggested Outfits</p>
                            </div>
                            <MultiSelect
                                options={aiOutfitSuggestions}
                                selected={selectedOutfits}
                                onChange={setSelectedOutfits}
                                placeholder="Select outfits..."
                                disabled={!canEdit}
                            />
                        </div>
                    )}
                    <div className="space-y-3">
                    {showSuggestions && aiOutfitSuggestions.length > 0 && (
                        <p className="text-sm text-muted-foreground text-center">Or</p>
                    )}
                    </div>
                    
                    <input
                        ref={fileInputRefs.outfits}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileInputChange("outfits", e)}
                        className="hidden"
                        disabled={!canEdit}
                    />
                     

                    <Button
                        variant="outline"
                        className="w-full border-border text-foreground hover:bg-secondary hover:text-foreground"
                        disabled={!canEdit || uploading.outfits}
                        onClick={() => triggerFileInput("outfits")}
                    >

                        <Upload className="w-4 h-4 mr-2" />
                        {uploading.outfits ? "Uploading..." : "Choose files"}
                    </Button>
                    {uploadedImages.outfits.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{uploadedImages.outfits.length} file(s) selected</p>


                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.outfits.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <img src={image.url} alt={image.name} className="w-full h-16 object-cover rounded border" />
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); window.open(image.url || image.cloud_url, "_blank") }}
                                                className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                                                title="View image"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => removeUploadedImage("outfits", image.id)}
                                                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                disabled={!canEdit}
                                                title="Remove image"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-2 border-dashed border-gold-muted bg-card/40 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h3 className="font-bold text-foreground text-lg mb-1">Color Palette</h3>
                            <p className="text-sm text-muted-foreground">Select palette, pick colors, and upload color references</p>
                        </div>
                        {renderCommentButton("color_images")}
                    </div>

                    {showSuggestions && aiColorSuggestions.length > 0 && (
                        <div className="space-y-3">
                            <div className="bg-gold-solid/10 border border-gold-muted rounded-lg p-3">
                                <p className="text-gold-solid text-sm font-medium">AI Suggested Color Palettes</p>
                            </div>
                            <MultiSelect
                                options={aiColorSuggestions}
                                selected={selectedColors}
                                onChange={setSelectedColors}
                                placeholder="Select color palettes..."
                                disabled={!canEdit}
                            />
                        </div>
                    )}

                    <ColorPicker selectedColors={pickedColors} onColorsChange={setPickedColors} disabled={!canEdit} />

                    <p className="text-sm text-muted-foreground">Upload inspiration images for color palette</p>
                    <input
                        ref={fileInputRefs.colors}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileInputChange("colors", e)}
                        className="hidden"
                        disabled={!canEdit}
                    />
                    <Button
                        variant="outline"
                        className="w-full border-border text-foreground hover:bg-secondary hover:text-foreground"
                        disabled={!canEdit || uploading.colors}
                        onClick={() => triggerFileInput("colors")}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading.colors ? "Uploading..." : "Choose files"}
                    </Button>
                    {uploadedImages.colors.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{uploadedImages.colors.length} file(s) selected</p>
                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.colors.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <img src={image.url} alt={image.name} className="w-full h-16 object-cover rounded border" />
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); window.open(image.url || image.cloud_url, "_blank") }}
                                                className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                                                title="View image"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => removeUploadedImage("colors", image.id)}
                                                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                disabled={!canEdit}
                                                title="Remove image"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {activeCommentField && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-card rounded-xl shadow-2xl border border-border">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <h4 className="text-sm font-semibold text-foreground">{activeCommentConfig?.title} Comments</h4>
                            <button
                                type="button"
                                onClick={closeComments}
                                className="p-1 rounded hover:bg-gray-100"
                                aria-label="Close comments"
                            >
                                <X className="w-4 h-4 text-[#666]" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {currentComments.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No comments yet.</p>
                                ) : (
                                    currentComments.map((comment) => (
                                        <div key={comment.id} className="border border-border rounded-md p-2 bg-[#fafafa]">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-[#444]">
                                                        {(comment.authorName || "Member")} • {formatRelativeCommentTime(comment.createdAt, nowMs)}
                                                    </p>
                                                    <p className="text-sm text-foreground break-words">{comment.comment}</p>
                                                    {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                                                        <div className="mt-2 pl-3 border-l border-border space-y-2">
                                                            {comment.replies.map((reply) => (
                                                                <div key={reply.id} className="bg-card border border-[#f0f0f0] rounded p-2">
                                                                    <p className="text-xs font-medium text-[#555]">
                                                                        {(reply.authorName || "Member")} • {formatRelativeCommentTime(reply.createdAt, nowMs)}
                                                                    </p>
                                                                    <p className="text-sm text-foreground break-words">{reply.comment}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {canEdit && (
                                                        <div className="mt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStartReply(comment.id)}
                                                                className="text-xs text-gold-solid hover:brightness-110"
                                                            >
                                                                {replyingToCommentId === comment.id ? "Replying..." : "Reply"}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {canEdit && replyingToCommentId === comment.id && (
                                                        <div className="mt-2 space-y-2">
                                                            <textarea
                                                                value={replyDraftByCommentId[comment.id] || ""}
                                                                onChange={(e) => handleReplyDraftChange(comment.id, e.target.value)}
                                                                placeholder="Write a reply..."
                                                                className="w-full h-16 px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                                                            />
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setReplyingToCommentId(null)}
                                                                    className="px-2 py-1 text-xs rounded-md border border-border text-[#555] hover:bg-secondary"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddReply(comment.id)}
                                                                    disabled={savingComments || !(replyDraftByCommentId[comment.id] || "").trim()}
                                                                    className="px-2 py-1 text-xs rounded-md bg-gold-gradient text-white hover:brightness-110 disabled:opacity-60"
                                                                >
                                                                    {savingComments ? "Submitting..." : "Submit reply"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {canEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-red-500 hover:text-red-600 p-1"
                                                        aria-label="Delete comment"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {canEdit && (
                                <>
                                    <textarea
                                        value={draftComment}
                                        onChange={(e) => setDraftComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="w-full h-20 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                                    />

                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAddComment}
                                            disabled={savingComments || !draftComment.trim()}
                                            className="px-3 py-1.5 text-sm rounded-md bg-gold-gradient text-white hover:brightness-110 disabled:opacity-60"
                                        >
                                            {savingComments ? "Submitting..." : "Submit"}
                                        </button>
                                    </div>
                                </>
                            )}

                            {commentError && <p className="text-xs text-red-600">{commentError}</p>}
                            {commentMessage && <p className="text-xs text-green-600">{commentMessage}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
