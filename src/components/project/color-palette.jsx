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
    const [selectedColors, setSelectedColors] = useState([])
    const [pickedColors, setPickedColors] = useState([])
    const [colorInstructions, setColorInstructions] = useState("")
    const [uploadedImages, setUploadedImages] = useState([])
    const [uploading, setUploading] = useState(false)
    const [activeCommentField, setActiveCommentField] = useState(null)
    const [commentsByField, setCommentsByField] = useState({
        color_images: [],
    })
    const [draftComment, setDraftComment] = useState("")
    const [replyDraftByCommentId, setReplyDraftByCommentId] = useState({})
    const [replyingToCommentId, setReplyingToCommentId] = useState(null)
    const [commentError, setCommentError] = useState("")
    const [commentMessage, setCommentMessage] = useState("")
    const [savingComments, setSavingComments] = useState(false)
    const [nowMs, setNowMs] = useState(Date.now())
    const fileInputRef = useRef(null)

    // Get suggestions and selections from collection data
    const item = collectionData?.items?.[0]
    const aiColorSuggestions = (item?.suggested_colors || []).slice(0, 10)

    // Debug: Log suggestions to help troubleshoot
    useEffect(() => {
        if (item) {
            console.log('Color Palette - Collection item:', item)
            console.log('Color Palette - Suggested colors:', item.suggested_colors)
            console.log('Color Palette - AI Color Suggestions:', aiColorSuggestions)
            console.log('Color Palette - Show Suggestions prop:', showSuggestions)
        }
    }, [item, aiColorSuggestions, showSuggestions])

    // Load existing selections and uploaded images when collection data changes
    useEffect(() => {
        if (item) {
            setSelectedColors(item.selected_colors || [])
            setPickedColors(item.picked_colors || [])
            setColorInstructions(item.color_instructions || "")

            // Load existing uploaded color images from server
            const existingImages = (item.uploaded_color_images || []).map(img => ({
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
                isFromServer: true // Flag to indicate this image was loaded from server
            }))

            setUploadedImages(existingImages)
            console.log('Loaded existing color images from server:', existingImages)
        }
    }, [item])

    const commentFieldConfig = {
        color_images: {
            payloadKey: "color_images_comments",
            title: "Upload Color Images",
        },
    }

    const activeCommentConfig = activeCommentField ? commentFieldConfig[activeCommentField] : null
    const currentComments = activeCommentField ? (commentsByField[activeCommentField] || []) : []

    useEffect(() => {
        setCommentsByField({
            color_images: Array.isArray(collectionData?.color_images_comments) ? collectionData.color_images_comments : [],
        })
    }, [collectionData?.color_images_comments])

    const loadCommentsFromDb = async () => {
        if (!collectionData?.id || !token) return
        try {
            const latestCollection = await apiService.getCollection(collectionData.id, token, {
                cache: "no-store",
            })
            setCommentsByField({
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
                        : "text-[#884cff] hover:bg-[#f3efff]"
                }`}
                aria-label="Open comments"
                title="Open comments"
            >
                <MessageCircle className="w-4 h-4" />
                {isActive ? "Hide comments" : "Comments"}
            </button>
        )
    }

    const toggleSelection = (color) => {
        if (selectedColors.includes(color)) {
            setSelectedColors(selectedColors.filter(item => item !== color))
        } else {
            setSelectedColors([...selectedColors, color])
        }
    }

    // Handle file upload - now uploads immediately to server
    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return
        if (!project?.id || !collectionData?.id) {
            console.error('Missing project or collection data')
            return
        }

        setUploading(true)

        try {
            // Upload to server immediately
            const response = await apiService.uploadWorkflowImage(
                project.id,
                collectionData.id,
                'color',
                Array.from(files),
                token
            )

            if (response.success) {
                // Add the uploaded images to local state
                const newImages = response.uploaded_images.map(img => ({
                    id: img.id || Date.now() + Math.random(),
                    local_path: img.local_path,
                    cloud_url: img.cloud_url,
                    original_filename: img.original_filename,
                    uploaded_by: img.uploaded_by,
                    uploaded_at: img.uploaded_at,
                    file_size: img.file_size,
                    category: img.category,
                    url: img.cloud_url, // Use cloud URL for display
                    name: img.original_filename,
                    isFromServer: false // Flag to indicate this image was just uploaded
                }))

                setUploadedImages(prev => [...prev, ...newImages])
                console.log(`Successfully uploaded ${newImages.length} color images`)
            } else {
                console.error('Upload failed:', response.error)
            }
        } catch (error) {
            console.error('Error uploading images:', error)
        } finally {
            setUploading(false)
        }
    }

    // Remove uploaded image
    const removeUploadedImage = async (imageId) => {
        if (!project?.id || !collectionData?.id) {
            console.error('Missing project or collection data')
            return
        }

        // Find the image to get its cloud_url
        const image = uploadedImages.find(img => img.id === imageId)
        if (!image) {
            console.error('Image not found in local state')
            return
        }

        try {
            const response = await apiService.removeWorkflowImage(
                project.id,
                collectionData.id,
                imageId,
                'colors',
                token,
                image.cloud_url || image.url
            )

            if (response.success) {
                // Remove from local state
                setUploadedImages(prev => prev.filter(img => img.id !== imageId))

                // Refresh collection data
                const updatedData = await apiService.getCollection(collectionData.id, token)
                if (updatedData && onSave) {
                    await onSave({ imagesUpdated: true })
                }
            } else {
                console.error('Failed to remove image:', response.error)
            }
        } catch (error) {
            console.error('Error removing image:', error)
        }
    }

    // Handle file input change
    const handleFileInputChange = async (event) => {
        const files = event.target.files
        await handleFileUpload(files)
        // Reset the input
        event.target.value = ''
    }

    // Trigger file input
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    // Export selections through a getter function
    const getSelections = () => ({
        colors: selectedColors,
        pickedColors: pickedColors,
        colorInstructions: colorInstructions
    })

    // Notify parent of selection changes
    useEffect(() => {
        if (onSelectionsChange) {
            onSelectionsChange(getSelections())
        }
    }, [selectedColors, pickedColors, colorInstructions])

    // Notify parent of image changes
    useEffect(() => {
        if (onImagesChange) {
            onImagesChange(uploadedImages)
        }
    }, [uploadedImages])

    const hasSuggestions = showSuggestions && aiColorSuggestions.length > 0

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-[#1a1a1a] text-lg">Color Palette</h3>

            {hasSuggestions ? (
                // Layout when suggestions are present: AI suggestions + color picker in row, upload section below
                <>
                    <div className="flex gap-6">
                        {/* AI Suggested Color Palettes Section */}
                        <div className="flex-1 w-2/3 space-y-3">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                <p className="text-blue-600 text-sm text-center font-medium">AI Suggested Color Palettes</p>
                            </div>
                            <MultiSelect
                                options={aiColorSuggestions}
                                selected={selectedColors}
                                onChange={(newSelection) => setSelectedColors(newSelection)}
                                placeholder="Select color palettes..."
                                disabled={!canEdit}
                            />
                        </div>

                        {/* Color Picker Section */}
                        <div className="flex-1 w-1/2 space-y-3">
                            <p className="text-sm text-[#708090]">Or pick specific colors:</p>
                            <ColorPicker
                                selectedColors={pickedColors}
                                onColorsChange={setPickedColors}
                                disabled={!canEdit}
                            />

                            {/* Display picked colors */}
                            {pickedColors.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-[#708090]">
                                        {pickedColors.length} color(s) selected
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {pickedColors.map((color, index) => (
                                            <div key={index} className="relative group">
                                                <div
                                                    className="w-8 h-8 rounded border border-gray-300"
                                                    style={{
                                                        background: color.includes('gradient') ? color : undefined,
                                                        backgroundColor: color.includes('gradient') ? 'transparent' : color
                                                    }}
                                                    title={color}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Color Images Section */}
                    <div className="border-2 border-dashed border-[#b0bec5] rounded-lg p-6 space-y-4">
                        <div>
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-[#1a1a1a] mb-1">Upload Color Images</h4>
                                {renderCommentButton("color_images")}
                            </div>
                            <p className="text-sm text-[#708090]">Upload inspiration images for color palette</p>
                        </div>

                        <div className="space-y-3">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileInputChange}
                                className="hidden"
                                disabled={!canEdit}
                            />

                            <Button
                                variant="outline"
                                className="w-full bg-transparent"
                                disabled={!canEdit || uploading}
                                onClick={triggerFileInput}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                {uploading ? 'Uploading...' : 'Choose files'}
                            </Button>

                            {/* Uploaded images preview */}
                            {uploadedImages.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-[#708090]">
                                        {uploadedImages.length} file(s) selected
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {uploadedImages.map((image) => (
                                            <div key={image.id} className="relative group">
                                                <img
                                                    src={image.url}
                                                    alt={image.name}
                                                    className="w-full h-16 object-cover rounded border"
                                                />
                                                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            window.open(image.url || image.cloud_url, '_blank')
                                                        }}
                                                        className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                                                        title="View image"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => removeUploadedImage(image.id)}
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
                </>
            ) : (
                // Layout when suggestions are NOT present: Color picker and upload section side by side in grid
                <div className="grid grid-cols-2 gap-6">
                    {/* Color Picker Section */}
                    <div className="border-2 border-dashed border-[#b0bec5] rounded-lg p-6 space-y-4">
                        <div>
                            <h4 className="font-bold text-[#1a1a1a] mb-1">Pick Specific Colors</h4>
                            <p className="text-sm text-[#708090]">Choose colors for your palette</p>
                        </div>
                        <ColorPicker
                            selectedColors={pickedColors}
                            onColorsChange={setPickedColors}
                            disabled={!canEdit}
                        />

                        {/* Display picked colors */}
                        {pickedColors.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-[#708090]">
                                    {pickedColors.length} color(s) selected
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {pickedColors.map((color, index) => (
                                        <div key={index} className="relative group">
                                            <div
                                                className="w-8 h-8 rounded border border-gray-300"
                                                style={{
                                                    background: color.includes('gradient') ? color : undefined,
                                                    backgroundColor: color.includes('gradient') ? 'transparent' : color
                                                }}
                                                title={color}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Upload Color Images Section */}
                    <div className="border-2 border-dashed border-[#b0bec5] rounded-lg p-6 space-y-4">
                        <div>
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-[#1a1a1a] mb-1">Upload Color Images</h4>
                                {renderCommentButton("color_images")}
                            </div>
                            <p className="text-sm text-[#708090]">Upload inspiration images for color palette</p>
                        </div>

                        <div className="space-y-3">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileInputChange}
                                className="hidden"
                                disabled={!canEdit}
                            />

                            <Button
                                variant="outline"
                                className="w-full bg-transparent"
                                disabled={!canEdit || uploading}
                                onClick={triggerFileInput}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                {uploading ? 'Uploading...' : 'Choose files'}
                            </Button>

                            {/* Uploaded images preview */}
                            {uploadedImages.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-[#708090]">
                                        {uploadedImages.length} file(s) selected
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {uploadedImages.map((image) => (
                                            <div key={image.id} className="relative group">
                                                <img
                                                    src={image.url}
                                                    alt={image.name}
                                                    className="w-full h-16 object-cover rounded border"
                                                />
                                                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            window.open(image.url || image.cloud_url, '_blank')
                                                        }}
                                                        className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                                                        title="View image"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => removeUploadedImage(image.id)}
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
                </div>
            )}
            {activeCommentField && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#e6e6e6]">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e6e6e6]">
                            <h4 className="text-sm font-semibold text-[#1a1a1a]">{activeCommentConfig?.title} Comments</h4>
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
                                    <p className="text-xs text-[#708090]">No comments yet.</p>
                                ) : (
                                    currentComments.map((comment) => (
                                        <div key={comment.id} className="border border-[#e6e6e6] rounded-md p-2 bg-[#fafafa]">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-[#444]">
                                                        {(comment.authorName || "Member")} • {formatRelativeCommentTime(comment.createdAt, nowMs)}
                                                    </p>
                                                    <p className="text-sm text-[#1a1a1a] break-words">{comment.comment}</p>
                                                    {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                                                        <div className="mt-2 pl-3 border-l border-[#e6e6e6] space-y-2">
                                                            {comment.replies.map((reply) => (
                                                                <div key={reply.id} className="bg-white border border-[#f0f0f0] rounded p-2">
                                                                    <p className="text-xs font-medium text-[#555]">
                                                                        {(reply.authorName || "Member")} • {formatRelativeCommentTime(reply.createdAt, nowMs)}
                                                                    </p>
                                                                    <p className="text-sm text-[#1a1a1a] break-words">{reply.comment}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {canEdit && (
                                                        <div className="mt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStartReply(comment.id)}
                                                                className="text-xs text-[#884cff] hover:text-[#7a3ff0]"
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
                                                                className="w-full h-16 px-2 py-1.5 border border-[#e6e6e6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#884cff] resize-none text-sm"
                                                            />
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setReplyingToCommentId(null)}
                                                                    className="px-2 py-1 text-xs rounded-md border border-[#dcdcdc] text-[#555] hover:bg-gray-50"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddReply(comment.id)}
                                                                    disabled={savingComments || !(replyDraftByCommentId[comment.id] || "").trim()}
                                                                    className="px-2 py-1 text-xs rounded-md bg-[#884cff] text-white hover:bg-[#7a3ff0] disabled:opacity-60"
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
                                        className="w-full h-20 px-3 py-2 border border-[#e6e6e6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#884cff] resize-none text-sm"
                                    />

                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAddComment}
                                            disabled={savingComments || !draftComment.trim()}
                                            className="px-3 py-1.5 text-sm rounded-md bg-[#884cff] text-white hover:bg-[#7a3ff0] disabled:opacity-60"
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
